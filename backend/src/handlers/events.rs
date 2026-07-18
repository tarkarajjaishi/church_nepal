use crate::tenant::Db;
use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{ChurchEvent, CreateEvent, UpdateEvent};

pub async fn list(Db(pool): Db) -> Result<Json<Vec<ChurchEvent>>, AppError> {
    let rows = sqlx::query_as::<_, ChurchEvent>("SELECT * FROM events ORDER BY created_at DESC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<ChurchEvent>, AppError> {
    let row = sqlx::query_as::<_, ChurchEvent>("SELECT * FROM events WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Event not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, Db(pool): Db, Json(input): Json<CreateEvent>) -> Result<Json<ChurchEvent>, AppError> {
    let row = sqlx::query_as::<_, ChurchEvent>(
        r#"INSERT INTO events (title, date, display_date, time, location, image, description) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *"#,
    )
    .bind(&input.title)
    .bind(&input.date)
    .bind(&input.display_date)
    .bind(&input.time)
    .bind(&input.location)
    .bind(&input.image)
    .bind(&input.description)
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateEvent>) -> Result<Json<ChurchEvent>, AppError> {
    let existing = sqlx::query_as::<_, ChurchEvent>("SELECT * FROM events WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Event not found"))?;
    let row = sqlx::query_as::<_, ChurchEvent>(
        r#"UPDATE events SET title=COALESCE($2,title), date=COALESCE($3,date), display_date=COALESCE($4,display_date), time=COALESCE($5,time), location=COALESCE($6,location), image=COALESCE($7,image), description=COALESCE($8,description) WHERE id=$1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.title.as_deref().unwrap_or(&existing.title))
    .bind(input.date.as_deref().unwrap_or(&existing.date))
    .bind(input.display_date.as_deref().unwrap_or(&existing.display_date))
    .bind(input.time.as_deref().unwrap_or(&existing.time))
    .bind(input.location.as_deref().unwrap_or(&existing.location))
    .bind(input.image.as_deref().unwrap_or(&existing.image))
    .bind(input.description.as_deref().unwrap_or(&existing.description))
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM events WHERE id = $1")
        .bind(id)
        .execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<ChurchEvent>, AppError> {
    let row = sqlx::query_as::<_, ChurchEvent>(
        "UPDATE events SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("ChurchEvent not found"))?;
    Ok(Json(row))
}

#[derive(serde::Deserialize)]
pub struct ReorderRequest {
    pub sort_order: i32,
}

pub async fn reorder(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<ReorderRequest>,
) -> Result<Json<ChurchEvent>, AppError> {
    let row = sqlx::query_as::<_, ChurchEvent>(
        "UPDATE events SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("ChurchEvent not found"))?;
    Ok(Json(row))
}
