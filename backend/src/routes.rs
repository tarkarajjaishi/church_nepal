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
        // Users (admin only)
        .route("/users", get(users::list).post(users::create))
        .route("/users/{id}", get(users::get).put(users::update).delete(users::delete))
        // Sermons
        .route("/sermons", get(sermons::list).post(sermons::create))
        .route("/sermons/{id}", get(sermons::get).put(sermons::update).delete(sermons::delete))
        .route("/sermons/{id}/toggle", put(sermons::toggle))
        // Ministries
        .route("/ministries", get(ministries::list).post(ministries::create))
        .route("/ministries/{id}", get(ministries::get).put(ministries::update).delete(ministries::delete))
        .route("/ministries/{id}/toggle", put(ministries::toggle))
        // Events
        .route("/events", get(events::list).post(events::create))
        .route("/events/{id}", get(events::get).put(events::update).delete(events::delete))
        .route("/events/{id}/toggle", put(events::toggle))
        // Leaders
        .route("/leaders", get(leaders::list).post(leaders::create))
        .route("/leaders/{id}", get(leaders::get).put(leaders::update).delete(leaders::delete))
        .route("/leaders/{id}/toggle", put(leaders::toggle))
        // Gallery
        .route("/gallery", get(gallery::list).post(gallery::create))
        .route("/gallery/{id}", get(gallery::get).put(gallery::update).delete(gallery::delete))
        .route("/gallery/{id}/toggle", put(gallery::toggle))
        // Testimonies
        .route("/testimonies", get(testimonies::list).post(testimonies::create))
        .route("/testimonies/{id}", get(testimonies::get).put(testimonies::update).delete(testimonies::delete))
        .route("/testimonies/{id}/toggle", put(testimonies::toggle))
        // Notices
        .route("/notices", get(notices::list).post(notices::create))
        .route("/notices/{id}", get(notices::get).put(notices::update).delete(notices::delete))
        .route("/notices/{id}/toggle", put(notices::toggle))
        // Members
        .route("/members", get(members::list).post(members::create))
        .route("/members/{id}", get(members::get).put(members::update).delete(members::delete))
        .route("/members/{id}/toggle", put(members::toggle))
        // Service Times
        .route("/service-times", get(service_times::list).post(service_times::create))
        .route("/service-times/{id}", get(service_times::get).put(service_times::update).delete(service_times::delete))
        .route("/service-times/{id}/toggle", put(service_times::toggle))
        // Verses
        .route("/verses", get(verses::list).post(verses::create))
        .route("/verses/{id}", get(verses::get).put(verses::update).delete(verses::delete))
        .route("/verses/{id}/toggle", put(verses::toggle))
        // Campaigns
        .route("/campaigns", get(campaigns::list).post(campaigns::create))
        .route("/campaigns/{id}", get(campaigns::get).put(campaigns::update).delete(campaigns::delete))
        .route("/campaigns/{id}/toggle", put(campaigns::toggle))
        // Settings
        .route("/settings", get(settings::list))
        .route("/settings/{key}", get(settings::get).put(settings::upsert))
}
