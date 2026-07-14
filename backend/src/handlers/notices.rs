use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateNotice, Notice, UpdateNotice};

pub async fn list(State(pool): State<PgPool>) -> Result<Json<Vec<Notice>>, AppError> {
    let rows = sqlx::query_as!(Notice, "SELECT * FROM notices ORDER BY created_at DESC").fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<Notice>, AppError> {
    let row = sqlx::query_as!(Notice, "SELECT * FROM notices WHERE id = $1", id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Notice not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, State(pool): State<PgPool>, Json(input): Json<CreateNotice>) -> Result<Json<Notice>, AppError> {
    let urgent = input.urgent.unwrap_or(false);
    let row = sqlx::query_as!(Notice, r#"INSERT INTO notices (title, date, category, text, urgent) VALUES ($1,$2,$3,$4,$5) RETURNING *"#,
        input.title, input.date, input.category, input.text, urgent).fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateNotice>) -> Result<Json<Notice>, AppError> {
    let existing = sqlx::query_as!(Notice, "SELECT * FROM notices WHERE id = $1", id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Notice not found"))?;
    let row = sqlx::query_as!(Notice, r#"UPDATE notices SET title=COALESCE($2,title), date=COALESCE($3,date), category=COALESCE($4,category), text=COALESCE($5,text), urgent=COALESCE($6,urgent) WHERE id=$1 RETURNING *"#,
        id, input.title.as_deref().unwrap_or(&existing.title), input.date.as_deref().unwrap_or(&existing.date), input.category.as_deref().unwrap_or(&existing.category), input.text.as_deref().unwrap_or(&existing.text), input.urgent.unwrap_or(existing.urgent)).fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query!("DELETE FROM notices WHERE id = $1", id).execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
pub async fn toggle(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Notice>, AppError> {
    let row = sqlx::query_as::<_, Notice>(
        "UPDATE notices SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Notice not found"))?;
    Ok(Json(row))
}

#[derive(serde::Deserialize)]
pub struct ReorderRequest {
    pub sort_order: i32,
}

pub async fn reorder(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<ReorderRequest>,
) -> Result<Json<Notice>, AppError> {
    let row = sqlx::query_as::<_, Notice>(
        "UPDATE notices SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Notice not found"))?;
    Ok(Json(row))
}