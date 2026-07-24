mod auth;
mod config;
mod db;
mod email;
mod error;
mod handlers;
mod models;
mod payment;
mod routes;
mod security;
mod tenant;

use axum::http::{header, Method};
use axum::middleware::{from_fn, from_fn_with_state};
use axum::routing::get;
use chrono::Duration;
use lazy_static::lazy_std::Lazy;
use sqlx::PgPool;
use std::sync::Arc;
use tenant::{TenantRegistry, TenantRegistryConfig};
use tower::ServiceExt;
use tower_governor::key_extractor::KeyExtractor;
use tower_governor::{GovernorConfigBuilder, GovernorLayer};
use tower_http::cors::{Any, CorsLayer};
use uuid::Uuid;
use handlers::audit::audit_middleware;
use handlers::webhooks::process_webhook_deliveries;
use sentry::{self, ClientInitOptions};
use sentry::integrations::axum::SentryLayer;
use sentry::Client;
use sentry::types::{Event, IpAddr};

// ── Per-IP key extractor ──────────────────────────────────────────────────────

#[derive(Clone, Copy, Default)]
struct IpKeyExtractor;

impl KeyExtractor for IpKeyExtractor {
    type Key = String;
    type KeyExtractionError = tower_governor::key_extractor::KeyExtractorError;

    fn extract<R: tower::ServiceExt>(
        &self,
        req: &axum::http::Request<R>,
    ) -> Result<Self::Key, Self::KeyExtractionError> {
        let peer = req
            .extensions()
            .get::<std::net::SocketAddr>()
            .map(|a| a.ip().to_string())
            .unwrap_or_else(|| "0.0.0.0".into());
        Ok(peer)
    }

    fn measure<R: tower::ServiceExt>(
        &self,
        _req: &axum::http::Request<R>,
    ) -> Result<Self::Key, Self::KeyExtractionError> {
        self.extract(_req)
    }
}

// ── Per-token (Authorization header) key extractor ────────────────────────────
// Falls back to Peer-IP when the header is absent so that unauthenticated
// traffic is still counted and rate-limited.

#[derive(Clone, Copy, Default)]
struct TokenKeyExtractor;

impl KeyExtractor for TokenKeyExtractor {
    type Key = String;
    type KeyExtractionError = tower_governor::key_extractor::KeyExtractorError;

    fn measure<R: tower::ServiceExt>(
        &self,
        req: &axum::http::Request<R>,
    ) -> Result<Self::Key, Self::KeyExtractorError> {
        if let Some(raw) = req.headers().get(axum::http::header::AUTHORIZATION) {
            if let Ok(s) = raw.to_str() {
                if let Some(token) = s.strip_prefix("Bearer ") {
                    if !token.is_empty() {
                        return Ok(format!("token:{}", token));
                    }
                }
            }
        }
        let peer = req
            .extensions()
            .get::<std::net::SocketAddr>()
            .map(|a| a.ip().to_string())
            .unwrap_or_else(|| "0.0.0.0".into());
        Ok(peer)
    }

    fn extract<R: tower::ServiceExt>(
        &self,
        req: &axum::http::Request<R>,
    ) -> Result<Self::Key, Self::KeyExtractorError> {
        self.measure(req)
    }
}

// ── Governor configs (shared with routes.rs) ──────────────────────────────────

/// Lenient Per-IP limit applied globally (200 req/min). The task specifies a
/// "per-IP" rate limit; 200/min preserves the global floor while
/// "stricter on auth + public submit" endpoints is achieved by nesting the
/// strict_ip_governor inside routes.rs.
pub fn lenient_ip_governor() -> std::sync::Arc<tower_governor::GovernorConfig> {
    std::sync::Arc::new(
        GovernorConfigBuilder::default()
            .key_extractor(IpKeyExtractor)
            .per_minute(200)
            .finish()
            .expect("valid lenient IP governor config"),
    )
}

/// Strict per-IP limit (30 req/min) for sensitive endpoints: auth
/// login/refresh and public write/submit routes. Nest inside routes.rs
/// alongside the lenient outer governor so both thresholds must pass.
pub fn strict_ip_governor() -> std::sync::Arc<tower_governor::GovernorConfig> {
    std::sync::Arc::new(
        GovernorConfigBuilder::default()
            .key_extractor(IpKeyExtractor)
            .per_minute(30)
            .finish()
            .expect("valid strict IP governor config"),
    )
}

/// Per-token limit (1 000 req/min) keyed on the Authorization header value.
/// Falls back to the raw peer IP when no Bearer token is present so that
/// unauthenticated admin traffic is still tracked. Applied ONLY inside the
/// admin_guarded route group.
pub fn per_token_governor() -> std::sync::Arc<tower_governor::GovernorConfig> {
    std::sync::Arc::new(
        GovernorConfigBuilder::default()
            .key_extractor(TokenKeyExtractor)
            .per_minute(1000)
            .finish()
            .expect("valid token governor config"),
    )
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
                .bind(gateway)
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

    let app = axum::Router::new()
        .nest("/api", routes::api_routes())
        .route("/uploads/{filename}", get(handlers::upload::serve_upload))
        .layer(from_fn_with_state(registry.clone(), tenant::tenant_mw))
        .layer(from_fn_with_state(registry.clone(), audit_middleware))
        // Per-IP floor: 200 req/min on every request (prevents blanket abuse).
        // Tighten for auth + public-write endpoints via nested stricts in
        // routes.rs; track individual bearer tokens separately with
        // per_token_governor() on the admin-guarded group.
        .layer(GovernorLayer {
            config: crate::lenient_ip_governor(),
        })
        .layer(cors);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3002".into());
    let addr = format!("0.0.0.0:{}", port);
    println!("Church app (multi-tenant) running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
