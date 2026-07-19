use crate::tenant::Db;
use axum::Json;
use bcrypt::{hash, verify, DEFAULT_COST};

use crate::auth::{create_token, AuthUser};
use crate::error::AppError;
use crate::models::{AuthResponse, CreateUser, LoginRequest, UserPublic};

/// Create a user account. NOTE: this is intentionally NOT exposed as a public
/// route — the church admin is provisioned by the control plane and additional
/// admins are created via the admin-only `POST /users` endpoint. This handler
/// hard-codes a non-privileged role so it can never mint an admin, even if it
/// is ever re-wired behind a guard for member self-signup.
#[allow(dead_code)]
pub async fn register(
    Db(pool): Db,
    Json(input): Json<CreateUser>,
) -> Result<Json<AuthResponse>, AppError> {
    let existing: Option<uuid::Uuid> = sqlx::query_scalar("SELECT id FROM users WHERE email = $1")
        .bind(&input.email)
        .fetch_optional(&pool)
        .await?;
    if existing.is_some() {
        return Err(AppError::bad_request("Email already registered"));
    }

    let password_hash = hash(&input.password, DEFAULT_COST)?;

    // Force a non-privileged role. The `users.role` column defaults to 'admin',
    // so we MUST set it explicitly here to avoid privilege escalation.
    let user = sqlx::query_as::<_, UserPublic>(
        r#"INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'member') RETURNING id, email, name, role"#,
    )
    .bind(&input.email)
    .bind(&password_hash)
    .bind(&input.name)
    .fetch_one(&pool)
    .await?;

    let token = create_token(&user.id.to_string(), &user.email, &user.role)?;

    Ok(Json(AuthResponse { token, user }))
}

pub async fn login(
    Db(pool): Db,
    Json(input): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let user = sqlx::query_as::<_, crate::models::User>(
        r#"SELECT id, email, password_hash, name, role, created_at FROM users WHERE email = $1"#,
    )
    .bind(&input.email)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::unauthorized("Invalid email or password"))?;

    let valid = verify(&input.password, &user.password_hash)?;
    if !valid {
        return Err(AppError::unauthorized("Invalid email or password"));
    }

    let token = create_token(&user.id.to_string(), &user.email, &user.role)?;

    let public = UserPublic {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    };

    Ok(Json(AuthResponse { token, user: public }))
}

/// Issue a fresh 24h token for the currently authenticated user.
pub async fn refresh(
    auth: AuthUser,
    Db(pool): Db,
) -> Result<Json<AuthResponse>, AppError> {
    let user = sqlx::query_as::<_, crate::models::User>(
        r#"SELECT id, email, password_hash, name, role, created_at FROM users WHERE id = $1"#,
    )
    .bind(auth.user_id.parse::<uuid::Uuid>()?)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("User not found"))?;

    let token = create_token(&user.id.to_string(), &user.email, &user.role)?;

    let public = UserPublic {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    };

    Ok(Json(AuthResponse { token, user: public }))
}

pub async fn me(
    auth: AuthUser,
    Db(pool): Db,
) -> Result<Json<UserPublic>, AppError> {
    let user = sqlx::query_as::<_, UserPublic>(
        r#"SELECT id, email, name, role FROM users WHERE id = $1"#,
    )
    .bind(auth.user_id.parse::<uuid::Uuid>()?)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| anyhow::anyhow!("User not found"))?;

    Ok(Json(user))
}

#[derive(serde::Deserialize)]
pub struct UpdateProfileRequest {
    pub name: Option<String>,
}

pub async fn update_me(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpdateProfileRequest>,
) -> Result<Json<UserPublic>, AppError> {
    let id = auth.user_id.parse::<uuid::Uuid>()?;
    let user = sqlx::query_as::<_, UserPublic>(
        r#"UPDATE users SET name = COALESCE($2, name), updated_at = NOW() WHERE id = $1
           RETURNING id, email, name, role"#,
    )
    .bind(id)
    .bind(input.name.as_deref())
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("User not found"))?;
    Ok(Json(user))
}

#[derive(serde::Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

pub async fn change_password(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<ChangePasswordRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let id = auth.user_id.parse::<uuid::Uuid>()?;

    let current_hash: Option<String> = sqlx::query_scalar(
        "SELECT password_hash FROM users WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?;

    let current_hash = current_hash.ok_or_else(|| AppError::not_found("User not found"))?;

    let valid = verify(&input.current_password, &current_hash)
        .map_err(|_| AppError::internal("Password check failed"))?;
    if !valid {
        return Err(AppError::bad_request("Current password is incorrect"));
    }
    if input.new_password.len() < 6 {
        return Err(AppError::bad_request("New password must be at least 6 characters"));
    }

    let new_hash = hash(&input.new_password, DEFAULT_COST)
        .map_err(|_| AppError::internal("Failed to hash password"))?;

    sqlx::query("UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1")
        .bind(id)
        .bind(&new_hash)
        .execute(&pool)
        .await?;

    Ok(Json(serde_json::json!({ "success": true })))
}
