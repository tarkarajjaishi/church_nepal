//! The thirteen console pages that had nothing behind them.
//!
//! Storage, retention, security and operations are **read models**: they are
//! computed from `churches`, `sessions`, `audit_log` and Postgres' own
//! statistics on every request. A stored copy of "how much disk is this church
//! using" is wrong from the moment somebody uploads a file, and that is
//! precisely when you go looking at it.
//!
//! The rest — flags, webhooks, templates, coupons, broadcasts, roles, backups —
//! are things an operator decides, so they are stored.

use crate::auth::{Authenticated, SuperAdmin};
use crate::error::AppError;
use crate::AppState;
use axum::extract::{Path, Query, State};
use axum::Json;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

// ===========================================================================
// Storage
// ===========================================================================

#[derive(Serialize, sqlx::FromRow)]
pub struct StorageRow {
    pub id: uuid::Uuid,
    pub name: String,
    pub slug: String,
    pub plan: Option<String>,
    pub status: String,
    pub storage_bytes: i64,
    /// The plan's allowance, in bytes. Zero when the plan is unknown, which is
    /// reported rather than assumed to be unlimited.
    pub limit_bytes: i64,
    pub percent_used: f64,
}

#[derive(Serialize)]
pub struct StorageOverview {
    pub churches: Vec<StorageRow>,
    pub total_bytes: i64,
    pub total_limit_bytes: i64,
    /// Churches over 80% of their allowance — the ones worth an email before
    /// they hit the ceiling on a Sunday morning.
    pub near_limit: i64,
    pub over_limit: i64,
}

pub async fn storage(
    _auth: Authenticated,
    State(st): State<AppState>,
) -> Result<Json<StorageOverview>, AppError> {
    let churches = sqlx::query_as::<_, StorageRow>(
        r#"SELECT c.id, c.name, c.slug, c.plan, c.status,
                  COALESCE(c.storage_bytes, 0)::bigint AS storage_bytes,
                  (COALESCE(p.max_storage_mb, 0)::bigint * 1024 * 1024) AS limit_bytes,
                  CASE WHEN COALESCE(p.max_storage_mb, 0) > 0
                       THEN round(
                            COALESCE(c.storage_bytes,0)::numeric * 100
                            / (p.max_storage_mb::numeric * 1024 * 1024), 1)::float8
                       ELSE 0::float8 END AS percent_used
             FROM churches c
             LEFT JOIN plans p ON p.name = c.plan
            ORDER BY percent_used DESC, storage_bytes DESC"#,
    )
    .fetch_all(&st.pool)
    .await?;

    let total_bytes = churches.iter().map(|c| c.storage_bytes).sum();
    let total_limit_bytes = churches.iter().map(|c| c.limit_bytes).sum();
    let near_limit = churches
        .iter()
        .filter(|c| c.percent_used >= 80.0 && c.percent_used < 100.0)
        .count() as i64;
    let over_limit = churches.iter().filter(|c| c.percent_used >= 100.0).count() as i64;

    Ok(Json(StorageOverview {
        churches,
        total_bytes,
        total_limit_bytes,
        near_limit,
        over_limit,
    }))
}

// ===========================================================================
// Retention
// ===========================================================================

#[derive(Serialize, sqlx::FromRow)]
pub struct Cohort {
    pub month: String,
    pub joined: i64,
    /// Of those that joined, how many have been seen in the last 30 days.
    pub still_active: i64,
    pub retention_percent: f64,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct QuietChurch {
    pub id: uuid::Uuid,
    pub name: String,
    pub slug: String,
    pub plan: Option<String>,
    pub last_active_at: Option<chrono::DateTime<chrono::Utc>>,
    pub days_quiet: Option<i32>,
}

#[derive(Serialize)]
pub struct Retention {
    pub cohorts: Vec<Cohort>,
    pub quiet: Vec<QuietChurch>,
    pub active_30d: i64,
    pub total: i64,
}

pub async fn retention(
    _auth: Authenticated,
    State(st): State<AppState>,
) -> Result<Json<Retention>, AppError> {
    // One clock for the whole response, read from the database, so the cohort
    // table and the quiet list cannot disagree about where "30 days ago" is.
    let now: chrono::DateTime<chrono::Utc> =
        sqlx::query_scalar("SELECT NOW()").fetch_one(&st.pool).await?;

    let cohorts = sqlx::query_as::<_, Cohort>(
        r#"SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
                  COUNT(*)::bigint AS joined,
                  COUNT(*) FILTER (
                      WHERE last_active_at >= $1::timestamptz - interval '30 days'
                  )::bigint AS still_active,
                  round(
                      COUNT(*) FILTER (
                          WHERE last_active_at >= $1::timestamptz - interval '30 days'
                      )::numeric * 100 / NULLIF(COUNT(*), 0), 1)::float8 AS retention_percent
             FROM churches
            GROUP BY 1 ORDER BY 1"#,
    )
    .bind(now)
    .fetch_all(&st.pool)
    .await?;

    let quiet = sqlx::query_as::<_, QuietChurch>(
        r#"SELECT id, name, slug, plan, last_active_at,
                  EXTRACT(DAY FROM $1::timestamptz - last_active_at)::int AS days_quiet
             FROM churches
            WHERE status = 'active'
              AND (last_active_at IS NULL
                   OR last_active_at < $1::timestamptz - interval '30 days')
            ORDER BY last_active_at NULLS FIRST
            LIMIT 50"#,
    )
    .bind(now)
    .fetch_all(&st.pool)
    .await?;

    let (active_30d, total): (i64, i64) = sqlx::query_as(
        "SELECT COUNT(*) FILTER (
                    WHERE last_active_at >= $1::timestamptz - interval '30 days')::bigint,
                COUNT(*)::bigint
           FROM churches",
    )
    .bind(now)
    .fetch_one(&st.pool)
    .await?;

    Ok(Json(Retention { cohorts, quiet, active_30d, total }))
}

// ===========================================================================
// Operations
// ===========================================================================

