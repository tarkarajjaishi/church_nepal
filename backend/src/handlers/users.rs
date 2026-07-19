use crate::tenant::Db;
use axum::extract::{Path, State};
use axum::Json;
use bcrypt::{hash, DEFAULT_COST};
use sqlx::PgPool;

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{UpdateUser, UserPublic};

pub async fn list(
    _auth: AuthUser,
    Db(pool): Db,
) -> Result<Json<Vec<UserPublic>>, AppError> {
    let users = sqlx::query_as::<_, UserPublic>(
        r#"SELECT id, email, name, role FROM users ORDER BY created_at DESC"#,
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(users))
}

pub async fn get(
    _auth: AuthUser,
    Path(id): Path<uuid::Uuid>,
    Db(pool): Db,
) -> Result<Json<UserPublic>, AppError> {
    let user = sqlx::query_as::<_, UserPublic>(
        r#"SELECT id, email, name, role FROM users WHERE id = $1"#,
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("User not found"))?;

    Ok(Json(user))
}

pub async fn update(
    _auth: AuthUser,
    Path(id): Path<uuid::Uuid>,
    Db(pool): Db,
    Json(input): Json<UpdateUser>,
) -> Result<Json<UserPublic>, AppError> {
    // Fetch existing user to preserve non-updated fields
    let existing = sqlx::query_as::<_, UserPublic>(
        r#"SELECT id, email, name, role FROM users WHERE id = $1"#,
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("User not found"))?;

    let name = input.name.unwrap_or(existing.name);
    let role = input.role.unwrap_or(existing.role);
    let password_hash = if let Some(password) = input.password {
        if password.is_empty() {
            None
        } else {
            Some(hash(&password, DEFAULT_COST)?)
        }
    } else {
        None
    };

    let user = if let Some(h) = password_hash {
        sqlx::query_as::<_, UserPublic>(
            r#"UPDATE users SET name = $2, role = $3, password_hash = $4, updated_at = NOW()
               WHERE id = $1
               RETURNING id, email, name, role"#,
        )
        .bind(id)
        .bind(&name)
        .bind(&role)
        .bind(&h)
        .fetch_optional(&pool)
        .await?
    } else {
        sqlx::query_as::<_, UserPublic>(
            r#"UPDATE users SET name = $2, role = $3, updated_at = NOW()
               WHERE id = $1
               RETURNING id, email, name, role"#,
        )
        .bind(id)
        .bind(&name)
        .bind(&role)
        .fetch_optional(&pool)
        .await?
    };

    user.ok_or_else(|| AppError::not_found("User not found")).map(Json)
}

pub async fn delete(
    _auth: AuthUser,
    Path(id): Path<uuid::Uuid>,
    Db(pool): Db,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::not_found("User not found"));
    }

    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<crate::models::CreateUser>,
) -> Result<Json<UserPublic>, AppError> {
    // Check if email already exists
    let existing: Option<uuid::Uuid> = sqlx::query_scalar("SELECT id FROM users WHERE email = $1")
        .bind(&input.email)
        .fetch_optional(&pool)
        .await?;
    if existing.is_some() {
        return Err(AppError::bad_request("Email already registered"));
    }

    let password_hash = hash(&input.password, DEFAULT_COST)?;

    // Admin-gated endpoint: honor the requested role, defaulting to 'admin'
    // (this is the church admin-user creation path). Set explicitly rather than
    // relying on the DB column default.
    let role = input.role.clone().unwrap_or_else(|| "admin".to_string());

    let user = sqlx::query_as::<_, UserPublic>(
        r#"INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role"#,
    )
    .bind(&input.email)
    .bind(&password_hash)
    .bind(&input.name)
    .bind(&role)
    .fetch_one(&pool)
    .await?;

    Ok(Json(user))
}
