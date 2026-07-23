use axum::extract::{Path, Query, State};
use axum::http::{header, StatusCode};
use axum::Json;
use base32::{decode, Alphabet};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::postgres::PgPoolOptions;
use std::time::Duration;
use totp_rs::{Algorithm, TOTP};

use crate::auth::{create_access_token, create_refresh_token, find_refresh_token, revoke_all_refresh_tokens, revoke_refresh_token, store_refresh_token, AdminGuard, ApiKey, Authenticated, SuperAdmin};
use crate::error::AppError;
use crate::provision;
use crate::seed;
use crate::stripe::{CreateCheckoutSessionParams, CreateCheckoutSessionLineItem, CreateCheckoutSessionPriceData, CreateCheckoutSessionProductData, CreateCheckoutSessionRecurring};
use crate::AppState;

#[derive(Deserialize)]
pub struct LoginReq {
    pub email: String,
    pub password: String,
    pub code: Option<String>,
}

pub async fn login(State(st): State<AppState>, Json(req): Json<LoginReq>) -> Result<Json<Value>, AppError> {
    let row: Option<(String, String, String, Option<String>, Option<bool>)> =
        sqlx::query_as("SELECT id::text, password_hash, role, totp_secret, twofa_enabled FROM admins WHERE email = $1")
            .bind(&req.email)
            .fetch_optional(&st.pool)
            .await?;
    let (id, hash, role, totp_secret, twofa_enabled) = row
        .ok_or_else(|| AppError::unauthorized("Invalid credentials"))?;
    let ok = bcrypt::verify(&req.password, &hash).unwrap_or(false);
    if !ok {
        return Err(AppError::unauthorized("Invalid credentials"));
    }

    if twofa_enabled.unwrap_or(false) {
        let code = req.code.unwrap_or_default().trim().to_string();
        if code.is_empty() {
            return Ok(Json(json!({ "twofa_required": true })));
        }
        let secret = totp_secret.ok_or_else(|| AppError::internal("2FA misconfigured"))?;
        let bytes = decode(Alphabet::Rfc4648 { padding: false }, &secret)
            .ok_or_else(|| AppError::internal("Invalid 2FA secret"))?;
        let totp = TOTP::new(
            Algorithm::SHA1,
            6,
            1,
            30,
            bytes,
            Some("ChurchNepal".to_string()),
            req.email.clone(),
        )
        .map_err(|e| AppError::internal(e.to_string()))?;
        if !totp.check_current(&code).map_err(|e| AppError::internal(e.to_string()))? {
            return Err(AppError::unauthorized("Invalid 2FA code"));
        }
    }

    let access_token = create_access_token(&id, &req.email, &role).map_err(|e| AppError::internal(e.to_string()))?;
    let refresh_token = create_refresh_token();
    store_refresh_token(&st.pool, &id, &refresh_token).await?;

    Ok(Json(json!({ "token": access_token, "refresh_token": refresh_token, "email": req.email, "role": role })))
}

#[derive(Deserialize)]
pub struct RefreshTokenReq {
    pub refresh_token: String,
}

pub async fn refresh_token(State(st): State<AppState>, Json(req): Json<RefreshTokenReq>) -> Result<Json<Value>, AppError> {
    let raw_token = req.refresh_token.trim();
    if raw_token.is_empty() {
        return Err(AppError::bad_request("refresh_token is required"));
    }

    let token_hash = bcrypt::hash(raw_token, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::internal(format!("hash refresh token: {e}")))?;

    let existing = find_refresh_token(&st.pool, &token_hash).await?;
    let (token_id, admin_id, expires_at, revoked) = existing
        .ok_or_else(|| AppError::unauthorized("Invalid refresh token"))?;

    if revoked {
        return Err(AppError::unauthorized("Reused refresh token"));
    }

    let now = chrono::Utc::now();
    if now > expires_at {
        return Err(AppError::unauthorized("Expired refresh token"));
    }

    let admin: Option<(String, String, String)> =
        sqlx::query_as("SELECT id::text, email, role FROM admins WHERE id = $1")
            .bind(admin_id)
            .fetch_optional(&st.pool)
            .await?
            .ok_or_else(|| AppError::unauthorized("Admin not found"))?;
    let (admin_id_str, email, role) = admin;

    sqlx::query("UPDATE refresh_tokens SET revoked = true WHERE id = $1")
        .bind(token_id)
        .execute(&st.pool)
        .await?;

    let new_access = create_access_token(&admin_id_str, &email, &role).map_err(|e| AppError::internal(e.to_string()))?;
    let new_refresh = create_refresh_token();
    store_refresh_token(&st.pool, &admin_id_str, &new_refresh).await?;

    Ok(Json(json!({ "token": new_access, "refresh_token": new_refresh, "email": email, "role": role })))
}

#[derive(Deserialize)]
pub struct LogoutReq {
    pub refresh_token: String,
}

pub async fn logout(State(st): State<AppState>, auth: Authenticated, Json(req): Json<LogoutReq>) -> Result<Json<Value>, AppError> {
    let raw_token = req.refresh_token.trim();
    if raw_token.is_empty() {
        return Err(AppError::bad_request("refresh_token is required"));
    }

    let token_hash = bcrypt::hash(raw_token, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::internal(format!("hash refresh token: {e}")))?;

    revoke_refresh_token(&st.pool, &token_hash).await?;
    revoke_all_refresh_tokens(&st.pool, uuid::Uuid::parse_str(&auth.0.id).map_err(|e| AppError::internal(format!("parse id: {e}")))?).await;

    Ok(Json(json!({ "success": true })))
}

pub async fn me(auth: Authenticated, State(st): State<AppState>) -> Json<Value> {
    let twofa: Option<bool> = sqlx::query_scalar("SELECT twofa_enabled FROM admins WHERE id = $1")
        .bind(uuid::Uuid::parse_str(&auth.0.id).map_err(|e| AppError::internal(format!("parse id: {e}")))?)
        .fetch_optional(&st.pool)
        .await?
        .flatten();
    Json(json!({ "id": auth.0.id, "email": auth.0.email, "role": auth.0.role, "twofa_enabled": twofa.unwrap_or(false) }))
}

pub async fn reset_authenticated_password(
    auth: Authenticated,
    State(st): State<AppState>,
    Json(req): Json<Value>,
) -> Result<Json<Value>, AppError> {
    let current_password = req.get("current_password").and_then(|v| v.as_str()).unwrap_or_default().trim().to_string();
    let new_password = req.get("new_password").and_then(|v| v.as_str()).unwrap_or_default().trim().to_string();

    if current_password.is_empty() {
        return Err(AppError::bad_request("Current password is required"));
    }
    if new_password.is_empty() || new_password.len() < 8 {
        return Err(AppError::bad_request("New password must be at least 8 characters"));
    }

    let admin_uuid = uuid::Uuid::parse_str(&auth.0.id).map_err(|e| AppError::internal(format!("parse id: {e}")))?;
    let row: Option<(String,)> =
        sqlx::query_as("SELECT password_hash FROM admins WHERE id = $1")
            .bind(admin_uuid)
            .fetch_optional(&st.pool)
            .await?;
    let (hash,) = row.ok_or_else(|| AppError::not_found("Admin not found"))?;

    if !bcrypt::verify(&current_password, &hash).unwrap_or(false) {
        return Err(AppError::bad_request("Current password is incorrect"));
    }

    let new_hash = bcrypt::hash(&new_password, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::internal(format!("hash password: {e}")))?;

    sqlx::query("UPDATE admins SET password_hash = $1 WHERE id = $2")
        .bind(&new_hash)
        .bind(admin_uuid)
        .execute(&st.pool)
        .await?;

    sqlx::query(
        "INSERT INTO audit_log (actor_id, actor_email, action, target_type, target_id, metadata) \
         VALUES ($1, $2, $3, $4, $5, $6)"
    )
    .bind(admin_uuid)
    .bind(&auth.0.email)
    .bind("reset_password")
    .bind("admins")
    .bind(auth.0.id.clone())
    .bind(Some(json!({})))
    .execute(&st.pool)
    .await?;

    Ok(Json(json!({ "success": true, "message": "Password updated" })))
}

#[derive(Serialize)]
pub struct RouteInfo {
    pub method: &'static str,
    pub path: &'static str,
    pub auth: &'static str,
}

