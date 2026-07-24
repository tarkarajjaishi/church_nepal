use axum::http::header::HeaderMap;
use axum::extract::{Path, Query, State};
use axum::http::{header, StatusCode};
use axum::Json;
use base32::{decode, Alphabet};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::postgres::PgPoolOptions;
use std::fs;
use std::path::PathBuf;
use std::time::Duration;
use totp_rs::{Algorithm, TOTP};

use crate::auth::{create_access_token, create_refresh_token, find_refresh_token, revoke_all_refresh_tokens, revoke_refresh_token, store_refresh_token, AdminGuard, ApiKey, Authenticated, SuperAdmin, control_cookie_value, control_clear_cookie};
use crate::error::AppError;
use crate::provision;
use crate::seed;
use crate::stripe::{
    CreateCheckoutSessionParams, CreateCheckoutSessionLineItem, CreateCheckoutSessionPriceData,
    CreateCheckoutSessionProductData, CreateCheckoutSessionRecurring, StripeBillingPortalSession,
    StripeInvoice, StripeSubscription,
};
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

    let access_token = create_access_token(&id, &req.email, &role, &id, 0).map_err(|e| AppError::internal(e.to_string()))?;
    let refresh_token = create_refresh_token();
    store_refresh_token(&st.pool, &id, &refresh_token).await?;

    let max_age: u64 = std::env::var("SESSION_COOKIE_MAX_AGE")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(900);
    let secure: bool = std::env::var("SESSION_COOKIE_SECURE")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(false);

    let mut headers = HeaderMap::new();
    headers.insert(
        "Set-Cookie",
        control_cookie_value(&access_token, max_age, secure).parse().unwrap(),
    );

    Ok((headers, Json(json!({ "token": access_token, "refresh_token": refresh_token, "email": req.email, "role": role }))))
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

    let new_access = create_access_token(&admin_id_str, &email, &role, &admin_id_str, 0).map_err(|e| AppError::internal(e.to_string()))?;
    let new_refresh = create_refresh_token();
    store_refresh_token(&st.pool, &admin_id_str, &new_refresh).await?;

    let max_age: u64 = std::env::var("SESSION_COOKIE_MAX_AGE")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(900);
    let secure: bool = std::env::var("SESSION_COOKIE_SECURE")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(false);

    let mut headers = HeaderMap::new();
    headers.insert(
        "Set-Cookie",
        control_cookie_value(&new_access, max_age, secure).parse().unwrap(),
    );

    Ok((headers, Json(json!({ "token": new_access, "refresh_token": new_refresh, "email": email, "role": role }))))
}

#[derive(Deserialize)]
pub struct LogoutReq {
    pub refresh_token: String,
}

pub async fn logout(State(st): State<AppState>, auth: Authenticated, Json(req): Json<LogoutReq>) -> Result<impl axum::response::IntoResponse, AppError> {
    let raw_token = req.refresh_token.trim();
    if raw_token.is_empty() {
        return Err(AppError::bad_request("refresh_token is required"));
    }

    let token_hash = bcrypt::hash(raw_token, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::internal(format!("hash refresh token: {e}")))?;

    revoke_refresh_token(&st.pool, &token_hash).await?;
    revoke_all_refresh_tokens(&st.pool, uuid::Uuid::parse_str(&auth.0.id).map_err(|e| AppError::internal(format!("parse id: {e}")))?).await;

    let secure: bool = std::env::var("SESSION_COOKIE_SECURE")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(false);

    let body = json!({ "success": true });
    let mut response = Json(body).into_response();
    response.headers_mut().insert("Set-Cookie", control_clear_cookie(secure).parse().unwrap());
    Ok(response)
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

    sqlx::query("UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE id = $2")
        .bind(&new_hash)
        .bind(admin_uuid)
        .execute(&st.pool)
        .await?;

    let updated_at = chrono::Utc::now().timestamp() as usize;
    let new_jti = uuid::Uuid::new_v4().to_string();
    let new_token = create_access_token(&auth.0.id, &auth.0.email, &auth.0.role, &uuid::Uuid::new_v4().to_string(), 0)
        .map_err(|e| AppError::internal(e.to_string()))?;

    let max_age: u64 = std::env::var("SESSION_COOKIE_MAX_AGE")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(900);
    let secure: bool = std::env::var("SESSION_COOKIE_SECURE")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(false);

    let body = json!({
        "success": true,
        "message": "Password updated",
        "token": new_token
    });
    let mut response = Json(body).into_response();
    response.headers_mut().insert(
        "Set-Cookie",
        control_cookie_value(&new_token, max_age, secure).parse().unwrap(),
    );

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

    Ok(response)
}

