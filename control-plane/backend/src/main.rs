mod auth;
mod config;
mod contract_tests;
mod email;
mod error;
mod handlers;
mod provision;
mod seed;
mod stripe;

use axum::http::{header, Method};
use axum::routing::{delete, get, patch, post};
use axum::Router;
use config::Config;
use sqlx::postgres::{PgPool, PgPoolOptions};
use sqlx::Executor;
use std::sync::Arc;
use std::time::Duration;
use std::time::Instant;
use tower_http::cors::{Any, CorsLayer};

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub cfg: Arc<Config>,
    pub started_at: Instant,
}

#[tokio::main]
async fn main() {
    let cfg = Config::from_env();

    let pool = connect_control_pool(&cfg).await;

    if cfg.db_migrate_on_startup {
        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .expect("run control migrations");
    }

    seed_super_admin(&pool, &cfg).await;
    let _ = seed::seed_admins(&cfg, &pool).await;
    let _ = seed::seed_test_admin(&cfg, &pool).await;

    let _ = seed::seed_dummy_churches(&cfg, &pool).await;

    let state = AppState { pool, cfg: Arc::new(cfg.clone()), started_at: Instant::now() };

    let dunning_pool = state.pool.clone();
    let dunning_cfg = state.cfg.clone();
    tokio::spawn(async move {
        handlers::run_dunning_checker(dunning_pool, dunning_cfg).await;
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    let api = Router::new()
        .route("/auth/login", post(handlers::login))
        .route("/auth/refresh", post(handlers::refresh_token))
        .route("/auth/logout", post(handlers::logout))
        .route("/auth/forgot", post(handlers::forgot_password))
        .route("/auth/reset", post(handlers::reset_password))
        .route("/auth/me", get(handlers::me))
        .route("/auth/reset-authenticated", post(handlers::reset_authenticated_password))
        // 2FA
        .route("/auth/2fa/enroll", post(handlers::twofa_enroll))
        .route("/auth/2fa/verify", post(handlers::twofa_verify))
        .route("/auth/2fa/disable", post(handlers::twofa_disable))
        // Admins
        .route("/admins", get(handlers::list_admins).post(handlers::invite_admin))
        .route("/admins/{id}", patch(handlers::update_admin).delete(handlers::delete_admin))
        // API Keys
        .route("/api-keys", post(handlers::create_api_key).get(handlers::list_api_keys))
        .route("/api-keys/{id}", delete(handlers::revoke_api_key))
        // Churches
        .route("/churches", get(handlers::list_churches).post(handlers::create_church))
        .route("/churches/{id}", get(handlers::get_church).delete(handlers::delete_church))
        .route("/churches/{id}/suspend", post(handlers::suspend_church))
        .route("/churches/{id}/reactivate", post(handlers::reactivate_church))
        .route("/churches/{id}/subscribe", post(handlers::subscribe_church))
        .route("/churches/{slug}/stats", get(handlers::get_church_stats))
        // Plans
        .route("/plans", get(handlers::list_plans).post(handlers::create_plan))
        .route("/plans/{id}", get(handlers::get_plan).put(handlers::update_plan).delete(handlers::delete_plan))
        // Billing
        .route("/billing", get(handlers::list_billing))
        .route("/billing/{church_id}", get(handlers::get_billing_for_church))
        .route("/billing/overview", get(handlers::get_billing_overview))
        .route("/invoices", get(handlers::list_invoices).post(handlers::create_invoice))
        .route("/invoices/{id}/pay", post(handlers::mark_invoice_paid))
        .route("/churches/{id}/billing-portal", post(handlers::create_billing_portal_session))
        .route("/churches/{id}/invoices", get(handlers::list_church_stripe_invoices))
        .route("/churches/{church_id}/donations/{donation_id}/refund", post(handlers::refund_donation))
        // Analytics
        .route("/analytics/overview", get(handlers::get_analytics_overview))
        .route("/analytics/growth", get(handlers::get_growth_analytics))
        .route("/analytics/top-churches", get(handlers::get_top_churches))
        .route("/analytics/refunds", get(handlers::get_refund_analytics))
        // Notifications
        .route("/notifications", get(handlers::list_notifications))
        .route("/notifications/{id}/read", post(handlers::mark_notification_read))
        .route("/notifications/read-all", post(handlers::mark_all_notifications_read))
        // Settings
        .route("/settings", get(handlers::get_settings).put(handlers::update_settings))
        // Seeding
        .route("/seed/dummy", post(handlers::seed_dummy))
        .route("/search", get(handlers::search))
        // Blog
        .route("/blog", get(handlers::list_public_blog_posts))
        .route("/blog/{slug}", get(handlers::get_public_blog_post))
        .route("/admin/blog", get(handlers::list_admin_blog_posts).post(handlers::create_blog_post))
        .route("/admin/blog/{id}", patch(handlers::update_blog_post).delete(handlers::delete_blog_post))
        .with_state(state.clone());

    let app = Router::new()
        .route("/healthz", get(handlers::healthz))
        .route("/readyz", get(handlers::readyz))
        .route("/api/webhooks/stripe", post(handlers::stripe_webhook))
        .route("/api/_routes", get(handlers::api_routes))
        .route("/api/status", get(handlers::get_status))
        .nest("/api", api)
        .with_state(state)
        .layer(cors);

    let addr = format!("0.0.0.0:{}", cfg.port);
    println!("Control plane running on http://{addr}");
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

/// Connect to the control database with retries, creating it first if needed.
async fn connect_control_pool(cfg: &Config) -> PgPool {
    ensure_control_db(cfg).await;
    connect_with_retry(&cfg.control_database_url, cfg)
        .await
        .expect("connect control database")
}

/// Bootstrap: create the control database if it doesn't yet exist (one-time).
async fn ensure_control_db(cfg: &Config) {
    let db_name = cfg.control_db_name();

    let admin = connect_superuser_pool(cfg).await;

    let exists: Option<i32> = sqlx::query_scalar("SELECT 1 FROM pg_database WHERE datname = $1")
        .bind(&db_name)
        .fetch_optional(&admin)
        .await
        .expect("check control db");
    if exists.is_none() {
        admin
            .execute(format!("CREATE DATABASE \"{db_name}\"").as_str())
            .await
            .expect("create control database");
        println!("Created control database '{}'", db_name);
    }
}

/// Connect to the superuser maintenance DB with retries (max_connections=1).
async fn connect_superuser_pool(cfg: &Config) -> PgPool {
    connect_with_retry(&cfg.pg_super_url, cfg)
        .await
        .expect("connect superuser db to bootstrap control database")
}

/// Core retry loop shared by control-pool and superuser-pool connections.
///
/// Uses exponential back-off: 200ms, 400ms, 600ms, … up to `max_retries`
/// attempts before returning the final error.
async fn connect_with_retry(url: &str, cfg: &Config) -> Result<PgPool, sqlx::Error> {
    let timeout = Duration::from_secs(cfg.db_connect_timeout_secs);
    let max_retries = cfg.db_connect_max_retries;
    let mut attempt: u32 = 0;

    loop {
        match PgPoolOptions::new()
            .min_connections(1)
            .max_connections(cfg.db_max_connections)
            .idle_timeout(Some(Duration::from_secs(cfg.db_idle_timeout_secs)))
            .max_lifetime(Some(Duration::from_secs(cfg.db_max_lifetime_secs)))
            .acquire_timeout(timeout)
            .connect(url)
            .await
        {
            Ok(pool) => return Ok(pool),
            Err(e) => {
                attempt += 1;
                if attempt >= max_retries {
                    return Err(e);
                }
                let backoff = Duration::from_millis(200 * u64::from(attempt));
                eprintln!(
                    "DB connect attempt {}/{} to '{}' failed: {} — retrying in {:?}",
                    attempt, max_retries, url, e, backoff
                );
                tokio::time::sleep(backoff).await;
            }
        }
    }
}


async fn seed_super_admin(pool: &PgPool, cfg: &Config) {
    let ctrl_exists: Option<i32> =
        sqlx::query_scalar("SELECT 1 FROM control_admins WHERE email = $1")
            .bind(&cfg.super_admin_email)
            .fetch_optional(pool)
            .await
            .expect("check super admin");
    if ctrl_exists.is_none() {
        let hash = bcrypt::hash(&cfg.super_admin_password, bcrypt::DEFAULT_COST).expect("hash");
        sqlx::query("INSERT INTO control_admins (email, password_hash, name) VALUES ($1, $2, 'Owner')")
            .bind(&cfg.super_admin_email)
            .bind(&hash)
            .execute(pool)
            .await
            .expect("seed super admin");
        println!("Seeded super-admin '{}'", cfg.super_admin_email);
    }

    let admins_exists: Option<i32> =
        sqlx::query_scalar("SELECT 1 FROM admins WHERE email = $1")
            .bind(&cfg.super_admin_email)
            .fetch_optional(pool)
            .await
            .expect("check super admin in admins");
    if admins_exists.is_none() {
        let hash = bcrypt::hash(&cfg.super_admin_password, bcrypt::DEFAULT_COST).expect("hash");
        sqlx::query("INSERT INTO admins (email, password_hash, role, status) VALUES ($1, $2, 'super_admin', 'active')")
            .bind(&cfg.super_admin_email)
            .bind(&hash)
            .execute(pool)
            .await
            .expect("seed super admin in admins");
    }
}