pub async fn api_routes() -> Json<Vec<RouteInfo>> {
    Json(vec![
        RouteInfo { method: "GET", path: "/healthz", auth: "none" },
        RouteInfo { method: "GET", path: "/readyz", auth: "none" },
        RouteInfo { method: "POST", path: "/api/webhooks/stripe", auth: "none" },
        RouteInfo { method: "POST", path: "/api/auth/login", auth: "none" },
        RouteInfo { method: "POST", path: "/api/auth/refresh", auth: "none" },
        RouteInfo { method: "POST", path: "/api/auth/logout", auth: "authenticated" },
        RouteInfo { method: "GET", path: "/api/auth/me", auth: "authenticated" },
        RouteInfo { method: "POST", path: "/api/auth/2fa/enroll", auth: "authenticated" },
        RouteInfo { method: "POST", path: "/api/auth/2fa/verify", auth: "authenticated" },
        RouteInfo { method: "POST", path: "/api/auth/2fa/disable", auth: "authenticated" },
        RouteInfo { method: "GET", path: "/api/admins", auth: "super_admin" },
        RouteInfo { method: "POST", path: "/api/admins", auth: "super_admin" },
        RouteInfo { method: "PATCH", path: "/api/admins/{id}", auth: "super_admin" },
        RouteInfo { method: "DELETE", path: "/api/admins/{id}", auth: "super_admin" },
        RouteInfo { method: "POST", path: "/api/api-keys", auth: "admin" },
        RouteInfo { method: "GET", path: "/api/api-keys", auth: "admin" },
        RouteInfo { method: "DELETE", path: "/api/api-keys/{id}", auth: "admin" },
        RouteInfo { method: "GET", path: "/api/churches", auth: "authenticated" },
        RouteInfo { method: "POST", path: "/api/churches", auth: "admin" },
        RouteInfo { method: "DELETE", path: "/api/churches/{id}", auth: "admin" },
        RouteInfo { method: "POST", path: "/api/churches/{id}/suspend", auth: "admin" },
        RouteInfo { method: "POST", path: "/api/churches/{id}/reactivate", auth: "admin" },
        RouteInfo { method: "GET", path: "/api/churches/{slug}/stats", auth: "authenticated" },
        RouteInfo { method: "GET", path: "/api/plans", auth: "none" },
        RouteInfo { method: "POST", path: "/api/plans", auth: "admin" },
        RouteInfo { method: "GET", path: "/api/plans/{id}", auth: "none" },
        RouteInfo { method: "PUT", path: "/api/plans/{id}", auth: "admin" },
        RouteInfo { method: "DELETE", path: "/api/plans/{id}", auth: "admin" },
        RouteInfo { method: "GET", path: "/api/billing", auth: "none" },
        RouteInfo { method: "GET", path: "/api/billing/{church_id}", auth: "none" },
        RouteInfo { method: "GET", path: "/api/invoices", auth: "none" },
        RouteInfo { method: "POST", path: "/api/invoices", auth: "admin" },
        RouteInfo { method: "POST", path: "/api/invoices/{id}/pay", auth: "admin" },
        RouteInfo { method: "GET", path: "/api/analytics", auth: "none" },
        RouteInfo { method: "GET", path: "/api/analytics/growth", auth: "none" },
        RouteInfo { method: "GET", path: "/api/analytics/top-churches", auth: "none" },
        RouteInfo { method: "GET", path: "/api/analytics/refunds", auth: "admin" },
        RouteInfo { method: "GET", path: "/api/notifications", auth: "none" },
        RouteInfo { method: "POST", path: "/api/notifications/{id}/read", auth: "none" },
        RouteInfo { method: "POST", path: "/api/notifications/read-all", auth: "none" },
        RouteInfo { method: "GET", path: "/api/settings", auth: "authenticated" },
        RouteInfo { method: "PUT", path: "/api/settings", auth: "super_admin" },
        RouteInfo { method: "GET", path: "/api/search", auth: "authenticated" },
        RouteInfo { method: "POST", path: "/api/seed/dummy", auth: "super_admin" },
        RouteInfo { method: "GET", path: "/api/blog", auth: "none" },
        RouteInfo { method: "GET", path: "/api/blog/{slug}", auth: "none" },
        RouteInfo { method: "GET", path: "/api/admin/blog", auth: "authenticated" },
        RouteInfo { method: "POST", path: "/api/admin/blog", auth: "admin" },
        RouteInfo { method: "PATCH", path: "/api/admin/blog/{id}", auth: "admin" },
        RouteInfo { method: "DELETE", path: "/api/admin/blog/{id}", auth: "admin" },
        RouteInfo { method: "GET", path: "/api/_routes", auth: "none" },
    ])
}

#[derive(Deserialize)]
pub struct SearchQuery {
    pub q: Option<String>,
}

#[derive(Serialize)]
pub struct SearchResultItem {
    pub id: String,
    pub label: String,
    #[serde(rename = "type")]
    pub kind: String,
    pub href: String,
}

pub async fn search(
    auth: Authenticated,
    Query(params): Query<SearchQuery>,
    State(st): State<AppState>,
) -> Result<Json<Vec<SearchResultItem>>, AppError> {
    let q = params.q.unwrap_or_default().trim().to_lowercase();
    let mut results = Vec::new();

    if !q.is_empty() {
        let rows: Vec<(String, String, String)> = sqlx::query_as(
            "SELECT id::text, name, subdomain FROM churches \
             WHERE LOWER(name) LIKE $1 OR LOWER(subdomain) LIKE $1 \
             ORDER BY created_at DESC LIMIT 10"
        )
        .bind(format!("%{q}%"))
        .fetch_all(&st.pool)
        .await?;

        for (id, name, _subdomain) in rows {
            results.push(SearchResultItem {
                id: format!("church-{}", id),
                label: name,
                kind: "church".to_string(),
                href: format!("/admin/churches/{}", id),
            });
        }
    }

    let actions = [
        ("Dashboard", "/admin"),
        ("Churches", "/admin/churches"),
        ("Analytics", "/admin/analytics"),
        ("Billing", "/admin/billing"),
        ("Settings", "/admin/settings"),
    ];

    if q.is_empty() {
        for (label, href) in &actions {
            results.push(SearchResultItem {
                id: format!("action-{}", label.to_lowercase().replace(" ", "-")),
                label: label.to_string(),
                kind: "action".to_string(),
                href: href.to_string(),
            });
        }
    } else {
        for (label, href) in &actions {
            if label.to_lowercase().contains(&q) {
                results.push(SearchResultItem {
                    id: format!("action-{}", label.to_lowercase().replace(" ", "-")),
                    label: label.to_string(),
                    kind: "action".to_string(),
                    href: href.to_string(),
                });
            }
        }
    }

    Ok(Json(results))
}

#[derive(Serialize)]
pub struct HealthResponse {
    status: &'static str,
    version: &'static str,
    uptime_seconds: u64,
}

#[derive(Serialize)]
struct ReadyResponse {
    status: String,
    version: &'static str,
    uptime_seconds: u64,
    database: String,
}

pub async fn healthz(State(st): State<AppState>) -> impl IntoResponse {
    let uptime = st.started_at.elapsed().as_secs();
    let body = HealthResponse {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
        uptime_seconds: uptime,
    };
    (StatusCode::OK, Json(body))
}

pub async fn readyz(State(st): State<AppState>) -> impl IntoResponse {
    let uptime = st.started_at.elapsed().as_secs();
    match sqlx::query("SELECT 1").fetch_one(&st.pool).await {
        Ok(_) => {
            let body = ReadyResponse {
                status: "ready".into(),
                version: env!("CARGO_PKG_VERSION"),
                uptime_seconds: uptime,
                database: "up".into(),
            };
            (StatusCode::OK, Json(body))
        }
        Err(e) => {
            let body = ReadyResponse {
                status: "not_ready".into(),
                version: env!("CARGO_PKG_VERSION"),
                uptime_seconds: uptime,
                database: format!("down: {e}"),
            };
            (StatusCode::SERVICE_UNAVAILABLE, Json(body))
        }
    }
}

