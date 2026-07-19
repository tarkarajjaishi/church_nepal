use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::*;

#[derive(serde::Deserialize)]
pub struct ReorderRequest {
    pub sort_order: i32,
}

pub async fn list(
    Db(pool): Db,
    Query(p): Query<Pagination>,
) -> Result<Json<Paginated<Sermon>>, AppError> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM sermons")
        .fetch_one(&pool).await?;
    let rows = sqlx::query_as::<_, Sermon>(
        "SELECT * FROM sermons ORDER BY sort_order ASC, created_at DESC LIMIT $1 OFFSET $2")
        .bind(p.limit()).bind(p.offset())
        .fetch_all(&pool).await?;
    Ok(Json(Paginated::new(rows, total, &p)))
}

pub async fn list_enabled(Db(pool): Db) -> Result<Json<Vec<Sermon>>, AppError> {
    let rows = sqlx::query_as::<_, Sermon>("SELECT * FROM sermons WHERE enabled = TRUE ORDER BY sort_order ASC, created_at DESC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Sermon>, AppError> {
    let row = sqlx::query_as::<_, Sermon>(
        "UPDATE sermons SET enabled = NOT enabled WHERE id = $1 RETURNING *")
        .bind(id).fetch_optional(&pool).await?
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
        "UPDATE sermons SET sort_order = $2 WHERE id = $1 RETURNING *")
        .bind(id).bind(input.sort_order).fetch_optional(&pool).await?
        .ok_or_else(|| AppError::not_found("Sermon not found"))?;
    Ok(Json(row))
}

pub async fn get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Sermon>, AppError> {
    let row = sqlx::query_as::<_, Sermon>("SELECT * FROM sermons WHERE id = $1")
        .bind(id).fetch_optional(&pool).await?
        .ok_or_else(|| AppError::not_found("Sermon not found"))?;
    Ok(Json(row))
}

pub async fn create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CreateSermon>,
) -> Result<Json<Sermon>, AppError> {
    let row = sqlx::query_as::<_, Sermon>(
        "INSERT INTO sermons (title, speaker, date, duration, series, topic, image, description, video_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *")
        .bind(&input.title).bind(&input.speaker).bind(&input.date)
        .bind(&input.duration).bind(&input.series).bind(&input.topic)
        .bind(&input.image).bind(&input.description).bind(&input.video_url)
        .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdateSermon>,
) -> Result<Json<Sermon>, AppError> {
    let row = sqlx::query_as::<_, Sermon>(
        "UPDATE sermons SET title=COALESCE($2,title), speaker=COALESCE($3,speaker),
         date=COALESCE($4,date), duration=COALESCE($5,duration), series=COALESCE($6,series),
         topic=COALESCE($7,topic), image=COALESCE($8,image), description=COALESCE($9,description),
         video_url=COALESCE($10,video_url), updated_at=NOW()
         WHERE id=$1 RETURNING *")
        .bind(id).bind(&input.title).bind(&input.speaker)
        .bind(&input.date).bind(&input.duration).bind(&input.series)
        .bind(&input.topic).bind(&input.image).bind(&input.description)
        .bind(&input.video_url)
        .fetch_optional(&pool).await?
        .ok_or_else(|| AppError::not_found("Sermon not found"))?;
    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let affected = sqlx::query("DELETE FROM sermons WHERE id = $1")
        .bind(id).execute(&pool).await?.rows_affected();
    if affected == 0 { return Err(AppError::not_found("Sermon not found")); }
    Ok(Json(serde_json::json!({"deleted": true})))
}
