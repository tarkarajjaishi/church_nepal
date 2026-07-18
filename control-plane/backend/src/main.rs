mod auth;
mod config;
mod error;
mod handlers;
mod provision;

use axum::http::{header, Method};
use axum::routing::{delete, get, post};
use axum::Router;
use config::Config;
use sqlx::postgres::{PgPool, PgPoolOptions};
use sqlx::Executor;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub cfg: Arc<Config>,
}

#[tokio::main]
async fn main() {
    let cfg = Config::from_env();

    ensure_control_db(&cfg).await;

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&cfg.control_database_url)
        .await
        .expect("connect control database");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("run control migrations");

    seed_super_admin(&pool, &cfg).await;

    let state = AppState { pool, cfg: Arc::new(cfg.clone()) };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    let api = Router::new()
        .route("/auth/login", post(handlers::login))
        .route("/auth/me", get(handlers::me))
        .route("/churches", get(handlers::list_churches).post(handlers::create_church))
        .route("/churches/{id}", delete(handlers::delete_church))
        .with_state(state);

    let app = Router::new().nest("/api", api).layer(cors);

    let addr = format!("0.0.0.0:{}", cfg.port);
    println!("Control plane running on http://{addr}");
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

/// Create the control database itself if it doesn't exist yet (one-time bootstrap).
async fn ensure_control_db(cfg: &Config) {
    let db_name = cfg
        .control_database_url
        .rsplit('/')
        .next()
        .and_then(|s| s.split('?').next())
        .unwrap_or("churchnepal_control")
        .to_string();

    let admin = PgPoolOptions::new()
        .max_connections(1)
        .connect(&cfg.pg_super_url)
        .await
        .expect("connect superuser db to bootstrap control database");

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
        println!("Created control database '{db_name}'");
    }
}

async fn seed_super_admin(pool: &PgPool, cfg: &Config) {
    let exists: Option<i32> = sqlx::query_scalar("SELECT 1 FROM control_admins WHERE email = $1")
        .bind(&cfg.super_admin_email)
        .fetch_optional(pool)
        .await
        .expect("check super admin");
    if exists.is_none() {
        let hash = bcrypt::hash(&cfg.super_admin_password, bcrypt::DEFAULT_COST).expect("hash");
        sqlx::query("INSERT INTO control_admins (email, password_hash, name) VALUES ($1, $2, 'Owner')")
            .bind(&cfg.super_admin_email)
            .bind(&hash)
            .execute(pool)
            .await
            .expect("seed super admin");
        println!("Seeded super-admin '{}'", cfg.super_admin_email);
    }
}