#[derive(Serialize, sqlx::FromRow)]
pub struct Church {
    pub id: uuid::Uuid,
    pub name: String,
    pub slug: String,
    pub db_name: String,
    pub storage_path: String,
    pub subdomain: String,
    pub admin_email: String,
    pub status: String,
    pub plan: Option<String>,
    pub custom_domain: Option<String>,
    pub last_active_at: Option<chrono::NaiveDateTime>,
    pub storage_bytes: Option<i64>,
    pub notes: Option<String>,
    pub suspended_at: Option<chrono::NaiveDateTime>,
    pub created_at: Option<chrono::NaiveDateTime>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct Notification {
    pub id: i64,
    #[serde(rename = "type")]
    #[sqlx(rename = "type")]
    pub event_type: String,
    pub title: String,
    pub body: Option<String>,
    pub church_id: Option<uuid::Uuid>,
    pub read: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub async fn list_churches(_auth: Authenticated, State(st): State<AppState>) -> Result<Json<Vec<Value>>, AppError> {
    let churches: Vec<Church> = sqlx::query_as("SELECT * FROM churches ORDER BY created_at DESC")
        .fetch_all(&st.pool)
        .await?;

    let mut result = Vec::with_capacity(churches.len());
    for church in churches {
        let pool = PgPoolOptions::new()
            .max_connections(1)
            .connect(&st.cfg.church_db_url(&church.slug))
            .await
            .map_err(|e| AppError::internal(format!("connect church db: {e}")))?;

        let member_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM members")
            .fetch_one(&pool)
            .await
            .unwrap_or((0,));

        let giving_total: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(total_amount), 0) FROM offerings")
            .fetch_one(&pool)
            .await
            .unwrap_or((0,));

        let mut church_json = serde_json::to_value(&church).map_err(|e| AppError::internal(e.to_string()))?;
        church_json["member_count"] = json!(member_count.0);
        church_json["giving_total"] = json!(giving_total.0);
        result.push(church_json);
    }

    Ok(Json(result))
}

#[derive(Deserialize)]
pub struct CreateReq {
    pub name: String,
}

pub async fn create_church(
    _admin: AdminGuard,
    State(st): State<AppState>,
    Json(req): Json<CreateReq>,
) -> Result<Json<Value>, AppError> {
    let name = req.name.trim();
    if name.is_empty() {
        return Err(AppError::bad_request("Church name is required"));
    }

    let p = provision::provision_church(&st.cfg, name).await?;

    sqlx::query(
        "INSERT INTO churches (name, slug, db_name, storage_path, subdomain, admin_email, status) \
         VALUES ($1, $2, $3, $4, $5, $6, 'provisioning')",
    )
    .bind(name)
    .bind(&p.slug)
    .bind(&p.slug)
    .bind(&p.storage_path)
    .bind(&p.subdomain)
    .bind(&p.admin_email)
    .execute(&st.pool)
    .await?;

    let church_id: uuid::Uuid = sqlx::query_scalar("SELECT id FROM churches WHERE slug = $1")
        .bind(&p.slug)
        .fetch_one(&st.pool)
        .await?;

    let cfg = st.cfg.clone();
    let pool = st.pool.clone();
    tokio::spawn(async move {
        let _ = provision::emit_notification(
            &pool,
            "church_provisioned",
            "Church provisioned",
            &format!("'{}' has been provisioned", name),
            Some(&church_id),
        )
        .await;

        tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

        let _ = sqlx::query("UPDATE churches SET status = 'active' WHERE id = $1")
            .bind(church_id)
            .execute(&pool)
            .await;
    });

    Ok(Json(json!({
        "id": church_id.to_string(),
        "slug": p.slug,
        "subdomain": p.subdomain,
        "url": format!("https://{}", p.subdomain),
        "admin_email": p.admin_email,
        "admin_password": p.admin_password,
        "note": "Save this password now — it is shown only once."
    })))
}

pub async fn get_church(
    Path(id): Path<uuid::Uuid>,
    State(st): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let church: Option<Church> =
        sqlx::query_as("SELECT * FROM churches WHERE id = $1")
            .bind(id)
            .fetch_optional(&st.pool)
            .await?
            .ok_or_else(|| AppError::not_found("Church not found"))?;

    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&st.cfg.church_db_url(&church.slug))
        .await
        .map_err(|e| AppError::internal(format!("connect church db: {e}")))?;

    let member_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM members")
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    let giving_total: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(total_amount), 0) FROM offerings")
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    let mut church_json = serde_json::to_value(&church).map_err(|e| AppError::internal(e.to_string()))?;
    church_json["member_count"] = json!(member_count.0);
    church_json["giving_total"] = json!(giving_total.0);

    Ok(Json(church_json))
}

