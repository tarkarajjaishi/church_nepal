use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateLeader, Leader, UpdateLeader};

pub async fn list(State(pool): State<PgPool>) -> Result<Json<Vec<Leader>>, AppError> {
    let rows = sqlx::query_as!(Leader, "SELECT * FROM leaders ORDER BY created_at DESC").fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<Leader>, AppError> {
    let row = sqlx::query_as!(Leader, "SELECT * FROM leaders WHERE id = $1", id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Leader not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, State(pool): State<PgPool>, Json(input): Json<CreateLeader>) -> Result<Json<Leader>, AppError> {
    let row = sqlx::query_as!(Leader, r#"INSERT INTO leaders (name, role, category, image, bio) VALUES ($1,$2,$3,$4,$5) RETURNING *"#,
        input.name, input.role, input.category, input.image, input.bio).fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateLeader>) -> Result<Json<Leader>, AppError> {
    let existing = sqlx::query_as!(Leader, "SELECT * FROM leaders WHERE id = $1", id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Leader not found"))?;
    let row = sqlx::query_as!(Leader, r#"UPDATE leaders SET name=COALESCE($2,name), role=COALESCE($3,role), category=COALESCE($4,category), image=COALESCE($5,image), bio=COALESCE($6,bio) WHERE id=$1 RETURNING *"#,
        id, input.name.as_deref().unwrap_or(&existing.name), input.role.as_deref().unwrap_or(&existing.role), input.category.as_deref().unwrap_or(&existing.category), input.image.as_deref().unwrap_or(&existing.image), input.bio.as_deref().unwrap_or(&existing.bio)).fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query!("DELETE FROM leaders WHERE id = $1", id).execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
