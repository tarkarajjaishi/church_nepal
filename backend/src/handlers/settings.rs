use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{Setting, UpdateSetting};

pub async fn list(State(pool): State<PgPool>) -> Result<Json<Vec<Setting>>, AppError> {
    let rows = sqlx::query_as!(Setting, "SELECT * FROM settings ORDER BY key ASC").fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(State(pool): State<PgPool>, Path(key): Path<String>) -> Result<Json<Setting>, AppError> {
    let row = sqlx::query_as!(Setting, "SELECT * FROM settings WHERE key = $1", key).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Setting not found"))?;
    Ok(Json(row))
}

pub async fn upsert(_auth: AuthUser, State(pool): State<PgPool>, Path(key): Path<String>, Json(input): Json<UpdateSetting>) -> Result<Json<Setting>, AppError> {
    let row = sqlx::query_as!(Setting, r#"INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW() RETURNING *"#,
        key, input.value).fetch_one(&pool).await?;
    Ok(Json(row))
}
