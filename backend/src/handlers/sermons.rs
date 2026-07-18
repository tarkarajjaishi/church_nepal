use crate::tenant::Db;
use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateSermon, Sermon, UpdateSermon};

#[derive(serde::Deserialize)]
pub struct ReorderRequest {
    pub sort_order: i32,
}

pub async fn list(Db(pool): Db) -> Result<Json<Vec<Sermon>>, AppError> {
    let rows = sqlx::query_as::<_, Sermon>("SELECT * FROM sermons ORDER BY sort_order ASC, created_at DESC")
        .fetch_all(&pool)
        .await?;
    Ok(Json(rows))
}

pub async fn list_enabled(Db(pool): Db) -> Result<Json<Vec<Sermon>>, AppError> {
    let rows = sqlx::query_as::<_, Sermon>("SELECT * FROM sermons WHERE enabled = TRUE ORDER BY sort_order ASC, created_at DESC")
        .fetch_all(&pool)
        .await?;
    Ok(Json(rows))
}

pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Sermon>, AppError> {
    let row = sqlx::query_as::<_, Sermon>(
        "UPDATE sermons SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Sermon not found"))?;
    Ok(Json(row))
}

pub async fn reorder(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<ReorderRequest>,
) -> Result<Json<Sermon>, AppError> {
    let row = sqlx::query_as::<_, Sermon>(
        "UPDATE sermons SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Sermon not found"))?;
    Ok(Json(row))
}

pub async fn get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Sermon>, AppError> {
    let row = sqlx::query_as::<_, Sermon>("SELECT * FROM sermons WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Sermon not found"))?;
    Ok(Json(row))
}

pub async fn create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CreateSermon>,
) -> Result<Json<Sermon>, AppError> {
    let row = sqlx::query_as::<_, Sermon>(
        r#"INSERT INTO sermons (title, speaker, date, duration, series, topic, image, description, video_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *"#,
    )
    .bind(&input.title)
    .bind(&input.speaker)
    .bind(&input.date)
    .bind(&input.duration)
    .bind(&input.series)
    .bind(&input.topic)
    .bind(&input.image)
    .bind(&input.description)
    .bind(input.video_url.as_deref().unwrap_or(""))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdateSermon>,
) -> Result<Json<Sermon>, AppError> {
    let existing = sqlx::query_as::<_, Sermon>("SELECT * FROM sermons WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Sermon not found"))?;

    let row = sqlx::query_as::<_, Sermon>(
        r#"UPDATE sermons SET
            title = COALESCE($2, title),
            speaker = COALESCE($3, speaker),
            date = COALESCE($4, date),
            duration = COALESCE($5, duration),
            series = COALESCE($6, series),
            topic = COALESCE($7, topic),
            image = COALESCE($8, image),
            description = COALESCE($9, description),
            video_url = COALESCE($10, video_url),
            sort_order = COALESCE($11, sort_order),
            updated_at = NOW()
           WHERE id = $1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.title.as_deref().unwrap_or(&existing.title))
    .bind(input.speaker.as_deref().unwrap_or(&existing.speaker))
    .bind(input.date.as_deref().unwrap_or(&existing.date))
    .bind(input.duration.as_deref().unwrap_or(&existing.duration))
    .bind(input.series.as_deref().unwrap_or(&existing.series))
    .bind(input.topic.as_deref().unwrap_or(&existing.topic))
    .bind(input.image.as_deref().unwrap_or(&existing.image))
    .bind(input.description.as_deref().unwrap_or(&existing.description))
    .bind(input.video_url.as_deref().unwrap_or(existing.video_url.as_deref().unwrap_or("")))
    .bind(input.sort_order)
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM sermons WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