pub async fn delete_church(
    _admin: AdminGuard,
    State(st): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Value>, AppError> {
    let slug: Option<String> = sqlx::query_scalar("SELECT slug FROM churches WHERE id = $1")
        .bind(id)
        .fetch_optional(&st.pool)
        .await?;
    let slug = slug.ok_or_else(|| AppError::not_found("Church not found"))?;

    provision::deprovision(&st.cfg, &slug).await?;
    sqlx::query("DELETE FROM churches WHERE id = $1").bind(id).execute(&st.pool).await?;

    Ok(Json(json!({ "deleted": slug })))
}

pub async fn suspend_church(
    _admin: AdminGuard,
    State(st): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Value>, AppError> {
    let church: Option<Church> =
        sqlx::query_as("SELECT * FROM churches WHERE id = $1")
            .bind(id)
            .fetch_optional(&st.pool)
            .await?;
    let church = church.ok_or_else(|| AppError::not_found("Church not found"))?;

    if church.status == "suspended" {
        return Err(AppError::bad_request("Church is already suspended"));
    }

    let now = chrono::Utc::now().naive_utc();
    let updated: Church = sqlx::query_as(
        "UPDATE churches SET status = 'suspended', suspended_at = $1 WHERE id = $2 RETURNING *",
    )
    .bind(now)
    .bind(id)
    .fetch_one(&st.pool)
    .await?;

    let _ = provision::update_church_suspended_flag(&st.cfg, &church.slug, Some(&now)).await;

    audit_log(
        &st.pool,
        &_admin.0,
        "suspend_church",
        &id.to_string(),
        "church",
        Some(json!({ "slug": church.slug, "status": updated.status })),
    )
    .await?;

    let _ = provision::emit_notification(
        &st.pool,
        "church_suspended",
        "Church suspended",
        &format!("'{}' has been suspended", church.name),
        Some(&id),
    )
    .await;

    Ok(Json(json!({
        "id": updated.id,
        "name": updated.name,
        "slug": updated.slug,
        "status": updated.status,
        "suspended_at": updated.suspended_at,
    })))
}

pub async fn reactivate_church(
    _admin: AdminGuard,
    State(st): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Value>, AppError> {
    let church: Option<Church> =
        sqlx::query_as("SELECT * FROM churches WHERE id = $1")
            .bind(id)
            .fetch_optional(&st.pool)
            .await?;
    let church = church.ok_or_else(|| AppError::not_found("Church not found"))?;

    if church.status != "suspended" {
        return Err(AppError::bad_request("Church is not suspended"));
    }

    let updated: Church = sqlx::query_as(
        "UPDATE churches SET status = 'active', suspended_at = NULL WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_one(&st.pool)
    .await?;

    let _ = provision::update_church_suspended_flag(&st.cfg, &church.slug, None).await;

    audit_log(
        &st.pool,
        &_admin.0,
        "reactivate_church",
        &id.to_string(),
        "church",
        Some(json!({ "slug": church.slug, "status": updated.status })),
    )
    .await?;

    let _ = provision::emit_notification(
        &st.pool,
        "church_reactivated",
        "Church reactivated",
        &format!("'{}' has been reactivated", church.name),
        Some(&id),
    )
    .await;

    Ok(Json(json!({
        "id": updated.id,
        "name": updated.name,
        "slug": updated.slug,
        "status": updated.status,
        "suspended_at": updated.suspended_at,
    })))
}

/// Seed dummy churches endpoint (super_admin only)
pub async fn seed_dummy(_super: SuperAdmin, State(st): State<AppState>) -> Result<Json<Value>, AppError> {
    let seeded = seed::seed_dummy_churches(&st.cfg, &st.pool).await?;
    Ok(Json(json!({ "seeded": seeded.len(), "message": "Dummy churches seeded" })))
}

#[derive(Serialize, sqlx::FromRow)]
pub struct Admin {
    pub id: uuid::Uuid,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: String,
    pub status: String,
    pub invite_token: Option<String>,
    pub invite_expires_at: Option<chrono::DateTime<chrono::Utc>>,
    pub last_active_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub totp_secret: Option<String>,
    pub twofa_enabled: Option<bool>,
}

pub async fn list_admins(_super: SuperAdmin, State(st): State<AppState>) -> Result<Json<Vec<Admin>>, AppError> {
    let admins = sqlx::query_as("SELECT * FROM admins ORDER BY created_at DESC")
        .fetch_all(&st.pool)
        .await?;
    Ok(Json(admins))
}

#[derive(Deserialize)]
pub struct InviteAdminReq {
    pub email: String,
    pub role: String,
}

pub async fn invite_admin(
    super_admin: SuperAdmin,
    State(st): State<AppState>,
    Json(req): Json<InviteAdminReq>,
) -> Result<Json<Value>, AppError> {
    let email = req.email.trim().to_string();
    let role = req.role.trim().to_string();
    if email.is_empty() || role.is_empty() {
        return Err(AppError::bad_request("Email and role are required"));
    }
    if !matches!(role.as_str(), "super_admin" | "admin" | "readonly") {
        return Err(AppError::bad_request("Invalid role"));
    }

    let invite_token = uuid::Uuid::new_v4().to_string();
    let token_hash = bcrypt::hash(&invite_token, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::internal(format!("hash invite token: {e}")))?;

    let admin = sqlx::query_as::<_, Admin>(
        "INSERT INTO admins (email, password_hash, role, status, invite_token, invite_expires_at) \
         VALUES ($1, $2, $3, 'pending', $4, NOW() + INTERVAL '7 days') \
         RETURNING *"
    )
    .bind(&email)
    .bind(&token_hash)
    .bind(&role)
    .bind(&invite_token)
    .fetch_one(&st.pool)
    .await?;

    audit_log(
        &st.pool,
        &super_admin,
        "invite_admin",
        &admin.id.to_string(),
        "admin",
        Some(json!({ "email": email, "role": role }))
    ).await?;

    Ok(Json(json!({
        "id": admin.id,
        "email": admin.email,
        "role": admin.role,
        "status": admin.status,
        "invite_token": invite_token,
        "message": "Invitation sent. Share this token with the user."
    })))
}

#[derive(Deserialize)]
pub struct UpdateAdminReq {
    pub role: Option<String>,
    pub status: Option<String>,
}

pub async fn update_admin(
    super_admin: SuperAdmin,
    Path(id): Path<uuid::Uuid>,
    State(st): State<AppState>,
    Json(req): Json<UpdateAdminReq>,
) -> Result<Json<Value>, AppError> {
    let role = req.role.filter(|r| !r.trim().is_empty());
    let status = req.status.filter(|r| !r.trim().is_empty());

    if role.is_none() && status.is_none() {
        return Err(AppError::bad_request("No updates provided"));
    }

    let existing: Option<Admin> = sqlx::query_as("SELECT * FROM admins WHERE id = $1")
        .bind(id)
        .fetch_optional(&st.pool)
        .await?;
    let existing = existing.ok_or_else(|| AppError::not_found("Admin not found"))?;

    if let Some(ref role) = role {
        if !matches!(role.as_str(), "super_admin" | "admin" | "readonly") {
            return Err(AppError::bad_request("Invalid role"));
        }
        if existing.role == "super_admin" && role != "super_admin" {
            let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM admins WHERE role = 'super_admin' AND status = 'active'")
                .fetch_one(&st.pool)
                .await?;
            if count.0 <= 1 {
                return Err(AppError::conflict("Cannot remove the last active super_admin"));
            }
        }
    }

    if let Some(ref status) = status {
        if !matches!(status.as_str(), "active" | "pending" | "disabled") {
            return Err(AppError::bad_request("Invalid status"));
        }
        if existing.role == "super_admin" && status != "active" {
            let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM admins WHERE role = 'super_admin' AND status = 'active' AND id != $1")
                .bind(id)
                .fetch_one(&st.pool)
                .await?;
            if count.0 == 0 {
                return Err(AppError::conflict("Cannot disable the last active super_admin"));
            }
        }
    }

    let updated = sqlx::query_as::<_, Admin>(
        "UPDATE admins SET role = COALESCE($2, role), status = COALESCE($3, status) WHERE id = $1 RETURNING *"
    )
    .bind(id)
    .bind(role)
    .bind(status)
    .fetch_one(&st.pool)
    .await?;

    audit_log(
        &st.pool,
        &super_admin,
        "update_admin",
        &updated.id.to_string(),
        "admin",
        Some(json!({
            "old_role": existing.role,
            "old_status": existing.status,
            "new_role": updated.role,
            "new_status": updated.status,
        }))
    ).await?;

    Ok(Json(serde_json::to_value(&updated).map_err(|e| AppError::internal(e.to_string()))?))
}

pub async fn delete_admin(
    super_admin: SuperAdmin,
    Path(id): Path<uuid::Uuid>,
    State(st): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let admin: Option<Admin> = sqlx::query_as("SELECT * FROM admins WHERE id = $1")
        .bind(id)
        .fetch_optional(&st.pool)
        .await?;
    let admin = admin.ok_or_else(|| AppError::not_found("Admin not found"))?;

    if admin.role == "super_admin" {
        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM admins WHERE role = 'super_admin' AND status = 'active'")
            .fetch_one(&st.pool)
            .await?;
        if count.0 <= 1 {
            return Err(AppError::conflict("Cannot remove the last active super_admin"));
        }
    }

    sqlx::query("DELETE FROM admins WHERE id = $1")
        .bind(id)
        .execute(&st.pool)
        .await?;

    audit_log(
        &st.pool,
        &super_admin,
        "delete_admin",
        &admin.id.to_string(),
        "admin",
        Some(json!({ "email": admin.email, "role": admin.role }))
    ).await?;

    Ok(Json(json!({ "deleted": id.to_string() })))
}

async fn audit_log(
    pool: &sqlx::PgPool,
    actor: &SuperAdmin,
    action: &str,
    target_id: &str,
    target_type: &str,
    metadata: Option<serde_json::Value>,
) -> Result<(), AppError> {
    sqlx::query(
        "INSERT INTO audit_log (actor_id, actor_email, action, target_type, target_id, metadata) \
         VALUES ($1, $2, $3, $4, $5, $6)"
    )
    .bind(uuid::Uuid::parse_str(&actor.id).map_err(|e| AppError::internal(format!("parse actor id: {e}")))?)
    .bind(&actor.email)
    .bind(action)
    .bind(target_type)
    .bind(target_id)
    .bind(metadata.unwrap_or_else(|| json!({})))
    .execute(pool)
    .await?;

    Ok(())
}

// =============================================================================
// Plans handlers
// =============================================================================

#[derive(Serialize, sqlx::FromRow)]
pub struct Plan {
    pub id: uuid::Uuid,
    pub name: String,
    pub price_monthly: i64,
    pub price_annual: i64,
    pub max_members: i64,
    pub max_storage_mb: i64,
    pub max_emails: i64,
    pub max_churches: i64,
    pub features: Value,
    pub created_at: Option<chrono::NaiveDateTime>,
}

pub async fn list_plans(State(st): State<AppState>) -> Result<Json<Vec<Plan>>, AppError> {
    let plans = sqlx::query_as("SELECT * FROM plans ORDER BY price_monthly ASC")
        .fetch_all(&st.pool)
        .await?;
    Ok(Json(plans))
}

pub async fn get_plan(Path(id): Path<uuid::Uuid>, State(st): State<AppState>) -> Result<Json<Plan>, AppError> {
    let plan = sqlx::query_as("SELECT * FROM plans WHERE id = $1")
        .bind(id)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(|| AppError::not_found("Plan not found"))?;
    Ok(Json(plan))
}

#[derive(Deserialize)]
pub struct CreatePlanReq {
    pub name: String,
    pub price_monthly: i64,
    pub price_annual: Option<i64>,
    pub max_members: i64,
    pub max_storage_mb: i64,
    pub max_emails: i64,
    pub max_churches: i64,
    pub features: Option<Value>,
}

pub async fn create_plan(
    _admin: AdminGuard,
    State(st): State<AppState>,
    Json(req): Json<CreatePlanReq>,
) -> Result<Json<Value>, AppError> {
    let price_annual = req.price_annual.unwrap_or(req.price_monthly * 10);
    
    let plan = sqlx::query_as::<_, Plan>(
        "INSERT INTO plans (name, price_monthly, price_annual, max_members, max_storage_mb, max_emails, max_churches, features) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) \
         RETURNING *"
    )
    .bind(&req.name)
    .bind(req.price_monthly)
    .bind(price_annual)
    .bind(req.max_members)
    .bind(req.max_storage_mb)
    .bind(req.max_emails)
    .bind(req.max_churches)
    .bind(req.features.unwrap_or(json!({})))
    .fetch_one(&st.pool)
    .await?;

    Ok(Json(serde_json::to_value(&plan).map_err(|e| AppError::internal(e.to_string()))?))
}

pub async fn update_plan(
    _admin: AdminGuard,
    Path(id): Path<uuid::Uuid>,
    State(st): State<AppState>,
    Json(req): Json<CreatePlanReq>,
) -> Result<Json<Value>, AppError> {
    let plan = sqlx::query_as::<_, Plan>(
        "UPDATE plans SET name = $1, price_monthly = $2, price_annual = $3, max_members = $4, \
         max_storage_mb = $5, max_emails = $6, max_churches = $7, features = $8 \
         WHERE id = $9 \
         RETURNING *"
    )
    .bind(&req.name)
    .bind(req.price_annual.unwrap_or(req.price_monthly * 10))
    .bind(req.max_members)
    .bind(req.max_storage_mb)
    .bind(req.max_emails)
    .bind(req.max_churches)
    .bind(req.features.unwrap_or(json!({})))
    .bind(id)
    .fetch_optional(&st.pool)
    .await?
    .ok_or_else(|| AppError::not_found("Plan not found"))?;

    Ok(Json(serde_json::to_value(&plan).map_err(|e| AppError::internal(e.to_string()))?))
}

pub async fn delete_plan(
    _admin: AdminGuard,
    Path(id): Path<uuid::Uuid>,
    State(st): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let result = sqlx::query("DELETE FROM plans WHERE id = $1")
        .bind(id)
        .execute(&st.pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::not_found("Plan not found"));
    }

    Ok(Json(json!({ "deleted": id.to_string() })))
}

// =============================================================================
// Billing handlers
// =============================================================================

#[derive(Serialize, sqlx::FromRow)]
pub struct Invoice {
    pub id: uuid::Uuid,
    pub church_id: uuid::Uuid,
    pub amount: i64,
    pub status: String,
    pub period_start: chrono::NaiveDateTime,
    pub period_end: chrono::NaiveDateTime,
    pub due_date: chrono::NaiveDateTime,
    pub paid_at: Option<chrono::NaiveDateTime>,
    pub created_at: Option<chrono::NaiveDateTime>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct BillingInfo {
    pub id: uuid::Uuid,
    pub church_id: uuid::Uuid,
    pub church_name: String,
    pub plan: String,
    pub status: String,
    pub trial_ends_at: Option<chrono::NaiveDateTime>,
    pub current_period_end: Option<chrono::NaiveDateTime>,
    pub mrr: i64,
}

pub async fn list_billing(State(st): State<AppState>) -> Result<Json<Vec<BillingInfo>>, AppError> {
    let churches = sqlx::query_as::<_, crate::handlers::Church>("SELECT * FROM churches ORDER BY created_at DESC")
        .fetch_all(&st.pool)
        .await?;

    let mut billing = Vec::new();
    for c in churches {
        billing.push(BillingInfo {
            id: c.id,
            church_id: c.id,
            church_name: c.name,
            plan: c.plan.unwrap_or_else(|| "Free".to_string()),
            status: c.status,
            trial_ends_at: None,
            current_period_end: None,
            mrr: 0,
        });
    }
    Ok(Json(billing))
}

pub async fn get_billing_for_church(
    Path(church_id): Path<uuid::Uuid>,
    State(st): State<AppState>,
) -> Result<Json<BillingInfo>, AppError> {
    let church = sqlx::query_as::<_, crate::handlers::Church>("SELECT * FROM churches WHERE id = $1")
        .bind(church_id)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(|| AppError::not_found("Church not found"))?;
    
    let billing = BillingInfo {
        id: church.id,
        church_id: church.id,
        church_name: church.name,
        plan: church.plan.unwrap_or_else(|| "Free".to_string()),
        status: church.status,
        trial_ends_at: None,
        current_period_end: None,
        mrr: 0,
    };
    Ok(Json(billing))
}

pub async fn subscribe_church(
    _admin: AdminGuard,
    Path(church_id): Path<uuid::Uuid>,
    State(st): State<AppState>,
    Json(req): Json<SubscribeReq>,
) -> Result<Json<Value>, AppError> {
    let church = sqlx::query_as::<_, crate::handlers::Church>("SELECT * FROM churches WHERE id = $1")
        .bind(church_id)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(|| AppError::not_found("Church not found"))?;

    let plan = sqlx::query_as::<_, crate::handlers::Plan>("SELECT * FROM plans WHERE id = $1")
        .bind(req.plan_id)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(|| AppError::not_found("Plan not found"))?;

    let success_url = format!(
        "https://{}/billing?session_id={{CHECKOUT_SESSION_ID}}",
        church.subdomain
    );
    let cancel_url = format!("https://{}/billing", church.subdomain);

    let params = CreateCheckoutSessionParams {
        mode: "subscription".to_string(),
        success_url,
        cancel_url,
        line_items: vec![CreateCheckoutSessionLineItem {
            price_data: CreateCheckoutSessionPriceData {
                currency: "usd".to_string(),
                product_data: CreateCheckoutSessionProductData {
                    name: plan.name.clone(),
                },
                unit_amount: plan.price_monthly,
                recurring: CreateCheckoutSessionRecurring {
                    interval: "month".to_string(),
                },
            },
            quantity: 1,
        }],
    };

    let client = crate::stripe::StripeClient::new(&st.cfg.stripe_secret_key);
    let session = client.create_checkout_session(&params).await?;

    sqlx::query(
        "INSERT INTO stripe_sessions (church_id, plan_id, session_id, status) VALUES ($1, $2, $3, 'pending')"
    )
    .bind(church_id)
    .bind(req.plan_id)
    .bind(&session.id)
    .execute(&st.pool)
    .await?;

    Ok(Json(json!({ "url": session.url })))
}

#[derive(Deserialize)]
pub struct SubscribeReq {
    pub plan_id: uuid::Uuid,
}

pub async fn list_invoices(
    Query(params): Query<InvoiceParams>,
    State(st): State<AppState>,
) -> Result<Json<Vec<Invoice>>, AppError> {
    if let Some(church_id) = params.church_id {
        let invoices = sqlx::query_as("SELECT * FROM invoices WHERE church_id = $1 ORDER BY created_at DESC")
            .bind(church_id)
            .fetch_all(&st.pool)
            .await?;
        return Ok(Json(invoices));
    }
    
    let invoices = sqlx::query_as("SELECT * FROM invoices ORDER BY created_at DESC")
        .fetch_all(&st.pool)
        .await?;
    Ok(Json(invoices))
}

#[derive(Deserialize)]
pub struct InvoiceParams {
    pub church_id: Option<uuid::Uuid>,
}

pub async fn create_invoice(
    _admin: AdminGuard,
    State(st): State<AppState>,
    Json(req): Json<CreateInvoiceReq>,
) -> Result<Json<Value>, AppError> {
    let invoice = sqlx::query_as::<_, Invoice>(
        "INSERT INTO invoices (church_id, amount, status, period_start, period_end, due_date) \
         VALUES ($1, $2, 'unpaid', $3, $4, $5) \
         RETURNING *"
    )
    .bind(req.church_id)
    .bind(req.amount)
    .bind(req.period_start)
    .bind(req.period_end)
    .bind(req.due_date)
    .fetch_one(&st.pool)
    .await?;

    Ok(Json(serde_json::to_value(&invoice).map_err(|e| AppError::internal(e.to_string()))?))
}

#[derive(Deserialize)]
pub struct CreateInvoiceReq {
    pub church_id: uuid::Uuid,
    pub amount: i64,
    pub period_start: chrono::NaiveDateTime,
    pub period_end: chrono::NaiveDateTime,
    pub due_date: chrono::NaiveDateTime,
}

pub async fn mark_invoice_paid(
    _admin: AdminGuard,
    Path(id): Path<uuid::Uuid>,
    State(st): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let invoice = sqlx::query_as::<_, Invoice>(
        "UPDATE invoices SET status = 'paid', paid_at = NOW() WHERE id = $1 RETURNING *"
    )
    .bind(id)
    .fetch_optional(&st.pool)
    .await?
    .ok_or_else(|| AppError::not_found("Invoice not found"))?;

    let _ = provision::emit_notification(
        &st.pool,
        "payment_succeeded",
        "Payment received",
        &format!("Invoice {} has been paid", invoice.id),
        Some(&invoice.church_id),
    )
    .await;

    Ok(Json(serde_json::to_value(&invoice).map_err(|e| AppError::internal(e.to_string()))?))
}

// =============================================================================
// Refunds handlers
// =============================================================================

#[derive(Serialize)]
pub struct ParishRefundSummary {
    pub church_id: uuid::Uuid,
    pub church_name: String,
    pub total_refunded: i64,
    pub refund_count: i64,
}

#[derive(Serialize)]
pub struct RefundAnalytics {
    pub total_refunded: i64,
    pub refund_count: i64,
    pub parish_refunds: Vec<ParishRefundSummary>,
}

pub async fn get_refund_analytics(
    State(st): State<AppState>,
) -> Result<Json<RefundAnalytics>, AppError> {
    let churches = sqlx::query_as::<_, crate::handlers::Church>("SELECT * FROM churches ORDER BY created_at DESC")
        .fetch_all(&st.pool)
        .await?;

    let mut total_refunded = 0i64;
    let mut refund_count = 0i64;
    let mut parish_refunds = Vec::new();

    for church in churches {
        if let Ok(pool) = PgPoolOptions::new()
            .max_connections(1)
            .connect(&st.cfg.church_db_url(&church.slug))
            .await
        {
            let refunded: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(refund_amount)::bigint, 0) FROM donations WHERE refund_amount > 0")
                .fetch_one(&pool)
                .await
                .unwrap_or((0,));

            let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM donations WHERE refund_amount > 0")
                .fetch_one(&pool)
                .await
                .unwrap_or((0,));

            total_refunded += refunded.0;
            refund_count += count.0;

            if count.0 > 0 {
                parish_refunds.push(ParishRefundSummary {
                    church_id: church.id,
                    church_name: church.name,
                    total_refunded: refunded.0,
                    refund_count: count.0,
                });
            }
        }
    }

    Ok(Json(RefundAnalytics {
        total_refunded,
        refund_count,
        parish_refunds,
    }))
}

// =============================================================================
// Analytics handlers
// =============================================================================

#[derive(Serialize)]
pub struct Analytics {
    pub total_churches: i64,
    pub active_churches: i64,
    pub suspended_churches: i64,
    pub total_members: i64,
    pub total_giving: i64,
    pub mrr: i64,
    pub churches_this_month: i64,
}

pub async fn get_analytics(State(st): State<AppState>) -> Result<Json<Analytics>, AppError> {
    let total_churches: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM churches")
        .fetch_one(&st.pool)
        .await
        .map_err(|e| AppError::internal(e.to_string()))?;

    let active_churches: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM churches WHERE status = 'active'")
        .fetch_one(&st.pool)
        .await
        .map_err(|e| AppError::internal(e.to_string()))?;

    let suspended_churches: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM churches WHERE status = 'suspended'")
        .fetch_one(&st.pool)
        .await
        .map_err(|e| AppError::internal(e.to_string()))?;

    let churches_this_month: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM churches WHERE created_at >= DATE_TRUNC('month', NOW())"
    )
    .fetch_one(&st.pool)
    .await
    .map_err(|e| AppError::internal(e.to_string()))?;

    let churches = sqlx::query_as::<_, Church>("SELECT * FROM churches ORDER BY created_at DESC")
        .fetch_all(&st.pool)
        .await?;

    let mut total_members = 0i64;
    let mut total_giving = 0i64;

    for church in churches {
        if let Ok(pool) = PgPoolOptions::new()
            .max_connections(1)
            .connect(&st.cfg.church_db_url(&church.slug))
            .await
        {
            let members: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM members")
                .fetch_one(&pool)
                .await
                .unwrap_or((0,));
            total_members += members.0;

            let giving: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(total_amount), 0) FROM offerings")
                .fetch_one(&pool)
                .await
                .unwrap_or((0,));
            total_giving += giving.0;
        }
    }

    let analytics = Analytics {
        total_churches: total_churches.0,
        active_churches: active_churches.0,
        suspended_churches: suspended_churches.0,
        total_members,
        total_giving,
        mrr: 0,
        churches_this_month: churches_this_month.0,
    };

    Ok(Json(analytics))
}

#[derive(Serialize)]
pub struct ChurchStats {
    pub members: i64,
    pub giving: i64,
    pub events: i64,
    pub sermons: i64,
    pub groups: i64,
}

pub async fn get_church_stats(
    Path(slug): Path<String>,
    State(st): State<AppState>,
) -> Result<Json<ChurchStats>, AppError> {
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&st.cfg.church_db_url(&slug))
        .await
        .map_err(|e| AppError::internal(format!("connect church db: {e}")))?;

    let members: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM members")
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    let giving: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(total_amount), 0) FROM offerings")
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    let events: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM events")
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    let sermons: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM sermons")
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    let groups: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM groups")
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    let stats = ChurchStats {
        members: members.0,
        giving: giving.0,
        events: events.0,
        sermons: sermons.0,
        groups: groups.0,
    };

    Ok(Json(stats))
}

