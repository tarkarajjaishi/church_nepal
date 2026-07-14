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
        .route("/sermons/{id}/reorder", put(sermons::reorder))
        // Ministries
        .route("/ministries", get(ministries::list).post(ministries::create))
        .route("/ministries/{id}", get(ministries::get).put(ministries::update).delete(ministries::delete))
        .route("/ministries/{id}/toggle", put(ministries::toggle))
        .route("/ministries/{id}/reorder", put(ministries::reorder))
        // Events
        .route("/events", get(events::list).post(events::create))
        .route("/events/{id}", get(events::get).put(events::update).delete(events::delete))
        .route("/events/{id}/toggle", put(events::toggle))
        .route("/events/{id}/reorder", put(events::reorder))
        // Leaders
        .route("/leaders", get(leaders::list).post(leaders::create))
        .route("/leaders/{id}", get(leaders::get).put(leaders::update).delete(leaders::delete))
        .route("/leaders/{id}/toggle", put(leaders::toggle))
        .route("/leaders/{id}/reorder", put(leaders::reorder))
        // Gallery
        .route("/gallery", get(gallery::list).post(gallery::create))
        .route("/gallery/{id}", get(gallery::get).put(gallery::update).delete(gallery::delete))
        .route("/gallery/{id}/toggle", put(gallery::toggle))
        .route("/gallery/{id}/reorder", put(gallery::reorder))
        // Testimonies
        .route("/testimonies", get(testimonies::list).post(testimonies::create))
        .route("/testimonies/{id}", get(testimonies::get).put(testimonies::update).delete(testimonies::delete))
        .route("/testimonies/{id}/toggle", put(testimonies::toggle))
        .route("/testimonies/{id}/reorder", put(testimonies::reorder))
        // Notices
        .route("/notices", get(notices::list).post(notices::create))
        .route("/notices/{id}", get(notices::get).put(notices::update).delete(notices::delete))
        .route("/notices/{id}/toggle", put(notices::toggle))
        .route("/notices/{id}/reorder", put(notices::reorder))
        // Members
        .route("/members", get(members::list).post(members::create))
        .route("/members/{id}", get(members::get).put(members::update).delete(members::delete))
        .route("/members/{id}/toggle", put(members::toggle))
        .route("/members/{id}/reorder", put(members::reorder))
        // Service Times
        .route("/service-times", get(service_times::list).post(service_times::create))
        .route("/service-times/{id}", get(service_times::get).put(service_times::update).delete(service_times::delete))
        .route("/service-times/{id}/toggle", put(service_times::toggle))
        .route("/service-times/{id}/reorder", put(service_times::reorder))
        // Verses
        .route("/verses", get(verses::list).post(verses::create))
        .route("/verses/{id}", get(verses::get).put(verses::update).delete(verses::delete))
        .route("/verses/{id}/toggle", put(verses::toggle))
        .route("/verses/{id}/reorder", put(verses::reorder))
        // Campaigns
        .route("/campaigns", get(campaigns::list).post(campaigns::create))
        .route("/campaigns/{id}", get(campaigns::get).put(campaigns::update).delete(campaigns::delete))
        .route("/campaigns/{id}/toggle", put(campaigns::toggle))
        .route("/campaigns/{id}/reorder", put(campaigns::reorder))
        // Settings
        .route("/settings", get(settings::list))
        .route("/settings/{key}", get(settings::get).put(settings::upsert))
        .route("/settings/sections", get(settings::get_sections))
        .route("/settings/sections/{section}/toggle", put(settings::toggle_section))
        // Upload
        .route("/upload", post(upload::upload))
        // Content Blocks
        .route("/content-blocks", get(content_blocks::list).post(content_blocks::create))
        .route("/content-blocks/{id}", get(content_blocks::get).put(content_blocks::update).delete(content_blocks::delete))
        .route("/content-blocks/{id}/toggle", put(content_blocks::toggle))
        .route("/content-blocks/{id}/reorder", put(content_blocks::reorder))
        .route("/content-blocks/key/{key}", get(content_blocks::get_by_key))
        .route("/content-blocks/enabled", get(content_blocks::list_enabled))
        // Donations
        .route("/donations/initiate", post(donations::initiate))
        .route("/donations/callback/esewa", get(donations::callback_esewa))
        .route("/donations/callback/khalti/{id}", post(donations::callback_khalti))
        .route("/donations/status", get(donations::status))
        .route("/donations", get(donations::list))
        .route("/donations/stats", get(donations::stats))
        .route("/donations/{id}", get(donations::get))
}
