use crate::tenant::Db;
use axum::{extract::Query, Json};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppError;

#[derive(Deserialize)]
struct SearchQuery {
    q: String,
    limit: Option<u64>,
    offset: Option<u64>,
}

#[derive(Serialize)]
struct SearchResult {
    id: Uuid,
    title: String,
    result_type: String,
    body: String,
    rank: f32,
}

pub async fn stats(Db(pool): Db) -> Result<Json<serde_json::Value>, AppError> {
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

pub async fn search(
    Query(params): Query<SearchQuery>,
    Db(pool): Db,
) -> Result<Json<Vec<SearchResult>>, AppError> {
    let query = params.q;
    let limit = params.limit.unwrap_or(10) as i64;
    let offset = params.offset.unwrap_or(0) as i64;

    // If the query is empty, return an empty vector
    if query.trim().is_empty() {
        return Ok(Json(vec![]));
    }

    let results = sqlx::query_as!(
        SearchResult,
        r#"
        WITH query AS (SELECT websearch_to_tsquery('english', $1) AS q)
        SELECT
            id,
            title,
            result_type,
            body,
            rank
        FROM (
            SELECT
                id,
                title,
                'sermon' AS result_type,
                description AS body,
                ts_rank_cd(search_vector, q) AS rank
            FROM sermons, query
            WHERE search_vector @@ q
            UNION ALL
            SELECT
                id,
                title,
                'blog_post' AS result_type,
                excerpt AS body,
                ts_rank_cd(search_vector, q) AS rank
            FROM blog_posts, query
            WHERE search_vector @@ q
            UNION ALL
            SELECT
                id,
                title,
                'event' AS result_type,
                description AS body,
                ts_rank_cd(search_vector, q) AS rank
            FROM events, query
            WHERE search_vector @@ q
            UNION ALL
            SELECT
                id,
                name AS title,
                'member' AS result_type,
                email AS body,
                ts_rank_cd(search_vector, q) AS rank
            FROM members, query
            WHERE search_vector @@ q
        ) combined
        ORDER BY rank DESC
        LIMIT $2 OFFSET $3
        "#,
        query, limit, offset
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(results))
}