pub async fn get_growth_analytics(
    State(st): State<AppState>,
) -> Result<Json<Vec<Value>>, AppError> {
    let rows: Vec<(String, i64, i64, i64)> = sqlx::query_as(
        "SELECT 
            TO_CHAR(created_at, 'YYYY-MM') as month,
            COUNT(*) as churches_created,
            0 as churches_churned,
            COUNT(*) as net_growth
         FROM churches 
         GROUP BY TO_CHAR(created_at, 'YYYY-MM') 
         ORDER BY month DESC 
         LIMIT 12"
    )
    .fetch_all(&st.pool)
    .await?;

    let growth: Vec<Value> = rows.into_iter().map(|(month, churches_created, churches_churned, _)| {
        json!({
            "month": month,
            "churches_created": churches_created,
            "churches_churned": churches_churned,
            "net_growth": churches_created - churches_churned
        })
    }).collect();

    Ok(Json(growth))
}

pub async fn get_top_churches(
    State(st): State<AppState>,
) -> Result<Json<Vec<Church>>, AppError> {
    let churches = sqlx::query_as("SELECT * FROM churches WHERE status = 'active' ORDER BY created_at DESC LIMIT 10")
        .fetch_all(&st.pool)
        .await?;
    Ok(Json(churches))
}

// =============================================================================
// Notifications handlers
// =============================================================================