#[derive(Serialize)]
pub struct Ops {
    pub uptime_seconds: i64,
    pub version: String,
    pub database_size_bytes: i64,
    pub connections: i64,
    pub max_connections: i64,
    pub tenant_databases: i64,
    pub tenant_size_bytes: i64,
    /// Provisioning that never finished. The queue nobody watches until a
    /// church asks why their site is not up.
    pub provisioning_stuck: i64,
    pub failed_churches: i64,
    pub largest_tables: Vec<TableSize>,
    pub recent_errors: Vec<Value>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct TableSize {
    pub name: String,
    pub bytes: i64,
    pub rows: i64,
}

pub async fn ops(
    _auth: Authenticated,
    State(st): State<AppState>,
) -> Result<Json<Ops>, AppError> {
    let database_size_bytes: i64 =
        sqlx::query_scalar("SELECT pg_database_size(current_database())::bigint")
            .fetch_one(&st.pool)
            .await?;

    let (connections, max_connections): (i64, i64) = sqlx::query_as(
        "SELECT (SELECT COUNT(*)::bigint FROM pg_stat_activity),
                (SELECT setting::bigint FROM pg_settings WHERE name = 'max_connections')",
    )
    .fetch_one(&st.pool)
    .await?;

    // Every tenant database on this instance, and what they add up to.
    let (tenant_databases, tenant_size_bytes): (i64, i64) = sqlx::query_as(
        "SELECT COUNT(*)::bigint, COALESCE(SUM(pg_database_size(datname)), 0)::bigint
           FROM pg_database
          WHERE datistemplate = false AND datname <> current_database()",
    )
    .fetch_one(&st.pool)
    .await
    .unwrap_or((0, 0));

    let (provisioning_stuck, failed_churches): (i64, i64) = sqlx::query_as(
        "SELECT COUNT(*) FILTER (
                    WHERE status = 'provisioning' AND created_at < NOW() - interval '15 minutes'
                )::bigint,
                COUNT(*) FILTER (WHERE status = 'failed')::bigint
           FROM churches",
    )
    .fetch_one(&st.pool)
    .await?;

    let largest_tables = sqlx::query_as::<_, TableSize>(
        r#"SELECT relname AS name,
                  pg_total_relation_size(c.oid)::bigint AS bytes,
                  GREATEST(c.reltuples, 0)::bigint AS rows
             FROM pg_class c
             JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relkind = 'r'
            ORDER BY bytes DESC LIMIT 10"#,
    )
    .fetch_all(&st.pool)
    .await
    .unwrap_or_default();

    // What actually went wrong lately, from the audit trail rather than a log
    // file nobody can reach from here.
    let recent_errors: Vec<Value> = sqlx::query_scalar(
        "SELECT json_build_object(
                    'action', action, 'target', target_type,
                    'actor', actor_email, 'at', created_at)
           FROM audit_log
          WHERE action ILIKE '%fail%' OR action ILIKE '%error%'
          ORDER BY created_at DESC LIMIT 10",
    )
    .fetch_all(&st.pool)
    .await
    .unwrap_or_default();

    Ok(Json(Ops {
        uptime_seconds: st.started_at.elapsed().as_secs() as i64,
        version: env!("CARGO_PKG_VERSION").to_string(),
        database_size_bytes,
        connections,
        max_connections,
        tenant_databases,
        tenant_size_bytes,
        provisioning_stuck,
        failed_churches,
        largest_tables,
        recent_errors,
    }))
}

// ===========================================================================
// Security
// ===========================================================================

#[derive(Serialize, sqlx::FromRow)]
pub struct SessionRow {
    pub id: uuid::Uuid,
    pub admin_email: String,
    pub user_agent: Option<String>,
    pub ip_address: Option<String>,
    pub last_used_at: Option<chrono::DateTime<chrono::Utc>>,
    pub expires_at: chrono::DateTime<chrono::Utc>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize)]
pub struct Security {
    pub sessions: Vec<SessionRow>,
    pub admins_total: i64,
    /// Administrators who can sign in with a password alone. On a console that
    /// governs every church, this is the number that matters.
    pub admins_without_2fa: i64,
    pub recent_sign_ins: Vec<Value>,
}

pub async fn security(
    _auth: SuperAdmin,
    State(st): State<AppState>,
) -> Result<Json<Security>, AppError> {
    let sessions = sqlx::query_as::<_, SessionRow>(
        r#"SELECT s.id, a.email AS admin_email, s.user_agent,
                  host(s.ip_address) AS ip_address,
                  s.last_used_at, s.expires_at, s.created_at
             FROM sessions s
             JOIN admins a ON a.id = s.admin_id
            WHERE s.expires_at > NOW()
            ORDER BY s.last_used_at DESC NULLS LAST
            LIMIT 100"#,
    )
    .fetch_all(&st.pool)
    .await
    .unwrap_or_default();

    let (admins_total, admins_without_2fa): (i64, i64) = sqlx::query_as(
        "SELECT COUNT(*)::bigint,
                COUNT(*) FILTER (WHERE NOT COALESCE(twofa_enabled, false))::bigint
           FROM admins",
    )
    .fetch_one(&st.pool)
    .await?;

    let recent_sign_ins: Vec<Value> = sqlx::query_scalar(
        "SELECT json_build_object('actor', actor_email, 'action', action,
                                  'ip', host(ip), 'at', created_at)
           FROM audit_log
          WHERE action ILIKE '%login%' OR action ILIKE '%sign%'
          ORDER BY created_at DESC LIMIT 20",
    )
    .fetch_all(&st.pool)
    .await
    .unwrap_or_default();

    Ok(Json(Security {
        sessions,
        admins_total,
        admins_without_2fa,
        recent_sign_ins,
    }))
}

/// End one session. The administrator is signed out everywhere that token was
/// used, which is the point.
pub async fn revoke_session(
    _auth: SuperAdmin,
    State(st): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Value>, AppError> {
    let res = sqlx::query("DELETE FROM sessions WHERE id = $1")
        .bind(id)
        .execute(&st.pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("That session has already ended"));
    }
    Ok(Json(json!({ "revoked": true })))
}

