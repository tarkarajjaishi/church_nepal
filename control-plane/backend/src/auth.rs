use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use axum::http::StatusCode;
use bcrypt;
use crate::error::AppError;
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sqlx;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub role: String,
    pub exp: usize,
}

#[derive(Debug)]
pub struct AdminUser {
    pub id: String,
    pub email: String,
    pub role: String,
}

impl<S> FromRequestParts<S> for AdminUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let token = parts
            .headers
            .get("authorization")
            .and_then(|v| v.to_str().ok())
            .and_then(|h| h.strip_prefix("Bearer "))
            .ok_or_else(|| AppError::unauthorized("Missing or invalid authorization header"))?;

        let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "change_me_control_secret".into());
        let data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|_| AppError::unauthorized("Invalid or expired token"))?;

        Ok(AdminUser {
            id: data.claims.sub,
            email: data.claims.email,
            role: data.claims.role,
        })
    }
}

#[derive(Debug)]
pub struct Authenticated(pub AdminUser);

impl<S> FromRequestParts<S> for Authenticated
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let user = AdminUser::from_request_parts(parts, state).await?;
        Ok(Authenticated(user))
    }
}

#[derive(Debug)]
pub struct AdminGuard(pub AdminUser);

impl<S> FromRequestParts<S> for AdminGuard
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let user = AdminUser::from_request_parts(parts, state).await?;
        match user.role.as_str() {
            "admin" | "super_admin" => Ok(AdminGuard(user)),
            _ => Err(AppError::new(StatusCode::FORBIDDEN, "Forbidden")),
        }
    }
}

#[derive(Debug)]
pub struct SuperAdmin {
    pub id: String,
    pub email: String,
}

impl<S> FromRequestParts<S> for SuperAdmin
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let user = AdminUser::from_request_parts(parts, _state).await?;
        match user.role.as_str() {
            "super_admin" => Ok(SuperAdmin { id: user.id, email: user.email }),
            _ => Err(AppError::new(StatusCode::FORBIDDEN, "Forbidden")),
        }
    }
}

#[derive(Debug, Clone)]
pub struct ApiKey {
    pub id: Uuid,
    pub name: String,
    pub scopes: Vec<String>,
}

impl<S> FromRequestParts<S> for ApiKey
where
    S: Send + Sync + 'static,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let api_key = parts
            .headers
            .get("x-api-key")
            .and_then(|v| v.to_str().ok())
            .ok_or_else(|| AppError::unauthorized("Missing x-api-key header"))?;

        let st = state
            .downcast_ref::<crate::AppState>()
            .ok_or_else(|| AppError::internal("State type mismatch"))?;

        let rows: Vec<(Uuid, String, String, Vec<String>)> =
            sqlx::query_as("SELECT id, name, key_hash, scopes FROM api_keys WHERE prefix = LEFT($1, 12) AND revoked_at IS NULL")
                .bind(api_key)
                .fetch_all(&st.pool)
                .await?;

        let api_key_str = api_key.to_string();
        for (id, name, key_hash, scopes) in rows {
            if bcrypt::verify(&api_key_str, &key_hash).unwrap_or(false) {
                return Ok(Self { id, name, scopes });
            }
        }

        Err(AppError::unauthorized("Invalid API key"))
    }
}

pub fn create_access_token(user_id: &str, email: &str, role: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "change_me_control_secret".into());
    let exp = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::minutes(15))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user_id.to_string(),
        email: email.to_string(),
        role: role.to_string(),
        exp,
    };
    encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_bytes()))
}

pub fn create_refresh_token() -> String {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

pub async fn store_refresh_token(pool: &sqlx::PgPool, admin_id: &str, token: &str) -> Result<uuid::Uuid, AppError> {
    let token_hash = bcrypt::hash(token, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::internal(format!("hash refresh token: {e}")))?;
    let admin_uuid = uuid::Uuid::parse_str(admin_id).map_err(|e| AppError::internal(format!("parse admin id: {e}")))?;
    let expires_at = chrono::Utc::now() + chrono::Duration::days(30);

    let id: uuid::Uuid = sqlx::query_scalar(
        "INSERT INTO refresh_tokens (admin_id, token_hash, expires_at, revoked) VALUES ($1, $2, $3, false) RETURNING id"
    )
    .bind(admin_uuid)
    .bind(&token_hash)
    .bind(expires_at)
    .fetch_one(pool)
    .await?;

    Ok(id)
}

pub async fn find_refresh_token(pool: &sqlx::PgPool, token_hash: &str) -> Result<Option<(uuid::Uuid, uuid::Uuid, chrono::DateTime<chrono::Utc>, bool)>, AppError> {
    let row: Option<(uuid::Uuid, uuid::Uuid, chrono::DateTime<chrono::Utc>, bool)> =
        sqlx::query_as("SELECT id, admin_id, expires_at, revoked FROM refresh_tokens WHERE token_hash = $1")
            .bind(token_hash)
            .fetch_optional(pool)
            .await?;
    Ok(row)
}

pub async fn revoke_refresh_token(pool: &sqlx::PgPool, token_hash: &str) -> Result<(), AppError> {
    let result = sqlx::query("UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1 AND revoked = false")
        .bind(token_hash)
        .execute(pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::not_found("Refresh token not found"));
    }

    Ok(())
}

pub async fn revoke_all_refresh_tokens(pool: &sqlx::PgPool, admin_id: uuid::Uuid) -> Result<(), AppError> {
    sqlx::query("UPDATE refresh_tokens SET revoked = true WHERE admin_id = $1 AND revoked = false")
        .bind(admin_id)
        .execute(pool)
        .await?;
    Ok(())
}