pub async fn list_notifications(State(st): State<AppState>) -> Result<Json<Value>, AppError> {
    let notifications: Vec<Notification> =
        sqlx::query_as("SELECT * FROM notifications ORDER BY created_at DESC")
            .fetch_all(&st.pool)
            .await?;

    let unread_count: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM notifications WHERE read = false")
            .fetch_one(&st.pool)
            .await?;

    Ok(Json(json!({
        "notifications": notifications,
        "unread_count": unread_count.0,
    })))
}

pub async fn mark_notification_read(
    Path(id): Path<i64>,
    State(st): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let result =
        sqlx::query("UPDATE notifications SET read = true WHERE id = $1")
            .bind(id)
            .execute(&st.pool)
            .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::not_found("Notification not found"));
    }

    Ok(Json(json!({ "success": true })))
}

pub async fn mark_all_notifications_read(
    State(st): State<AppState>,
) -> Result<Json<Value>, AppError> {
    sqlx::query("UPDATE notifications SET read = true WHERE read = false")
        .execute(&st.pool)
        .await?;

    Ok(Json(json!({ "success": true })))
}

// =============================================================================
// Blog CMS handlers
// =============================================================================

#[derive(Serialize, sqlx::FromRow)]
pub struct BlogPost {
    pub id: uuid::Uuid,
    pub slug: String,
    pub title: String,
    pub excerpt: String,
    pub body: String,
    pub cover: Option<String>,
    pub author: String,
    pub category: String,
    pub published: bool,
    pub published_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize)]
pub struct CreateBlogPostReq {
    pub slug: String,
    pub title: String,
    pub excerpt: String,
    pub body: String,
    pub cover: Option<String>,
    pub author: String,
    pub category: String,
    pub published: Option<bool>,
}

#[derive(Deserialize)]
pub struct UpdateBlogPostReq {
    pub slug: Option<String>,
    pub title: Option<String>,
    pub excerpt: Option<String>,
    pub body: Option<String>,
    pub cover: Option<String>,
    pub author: Option<String>,
    pub category: Option<String>,
    pub published: Option<bool>,
}

pub async fn list_public_blog_posts(State(st): State<AppState>) -> Result<Json<Vec<BlogPost>>, AppError> {
    let posts = sqlx::query_as("SELECT * FROM mc_blog_posts WHERE published = true ORDER BY created_at DESC")
        .fetch_all(&st.pool)
        .await?;
    Ok(Json(posts))
}

pub async fn get_public_blog_post(Path(slug): Path<String>, State(st): State<AppState>) -> Result<Json<BlogPost>, AppError> {
    let post: Option<BlogPost> = sqlx::query_as("SELECT * FROM mc_blog_posts WHERE published = true AND slug = $1")
        .bind(&slug)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(|| AppError::not_found("Post not found"))?;
    Ok(Json(post))
}

pub async fn list_admin_blog_posts(_auth: Authenticated, State(st): State<AppState>) -> Result<Json<Vec<BlogPost>>, AppError> {
    let posts = sqlx::query_as("SELECT * FROM mc_blog_posts ORDER BY created_at DESC")
        .fetch_all(&st.pool)
        .await?;
    Ok(Json(posts))
}

pub async fn create_blog_post(_auth: AdminGuard, State(st): State<AppState>, Json(req): Json<CreateBlogPostReq>) -> Result<Json<BlogPost>, AppError> {
    let slug = req.slug.trim().to_lowercase().replace(|c: char| !c.is_alphanumeric() && c != '-', "-").trim_matches('-').to_string();
    if slug.is_empty() {
        return Err(AppError::bad_request("Slug is required"));
    }

    let published_at = if req.published.unwrap_or(false) {
        Some(chrono::Utc::now())
    } else {
        None
    };

    let post: BlogPost = sqlx::query_as(
        "INSERT INTO mc_blog_posts (slug, title, excerpt, body, cover, author, category, published, published_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *"
    )
    .bind(&slug)
    .bind(&req.title)
    .bind(&req.excerpt)
    .bind(&req.body)
    .bind(&req.cover)
    .bind(&req.author)
    .bind(&req.category)
    .bind(req.published.unwrap_or(false))
    .bind(published_at)
    .fetch_one(&st.pool)
    .await?;

    Ok(Json(post))
}

