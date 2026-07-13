use axum::extract::{Path, State};
use axum::Json;
use bcrypt::{hash, DEFAULT_COST};
use sqlx::PgPool;

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{UpdateUser, UserPublic};

pub async fn list(
    _auth: AuthUser,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<UserPublic>>, AppError> {
    let users = sqlx::query_as!(
        UserPublic,
        r#"SELECT id, email, name, role FROM users ORDER BY created_at DESC"#
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(users))
}

pub async fn get(
    _auth: AuthUser,
    Path(id): Path<uuid::Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<UserPublic>, AppError> {
    let user = sqlx::query_as!(
        UserPublic,
        r#"SELECT id, email, name, role FROM users WHERE id = $1"#,
        id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("User not found"))?;

    Ok(Json(user))
}

pub async fn update(
    _auth: AuthUser,
    Path(id): Path<uuid::Uuid>,
    State(pool): State<PgPool>,
    Json(input): Json<UpdateUser>,
) -> Result<Json<UserPublic>, AppError> {
    // Check if user exists
    let existing = sqlx::query_scalar!("SELECT id FROM users WHERE id = $1", id)
        .fetch_optional(&pool)
        .await?;
    if existing.is_none() {
        return Err(AppError::not_found("User not found"));
    }

    // Build update query dynamically
    let name = input.name.unwrap_or_default();
    let role = input.role.unwrap_or_default();
    let password_hash = if let Some(password) = input.password {
        if password.is_empty() {
            None
        } else {
            Some(hash(&password, DEFAULT_COST)?)
        }
    } else {
        None
    };

    let user = if let Some(hash) = password_hash {
        sqlx::query_as!(
            UserPublic,
            r#"UPDATE users SET name = NULLIF($2, ''), role = NULLIF($3, ''), password_hash = $4, updated_at = NOW()
               WHERE id = $1
               RETURNING id, email, name, role"#,
            id,
            name,
            role,
            hash
        )
        .fetch_optional(&pool)
        .await?
    } else {
        sqlx::query_as!(
            UserPublic,
            r#"UPDATE users SET name = NULLIF($2, ''), role = NULLIF($3, ''), updated_at = NOW()
               WHERE id = $1
               RETURNING id, email, name, role"#,
            id,
            name,
            role
        )
        .fetch_optional(&pool)
        .await?
    };

    user.ok_or_else(|| AppError::not_found("User not found")).map(Json)
}

pub async fn delete(
    _auth: AuthUser,
    Path(id): Path<uuid::Uuid>,
    State(pool): State<PgPool>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query!("DELETE FROM users WHERE id = $1", id)
        .execute(&pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::not_found("User not found"));
    }

    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn create(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Json(input): Json<crate::models::CreateUser>,
) -> Result<Json<UserPublic>, AppError> {
    // Check if email already exists
    let existing = sqlx::query_scalar!("SELECT id FROM users WHERE email = $1", input.email)
        .fetch_optional(&pool)
        .await?;
    if existing.is_some() {
        return Err(AppError::bad_request("Email already registered"));
    }

    let password_hash = hash(&input.password, DEFAULT_COST)?;

    let user = sqlx::query_as!(
        UserPublic,
        r#"INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, role"#,
        input.email,
        password_hash,
        input.name
    )
    .fetch_one(&pool)
    .await?;

    Ok(Json(user))
}
