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

pub fn control_cookie_value(token: &str, max_age_secs: u64, secure: bool) -> String {
    let mut cookie = format!(
        "cp_access_token={}; HttpOnly; Path=/api; Max-Age={}; SameSite=Strict",
        token, max_age_secs
    );
    if secure {
        cookie.push_str("; Secure");
    }
    cookie
}

pub fn control_clear_cookie(secure: bool) -> String {
    let mut cookie = format!(
        "cp_access_token=; HttpOnly; Path=/api; Max-Age=0; SameSite=Strict"
    );
    if secure {
        cookie.push_str("; Secure");
    }
    cookie
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub role: String,
    pub exp: usize,
    pub jti: String,
    pub iat: usize,
    pub last_active_at: usize,
    pub pwd_changed_at: usize,
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
            .get("cookie")
            .and_then(|v| v.to_str().ok())
            .and_then(|c| {
                c.split(';').find_map(|pair| {
                    let mut kv = pair.trim().splitn(2, '=');
                    match (kv.next(), kv.next()) {
                        (Some(k), Some(v)) if k == "cp_access_token" => Some(v),
                        _ => None,
                    }
                })
            })
            .or_else(|| {
                parts.headers
                    .get("authorization")
                    .and_then(|v| v.to_str().ok())
                    .and_then(|h| h.strip_prefix("Bearer "))
            })
            .ok_or_else(|| AppError::unauthorized("Missing or invalid authorization header"))?;

        let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "change_me_control_secret".into());
        let data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|_| AppError::unauthorized("Invalid or expired token"))?;

        let now = chrono::Utc::now().timestamp() as usize;
        let idle_timeout: u64 = std::env::var("SESSION_IDLE_TIMEOUT_SECS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(900);

        if now.saturating_sub(data.claims.last_active_at) > idle_timeout as usize {
            return Err(AppError::new(StatusCode::UNAUTHORIZED, "Session expired due to inactivity"));
        }

        // Verify absolute timeout (max age)
        let max_age_secs: u64 = std::env::var("SESSION_COOKIE_MAX_AGE")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(900);

        if now.saturating_sub(data.claims.iat) > max_age_secs as usize {
            return Err(AppError::new(StatusCode::UNAUTHORIZED, "Session expired (absolute timeout)"));
        }

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

pub fn create_access_token(user_id: &str, email: &str, role: &str, jti: &str, pwd_changed_at: usize) -> Result<String, jsonwebtoken::errors::Error> {
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "change_me_control_secret".into());
    let now = chrono::Utc::now().timestamp() as usize;
    let exp = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::minutes(15))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user_id.to_string(),
        email: email.to_string(),
        role: role.to_string(),
        exp,
        jti: jti.to_string(),
        iat: now,
        last_active_at: now,
        pwd_changed_at,
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_create_access_token() {
        // Set a predictable secret
        env::set_var("JWT_SECRET", "test_secret");
        let token = create_access_token("user1", "user@example.com", "admin", "jti-1", 0)
            .expect("Failed to create token");
        // Token should be a non-empty string
        assert!(!token.is_empty());
        // We can optionally decode and verify claims (not required for unit test)
    }

    #[test]
    fn test_create_refresh_token() {
        let token = create_refresh_token();
        // Refresh token is a hex string of 32 bytes => 64 chars
        assert_eq!(token.len(), 64);
        // All characters should be hex digits
        assert!(token.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[tokio::test]
    async fn test_store_and_find_refresh_token() {
        // Set up an in-memory SQLite database
        let pool = SqlitePoolOptions::new()
            .connect("sqlite::memory:")
            .await
            .expect("Failed to create in-memory DB");

        // Create the refresh_tokens table (matches the schema used in the function)
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id TEXT PRIMARY KEY,
                admin_id TEXT NOT NULL,
                token_hash TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                revoked BOOLEAN NOT NULL DEFAULT 0
            )
            "#,
        )
        .execute(&pool)
        .await
        .expect("Failed to create table");

        // Set bcrypt cost to a low value for testing (optional)
        // We'll just call the function; it will hash with default cost.
        let admin_id = "123e4567-e89b-12d3-a456-426614174000";
        let token = create_refresh_token();

        let id = store_refresh_token(&pool, admin_id, &token)
            .await
            .expect("Failed to store refresh token");
        // Ensure we got a UUID back
        assert_eq!(id.to_string().len(), 36);

        // Now fetch the token hash from the DB
        let token_hash = bcrypt::hash(&token, bcrypt::DEFAULT_COST)
            .expect("Failed to hash token");
        let found = find_refresh_token(&pool, &token_hash)
            .await
            .expect("Failed to find refresh token")
            .expect("Token should be found");

        // found is a tuple (id, admin_id, expires_at, revoked)
        assert_eq!(found.0.to_string(), id.to_string());
        assert_eq!(found.1.to_string(), admin_id);
        assert_eq!(found.3, false); // not revoked

        // Revoke the token
        revoke_refresh_token(&pool, &token_hash)
            .await
            .expect("Failed to revoke token");

        // Now fetching should return None
        let after_revoke = find_refresh_token(&pool, &token_hash)
            .await
            .expect("Failed to query after revoke");
        assert!(after_revoke.is_none(), "Token should be revoked");
    }

    #[tokio::test]
    async fn test_revoke_all_refresh_tokens() {
        let pool = SqlitePoolOptions::new()
            .connect("sqlite::memory:")
            .await
            .expect("Failed to create in-memory DB");

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id TEXT PRIMARY KEY,
                admin_id TEXT NOT NULL,
                token_hash TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                revoked BOOLEAN NOT NULL DEFAULT 0
            )
            "#,
        )
        .execute(&pool)
        .await
        .expect("Failed to create table");

        let admin_id = uuid::Uuid::new_v4();
        let token1 = create_refresh_token();
        let token2 = create_refresh_token();

        let hash1 = bcrypt::hash(&token1, bcrypt::DEFAULT_COST).unwrap();
        let hash2 = bcrypt::hash(&token2, bcrypt::DEFAULT_COST).unwrap();

        // Insert two tokens manually for simplicity
        sqlx::query(
            r#"
            INSERT INTO refresh_tokens (id, admin_id, token_hash, expires_at, revoked)
            VALUES (?, ?, ?, ?, 0)
            "#,
        )
        .bind(uuid::Uuid::new_v4().to_string())
        .bind(admin_id.to_string())
        .bind(&hash1)
        .bind(chrono::Utc::now().chrono::NaiveDateTime::and_utc().to_string())
        .execute(&pool)
        .await
        .expect("Failed to insert token1");

        sqlx::query(
            r#"
            INSERT INTO refresh_tokens (id, admin_id, token_hash, expires_at, revoked)
            VALUES (?, ?, ?, ?, 0)
            "#,
        )
        .bind(uuid::Uuid::new_v4().to_string())
        .bind(admin_id.to_string())
        .bind(&hash2)
        .bind(chrono::Utc::now().chrono::NaiveDateTime::and_utc().to_string())
        .execute(&pool)
        .await
        .expect("Failed to insert token2");

        // Revoke all
        revoke_all_refresh_tokens(&pool, admin_id)
            .await
            .expect("Failed to revoke all tokens");

        // Check both are revoked
        let row1: Option<(String, String, String, String, bool)> = sqlx::query_as(
            r#"SELECT id, admin_id, token_hash, expires_at, revoked FROM refresh_tokens WHERE token_hash = ?"#,
        )
        .bind(&hash1)
        .fetch_optional(&pool)
        .await
        .expect("Failed to query token1");
        assert!(row1.is_some());
        assert_eq!(row1.as_ref().unwrap().4, true);

        let row2: Option<(String, String, String, String, bool)> = sqlx::query_as(
            r#"SELECT id, admin_id, token_hash, expires_at, revoked FROM refresh_tokens WHERE token_hash = ?"#,
        )
        .bind(&hash2)
        .fetch_optional(&pool)
        .await
        .expect("Failed to query token2");
        assert!(row2.is_some());
        assert_eq!(row2.as_ref().unwrap().4, true);
    }
}

    use axum::http::header::HeaderMap;
    use axum::http::Request;
    use tower::ServiceExt;

    /// Helper to create a request with an Authorization header
    fn make_request(token: &str) -> http::request::Parts {
        let mut headers = HeaderMap::new();
        headers.insert(
            axum::http::header::AUTHORIZATION,
            axum::http::HeaderValue::from_str(&format!("Bearer {token}")).unwrap(),
        );
        let req = Request::builder().header(axom::http::header::CONTENT_TYPE, "application/json").body(()).unwrap();
        req.into_parts().0
    }

    #[tokio::test]
    async fn test_admin_guard_allows_admin_and_super_admin() {
        env::set_var("JWT_SECRET", "test_secret");
        let admin_token = create_access_token("admin1", "admin@example.com", "admin", "jti-admin1", 0).unwrap();
        let sa_token = create_access_token("sa1", "sa@example.com", "super_admin", "jti-sa1", 0).unwrap();

        let admin_parts = make_request(&admin_token);
        let sa_parts = make_request(&sa_token);
        let state = (); // dummy state

        // AdminGuard should succeed for admin
        let guard = AdminGuard::from_request_parts(admin_parts, &state)
            .await
            .expect("Admin should be allowed");
        assert_eq!(guard.0.role, "admin");

        // AdminGuard should succeed for super_admin
        let guard = AdminGuard::from_request_parts(sa_parts, &state)
            .await
            .expect("Super admin should be allowed");
        assert_eq!(guard.0.role, "super_admin");
    }

    #[tokio::test]
    async fn test_admin_guard_rejects_other_roles() {
        env::set_var("JWT_SECRET", "test_secret");
        let user_token = create_access_token("user1", "user@example.com", "user", "jti-user1", 0).unwrap();
        let parts = make_request(&user_token);
        let state = ();
        let err = AdminGuard::from_request_parts(parts, &state)
            .await
            .expect_err("Non-admin should be rejected");
        match err {
            AppError::Forbidden { .. } => {}
            e => panic!("Expected Forbidden error, got {:?}", e),
        }
    }

    #[tokio::test]
    async fn test_super_admin_only_super_admin() {
        env::set_var("JWT_SECRET", "test_secret");
        let admin_token = create_access_token("admin1", "admin@example.com", "admin", "jti-admin1", 0).unwrap();
        let sa_token = create_access_token("sa1", "sa@example.com", "super_admin", "jti-sa1", 0).unwrap();
        let user_token = create_access_token("user1", "user@example.com", "user").unwrap();

        let admin_parts = make_request(&admin_token);
        let sa_parts = make_request(&sa_token);
        let user_parts = make_request(&user_token);
        let state = ();

        // SuperAdmin::from_request_parts should reject admin
        let err = SuperAdmin::from_request_parts(admin_parts, &state)
            .await
            .expect_err("Admin should not be allowed as super admin");
        match err {
            AppError::Forbidden { .. } => {}
            e => panic!("Expected Forbidden error, got {:?}", e),
        };

        // Should accept super_admin
        let sa = SuperAdmin::from_request_parts(sa_parts, &state)
            .await
            .expect("Super admin should be allowed");
        assert_eq!(sa.id, "sa1");
        assert_eq!(sa.email, "sa@example.com");

        // Should reject regular user
        let err = SuperAdmin::from_request_parts(user_parts, &state)
            .await
            .expect_err("User should not be allowed as super admin");
        match err {
            AppError::Forbidden { .. } => {}
            e => panic!("Expected Forbidden error, got {:?}", e),
        };
    }
}