pub async fn update_blog_post(_auth: AdminGuard, Path(id): Path<uuid::Uuid>, State(st): State<AppState>, Json(req): Json<UpdateBlogPostReq>) -> Result<Json<BlogPost>, AppError> {
    let existing: Option<BlogPost> = sqlx::query_as("SELECT * FROM mc_blog_posts WHERE id = $1")
        .bind(id)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(|| AppError::not_found("Post not found"))?;

    let slug = req.slug.map(|s| s.trim().to_lowercase().replace(|c: char| !c.is_alphanumeric() && c != '-', "-").trim_matches('-').to_string());

    let new_published = req.published.unwrap_or(existing.published);
    let published_at = if new_published && !existing.published {
        Some(chrono::Utc::now())
    } else {
        existing.published_at
    };

    let post: BlogPost = sqlx::query_as(
        "UPDATE mc_blog_posts SET slug = COALESCE($2, slug), title = COALESCE($3, title), excerpt = COALESCE($4, excerpt), \
         body = COALESCE($5, body), cover = COALESCE($6, cover), author = COALESCE($7, author), \
         category = COALESCE($8, category), published = COALESCE($9, published), published_at = COALESCE($10, published_at) \
         WHERE id = $1 RETURNING *"
    )
    .bind(id)
    .bind(&slug)
    .bind(&req.title)
    .bind(&req.excerpt)
    .bind(&req.body)
    .bind(&req.cover)
    .bind(&req.author)
    .bind(&req.category)
    .bind(new_published)
    .bind(published_at)
    .fetch_one(&st.pool)
    .await?;

    Ok(Json(post))
}

pub async fn delete_blog_post(_auth: AdminGuard, Path(id): Path<uuid::Uuid>, State(st): State<AppState>) -> Result<Json<Value>, AppError> {
    let result = sqlx::query("DELETE FROM mc_blog_posts WHERE id = $1")
        .bind(id)
        .execute(&st.pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::not_found("Post not found"));
    }

    Ok(Json(json!({ "deleted": true })))
}

// =============================================================================
// Platform settings handlers
// =============================================================================

pub async fn get_settings(
    _auth: Authenticated,
    State(st): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let rows: Vec<(String, Value)> =
        sqlx::query_as("SELECT key, value FROM platform_settings")
            .fetch_all(&st.pool)
            .await?;

    let mut settings = json!({});
    for (key, value) in rows {
        settings[key] = value;
    }

    Ok(Json(settings))
}

pub async fn update_settings(
    super_admin: SuperAdmin,
    State(st): State<AppState>,
    Json(req): Json<Value>,
) -> Result<Json<Value>, AppError> {
    if !req.is_object() {
        return Err(AppError::bad_request("Request body must be a JSON object"));
    }

    let obj = req.as_object().unwrap();
    let mut updated_keys = Vec::new();

    for (key, value) in obj.iter() {
        if key.is_empty() {
            continue;
        }
        sqlx::query(
            "INSERT INTO platform_settings (key, value, updated_at) \
             VALUES ($1, $2, NOW()) \
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at",
        )
        .bind(key)
        .bind(value)
        .execute(&st.pool)
        .await?;
        updated_keys.push(key.clone());
    }

    let rows: Vec<(String, Value)> =
        sqlx::query_as("SELECT key, value FROM platform_settings")
            .fetch_all(&st.pool)
            .await?;
    let mut settings = json!({});
    for (key, value) in rows {
        settings[key] = value;
    }
    let result = Json(settings);

    audit_log(
        &st.pool,
        &super_admin,
        "update_settings",
        "platform_settings",
        "platform_settings",
        Some(json!({ "keys": updated_keys })),
    )
    .await?;

    Ok(result)
}

// =============================================================================
// API Keys handlers
// =============================================================================

#[derive(Serialize, sqlx::FromRow)]
pub struct ApiKeyRow {
    pub id: uuid::Uuid,
    pub name: String,
    pub prefix: String,
    pub last_four: String,
    pub scopes: Vec<String>,
    pub revoked_at: Option<chrono::NaiveDateTime>,
    pub last_used_at: Option<chrono::NaiveDateTime>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Deserialize)]
pub struct CreateApiKeyReq {
    pub name: String,
    pub scopes: Option<Vec<String>>,
}

pub async fn create_api_key(
    _admin: AdminGuard,
    State(st): State<AppState>,
    Json(req): Json<CreateApiKeyReq>,
) -> Result<Json<Value>, AppError> {
    let name = req.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::bad_request("Name is required"));
    }

    let scopes = req.scopes.unwrap_or_default();

    let mut rng = rand::thread_rng();
    let mut secret = [0u8; 32];
    rng.fill_bytes(&mut secret);
    let hex_secret: String = secret.iter().map(|b| format!("{:02x}", b)).collect();
    let full_key = format!("cn_{}", hex_secret);
    let prefix = &full_key[..12];
    let last_four = &full_key[full_key.len() - 4..];

    let key_hash = bcrypt::hash(&full_key, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::internal(format!("hash api key: {e}")))?;

    let row: ApiKeyRow = sqlx::query_as(
        "INSERT INTO api_keys (name, prefix, key_hash, last_four, scopes) VALUES ($1, $2, $3, $4, $5) RETURNING *"
    )
    .bind(&name)
    .bind(prefix)
    .bind(&key_hash)
    .bind(last_four)
    .bind(&scopes)
    .fetch_one(&st.pool)
    .await?;

    Ok(Json(json!({
        "id": row.id,
        "name": row.name,
        "prefix": prefix,
        "masked_key": format!("{}****{}", prefix, last_four),
        "full_key": full_key,
        "scopes": row.scopes,
        "created_at": row.created_at,
        "note": "Save this key now — it is shown only once."
    })))
}

pub async fn list_api_keys(
    _admin: AdminGuard,
    State(st): State<AppState>,
) -> Result<Json<Vec<Value>>, AppError> {
    let keys: Vec<ApiKeyRow> = sqlx::query_as("SELECT * FROM api_keys ORDER BY created_at DESC")
        .fetch_all(&st.pool)
        .await?;

    let result: Vec<Value> = keys
        .into_iter()
        .map(|key| {
            json!({
                "id": key.id,
                "name": key.name,
                "masked_key": format!("{}****{}", key.prefix, key.last_four),
                "scopes": key.scopes,
                "revoked_at": key.revoked_at,
                "last_used_at": key.last_used_at,
                "created_at": key.created_at,
            })
        })
        .collect();

    Ok(Json(result))
}

pub async fn revoke_api_key(
    _admin: AdminGuard,
    Path(id): Path<uuid::Uuid>,
    State(st): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let result = sqlx::query("UPDATE api_keys SET revoked_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(&st.pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::not_found("API key not found"));
    }

    Ok(Json(json!({ "revoked": true, "id": id.to_string() })))
}

// =============================================================================
// 2FA (TOTP) handlers
// =============================================================================

fn generate_otp_secret() -> String {
    let mut bytes = [0u8; 20];
    rand::thread_rng().fill_bytes(&mut bytes);
    base32::encode(base32::Alphabet::Rfc4648 { padding: false }, &bytes)
}

pub async fn twofa_enroll(auth: Authenticated, State(st): State<AppState>) -> Result<Json<Value>, AppError> {
    let secret = generate_otp_secret();
    let bytes = decode(Alphabet::Rfc4648 { padding: false }, &secret)
        .ok_or_else(|| AppError::internal("Generate secret failed"))?;

    let totp = TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        bytes,
        Some("ChurchNepal".to_string()),
        auth.0.email.clone(),
    )
    .map_err(|e| AppError::internal(e.to_string()))?;

    let otpauth_url = totp.get_url();
    let qr_base64 = totp.get_qr_base64().map_err(|e| AppError::internal(e.to_string()))?;

    let admin_id = uuid::Uuid::parse_str(&auth.0.id).map_err(|e| AppError::internal(format!("parse id: {e}")))?;
    sqlx::query("UPDATE admins SET totp_secret = $1, twofa_enabled = false WHERE id = $2")
        .bind(&secret)
        .bind(admin_id)
        .execute(&st.pool)
        .await?;

    Ok(Json(json!({
        "secret": secret,
        "otpauth_url": otpauth_url,
        "qr_base64": qr_base64,
    })))
}

pub async fn twofa_verify(auth: Authenticated, State(st): State<AppState>, Json(req): Json<serde_json::Value>) -> Result<Json<Value>, AppError> {
    let code = req.get("code").and_then(|v| v.as_str()).unwrap_or("").trim();
    if code.is_empty() {
        return Err(AppError::bad_request("Code is required"));
    }

    let row: Option<(String,)> = sqlx::query_as("SELECT totp_secret FROM admins WHERE id = $1")
        .bind(uuid::Uuid::parse_str(&auth.0.id).map_err(|e| AppError::internal(format!("parse id: {e}")))?)
        .fetch_optional(&st.pool)
        .await?;
    let secret = row.ok_or_else(|| AppError::not_found("Admin not found"))?.0;

    let bytes = decode(Alphabet::Rfc4648 { padding: false }, &secret)
        .ok_or_else(|| AppError::internal("Invalid 2FA secret"))?;

    let totp = TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        bytes,
        Some("ChurchNepal".to_string()),
        auth.0.email.clone(),
    )
    .map_err(|e| AppError::internal(e.to_string()))?;

    if !totp.check_current(code).map_err(|e| AppError::internal(e.to_string()))? {
        return Err(AppError::unauthorized("Invalid 2FA code"));
    }

    let admin_id = uuid::Uuid::parse_str(&auth.0.id).map_err(|e| AppError::internal(format!("parse id: {e}")))?;
    sqlx::query("UPDATE admins SET twofa_enabled = true WHERE id = $1")
        .bind(admin_id)
        .execute(&st.pool)
        .await?;

    Ok(Json(json!({ "success": true, "message": "2FA enabled" })))
}

