use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateMinistry, Ministry, UpdateMinistry};

pub async fn list(State(pool): State<PgPool>) -> Result<Json<Vec<Ministry>>, AppError> {
    let rows = sqlx::query_as!(Ministry, "SELECT * FROM ministries ORDER BY created_at DESC").fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<Ministry>, AppError> {
    let row = sqlx::query_as!(Ministry, "SELECT * FROM ministries WHERE id = $1", id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Ministry not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, State(pool): State<PgPool>, Json(input): Json<CreateMinistry>) -> Result<Json<Ministry>, AppError> {
    let row = sqlx::query_as!(Ministry, r#"INSERT INTO ministries (name, name_ne, description, leader, meeting, image, icon) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *"#,
        input.name, input.name_ne, input.description, input.leader, input.meeting, input.image, input.icon).fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateMinistry>) -> Result<Json<Ministry>, AppError> {
    let existing = sqlx::query_as!(Ministry, "SELECT * FROM ministries WHERE id = $1", id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Ministry not found"))?;
    let row = sqlx::query_as!(Ministry, r#"UPDATE ministries SET name=COALESCE($2,name), name_ne=COALESCE($3,name_ne), description=COALESCE($4,description), leader=COALESCE($5,leader), meeting=COALESCE($6,meeting), image=COALESCE($7,image), icon=COALESCE($8,icon) WHERE id=$1 RETURNING *"#,
        id, input.name.as_deref().unwrap_or(&existing.name), input.name_ne.as_deref().unwrap_or(&existing.name_ne), input.description.as_deref().unwrap_or(&existing.description), input.leader.as_deref().unwrap_or(&existing.leader), input.meeting.as_deref().unwrap_or(&existing.meeting), input.image.as_deref().unwrap_or(&existing.image), input.icon.as_deref().unwrap_or(&existing.icon)).fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query!("DELETE FROM ministries WHERE id = $1", id).execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
