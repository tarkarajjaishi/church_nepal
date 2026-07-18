mod auth;
mod config;
mod db;
mod error;
mod handlers;
mod models;
mod payment;
mod routes;
mod tenant;

use axum::http::{header, Method};
use axum::middleware::from_fn_with_state;
use axum::routing::get;
use tenant::TenantRegistry;
use tower_http::cors::{Any, CorsLayer};

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    // Multi-tenant: no single DB pool. Each request is routed to the church's
    // own database by subdomain (see tenant.rs). Databases are created and
    // migrated by the control plane at provisioning time.
    let registry = TenantRegistry::from_env();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::PATCH, Method::OPTIONS])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    let app = axum::Router::new()
        .nest("/api", routes::api_routes())
        // Per-church file serving: /uploads/<file> -> <STORAGE_ROOT>/<slug>/<file>
        .route("/uploads/{filename}", get(handlers::upload::serve_upload))
        .layer(from_fn_with_state(registry.clone(), tenant::tenant_mw))
        .layer(cors);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3002".into());
    let addr = format!("0.0.0.0:{}", port);
    println!("Church app (multi-tenant) running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