pub async fn twofa_disable(auth: Authenticated, State(st): State<AppState>, Json(req): Json<serde_json::Value>) -> Result<Json<Value>, AppError> {
    let code = req.get("code").and_then(|v| v.as_str()).unwrap_or("").trim();
    if code.is_empty() {
        return Err(AppError::bad_request("Code is required"));
    }

    let row: Option<(String,)> = sqlx::query_as("SELECT totp_secret FROM admins WHERE id = $1")
        .bind(uuid::Uuid::parse_str(&auth.0.id).map_err(|e| AppError::internal(format!("parse id: {e}")))?)
        .fetch_optional(&st.pool)
        .await?;
    let secret = row.ok_or_else(|| AppError::not_found("Admin not found"))?.0;

    let bytes = decode(Alphabet::Rfc4648 { padding: false }, &secret)
        .ok_or_else(|| AppError::internal("Invalid 2FA secret"))?;

    let totp = TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        bytes,
        Some("ChurchNepal".to_string()),
        auth.0.email.clone(),
    )
    .map_err(|e| AppError::internal(e.to_string()))?;

    if !totp.check_current(code).map_err(|e| AppError::internal(e.to_string()))? {
        return Err(AppError::unauthorized("Invalid 2FA code"));
    }

    let admin_id = uuid::Uuid::parse_str(&auth.0.id).map_err(|e| AppError::internal(format!("parse id: {e}")))?;
    sqlx::query("UPDATE admins SET twofa_enabled = false, totp_secret = NULL WHERE id = $1")
        .bind(admin_id)
        .execute(&st.pool)
        .await?;

    Ok(Json(json!({ "success": true, "message": "2FA disabled" })))
}

// =============================================================================
// Stripe webhook handler
// =============================================================================

pub async fn stripe_webhook(
    State(st): State<AppState>,
    headers: axum::http::HeaderMap,
    body: axum::body::Bytes,
) -> Result<Json<Value>, AppError> {
    let signature = headers
        .get("stripe-signature")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::bad_request("missing stripe-signature header"))?;

    let secret = &st.cfg.stripe_webhook_secret;
    crate::stripe::verify_webhook(&body, signature, secret)
        .map_err(|e| AppError::bad_request(format!("invalid signature: {e}")))?;

    let event: Value = serde_json::from_slice(&body)
        .map_err(|e| AppError::bad_request(format!("invalid json: {e}")))?;

    let event_id = event
        .get("id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    if event_id.is_empty() {
        return Err(AppError::bad_request("missing event id"));
    }

    let event_type = event
        .get("type")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let existing: Option<i64> = sqlx::query_scalar("SELECT id FROM stripe_events WHERE event_id = $1")
        .bind(&event_id)
        .fetch_optional(&st.pool)
        .await?;

    if existing.is_some() {
        return Ok(Json(json!({ "status": "already_processed" })));
    }

    let data_obj = event.get("data").and_then(|d| d.get("object"));
    let mut target_church_id: Option<uuid::Uuid> = None;

    match event_type.as_str() {
        "checkout.session.completed" => {
            let session_id = data_obj
                .and_then(|o| o.get("id"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let customer_id = data_obj
                .and_then(|o| o.get("customer"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let subscription_id = data_obj
                .and_then(|o| o.get("subscription"))
                .and_then(|v| v.as_str())
                .unwrap_or("");

            if session_id.is_empty() {
                return Err(AppError::bad_request("missing session id in checkout.session.completed"));
            }

            let session_row: Option<(uuid::Uuid,)> = sqlx::query_as(
                "SELECT church_id FROM stripe_sessions WHERE session_id = $1",
            )
            .bind(session_id)
            .fetch_optional(&st.pool)
            .await?;

            let Some((church_id,)) = session_row else {
                return Ok(Json(json!({ "status": "unknown_session" })));
            };

            sqlx::query(
                "UPDATE churches SET stripe_customer_id = $1, stripe_subscription_id = $2, subscription_status = 'active' WHERE id = $3",
            )
            .bind(customer_id)
            .bind(subscription_id)
            .bind(church_id)
            .execute(&st.pool)
            .await?;

            sqlx::query("UPDATE stripe_sessions SET status = 'completed' WHERE session_id = $1")
                .bind(session_id)
                .execute(&st.pool)
                .await?;

            target_church_id = Some(church_id);

            let _ = provision::emit_notification(
                &st.pool,
                "subscription_activated",
                "Subscription activated",
                &format!("Church {} subscription activated", church_id),
                Some(&church_id),
            )
            .await;
        }
        "invoice.paid" => {
            let subscription_id = data_obj
                .and_then(|o| o.get("subscription"))
                .and_then(|v| v.as_str())
                .unwrap_or("");

            if subscription_id.is_empty() {
                return Err(AppError::bad_request("missing subscription id in invoice.paid"));
            }

            let church: Option<crate::handlers::Church> = sqlx::query_as(
                "UPDATE churches SET subscription_status = 'active' WHERE stripe_subscription_id = $1 RETURNING *",
            )
            .bind(subscription_id)
            .fetch_optional(&st.pool)
            .await?;

            if let Some(church) = church {
                let period_end = data_obj
                    .and_then(|o| o.get("period_end"))
                    .and_then(|v| v.as_i64());

                if let Some(ts) = period_end {
                    if let Some(dt) = chrono::DateTime::from_timestamp(ts, 0) {
                        sqlx::query("UPDATE churches SET current_period_end = $1 WHERE id = $2")
                            .bind(dt.naive_utc())
                            .bind(church.id)
                            .execute(&st.pool)
                            .await?;
                    }
                }

                let _ = provision::emit_notification(
                    &st.pool,
                    "payment_succeeded",
                    "Payment received",
                    &format!("Invoice paid for {}", church.name),
                    Some(&church.id),
                )
                .await;

                target_church_id = Some(church.id);
            }
        }
        "invoice.payment_failed" => {
            let subscription_id = data_obj
                .and_then(|o| o.get("subscription"))
                .and_then(|v| v.as_str())
                .unwrap_or("");

            if subscription_id.is_empty() {
                return Err(AppError::bad_request("missing subscription id in invoice.payment_failed"));
            }

            let church: Option<crate::handlers::Church> = sqlx::query_as(
                "UPDATE churches SET subscription_status = 'past_due' WHERE stripe_subscription_id = $1 RETURNING *",
            )
            .bind(subscription_id)
            .fetch_optional(&st.pool)
            .await?;

            if let Some(church) = church {
                let _ = provision::emit_notification(
                    &st.pool,
                    "payment_failed",
                    "Payment failed",
                    &format!("Payment failed for {}. Subscription is now past_due.", church.name),
                    Some(&church.id),
                )
                .await;

                target_church_id = Some(church.id);
            }
        }
        "customer.subscription.deleted" => {
            let subscription_id = data_obj
                .and_then(|o| o.get("id"))
                .and_then(|v| v.as_str())
                .unwrap_or("");

            if subscription_id.is_empty() {
                return Err(AppError::bad_request("missing subscription id in customer.subscription.deleted"));
            }

            let church: Option<crate::handlers::Church> = sqlx::query_as(
                "UPDATE churches SET subscription_status = 'canceled', status = 'suspended' WHERE stripe_subscription_id = $1 RETURNING *",
            )
            .bind(subscription_id)
            .fetch_optional(&st.pool)
            .await?;

            if let Some(church) = church {
                let now = chrono::Utc::now().naive_utc();
                let _ = provision::update_church_suspended_flag(&st.cfg, &church.slug, Some(&now)).await;

                let _ = provision::emit_notification(
                    &st.pool,
                    "subscription_canceled",
                    "Subscription canceled",
                    &format!("Subscription for {} has been canceled. Church suspended.", church.name),
                    Some(&church.id),
                )
                .await;

                target_church_id = Some(church.id);
            }
        }
        _ => {}
    }

    sqlx::query("INSERT INTO stripe_events (event_id, event_type, church_id) VALUES ($1, $2, $3)")
        .bind(event_id)
        .bind(event_type)
        .bind(target_church_id)
        .execute(&st.pool)
        .await?;

    Ok(Json(json!({ "status": "processed" })))
}
