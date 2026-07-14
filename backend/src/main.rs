mod auth;
mod config;
mod db;
mod error;
mod handlers;
mod models;
mod routes;

use axum::http::header;
use axum::http::Method;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;

#[tokio::main]
async fn main() {
    let config = config::Config::from_env();
    let pool = db::new_pool(&config).await;

    // Ensure uploads directory exists
    std::fs::create_dir_all("uploads").ok();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    let app = axum::Router::new()
        .nest("/api", routes::api_routes())
        .nest_service("/api/uploads", ServeDir::new("uploads"))
        .layer(cors)
        .with_state(pool);

    let addr = format!("0.0.0.0:{}", config.port);
    println!("Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