#[derive(Deserialize)]
pub struct ForgotPasswordReq {
    pub email: String,
}

pub async fn forgot_password(State(st): State<AppState>, Json(req): Json<ForgotPasswordReq>) -> Result<Json<Value>, AppError> {
    let email = req.email.trim().to_string();
    if email.is_empty() {
        return Err(AppError::bad_request("Email is required"));
    }

    let admin: Option<(uuid::Uuid,)> =
        sqlx::query_as("SELECT id FROM admins WHERE email = $1")
            .bind(&email)
            .fetch_optional(&st.pool)
            .await?;

    let Some((admin_id,)) = admin else {
        return Ok(Json(json!({ "success": true, "message": "If an account exists, a reset link has been sent." })));
    };

    let mut rng = rand::thread_rng();
    let mut raw_token_bytes = [0u8; 32];
    rng.fill_bytes(&mut raw_token_bytes);
    let raw_token: String = raw_token_bytes.iter().map(|b| format!("{:02x}", b)).collect();

    let token_hash = bcrypt::hash(&raw_token, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::internal(format!("hash reset token: {e}")))?;

    let expires_at = chrono::Utc::now() + chrono::Duration::hours(1);

    sqlx::query("INSERT INTO password_resets (token_hash, admin_id, expires_at, used) VALUES ($1, $2, $3, false)")
        .bind(&token_hash)
        .bind(admin_id)
        .bind(expires_at)
        .execute(&st.pool)
        .await?;

    let reset_link = format!("https://{}/reset-password?token={}", st.cfg.base_domain, raw_token);
    eprintln!("[password_reset] Reset link for {}: {}", email, reset_link);

    Ok(Json(json!({ "success": true, "message": "If an account exists, a reset link has been sent." })))
}

#[derive(Deserialize)]
pub struct ResetPasswordReq {
    pub token: String,
    pub new_password: String,
}

