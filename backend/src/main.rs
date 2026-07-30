mod auth;
mod config;
mod db;
mod email;
mod error;
mod handlers;
mod models;
mod payment;
mod permissions;
mod routes;
mod security;
mod tenant;

use axum::http::{header, Method};
use axum::middleware::{from_fn, from_fn_with_state};
use axum::routing::get;
use chrono::Duration;
use sqlx::PgPool;
use std::sync::Arc;
use tenant::{TenantRegistry, TenantRegistryConfig};
use tower_http::cors::{Any, CorsLayer};
use uuid::Uuid;
use handlers::webhooks::process_webhook_deliveries;

use governor::clock::QuantaInstant;
use governor::middleware::NoOpMiddleware;
use std::sync::Arc as StdArc;
use tower_governor::governor::{GovernorConfig, GovernorConfigBuilder};
use tower_governor::key_extractor::{KeyExtractor, SmartIpKeyExtractor};
use tower_governor::GovernorError;

/// Every config here uses the builder's default (no-op) middleware.
type Governor<K> = StdArc<GovernorConfig<K, NoOpMiddleware<QuantaInstant>>>;

// ── Rate limiting ────────────────────────────────────────────────────────────
//
// tower_governor 0.6's KeyExtractor is just `extract()` — the earlier version of
// this file assumed a `KeyExtractionError` associated type and a `measure()`
// method that do not exist, which is why it never compiled.
//
// Limits are expressed as a replenish interval plus a burst size, since the
// builder has no per_minute(): 200/min == one cell every 300ms with a burst of
// 200.

// Client IP comes from SmartIpKeyExtractor, which reads X-Forwarded-For /
// X-Real-IP before falling back to the peer address — the app runs behind
// Caddy/nginx, so the peer address is the proxy on every request.

/// Rate-limits by bearer token so one noisy admin session cannot spend another
/// admin's budget. Falls back to the client IP when there is no token, so
/// unauthenticated traffic to guarded routes is still counted.
#[derive(Clone)]
struct TokenOrIpKeyExtractor;

impl KeyExtractor for TokenOrIpKeyExtractor {
    type Key = String;

    #[cfg(feature = "tracing")]
    fn name(&self) -> &'static str {
        "bearer token or IP"
    }

    fn extract<T>(&self, req: &axum::http::Request<T>) -> Result<Self::Key, GovernorError> {
        if let Some(token) = req
            .headers()
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .and_then(|h| h.strip_prefix("Bearer "))
            .filter(|t| !t.is_empty())
        {
            return Ok(format!("token:{token}"));
        }
        SmartIpKeyExtractor
            .extract(req)
            .map(|ip| format!("ip:{ip}"))
            .or(Err(GovernorError::UnableToExtractKey))
    }
}

fn governor_config<K: KeyExtractor>(key_extractor: K, per_minute: u32) -> Governor<K> {
    let replenish_ms = (60_000 / u64::from(per_minute)).max(1);
    StdArc::new(
        GovernorConfigBuilder::default()
            .key_extractor(key_extractor)
            .per_millisecond(replenish_ms)
            .burst_size(per_minute)
            .finish()
            .expect("valid governor config"),
    )
}

/// Global floor: 200 req/min per IP on every route.
pub fn lenient_ip_governor() -> Governor<SmartIpKeyExtractor> {
    governor_config(SmartIpKeyExtractor, 200)
}

/// Tighter 30 req/min per IP for auth and public-write endpoints (login,
/// contact, donations, prayer requests) — the abuse-prone surface.
pub fn strict_ip_governor() -> Governor<SmartIpKeyExtractor> {
    governor_config(SmartIpKeyExtractor, 30)
}

/// 1 000 req/min per bearer token for the admin surface.
pub fn per_token_governor() -> Governor<TokenOrIpKeyExtractor> {
    governor_config(TokenOrIpKeyExtractor, 1000)
}

// ── Internal control-plane hook ──────────────────────────────────────────────

/// Drop the negative-cache entry for a slug so a church the control plane just
/// provisioned serves immediately instead of waiting out MISSING_TENANT_TTL.
///
/// The control plane runs as a separate process, so this has to be an HTTP hop.
/// It is not part of the public API: it is guarded by a shared secret and fails
/// closed (404) when INTERNAL_API_SECRET is unset, so an unconfigured or
/// public-facing deployment never exposes a cache-busting endpoint.
async fn refresh_tenant(
    axum::extract::State(reg): axum::extract::State<TenantRegistry>,
    axum::extract::Path(slug): axum::extract::Path<String>,
    headers: axum::http::HeaderMap,
) -> axum::http::StatusCode {
    use axum::http::StatusCode;

    let expected = std::env::var("INTERNAL_API_SECRET").unwrap_or_default();
    if expected.is_empty() {
        return StatusCode::NOT_FOUND;
    }
    let provided = headers
        .get("x-internal-secret")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    if !constant_time_eq(provided.as_bytes(), expected.as_bytes()) {
        return StatusCode::UNAUTHORIZED;
    }
    if !tenant::valid_slug(&slug) {
        return StatusCode::BAD_REQUEST;
    }

    reg.forget_missing(&slug).await;
    println!("Tenant '{slug}' cache invalidated by control plane");
    StatusCode::NO_CONTENT
}