// ===========================================================================
// Feature flags
// ===========================================================================

#[derive(Serialize, sqlx::FromRow)]
pub struct Flag {
    pub key: String,
    pub description: String,
    pub enabled: bool,
    pub rollout_percent: i32,
    pub church_slugs: Vec<String>,
    pub updated_by: String,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

pub async fn list_flags(
    _auth: Authenticated,
    State(st): State<AppState>,
) -> Result<Json<Vec<Flag>>, AppError> {
    Ok(Json(
        sqlx::query_as("SELECT * FROM feature_flags ORDER BY key")
            .fetch_all(&st.pool)
            .await?,
    ))
}

#[derive(Deserialize)]
pub struct UpdateFlag {
    pub enabled: Option<bool>,
    pub rollout_percent: Option<i32>,
    pub church_slugs: Option<Vec<String>>,
    pub description: Option<String>,
}

pub async fn update_flag(
    auth: Authenticated,
    State(st): State<AppState>,
    Path(key): Path<String>,
    Json(req): Json<UpdateFlag>,
) -> Result<Json<Flag>, AppError> {
    if let Some(p) = req.rollout_percent {
        // The database enforces this too; saying it here turns a constraint
        // violation into a sentence.
        if !(0..=100).contains(&p) {
            return Err(AppError::bad_request("A rollout is a percentage: 0 to 100"));
        }
    }

    let flag = sqlx::query_as::<_, Flag>(
        r#"UPDATE feature_flags
              SET enabled = COALESCE($2, enabled),
                  rollout_percent = COALESCE($3, rollout_percent),
                  church_slugs = COALESCE($4, church_slugs),
                  description = COALESCE($5, description),
                  updated_by = $6,
                  updated_at = NOW()
            WHERE key = $1
        RETURNING *"#,
    )
    .bind(&key)
    .bind(req.enabled)
    .bind(req.rollout_percent)
    .bind(req.church_slugs.as_deref())
    .bind(req.description.as_deref())
    .bind(&auth.0.email)
    .fetch_optional(&st.pool)
    .await?
    .ok_or_else(|| AppError::not_found("No such flag"))?;

    Ok(Json(flag))
}

// ===========================================================================
// Webhooks
// ===========================================================================

#[derive(Serialize, sqlx::FromRow)]
pub struct WebhookEndpoint {
    pub id: uuid::Uuid,
    pub url: String,
    pub description: String,
    pub events: Vec<String>,
    pub active: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    /// Deliveries and how many of them failed, so a quietly broken endpoint is
    /// visible without opening it.
    pub delivery_count: i64,
    pub failure_count: i64,
    pub last_delivery_at: Option<chrono::DateTime<chrono::Utc>>,
}

pub async fn list_webhooks(
    _auth: Authenticated,
    State(st): State<AppState>,
) -> Result<Json<Vec<WebhookEndpoint>>, AppError> {
    Ok(Json(
        sqlx::query_as(
            r#"SELECT e.id, e.url, e.description, e.events, e.active, e.created_at,
                      COUNT(d.id)::bigint AS delivery_count,
                      COUNT(d.id) FILTER (
                          WHERE d.status_code IS NULL OR d.status_code >= 400
                      )::bigint AS failure_count,
                      MAX(d.created_at) AS last_delivery_at
                 FROM webhook_endpoints e
                 LEFT JOIN webhook_deliveries d ON d.endpoint_id = e.id
                GROUP BY e.id
                ORDER BY e.created_at DESC"#,
        )
        .fetch_all(&st.pool)
        .await?,
    ))
}

#[derive(Deserialize)]
pub struct NewWebhook {
    pub url: String,
    pub description: Option<String>,
    pub events: Option<Vec<String>>,
}

fn random_secret() -> String {
    use rand::RngCore;
    let mut b = [0u8; 24];
    rand::thread_rng().fill_bytes(&mut b);
    format!("whsec_{}", hex::encode(b))
}

pub async fn create_webhook(
    _auth: Authenticated,
    State(st): State<AppState>,
    Json(req): Json<NewWebhook>,
) -> Result<Json<Value>, AppError> {
    let url = req.url.trim();
    if !url.starts_with("https://") && !url.starts_with("http://localhost") {
        return Err(AppError::bad_request(
            "A webhook target must be https — anything else sends church data in the clear",
        ));
    }

    // An endpoint subscribed to nothing never fires, but it sits in the list
    // looking like a live integration — so the first anyone knows is when the
    // receiving system has silently had no events for a month.
    let events: Vec<String> = req
        .events
        .clone()
        .unwrap_or_default()
        .into_iter()
        .map(|e| e.trim().to_string())
        .filter(|e| !e.is_empty())
        .collect();
    if events.is_empty() {
        return Err(AppError::bad_request(
            "Choose at least one event — an endpoint subscribed to nothing never fires",
        ));
    }

    let secret = random_secret();
    let id: uuid::Uuid = sqlx::query_scalar(
        "INSERT INTO webhook_endpoints (url, description, events, secret)
         VALUES ($1, $2, $3, $4) RETURNING id",
    )
    .bind(url)
    .bind(req.description.unwrap_or_default())
    .bind(&events)
    .bind(&secret)
    .fetch_one(&st.pool)
    .await?;

    // The only time the secret is ever returned. A receiver that loses it needs
    // a new endpoint, which is the same rule every payment provider uses.
    Ok(Json(json!({ "id": id, "secret": secret })))
}

pub async fn delete_webhook(
    _auth: Authenticated,
    State(st): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Value>, AppError> {
    let res = sqlx::query("DELETE FROM webhook_endpoints WHERE id = $1")
        .bind(id)
        .execute(&st.pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("No such endpoint"));
    }
    Ok(Json(json!({ "deleted": true })))
}

#[derive(Serialize, sqlx::FromRow)]
pub struct Delivery {
    pub id: i64,
    pub event: String,
    pub status_code: Option<i32>,
    pub error: String,
    pub attempt: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub async fn webhook_deliveries(
    _auth: Authenticated,
    State(st): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Vec<Delivery>>, AppError> {
    Ok(Json(
        sqlx::query_as(
            "SELECT id, event, status_code, error, attempt, created_at
               FROM webhook_deliveries WHERE endpoint_id = $1
              ORDER BY created_at DESC LIMIT 100",
        )
        .bind(id)
        .fetch_all(&st.pool)
        .await?,
    ))
}

/// Send a test event, and record the attempt like any other delivery.
pub async fn test_webhook(
    _auth: Authenticated,
    State(st): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Value>, AppError> {
    let (url, secret): (String, String) =
        sqlx::query_as("SELECT url, secret FROM webhook_endpoints WHERE id = $1")
            .bind(id)
            .fetch_optional(&st.pool)
            .await?
            .ok_or_else(|| AppError::not_found("No such endpoint"))?;

    let payload = json!({ "event": "ping", "sent_at": chrono::Utc::now() });
    let body = payload.to_string();

    // Signed so the receiver can tell this came from us. Without it any host
    // that learns the URL can post whatever it likes.
    use hmac::{Hmac, Mac};
    use sha2::Sha256;
    let mut mac = <Hmac<Sha256>>::new_from_slice(secret.as_bytes())
        .map_err(|e| AppError::internal(e.to_string()))?;
    mac.update(body.as_bytes());
    let signature = hex::encode(mac.finalize().into_bytes());

    let client = reqwest::Client::new();
    let sent = client
        .post(&url)
        .header("content-type", "application/json")
        .header("x-churchnepal-signature", &signature)
        .body(body.clone())
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await;

    let (status_code, error) = match sent {
        Ok(r) => (Some(r.status().as_u16() as i32), String::new()),
        Err(e) => (None, e.to_string()),
    };

    sqlx::query(
        "INSERT INTO webhook_deliveries (endpoint_id, event, payload, status_code, error)
         VALUES ($1, 'ping', $2, $3, $4)",
    )
    .bind(id)
    .bind(&payload)
    .bind(status_code)
    .bind(&error)
    .execute(&st.pool)
    .await?;

    Ok(Json(json!({ "status_code": status_code, "error": error })))
}

// ===========================================================================
// Email templates
// ===========================================================================

#[derive(Serialize, sqlx::FromRow)]
pub struct EmailTemplate {
    pub key: String,
    pub name: String,
    pub subject: String,
    pub body: String,
    pub description: String,
    pub variables: Vec<String>,
    pub updated_by: String,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

pub async fn list_templates(
    _auth: Authenticated,
    State(st): State<AppState>,
) -> Result<Json<Vec<EmailTemplate>>, AppError> {
    Ok(Json(
        sqlx::query_as("SELECT * FROM email_templates ORDER BY name")
            .fetch_all(&st.pool)
            .await?,
    ))
}

#[derive(Deserialize)]
pub struct UpdateTemplate {
    pub subject: String,
    pub body: String,
}

pub async fn update_template(
    auth: Authenticated,
    State(st): State<AppState>,
    Path(key): Path<String>,
    Json(req): Json<UpdateTemplate>,
) -> Result<Json<EmailTemplate>, AppError> {
    if req.subject.trim().is_empty() {
        return Err(AppError::bad_request("A template needs a subject"));
    }

    // Refuse a substitution the template does not declare. A typo like
    // {{chruch_name}} would otherwise ship and reach every church as literal
    // text in their welcome email.
    let declared: Vec<String> =
        sqlx::query_scalar("SELECT variables FROM email_templates WHERE key = $1")
            .bind(&key)
            .fetch_optional(&st.pool)
            .await?
            .ok_or_else(|| AppError::not_found("No such template"))?;

    let used = extract_variables(&format!("{} {}", req.subject, req.body));
    let unknown: Vec<&String> = used.iter().filter(|v| !declared.contains(v)).collect();
    if !unknown.is_empty() {
        return Err(AppError::bad_request(format!(
            "This template does not know {}. It understands: {}",
            unknown
                .iter()
                .map(|v| format!("{{{{{v}}}}}"))
                .collect::<Vec<_>>()
                .join(", "),
            declared.join(", ")
        )));
    }

    let tpl = sqlx::query_as::<_, EmailTemplate>(
        "UPDATE email_templates SET subject = $2, body = $3, updated_by = $4, updated_at = NOW()
          WHERE key = $1 RETURNING *",
    )
    .bind(&key)
    .bind(req.subject.trim())
    .bind(&req.body)
    .bind(&auth.0.email)
    .fetch_one(&st.pool)
    .await?;

    Ok(Json(tpl))
}

/// Every `{{name}}` in the text.
fn extract_variables(text: &str) -> Vec<String> {
    let mut out = Vec::new();
    let bytes = text.as_bytes();
    let mut i = 0;
    while i + 1 < bytes.len() {
        if bytes[i] == b'{' && bytes[i + 1] == b'{' {
            if let Some(end) = text[i + 2..].find("}}") {
                let name = text[i + 2..i + 2 + end].trim().to_string();
                if !name.is_empty() && !out.contains(&name) {
                    out.push(name);
                }
                i += 2 + end + 2;
                continue;
            }
        }
        i += 1;
    }
    out
}

// ===========================================================================
// Tax
// ===========================================================================

#[derive(Serialize, Deserialize, Default)]
pub struct TaxSettings {
    pub vat_number: String,
    pub vat_percent: f64,
    pub company_name: String,
    pub address: String,
    pub invoice_footer: String,
    /// Whether the plan prices already include VAT. Getting this backwards
    /// misstates every invoice by the rate, so it is asked rather than assumed.
    pub prices_include_vat: bool,
}

pub async fn get_tax(
    _auth: Authenticated,
    State(st): State<AppState>,
) -> Result<Json<TaxSettings>, AppError> {
    let value: Option<Value> =
        sqlx::query_scalar("SELECT value FROM platform_settings WHERE key = 'tax'")
            .fetch_optional(&st.pool)
            .await?;
    Ok(Json(
        value
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or_default(),
    ))
}

pub async fn update_tax(
    _auth: SuperAdmin,
    State(st): State<AppState>,
    Json(req): Json<TaxSettings>,
) -> Result<Json<TaxSettings>, AppError> {
    if !(0.0..=100.0).contains(&req.vat_percent) {
        return Err(AppError::bad_request("VAT is a percentage: 0 to 100"));
    }
    sqlx::query(
        "INSERT INTO platform_settings (key, value, updated_at)
         VALUES ('tax', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
    )
    .bind(serde_json::to_value(&req).unwrap_or_default())
    .execute(&st.pool)
    .await?;
    Ok(Json(req))
}

// ===========================================================================
// Coupons
// ===========================================================================

#[derive(Serialize, sqlx::FromRow)]
pub struct Coupon {
    pub code: String,
    pub description: String,
    pub kind: String,
    pub value: i64,
    pub duration_months: Option<i32>,
    pub max_redemptions: Option<i32>,
    pub expires_at: Option<chrono::DateTime<chrono::Utc>>,
    pub active: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub redeemed_count: i64,
    /// False once it has expired or run out, whatever `active` says — derived,
    /// so an exhausted coupon cannot go on looking available.
    pub redeemable: bool,
}

pub async fn list_coupons(
    _auth: Authenticated,
    State(st): State<AppState>,
) -> Result<Json<Vec<Coupon>>, AppError> {
    Ok(Json(
        sqlx::query_as(
            r#"SELECT c.*, COUNT(r.church_id)::bigint AS redeemed_count,
                      (c.active
                       AND (c.expires_at IS NULL OR c.expires_at > NOW())
                       AND (c.max_redemptions IS NULL
                            OR COUNT(r.church_id) < c.max_redemptions)) AS redeemable
                 FROM coupons c
                 LEFT JOIN coupon_redemptions r ON r.coupon_code = c.code
                GROUP BY c.code
                ORDER BY c.created_at DESC"#,
        )
        .fetch_all(&st.pool)
        .await?,
    ))
}

#[derive(Deserialize)]
pub struct NewCoupon {
    pub code: String,
    pub description: Option<String>,
    pub kind: String,
    pub value: i64,
    pub duration_months: Option<i32>,
    pub max_redemptions: Option<i32>,
    pub expires_at: Option<String>,
}

pub async fn create_coupon(
    auth: Authenticated,
    State(st): State<AppState>,
    Json(req): Json<NewCoupon>,
) -> Result<Json<Value>, AppError> {
    let code = req.code.trim().to_uppercase();
    if code.is_empty() {
        return Err(AppError::bad_request("A coupon needs a code"));
    }
    if !matches!(req.kind.as_str(), "percent" | "amount") {
        return Err(AppError::bad_request("A coupon is either a percent or an amount off"));
    }
    if req.value <= 0 {
        return Err(AppError::bad_request("The discount must be more than nothing"));
    }
    if req.kind == "percent" && req.value > 100 {
        return Err(AppError::bad_request(
            "More than 100% off would pay the church to exist",
        ));
    }

    sqlx::query(
        "INSERT INTO coupons (code, description, kind, value, duration_months,
                              max_redemptions, expires_at, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7::timestamptz,$8)",
    )
    .bind(&code)
    .bind(req.description.unwrap_or_default())
    .bind(&req.kind)
    .bind(req.value)
    .bind(req.duration_months)
    .bind(req.max_redemptions)
    .bind(&req.expires_at)
    .bind(&auth.0.email)
    .execute(&st.pool)
    .await
    .map_err(|e| {
        if e.to_string().contains("duplicate key") {
            AppError::bad_request("That code is already in use")
        } else {
            AppError::internal(e.to_string())
        }
    })?;

    Ok(Json(json!({ "code": code })))
}

pub async fn set_coupon_active(
    _auth: Authenticated,
    State(st): State<AppState>,
    Path((code, active)): Path<(String, bool)>,
) -> Result<Json<Value>, AppError> {
    let res = sqlx::query("UPDATE coupons SET active = $2 WHERE code = $1")
        .bind(&code)
        .bind(active)
        .execute(&st.pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("No such coupon"));
    }
    Ok(Json(json!({ "active": active })))
}

// ===========================================================================
// Broadcasts
// ===========================================================================

#[derive(Serialize, sqlx::FromRow)]
pub struct Broadcast {
    pub id: uuid::Uuid,
    pub subject: String,
    pub body: String,
    pub audience: String,
    pub status: String,
    pub scheduled_at: Option<chrono::DateTime<chrono::Utc>>,
    pub sent_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_by: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub recipient_count: i64,
    pub delivered_count: i64,
    pub failed_count: i64,
}

pub async fn list_broadcasts(
    _auth: Authenticated,
    State(st): State<AppState>,
) -> Result<Json<Vec<Broadcast>>, AppError> {
    Ok(Json(
        sqlx::query_as(
            r#"SELECT b.*,
                      COUNT(r.id)::bigint AS recipient_count,
                      COUNT(r.id) FILTER (WHERE r.status = 'sent')::bigint AS delivered_count,
                      COUNT(r.id) FILTER (WHERE r.status = 'failed')::bigint AS failed_count
                 FROM broadcasts b
                 LEFT JOIN broadcast_recipients r ON r.broadcast_id = b.id
                GROUP BY b.id ORDER BY b.created_at DESC"#,
        )
        .fetch_all(&st.pool)
        .await?,
    ))
}

/// Who a given audience actually resolves to, right now.
async fn resolve_audience(
    pool: &sqlx::PgPool,
    audience: &str,
) -> Result<Vec<(uuid::Uuid, String)>, AppError> {
    let sql = match audience {
        "all" => "SELECT id, admin_email FROM churches WHERE admin_email <> ''",
        "active" => "SELECT id, admin_email FROM churches WHERE status = 'active' AND admin_email <> ''",
        "suspended" => "SELECT id, admin_email FROM churches WHERE status = 'suspended' AND admin_email <> ''",
        _ => "SELECT id, admin_email FROM churches WHERE plan = $1 AND admin_email <> ''",
    };

    let rows: Vec<(uuid::Uuid, Option<String>)> = if sql.contains("$1") {
        sqlx::query_as(sql).bind(audience).fetch_all(pool).await?
    } else {
        sqlx::query_as(sql).fetch_all(pool).await?
    };

    Ok(rows
        .into_iter()
        .filter_map(|(id, email)| email.filter(|e| e.contains('@')).map(|e| (id, e)))
        .collect())
}

/// The recipient list for an audience, before anything is sent.
pub async fn preview_audience(
    _auth: Authenticated,
    State(st): State<AppState>,
    Query(q): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Value>, AppError> {
    let audience = q.get("audience").map(String::as_str).unwrap_or("all");
    let list = resolve_audience(&st.pool, audience).await?;
    Ok(Json(json!({
        "audience": audience,
        "count": list.len(),
        "emails": list.iter().map(|(_, e)| e).take(50).collect::<Vec<_>>(),
    })))
}

#[derive(Deserialize)]
pub struct NewBroadcast {
    pub subject: String,
    pub body: String,
    pub audience: Option<String>,
}

pub async fn create_broadcast(
    auth: Authenticated,
    State(st): State<AppState>,
    Json(req): Json<NewBroadcast>,
) -> Result<Json<Value>, AppError> {
    if req.subject.trim().is_empty() {
        return Err(AppError::bad_request("A broadcast needs a subject"));
    }
    let id: uuid::Uuid = sqlx::query_scalar(
        "INSERT INTO broadcasts (subject, body, audience, created_by)
         VALUES ($1,$2,$3,$4) RETURNING id",
    )
    .bind(req.subject.trim())
    .bind(&req.body)
    .bind(req.audience.unwrap_or_else(|| "all".into()))
    .bind(&auth.0.email)
    .fetch_one(&st.pool)
    .await?;
    Ok(Json(json!({ "id": id })))
}

/// Send it.
///
/// The recipient list is resolved now, not when the draft was written, and
/// each recipient is recorded before delivery is attempted — so a crash
/// halfway through leaves a record of who was already written to rather than
/// an unanswerable question.
pub async fn send_broadcast(
    _auth: SuperAdmin,
    State(st): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Value>, AppError> {
    let (audience, status): (String, String) =
        sqlx::query_as("SELECT audience, status FROM broadcasts WHERE id = $1")
            .bind(id)
            .fetch_optional(&st.pool)
            .await?
            .ok_or_else(|| AppError::not_found("No such broadcast"))?;

    if status == "sent" || status == "sending" {
        return Err(AppError::bad_request(
            "That broadcast has already gone out — create a new one rather than sending twice",
        ));
    }

    let recipients = resolve_audience(&st.pool, &audience).await?;
    if recipients.is_empty() {
        return Err(AppError::bad_request(
            "That audience has nobody in it — nothing was sent",
        ));
    }

    sqlx::query("UPDATE broadcasts SET status = 'sending' WHERE id = $1")
        .bind(id)
        .execute(&st.pool)
        .await?;

    for (church_id, email) in &recipients {
        sqlx::query(
            "INSERT INTO broadcast_recipients (broadcast_id, church_id, email, status)
             VALUES ($1,$2,$3,'pending') ON CONFLICT DO NOTHING",
        )
        .bind(id)
        .bind(church_id)
        .bind(email)
        .execute(&st.pool)
        .await?;
    }

    // Delivery itself is the mail provider's job and is not wired up here, so
    // recipients stay `pending` rather than being marked sent. Claiming
    // delivery we did not perform is the one thing this table must never do.
    sqlx::query("UPDATE broadcasts SET status = 'sent', sent_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(&st.pool)
        .await?;

    Ok(Json(json!({
        "queued": recipients.len(),
        "note": "Recipients recorded. Delivery runs through the mail provider, which is not configured."
    })))
}

// ===========================================================================
// Roles
// ===========================================================================

#[derive(Serialize, sqlx::FromRow)]
pub struct Role {
    pub name: String,
    pub description: String,
    pub permissions: Vec<String>,
    pub is_builtin: bool,
    /// How many administrators hold it, so nobody deletes the role the last
    /// owner is using.
    pub admin_count: i64,
}

pub async fn list_roles(
    _auth: Authenticated,
    State(st): State<AppState>,
) -> Result<Json<Vec<Role>>, AppError> {
    Ok(Json(
        sqlx::query_as(
            r#"SELECT r.name, r.description, r.permissions, r.is_builtin,
                      (SELECT COUNT(*) FROM admins a WHERE a.role = r.name)::bigint AS admin_count
                 FROM control_roles r ORDER BY r.is_builtin DESC, r.name"#,
        )
        .fetch_all(&st.pool)
        .await?,
    ))
}

/// Everything a role can be granted, so the editor is a list of real choices
/// rather than a free-text box that silently accepts a typo.
pub async fn list_permissions(_auth: Authenticated) -> Json<Value> {
    Json(json!([
        { "key": "churches.view",    "label": "See churches" },
        { "key": "churches.manage",  "label": "Provision, suspend and edit churches" },
        { "key": "billing.manage",   "label": "Plans, invoices and coupons" },
        { "key": "admins.manage",    "label": "Invite and remove administrators" },
        { "key": "settings.manage",  "label": "Platform settings" },
        { "key": "flags.manage",     "label": "Feature flags" },
        { "key": "broadcasts.send",  "label": "Message every church" },
        { "key": "reports.view",     "label": "Platform reports" },
        { "key": "ops.view",         "label": "Operational health" },
    ]))
}

#[derive(Deserialize)]
pub struct UpsertRole {
    pub description: Option<String>,
    pub permissions: Vec<String>,
}

pub async fn update_role(
    _auth: SuperAdmin,
    State(st): State<AppState>,
    Path(name): Path<String>,
    Json(req): Json<UpsertRole>,
) -> Result<Json<Role>, AppError> {
    // Built-in roles are what the server's own extractors check. Editing
    // super_admin's permissions here would imply a power this console does not
    // actually have, which is worse than refusing.
    let builtin: Option<bool> =
        sqlx::query_scalar("SELECT is_builtin FROM control_roles WHERE name = $1")
            .bind(&name)
            .fetch_optional(&st.pool)
            .await?;
    match builtin {
        None => return Err(AppError::not_found("No such role")),
        Some(true) => {
            return Err(AppError::bad_request(
                "Built-in roles cannot be changed — their meaning is compiled into the server",
            ))
        }
        Some(false) => {}
    }

    sqlx::query(
        "UPDATE control_roles SET description = COALESCE($2, description), permissions = $3
          WHERE name = $1",
    )
    .bind(&name)
    .bind(req.description.as_deref())
    .bind(&req.permissions)
    .execute(&st.pool)
    .await?;

    let role = sqlx::query_as::<_, Role>(
        r#"SELECT r.name, r.description, r.permissions, r.is_builtin,
                  (SELECT COUNT(*) FROM admins a WHERE a.role = r.name)::bigint AS admin_count
             FROM control_roles r WHERE r.name = $1"#,
    )
    .bind(&name)
    .fetch_one(&st.pool)
    .await?;

    Ok(Json(role))
}

// ===========================================================================
// Backups
// ===========================================================================

#[derive(Serialize, sqlx::FromRow)]
pub struct BackupRun {
    pub id: uuid::Uuid,
    pub church_slug: Option<String>,
    pub kind: String,
    pub status: String,
    pub size_bytes: i64,
    pub path: String,
    pub error: String,
    pub started_by: String,
    pub started_at: chrono::DateTime<chrono::Utc>,
    pub finished_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Serialize)]
pub struct Backups {
    pub runs: Vec<BackupRun>,
    pub last_success_at: Option<chrono::DateTime<chrono::Utc>>,
    /// Churches with no successful backup on record. The number that decides
    /// whether "we have backups" is a true sentence.
    pub unprotected: Vec<String>,
    pub total_size_bytes: i64,
    pub pg_dump_available: bool,
}

/// The command that produces a dump, as program plus arguments.
///
/// Defaults to `pg_dump` on the PATH. `PG_DUMP_COMMAND` overrides it, which is
/// how a machine that runs Postgres in a container points at the copy inside:
///
///     PG_DUMP_COMMAND="docker exec -i grace-church-postgres pg_dump"
///
/// Version matters: pg_dump refuses to dump a server newer than itself, so the
/// binary must be at least the server's major version. Using the container's
/// own pg_dump sidesteps that question entirely.
fn pg_dump_command() -> (String, Vec<String>) {
    let raw = std::env::var("PG_DUMP_COMMAND").unwrap_or_else(|_| "pg_dump".to_string());
    let mut parts = raw.split_whitespace().map(str::to_string);
    let program = parts.next().unwrap_or_else(|| "pg_dump".to_string());
    (program, parts.collect())
}

pub async fn list_backups(
    _auth: Authenticated,
    State(st): State<AppState>,
) -> Result<Json<Backups>, AppError> {
    let runs = sqlx::query_as::<_, BackupRun>(
        "SELECT * FROM backup_runs ORDER BY started_at DESC LIMIT 100",
    )
    .fetch_all(&st.pool)
    .await?;

    let last_success_at = sqlx::query_scalar(
        "SELECT MAX(finished_at) FROM backup_runs WHERE kind = 'backup' AND status = 'ok'",
    )
    .fetch_one(&st.pool)
    .await
    .unwrap_or(None);

    let unprotected: Vec<String> = sqlx::query_scalar(
        "SELECT c.slug FROM churches c
          WHERE NOT EXISTS (
              SELECT 1 FROM backup_runs b
               WHERE b.church_slug = c.slug AND b.kind = 'backup' AND b.status = 'ok')
          ORDER BY c.slug",
    )
    .fetch_all(&st.pool)
    .await?;

    let total_size_bytes: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(size_bytes), 0)::bigint FROM backup_runs WHERE status = 'ok'",
    )
    .fetch_one(&st.pool)
    .await?;

    // Said plainly rather than discovered at the moment a backup is needed.
    // `.is_ok()` alone would call a command that ran and failed "available", so
    // the exit status is checked too.
    let (program, args) = pg_dump_command();
    let pg_dump_available = std::process::Command::new(&program)
        .args(&args)
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false);

    Ok(Json(Backups {
        runs,
        last_success_at,
        unprotected,
        total_size_bytes,
        pg_dump_available,
    }))
}

/// Take a backup of one church database.
pub async fn run_backup(
    auth: SuperAdmin,
    State(st): State<AppState>,
    Path(slug): Path<String>,
) -> Result<Json<Value>, AppError> {
    // The slug names a database; anything but the characters a slug is allowed
    // to contain has no business being interpolated into a command line.
    if !slug.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-') {
        return Err(AppError::bad_request("That is not a valid church slug"));
    }

    let db_name: Option<String> =
        sqlx::query_scalar("SELECT db_name FROM churches WHERE slug = $1")
            .bind(&slug)
            .fetch_optional(&st.pool)
            .await?;
    let db_name = db_name.ok_or_else(|| AppError::not_found("No such church"))?;

    let dir = std::path::Path::new("../../backups");
    std::fs::create_dir_all(dir)
        .map_err(|e| AppError::internal(format!("Could not create the backup folder: {e}")))?;
    let stamp = chrono::Utc::now().format("%Y%m%d-%H%M%S");
    let path = dir.join(format!("{slug}-{stamp}.sql"));

    let id: uuid::Uuid = sqlx::query_scalar(
        "INSERT INTO backup_runs (church_slug, kind, status, path, started_by)
         VALUES ($1, 'backup', 'running', $2, $3) RETURNING id",
    )
    .bind(&slug)
    .bind(path.to_string_lossy().as_ref())
    .bind(&auth.email)
    .fetch_one(&st.pool)
    .await?;

    // The tenant lives in its own database on the same instance, so the
    // superuser URL is reused with the database name swapped — the control
    // database's own credentials cannot read it.
    let base = st.cfg.pg_super_url.trim_end_matches('/');
    let dsn = match base.rfind('/') {
        Some(i) => format!("{}/{}", &base[..i], db_name),
        None => format!("{base}/{db_name}"),
    };

    // Captured from stdout rather than written with -f: the file has to land
    // here, and `-f` writes wherever the command itself runs — which for a
    // containerised pg_dump is inside the container, where nothing can restore
    // from it.
    let (program, args) = pg_dump_command();
    let out = std::process::Command::new(&program)
        .args(&args)
        .arg(&dsn)
        .output();

    let (status, size, error) = match out {
        Ok(o) if o.status.success() => {
            match std::fs::write(&path, &o.stdout) {
                // An empty dump is a failed dump, however cleanly pg_dump exited.
                Ok(()) if !o.stdout.is_empty() => ("ok", o.stdout.len() as i64, String::new()),
                Ok(()) => ("failed", 0, "pg_dump produced nothing".to_string()),
                Err(e) => ("failed", 0, format!("could not write the dump: {e}")),
            }
        }
        Ok(o) => ("failed", 0, String::from_utf8_lossy(&o.stderr).trim().to_string()),
        Err(e) => (
            "failed",
            0,
            format!("{program} could not be run: {e}. Set PG_DUMP_COMMAND if Postgres runs in a container."),
        ),
    };

    sqlx::query(
        "UPDATE backup_runs SET status = $2, size_bytes = $3, error = $4, finished_at = NOW()
          WHERE id = $1",
    )
    .bind(id)
    .bind(status)
    .bind(size)
    .bind(&error)
    .execute(&st.pool)
    .await?;

    if status == "failed" {
        return Err(AppError::internal(format!("The backup failed: {error}")));
    }
    Ok(Json(json!({ "id": id, "size_bytes": size, "path": path })))
}

// ===========================================================================
// Platform reports
// ===========================================================================

#[derive(Serialize, sqlx::FromRow)]
pub struct ReportRow {
    pub label: String,
    pub churches: i64,
    /// Storage, not members: the member count lives in each tenant database
    /// and would need a connection per church to draw one table. This figure
    /// is one the control database actually holds.
    pub storage_bytes: i64,
    pub mrr: i64,
}

#[derive(Serialize)]
pub struct PlatformReport {
    pub by_plan: Vec<ReportRow>,
    pub by_status: Vec<ReportRow>,
    pub by_month: Vec<ReportRow>,
    pub totals: ReportRow,
}

pub async fn platform_report(
    _auth: Authenticated,
    State(st): State<AppState>,
) -> Result<Json<PlatformReport>, AppError> {
    // One MRR expression, used by every grouping below, so the three tables on
    // this page cannot add up to three different platform totals.
    const MRR: &str = "COALESCE(SUM(p.price_monthly) FILTER (WHERE c.status = 'active'), 0)::bigint";

    let by_plan = sqlx::query_as::<_, ReportRow>(&format!(
        r#"SELECT COALESCE(NULLIF(btrim(c.plan), ''), 'Free') AS label,
                  COUNT(*)::bigint AS churches,
                  COALESCE(SUM(c.storage_bytes), 0)::bigint AS storage_bytes,
                  {MRR} AS mrr
             FROM churches c LEFT JOIN plans p ON p.name = c.plan
            GROUP BY 1 ORDER BY mrr DESC"#
    ))
    .fetch_all(&st.pool)
    .await?;

    let by_status = sqlx::query_as::<_, ReportRow>(&format!(
        r#"SELECT c.status AS label, COUNT(*)::bigint AS churches,
                  COALESCE(SUM(c.storage_bytes), 0)::bigint AS storage_bytes, {MRR} AS mrr
             FROM churches c LEFT JOIN plans p ON p.name = c.plan
            GROUP BY 1 ORDER BY churches DESC"#
    ))
    .fetch_all(&st.pool)
    .await?;

    let by_month = sqlx::query_as::<_, ReportRow>(&format!(
        r#"SELECT to_char(date_trunc('month', c.created_at), 'YYYY-MM') AS label,
                  COUNT(*)::bigint AS churches,
                  COALESCE(SUM(c.storage_bytes), 0)::bigint AS storage_bytes, {MRR} AS mrr
             FROM churches c LEFT JOIN plans p ON p.name = c.plan
            GROUP BY 1 ORDER BY 1"#
    ))
    .fetch_all(&st.pool)
    .await?;

    let totals = sqlx::query_as::<_, ReportRow>(&format!(
        r#"SELECT 'All churches' AS label, COUNT(*)::bigint AS churches,
                  COALESCE(SUM(c.storage_bytes), 0)::bigint AS storage_bytes, {MRR} AS mrr
             FROM churches c LEFT JOIN plans p ON p.name = c.plan"#
    ))
    .fetch_one(&st.pool)
    .await?;

    Ok(Json(PlatformReport { by_plan, by_status, by_month, totals }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn substitutions_are_found_and_deduplicated() {
        let vars = extract_variables("Hi {{name}}, your {{plan}} renews. Bye {{name}}.");
        assert_eq!(vars, vec!["name", "plan"]);
    }

    #[test]
    fn an_unclosed_placeholder_is_not_a_variable() {
        // Otherwise a stray brace would be reported as an unknown substitution
        // and block a save that is actually fine.
        assert!(extract_variables("Hello {{name").is_empty());
        assert_eq!(extract_variables("{{ spaced }}"), vec!["spaced"]);
        assert!(extract_variables("no placeholders here").is_empty());
    }
}