pub async fn reset_password(State(st): State<AppState>, Json(req): Json<ResetPasswordReq>) -> Result<Json<Value>, AppError> {
    let raw_token = req.token.trim();
    if raw_token.is_empty() {
        return Err(AppError::bad_request("Token is required"));
    }
    let new_password = req.new_password.trim();
    if new_password.is_empty() || new_password.len() < 8 {
        return Err(AppError::bad_request("New password must be at least 8 characters"));
    }

    let token_hash = bcrypt::hash(raw_token, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::internal(format!("hash token: {e}")))?;

    let row: Option<(uuid::Uuid, chrono::NaiveDateTime, bool)> =
        sqlx::query_as("SELECT admin_id, expires_at, used FROM password_resets WHERE token_hash = $1")
            .bind(&token_hash)
            .fetch_optional(&st.pool)
            .await?;

    let Some((admin_id, expires_at, used)) = row else {
        return Err(AppError::bad_request("Invalid or expired reset token"));
    };

    let now = chrono::Utc::now().naive_utc();
    if used {
        return Err(AppError::bad_request("Reset token has already been used"));
    }
    if now > expires_at {
        return Err(AppError::bad_request("Reset token has expired"));
    }

    let new_hash = bcrypt::hash(new_password, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::internal(format!("hash password: {e}")))?;

    sqlx::query("UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE id = $2")
        .bind(&new_hash)
        .bind(admin_id)
        .execute(&st.pool)
        .await?;

    sqlx::query("UPDATE password_resets SET used = true WHERE token_hash = $1")
        .bind(&token_hash)
        .execute(&st.pool)
        .await?;

    Ok(Json(json!({ "success": true, "message": "Password has been reset" })))
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
        RouteInfo { method: "POST", path: "/api/auth/forgot", auth: "none" },
        RouteInfo { method: "POST", path: "/api/auth/reset", auth: "none" },
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
        RouteInfo { method: "POST", path: "/api/churches/{id}/billing-portal", auth: "admin" },
        RouteInfo { method: "GET", path: "/api/churches/{id}/invoices", auth: "admin" },
        RouteInfo { method: "GET", path: "/api/billing/overview", auth: "admin" },
        RouteInfo { method: "GET", path: "/api/analytics", auth: "none" },
        RouteInfo { method: "GET", path: "/api/analytics/growth", auth: "none" },
        RouteInfo { method: "GET", path: "/api/analytics/top-churches", auth: "none" },
        RouteInfo { method: "GET", path: "/api/analytics/refunds", auth: "admin" },
        RouteInfo { method: "POST", path: "/api/churches/{church_id}/donations/{donation_id}/refund", auth: "admin" },
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

#[derive(Deserialize)]
pub struct GrowthQuery {
    pub range: Option<String>, // 30d, 90d, 12m
}

#[derive(Deserialize)]
pub struct GrowthQuery {
    pub range: Option<String>, // 30d, 90d, 12m
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
    pub past_due_at: Option<chrono::NaiveDateTime>,
}

#[derive(Serialize)]
pub struct PlanCount {
    pub plan: String,
    pub count: i64,
}

#[derive(Serialize)]
pub struct AnalyticsOverview {
    pub total_churches: i64,
    pub active_churches: i64,
    pub suspended_churches: i64,
    pub mrr: i64,
    pub churches_this_month: i64,
    pub churches_by_plan: Vec<PlanCount>,
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
        &AdminUser {
            id: super_admin.id.clone(),
            email: super_admin.email.clone(),
            role: "super_admin".to_string(),
        },
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
        &AdminUser {
            id: super_admin.id.clone(),
            email: super_admin.email.clone(),
            role: "super_admin".to_string(),
        },
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
        &AdminUser {
            id: super_admin.id.clone(),
            email: super_admin.email.clone(),
            role: "super_admin".to_string(),
        },
        "delete_admin",
        &admin.id.to_string(),
        "admin",
        Some(json!({ "email": admin.email, "role": admin.role }))
    ).await?;

    Ok(Json(json!({ "deleted": id.to_string() })))
}