/// Length-independent comparison so the shared secret cannot be recovered by
/// timing the response.
fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    a.iter().zip(b).fold(0u8, |acc, (x, y)| acc | (x ^ y)) == 0
}

async fn run_recurring_job(reg: TenantRegistry) {
    let mut interval = tokio::time::interval(std::time::Duration::from_secs(60));
    loop {
        interval.tick().await;
        let pools = reg.all_pools().await;
        for pool in &pools {
            process_due_recurring_donations(pool).await;
            process_scheduled_broadcasts(pool).await;
            process_webhook_deliveries(pool.clone()).await;
            handlers::report_schedules::process_due(pool).await;
            handlers::helpdesk_notify::process_escalations(pool).await;
        }
    }
}

async fn process_due_recurring_donations(pool: &PgPool) {
    let due: Vec<(Uuid, i64, String, String)> = match sqlx::query_as(
        r#"SELECT id, amount, gateway, interval FROM recurring_donations WHERE active = true AND next_charge_at <= NOW()"#,
    )
    .fetch_all(pool)
    .await
    {
        Ok(rows) => rows,
        Err(_) => return,
    };

    for (id, amount, gateway, interval) in due {
        match gateway.as_str() {
            "stripe" => {
                let next = if interval == "weekly" {
                    chrono::Utc::now() + Duration::weeks(1)
                } else {
                    chrono::Utc::now() + Duration::days(30)
                };
                let _ = sqlx::query("UPDATE recurring_donations SET next_charge_at = $1 WHERE id = $2")
                    .bind(next.naive_utc())
                    .bind(id)
                    .execute(pool)
                    .await;
            }
            "khalti" | "esewa" => {
                let _ = sqlx::query(
                    r#"INSERT INTO donations (donor_name, donor_email, donor_phone, amount, payment_method, campaign_id, transaction_id, status, notes)
                       VALUES ($1, $2, $3, $4, $5, NULL, $6, 'pending', $7)"#,
                )
                .bind(format!("recurring_{}", id))
                .bind("")
                .bind("")
                .bind(amount)
                .bind(&gateway)
                .bind(format!("recurring_{}", id))
                .bind(format!("Automated {} recurring charge", gateway))
                .execute(pool)
                .await;

                let next = if interval == "weekly" {
                    chrono::Utc::now() + Duration::weeks(1)
                } else {
                    chrono::Utc::now() + Duration::days(30)
                };
                let _ = sqlx::query("UPDATE recurring_donations SET next_charge_at = $1 WHERE id = $2")
                    .bind(next.naive_utc())
                    .bind(id)
                    .execute(pool)
                    .await;
            }
            _ => {}
        }
    }
}

