use axum::routing::{get, post, put, delete};
use axum::Router;
use sqlx::PgPool;

use crate::handlers::*;

pub fn api_routes() -> Router<PgPool> {
    Router::new()
        // Auth
        .route("/auth/login", post(auth::login))
        .route("/auth/register", post(auth::register))
        .route("/auth/me", get(auth::me))
        // Sermons
        .route("/sermons", get(sermons::list).post(sermons::create))
        .route("/sermons/{id}", get(sermons::get).put(sermons::update).delete(sermons::delete))
        // Ministries
        .route("/ministries", get(ministries::list).post(ministries::create))
        .route("/ministries/{id}", get(ministries::get).put(ministries::update).delete(ministries::delete))
        // Events
        .route("/events", get(events::list).post(events::create))
        .route("/events/{id}", get(events::get).put(events::update).delete(events::delete))
        // Leaders
        .route("/leaders", get(leaders::list).post(leaders::create))
        .route("/leaders/{id}", get(leaders::get).put(leaders::update).delete(leaders::delete))
        // Gallery
        .route("/gallery", get(gallery::list).post(gallery::create))
        .route("/gallery/{id}", get(gallery::get).put(gallery::update).delete(gallery::delete))
        // Testimonies
        .route("/testimonies", get(testimonies::list).post(testimonies::create))
        .route("/testimonies/{id}", get(testimonies::get).put(testimonies::update).delete(testimonies::delete))
        // Notices
        .route("/notices", get(notices::list).post(notices::create))
        .route("/notices/{id}", get(notices::get).put(notices::update).delete(notices::delete))
        // Members
        .route("/members", get(members::list).post(members::create))
        .route("/members/{id}", get(members::get).put(members::update).delete(members::delete))
        // Service Times
        .route("/service-times", get(service_times::list).post(service_times::create))
        .route("/service-times/{id}", get(service_times::get).put(service_times::update).delete(service_times::delete))
        // Verses
        .route("/verses", get(verses::list).post(verses::create))
        .route("/verses/{id}", get(verses::get).put(verses::update).delete(verses::delete))
        // Campaigns
        .route("/campaigns", get(campaigns::list).post(campaigns::create))
        .route("/campaigns/{id}", get(campaigns::get).put(campaigns::update).delete(campaigns::delete))
        // Settings
        .route("/settings", get(settings::list))
        .route("/settings/{key}", get(settings::get).put(settings::upsert))
}