async fn audit_log(
    pool: &sqlx::PgPool,
    actor: &AdminUser,
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
// Stripe-backed billing portal and invoice handlers
// =============================================================================

#[derive(Deserialize)]
pub struct BillingPortalReq {
    pub return_url: Option<String>,
}

pub async fn create_billing_portal_session(
    _admin: AdminGuard,
    Path(church_id): Path<uuid::Uuid>,
    State(st): State<AppState>,
    Json(req): Json<BillingPortalReq>,
) -> Result<Json<Value>, AppError> {
    let church = sqlx::query_as::<_, crate::handlers::Church>("SELECT * FROM churches WHERE id = $1")
        .bind(church_id)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(|| AppError::not_found("Church not found"))?;

    let stripe_customer_id: Option<String> =
        sqlx::query_scalar("SELECT stripe_customer_id FROM churches WHERE id = $1")
            .bind(church_id)
            .fetch_optional(&st.pool)
            .await?;

    let customer_id = stripe_customer_id.ok_or_else(|| {
        AppError::bad_request("Church has no Stripe customer ID yet. Subscribe to a plan first.")
    })?;

    let client = crate::stripe::StripeClient::new(&st.cfg.stripe_secret_key);
    if !client.enabled() {
        return Err(AppError::internal("Stripe is not configured"));
    }

    let return_url = req.return_url.unwrap_or_else(|| {
        format!("https://{}/admin/billing", church.subdomain)
    });

    let session = client.create_billing_portal_session(&customer_id, &return_url).await?;
    let url = session.url.ok_or_else(|| AppError::internal("Stripe did not return a portal URL"))?;

    Ok(Json(json!({ "url": url })))
}

#[derive(Serialize)]
pub struct StripeInvoiceResponse {
    pub id: String,
    pub stripe_invoice_id: String,
    pub amount: i64,
    pub amount_paid: i64,
    pub status: String,
    pub pdf_url: Option<String>,
    pub date: Option<i64>,
    pub period_start: Option<i64>,
    pub period_end: Option<i64>,
}

pub async fn list_church_stripe_invoices(
    _admin: AdminGuard,
    Path(church_id): Path<uuid::Uuid>,
    State(st): State<AppState>,
) -> Result<Json<Vec<StripeInvoiceResponse>>, AppError> {
    let church = sqlx::query_as::<_, crate::handlers::Church>("SELECT * FROM churches WHERE id = $1")
        .bind(church_id)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(|| AppError::not_found("Church not found"))?;

    let client = crate::stripe::StripeClient::new(&st.cfg.stripe_secret_key);
    if !client.enabled() {
        return Err(AppError::internal("Stripe is not configured"));
    }

    let customer_id: Option<String> =
        sqlx::query_scalar("SELECT stripe_customer_id FROM churches WHERE id = $1")
            .bind(church_id)
            .fetch_optional(&st.pool)
            .await?;

    let invoices: Vec<StripeInvoice> = match customer_id {
        Some(cid) => client.list_invoices(Some(&cid), 100).await?,
        None => Vec::new(),
    };

    let result: Vec<StripeInvoiceResponse> = invoices
        .into_iter()
        .map(|inv| StripeInvoiceResponse {
            id: inv.id.clone(),
            stripe_invoice_id: inv.id.clone(),
            amount: inv.amount_due,
            amount_paid: inv.amount_paid,
            status: inv.status,
            pdf_url: inv.invoice_pdf,
            date: Some(inv.created),
            period_start: Some(inv.period_start),
            period_end: Some(inv.period_end),
        })
        .collect();

    Ok(Json(result))
}

#[derive(Serialize)]
pub struct BillingOverview {
    pub mrr: i64,
    pub active_subscriptions: i64,
    pub total_churn: i64,
    pub churn_rate: f64,
}

pub async fn get_billing_overview(State(st): State<AppState>) -> Result<Json<BillingOverview>, AppError> {
    let client = crate::stripe::StripeClient::new(&st.cfg.stripe_secret_key);
    if !client.enabled() {
        let overview = BillingOverview {
            mrr: 0,
            active_subscriptions: 0,
            total_churn: 0,
            churn_rate: 0.0,
        };
        return Ok(Json(overview));
    }

    let subscriptions = client
        .list_subscriptions(None, Some("active"), 100)
        .await
        .unwrap_or_default();

    let active_subscriptions = subscriptions.len() as i64;
    let mut mrr: i64 = subscriptions
        .iter()
        .filter_map(|sub| sub.plan.as_ref().and_then(|p| p.amount))
        .sum();

    let canceled_subs = client
        .list_subscriptions(None, Some("canceled"), 100)
        .await
        .unwrap_or_default();

    let churned_count = canceled_subs.len() as i64;
    let churned_mrr: i64 = canceled_subs
        .iter()
        .filter_map(|sub| sub.plan.as_ref().and_then(|p| p.amount))
        .sum();

    let total_subscriptions = active_subscriptions + churned_count;
    let churn_rate = if total_subscriptions > 0 {
        (churned_count as f64 / total_subscriptions as f64) * 100.0
    } else {
        0.0
    };

    let overview = BillingOverview {
        mrr,
        active_subscriptions,
        total_churn: churned_mrr,
        churn_rate: (churn_rate * 100.0).round() / 100.0,
    };

    Ok(Json(overview))
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

#[derive(Deserialize)]
pub struct RefundDonationReq {
    pub amount: Option<i64>,
    pub reason: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
struct Donation {
    id: uuid::Uuid,
    donor_name: String,
    donor_email: String,
    donor_phone: String,
    amount: i64,
    payment_method: String,
    campaign_id: Option<uuid::Uuid>,
    fund_id: Option<uuid::Uuid>,
    notes: String,
    status: String,
    transaction_id: String,
    refund_status: String,
    refund_amount: i64,
    refunded_at: Option<chrono::NaiveDateTime>,
    refund_reason: String,
    gateway_refund_id: String,
    created_at: chrono::NaiveDateTime,
    updated_at: chrono::NaiveDateTime,
}

pub async fn refund_donation(
    _admin: AdminGuard,
    State(st): State<AppState>,
    Path((church_id, donation_id)): Path<(uuid::Uuid, uuid::Uuid)>,
    Json(req): Json<RefundDonationReq>,
) -> Result<Json<Value>, AppError> {
    // Get the church to get the slug
    let church = sqlx::query_as::<_, crate::handlers::Church>("SELECT * FROM churches WHERE id = $1")
        .bind(church_id)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(|| AppError::not_found("Church not found"))?;

    // Connect to the church's database
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&st.cfg.church_db_url(&church.slug))
        .await
        .map_err(|e| AppError::internal(format!("connect church db: {e}")))?;

    // Fetch the donation to verify it exists and is completed
    let donation = sqlx::query_as::<_, Donation>("SELECT * FROM donations WHERE id = $1")
        .bind(donation_id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Donation not found"))?;

    if donation.status != "completed" {
        return Err(AppError::bad_request("Only completed donations can be refunded"));
    }

    if donation.refund_status == "refunded" {
        return Err(AppError::bad_request("Donation has already been fully refunded"));
    }

    let refund_amount = req.amount.unwrap_or(donation.amount - donation.refund_amount);

    if refund_amount <= 0 || refund_amount > (donation.amount - donation.refund_amount) {
        return Err(AppError::bad_request("Invalid refund amount"));
    }

    let refund_status = if refund_amount == (donation.amount - donation.refund_amount) {
        "refunded"
    } else {
        "partially_refunded"
    };

    let gateway_refund_id = if donation.payment_method == "stripe" {
        if let Ok(client) = StripeClient::new(&st.cfg.stripe_secret_key) {
            if client.enabled() {
                match client.refund_payment(&donation.transaction_id, Some(refund_amount)).await {
                    Ok(stripe_refund) => Some(stripe_refund.id),
                    Err(_) => None,
                }
            } else {
                None
            }
        } else {
            None
        }
    } else {
        None
    };

    sqlx::query(
        r#"UPDATE donations SET refund_amount = refund_amount + $1, refund_status = $2, refunded_at = NOW(), refund_reason = COALESCE($3, refund_reason), gateway_refund_id = COALESCE($4, gateway_refund_id) WHERE id = $5"#
    )
    .bind(refund_amount)
    .bind(refund_status)
    .bind(req.reason.as_deref())
    .bind(gateway_refund_id)
    .bind(donation_id)
    .execute(&pool)
    .await?;

    if refund_status == "refunded" {
        if let Some(campaign_id) = donation.campaign_id {
            let _ = sqlx::query(
                r#"UPDATE campaigns SET raised = GREATEST(COALESCE(raised, 0) - $1, 0) WHERE id = $2"#
            )
            .bind(donation.amount)
            .bind(campaign_id)
            .execute(&pool)
            .await;
        }
    }

    let _ = crate::handlers::audit_log(
        &pool,
        &crate::auth::AdminUser {
            id: _admin.id.clone(),
            email: _admin.email.clone(),
            role: _admin.role.clone(),
        },
        "refund_donation",
        "donation",
        &donation_id.to_string(),
        Some(json!({
            "donor_email": donation.donor_email,
            "amount": donation.amount,
            "refund_amount": refund_amount,
            "new_refund_total": donation.refund_amount + refund_amount,
            "refund_status": refund_status,
            "payment_method": donation.payment_method,
            "gateway_refund_id": gateway_refund_id,
        })),
    ).await?;

    let updated = sqlx::query_as::<_, Donation>("SELECT * FROM donations WHERE id = $1")
        .bind(donation_id)
        .fetch_one(&pool)
        .await?;

    Ok(Json(serde_json::to_value(&updated).map_err(|e| AppError::internal(e.to_string()))?))
}

// =============================================================================
// Analytics handlers
// =============================================================================

#[derive(Serialize)]
pub struct AnalyticsOverview {
    pub total_churches: i64,
    pub active_churches: i64,
    pub suspended_churches: i64,
    pub mrr: i64,
    pub churches_this_month: i64,
    pub churches_by_plan: Vec<PlanCount>,
}

#[derive(Serialize)]
pub struct PlanCount {
    pub plan: String,
    pub count: i64,
}

pub async fn get_analytics_overview(State(st): State<AppState>) -> Result<Json<AnalyticsOverview>, AppError> {
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

    // Calculate MRR: sum of plan price_monthly for active churches with a plan
    let mrr: (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(p.price_monthly), 0) 
         FROM churches c 
         LEFT JOIN plans p ON c.plan = p.id 
         WHERE c.status = 'active' AND c.plan IS NOT NULL"
    )
    .fetch_one(&st.pool)
    .await
    .map_err(|e| AppError::internal(e.to_string()))?;

    // Get churches by plan
    let churches_by_plan: Vec<PlanCount> = sqlx::query_as(
        "SELECT 
            COALESCE(p.name, 'Free') as plan,
            COUNT(*) as count
         FROM churches c
         LEFT JOIN plans p ON c.plan = p.id
         GROUP BY p.name
         ORDER BY count DESC"
    )
    .fetch_all(&st.pool)
    .await
    .map_err(|e| AppError::internal(e.to_string()))?;

    let overview = AnalyticsOverview {
        total_churches: total_churches.0,
        active_churches: active_churches.0,
        suspended_churches: suspended_churches.0,
        mrr: mrr.0,
        churches_this_month: churches_this_month.0,
        churches_by_plan,
    };

    Ok(Json(overview))
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
    Query(params): Query<GrowthQuery>,
    State(st): State<AppState>,
) -> Result<Json<Vec<Value>>, AppError> {
    let range = params.range.as_deref().unwrap_or("30d");
    let (interval_sql, date_trunc) = match range {
        "30d" => ("1 month", "YYYY-MM-DD"),           // Daily for 30 days
        "90d" => ("3 months", "IYYY-IW"),             // Weekly for 90 days (ISO year-week)
        "12m" => ("12 months", "YYYY-MM"),            // Monthly for 12 months
        _ => ("1 month", "YYYY-MM-DD"),               // default to 30d daily
    };

    let rows: Vec<(String, i64)> = sqlx::query_as(
        &format!(
            "SELECT 
                 TO_CHAR(created_at, '{}') as period,
                 COUNT(*) as churches_created
               FROM churches 
               WHERE created_at >= NOW() - INTERVAL '{}'
               GROUP BY TO_CHAR(created_at, '{}')
               ORDER BY period",
            date_trunc, interval_sql, date_trunc
        )
    )
    .fetch_all(&st.pool)
    .await?;

    let growth: Vec<Value> = rows.into_iter().map(|(period, churches_created)| {
        json!({
            "period": period,
            "churches_created": churches_created,
            "churches_churned": 0,
            "net_growth": churches_created
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
        &AdminUser {
            id: super_admin.id.clone(),
            email: super_admin.email.clone(),
            role: "super_admin".to_string(),
        },
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
                "UPDATE churches SET subscription_status = 'active', status = CASE WHEN status = 'past_due' THEN 'active' ELSE status END, past_due_at = CASE WHEN status = 'past_due' THEN NULL ELSE past_due_at END WHERE stripe_subscription_id = $1 RETURNING *",
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

            let attempt_count: i64 = data_obj
                .and_then(|o| o.get("attempt_count"))
                .and_then(|v| v.as_i64())
                .unwrap_or(0);

            let church: Option<crate::handlers::Church> = sqlx::query_as(
                "UPDATE churches SET subscription_status = 'past_due' WHERE stripe_subscription_id = $1 RETURNING *",
            )
            .bind(subscription_id)
            .fetch_optional(&st.pool)
            .await?;

            if let Some(church) = church {
                let is_final_attempt = attempt_count >= 3;

                if is_final_attempt && (church.status == "active" || church.status == "provisioning") {
                    let now = chrono::Utc::now().naive_utc();
                    let updated: Church = sqlx::query_as(
                        "UPDATE churches SET status = 'past_due', past_due_at = $1 WHERE id = $2 RETURNING *",
                    )
                    .bind(now)
                    .bind(church.id)
                    .fetch_one(&st.pool)
                    .await?;

                    let _ = provision::emit_notification(
                        &st.pool,
                        "payment_failed_final",
                        "Payment failed - Account past due",
                        &format!("Payment failed for {} after {} retries. Account is now past_due.", updated.name, attempt_count),
                        Some(&updated.id),
                    )
                    .await;

                    let _ = crate::email::send_admin_notification(
                        &st.cfg,
                        &updated.admin_email,
                        "Payment Failed - Account Past Due",
                        &format!("Dear {},\n\nWe were unable to process your payment after {} retry attempts. Your account is now past due. Please update your payment method to avoid service suspension.", updated.name, attempt_count),
                    )
                    .await;

                    target_church_id = Some(updated.id);
                } else if church.status == "active" || church.status == "provisioning" {
                    let _ = provision::emit_notification(
                        &st.pool,
                        "payment_failed",
                        "Payment failed",
                        &format!("Payment failed for {}. Attempt {} of {}.", church.name, attempt_count, 3),
                        Some(&church.id),
                    )
                    .await;

                    target_church_id = Some(church.id);
                } else {
                    target_church_id = Some(church.id);
                }
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

pub async fn run_dunning_checker(pool: sqlx::PgPool, cfg: std::sync::Arc<crate::config::Config>) {
    let mut interval = tokio::time::interval(std::time::Duration::from_secs(60 * 60));
    loop {
        interval.tick().await;
        let _ = check_grace_period_and_suspend(&pool, &cfg).await;
    }
}

pub async fn check_grace_period_and_suspend(
    pool: &sqlx::PgPool,
    cfg: &crate::config::Config,
) -> Result<(), crate::error::AppError> {
    let grace_period = chrono::Duration::days(cfg.dunning_grace_period_days as i64);
    let cutoff = chrono::Utc::now().naive_utc() - grace_period;

    let past_due_churches: Vec<Church> = sqlx::query_as(
        "SELECT * FROM churches WHERE status = 'past_due' AND past_due_at IS NOT NULL AND past_due_at < $1",
    )
    .bind(cutoff)
    .fetch_all(pool)
    .await?;

    for church in past_due_churches {
        let now = chrono::Utc::now().naive_utc();
        let _ = sqlx::query(
            "UPDATE churches SET status = 'suspended', suspended_at = $1 WHERE id = $2",
        )
        .bind(now)
        .bind(church.id)
        .execute(pool)
        .await;

        let _ = provision::update_church_suspended_flag(cfg, &church.slug, Some(&now)).await;

        let _ = provision::emit_notification(
            pool,
            "church_suspended",
            "Church suspended",
            &format!(
                "'{}' has been suspended due to non-payment after grace period.",
                church.name
            ),
            Some(&church.id),
        )
        .await;

        let _ = crate::email::send_admin_notification(
            cfg,
            &church.admin_email,
            "Account Suspended - Payment Required",
            &format!(
                "Dear {},\n\nYour account has been suspended due to non-payment after the grace period. Please update your payment method to restore access.",
                church.name
            ),
        )
        .await;
    }

    Ok(())
}

#[derive(Serialize, Deserialize)]
pub struct StatusComponent {
    pub name: String,
    pub status: String,
}

#[derive(Serialize, Deserialize)]
pub struct StatusIncident {
    pub id: String,
    pub date: String,
    pub title: String,
    pub resolution: String,
    pub status: String,
}

#[derive(Serialize)]
pub struct StatusResponse {
    pub status: String,
    pub updated_at: String,
    pub components: Vec<StatusComponent>,
    pub incidents: Vec<StatusIncident>,
}

pub async fn get_status(State(st): State<AppState>) -> Json<StatusResponse> {
    let mut components: Vec<StatusComponent> = vec![
        StatusComponent { name: "Website / Marketing".into(), status: "operational".into() },
        StatusComponent { name: "Admin Dashboard".into(), status: "operational".into() },
        StatusComponent { name: "Church Sites".into(), status: "operational".into() },
        StatusComponent { name: "API".into(), status: "operational".into() },
        StatusComponent { name: "Database".into(), status: "operational".into() },
        StatusComponent { name: "Media / Storage".into(), status: "operational".into() },
        StatusComponent { name: "Email Delivery".into(), status: "operational".into() },
    ];

    if sqlx::query("SELECT 1").fetch_one(&st.pool).await.is_err() {
        for c in &mut components {
            if c.name == "Database" {
                c.status = "down".into();
                break;
            }
        }
    }

    let church_count: Option<i64> = sqlx::query_scalar("SELECT COUNT(*) FROM churches WHERE status = 'active'")
        .fetch_optional(&st.pool)
        .await
        .ok()
        .flatten();
    if church_count == Some(0) && !components.iter().any(|c| c.status == "down") {
        for c in &mut components {
            if c.name == "Church Sites" {
                c.status = "degraded".into();
                break;
            }
        }
    }

    let status_dir = PathBuf::from(&st.cfg.storage_root).join("status");
    let incidents = read_incidents(&status_dir);
    let stored_components = read_components(&status_dir);
    if !stored_components.is_empty() {
        for stored in stored_components {
            if let Some(comp) = components.iter_mut().find(|c| c.name == stored.name) {
                if stored.status == "down" {
                    comp.status = "down".into();
                } else if stored.status == "degraded" && comp.status != "down" {
                    comp.status = "degraded".into();
                }
            }
        }
    }

    let overall = if components.iter().any(|c| c.status == "down") {
        "down"
    } else if components.iter().any(|c| c.status == "degraded") {
        "degraded"
    } else {
        "operational"
    };

    Json(StatusResponse {
        status: overall.into(),
        updated_at: chrono::Utc::now().to_rfc3339(),
        components,
        incidents,
    })
}

fn read_components(dir: &PathBuf) -> Vec<StatusComponent> {
    let path = dir.join("components.json");
    let data = fs::read_to_string(path).ok();
    data.and_then(|d| serde_json::from_str(&d).ok()).unwrap_or_default()
}

fn read_incidents(dir: &PathBuf) -> Vec<StatusIncident> {
    let path = dir.join("incidents.jsonl");
    let data = fs::read_to_string(path).ok();
    let mut incidents: Vec<StatusIncident> = Vec::new();
    if let Some(content) = data {
        for line in content.lines() {
            if let Ok(inc) = serde_json::from_str::<StatusIncident>(line) {
                if incidents.len() < 20 {
                    incidents.push(inc);
                }
            }
        }
    }
    incidents.reverse();
    incidents
}
