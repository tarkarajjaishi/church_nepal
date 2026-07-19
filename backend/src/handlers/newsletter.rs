use crate::tenant::Db;
use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateSubscriber, NewsletterSubscriber};

pub async fn list_subscribers(_auth: AuthUser, Db(pool): Db) -> Result<Json<Vec<NewsletterSubscriber>>, AppError> {
    let rows = sqlx::query_as::<_, NewsletterSubscriber>(
        "SELECT * FROM newsletter_subscribers WHERE active = true ORDER BY subscribed_at DESC",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn count(Db(pool): Db) -> Result<Json<serde_json::Value>, AppError> {
    let row: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM newsletter_subscribers WHERE active = true",
    )
    .fetch_one(&pool)
    .await?;
    Ok(Json(serde_json::json!({ "count": row.0 })))
}

pub async fn subscribe(
    Db(pool): Db,
    Json(input): Json<CreateSubscriber>,
) -> Result<Json<NewsletterSubscriber>, AppError> {
    let row = sqlx::query_as::<_, NewsletterSubscriber>(
        r#"INSERT INTO newsletter_subscribers (email, name)
           VALUES ($1, $2)
           ON CONFLICT (email) DO UPDATE SET active = true, name = EXCLUDED.name
           RETURNING *"#,
    )
    .bind(&input.email)
    .bind(input.name.unwrap_or_default())
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn unsubscribe(
    _auth: AuthUser,
    Db(pool): Db,
    Path(email): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("UPDATE newsletter_subscribers SET active = false WHERE email = $1")
        .bind(&email)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "unsubscribed": true })))
}
