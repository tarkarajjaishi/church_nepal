use axum::extract::State;
use axum::Json;
use sqlx::PgPool;

use crate::error::AppError;

pub async fn stats(State(pool): State<PgPool>) -> Result<Json<serde_json::Value>, AppError> {
    let users: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users").fetch_one(&pool).await?;
    let blog_posts: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM blog_posts").fetch_one(&pool).await?;
    let published_posts: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM blog_posts WHERE published = true").fetch_one(&pool).await?;
    let testimonials: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM testimonies").fetch_one(&pool).await?;
    let team_members: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM team").fetch_one(&pool).await?;
    let services_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM services").fetch_one(&pool).await?;
    let portfolio_projects: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM portfolio").fetch_one(&pool).await?;
    let subscribers: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM newsletter_subscribers WHERE active = true").fetch_one(&pool).await?;

    Ok(Json(serde_json::json!({
        "users": users.0,
        "blog_posts": blog_posts.0,
        "published_posts": published_posts.0,
        "testimonials": testimonials.0,
        "team_members": team_members.0,
        "services": services_count.0,
        "portfolio_projects": portfolio_projects.0,
        "subscribers": subscribers.0,
    })))
}