async fn process_scheduled_broadcasts(pool: &PgPool) {
    let due: Vec<(Uuid,)> = match sqlx::query_as(
        "SELECT id FROM broadcasts WHERE status = 'scheduled' AND scheduled_at <= NOW()",
    )
    .fetch_all(pool)
    .await
    {
        Ok(rows) => rows,
        Err(_) => return,
    };

    for (id,) in due {
        let _ = sqlx::query("UPDATE broadcasts SET status = 'sending', updated_at = NOW() WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await;

        let broadcast: Option<crate::models::broadcast::Broadcast> = sqlx::query_as(
            "SELECT * FROM broadcasts WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten();

        if let Some(broadcast) = broadcast {
            let mut recipients: Vec<(String, String)> = Vec::new();

            match broadcast.recipient_group.as_str() {
                "all" | "all_members" => {
                    if let Ok(rows) = sqlx::query_as::<_, (String, String)>(
                        r#"SELECT email, COALESCE(name, '') as recipient_name FROM newsletter_subscribers WHERE active = true
                           UNION
                           SELECT p.email, COALESCE(p.first_name || ' ' || p.last_name, '') as recipient_name FROM people p WHERE p.enabled = true AND p.email IS NOT NULL AND p.email <> ''
                           ORDER BY email"#,
                    )
                    .fetch_all(pool)
                    .await
                    {
                        recipients = rows;
                    }
                }
                "active_members" => {
                    if let Ok(rows) = sqlx::query_as::<_, (String, String)>(
                        r#"SELECT email, COALESCE(first_name || ' ' || last_name, '') as recipient_name FROM people WHERE enabled = true AND email IS NOT NULL AND email <> '' AND member_status IN ('member', 'regular')"#,
                    )
                    .fetch_all(pool)
                    .await
                    {
                        recipients = rows;
                    }
                }
                "visitors" => {
                    if let Ok(rows) = sqlx::query_as::<_, (String, String)>(
                        r#"SELECT email, COALESCE(first_name || ' ' || last_name, '') as recipient_name FROM people WHERE enabled = true AND email IS NOT NULL AND email <> '' AND member_status = 'visitor'"#,
                    )
                    .fetch_all(pool)
                    .await
                    {
                        recipients = rows;
                    }
                }
                "volunteers" => {
                    if let Ok(rows) = sqlx::query_as::<_, (String, String)>(
                        r#"SELECT DISTINCT p.email, COALESCE(p.first_name || ' ' || p.last_name, '') as recipient_name FROM people p JOIN volunteer_assignments va ON va.person_id = p.id WHERE p.enabled = true AND p.email IS NOT NULL AND p.email <> ''"#,
                    )
                    .fetch_all(pool)
                    .await
                    {
                        recipients = rows;
                    }
                }
                "small_groups" => {
                    if let Ok(rows) = sqlx::query_as::<_, (String, String)>(
                        r#"SELECT DISTINCT p.email, COALESCE(p.first_name || ' ' || p.last_name, '') as recipient_name FROM people p JOIN group_memberships gm ON gm.person_id = p.id WHERE p.enabled = true AND p.email IS NOT NULL AND p.email <> ''"#,
                    )
                    .fetch_all(pool)
                    .await
                    {
                        recipients = rows;
                    }
                }
                _ => {
                    if let Ok(rows) = sqlx::query_as::<_, (String, String)>(
                        "SELECT email, COALESCE(name, '') as recipient_name FROM newsletter_subscribers WHERE active = true",
                    )
                    .fetch_all(pool)
                    .await
                    {
                        recipients = rows;
                    }
                }
            }

            let count = recipients.len() as i32;
            sqlx::query("UPDATE broadcasts SET recipient_count = $2 WHERE id = $1")
                .bind(id)
                .bind(count)
                .execute(pool)
                .await
                .ok();

            let mut recipient_ids: Vec<uuid::Uuid> = Vec::new();
            for (email, name) in &recipients {
                if let Ok(rid) = sqlx::query_as::<_, (uuid::Uuid,)>(
                    "INSERT INTO broadcast_recipients (broadcast_id, recipient_email, recipient_name, status) VALUES ($1, $2, $3, 'pending') RETURNING id",
                )
                .bind(id)
                .bind(email)
                .bind(name)
                .fetch_one(pool)
                .await
                {
                    recipient_ids.push(rid.0);
                }
            }

            let pool_clone = pool.clone();
            let broadcast_clone = broadcast.clone();
            tokio::spawn(async move {
                for ((email, name), recipient_id) in recipients.into_iter().zip(recipient_ids) {
                    let _ = crate::handlers::broadcasts::send_broadcast_email(&pool_clone, &broadcast_clone, &email, &name, recipient_id).await;
                }
                let _ = sqlx::query("UPDATE broadcasts SET status = 'sent', updated_at = NOW() WHERE id = $1")
                    .bind(broadcast_clone.id)
                    .execute(&pool_clone)
                    .await;
            });
        }
    }
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    let cfg = crate::config::Config::from_env();

    let pool = db::new_pool(&cfg).await;

    let tenant_cfg = TenantRegistryConfig {
        pg_base: std::env::var("PG_BASE_URL").unwrap_or_else(|_| {
            let url = std::env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgres://postgres:password@localhost:5432".into());
            match url.rfind('/') {
                Some(i) => url[..i].to_string(),
                None => url,
            }
        }),
        base_domain: std::env::var("BASE_DOMAIN").unwrap_or_else(|_| "churchnepal.com".into()),
        default_slug: std::env::var("DEFAULT_TENANT").ok().filter(|s| !s.is_empty()),
        min_connections: cfg.db_min_connections,
        max_connections: cfg.db_max_connections,
        idle_timeout_secs: cfg.db_idle_timeout_secs,
        max_lifetime_secs: cfg.db_max_lifetime_secs,
        connect_timeout_secs: cfg.db_connect_timeout_secs,
        connect_max_retries: cfg.db_connect_max_retries,
    };
    let registry = TenantRegistry::from_config(tenant_cfg);

    let _pool_for = {
        let default_slug = registry.default_slug
            .clone()
            .unwrap_or_else(|| {
                cfg.database_url
                    .rsplit('/')
                    .next()
                    .and_then(|s| s.split('?').next())
                    .unwrap_or("default")
                    .to_string()
            });
        registry.pool_for(&default_slug).await
    };

    // SENTRY_INIT_PLACEHOLDER
    tokio::spawn(run_recurring_job(registry.clone()));

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::PATCH, Method::OPTIONS])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    // Merged *after* tenant_mw so it is not itself tenant-scoped — the whole
    // point is that its slug has no resolvable tenant yet.
    let internal = axum::Router::new()
        .route(
            "/internal/tenants/{slug}/refresh",
            axum::routing::post(refresh_tenant),
        )
        .with_state(registry.clone());

    let app = axum::Router::new()
        .nest("/api", routes::api_routes())
        .route("/uploads/{filename}", get(handlers::upload::serve_upload))
        .layer(from_fn_with_state(registry.clone(), tenant::tenant_mw))
        .merge(internal)
        .layer(cors);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3002".into());
    let addr = format!("0.0.0.0:{}", port);
    println!("Church app (multi-tenant) running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    // ConnectInfo must be available or the rate limiter's peer-IP fallback has
    // no key to extract and every un-proxied request fails with 500.
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<std::net::SocketAddr>(),
    )
    .await
    .unwrap();
}
