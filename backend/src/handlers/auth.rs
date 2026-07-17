use axum::extract::State;
use axum::Json;
use bcrypt::{hash, verify, DEFAULT_COST};
use sqlx::PgPool;

use crate::auth::{create_token, AuthUser};
use crate::error::AppError;
use crate::models::{AuthResponse, CreateUser, LoginRequest, UserPublic};

pub async fn register(
    State(pool): State<PgPool>,
    Json(input): Json<CreateUser>,
) -> Result<Json<AuthResponse>, AppError> {
    // Check if email already exists
    let existing: Option<uuid::Uuid> = sqlx::query_scalar("SELECT id FROM users WHERE email = $1")
        .bind(&input.email)
        .fetch_optional(&pool)
        .await?;
    if existing.is_some() {
        return Err(AppError::bad_request("Email already registered"));
    }

    let password_hash = hash(&input.password, DEFAULT_COST)?;

    let user = sqlx::query_as::<_, UserPublic>(
        r#"INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, role"#,
    )
    .bind(&input.email)
    .bind(&password_hash)
    .bind(&input.name)
    .fetch_one(&pool)
    .await?;

    let token = create_token(&user.id.to_string(), &user.email)?;

    Ok(Json(AuthResponse { token, user }))
}

pub async fn login(
    State(pool): State<PgPool>,
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

    let token = create_token(&user.id.to_string(), &user.email)?;

    let public = UserPublic {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    };

    Ok(Json(AuthResponse {
        token,
        user: public,
    }))
}

pub async fn me(
    auth: AuthUser,
    State(pool): State<PgPool>,
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
