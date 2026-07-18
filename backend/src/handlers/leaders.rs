use crate::tenant::Db;
use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateLeader, Leader, UpdateLeader};

pub async fn list(Db(pool): Db) -> Result<Json<Vec<Leader>>, AppError> {
    let rows = sqlx::query_as::<_, Leader>("SELECT * FROM leaders ORDER BY created_at DESC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<Leader>, AppError> {
    let row = sqlx::query_as::<_, Leader>("SELECT * FROM leaders WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Leader not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, Db(pool): Db, Json(input): Json<CreateLeader>) -> Result<Json<Leader>, AppError> {
    let row = sqlx::query_as::<_, Leader>(
        "INSERT INTO leaders (name, role, category, image, bio) VALUES ($1,$2,$3,$4,$5) RETURNING *"
    )
    .bind(&input.name).bind(&input.role).bind(&input.category)
    .bind(&input.image).bind(&input.bio)
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateLeader>) -> Result<Json<Leader>, AppError> {
    let existing = sqlx::query_as::<_, Leader>("SELECT * FROM leaders WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Leader not found"))?;
    let row = sqlx::query_as::<_, Leader>(
        "UPDATE leaders SET name=COALESCE($2,name), role=COALESCE($3,role), category=COALESCE($4,category), image=COALESCE($5,image), bio=COALESCE($6,bio) WHERE id=$1 RETURNING *"
    )
    .bind(id)
    .bind(input.name.as_deref().unwrap_or(&existing.name))
    .bind(input.role.as_deref().unwrap_or(&existing.role))
    .bind(input.category.as_deref().unwrap_or(&existing.category))
    .bind(input.image.as_deref().unwrap_or(&existing.image))
    .bind(input.bio.as_deref().unwrap_or(&existing.bio))
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM leaders WHERE id = $1")
        .bind(id)
        .execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Leader>, AppError> {
    let row = sqlx::query_as::<_, Leader>(
        "UPDATE leaders SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Leader not found"))?;
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
) -> Result<Json<Leader>, AppError> {
    let row = sqlx::query_as::<_, Leader>(
        "UPDATE leaders SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Leader not found"))?;
    Ok(Json(row))
}
