use crate::auth::{create_token, AuthUser};
use crate::error::AppError;
use crate::handlers::ValidatedJson;
use crate::models::{AuthResponse, CreateUser, LoginRequest, UserPublic};
use crate::security::xss;
use crate::tenant::Db;
use axum::http::header::HeaderMap;
use axum::http::StatusCode;
use axum::Json;
use bcrypt::{hash, verify, DEFAULT_COST};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

/// Issue a fresh token for the currently authenticated user.
pub async fn refresh(
    auth: AuthUser,
    Db(pool): Db,
) -> Result<impl axum::response::IntoResponse, AppError> {
    let user = sqlx::query_as::<_, crate::models::User>(
        r#"SELECT id, email, password_hash, name, role, created_at, updated_at FROM users WHERE id = $1"#,
    )
    .bind(auth.user_id.parse::<uuid::Uuid>()?)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("User not found"))?;

    let updated_at = user.updated_at.and_utc().timestamp() as usize;
    let new_jti = Uuid::new_v4().to_string();
    let token = create_token(&user.id.to_string(), &user.email, &user.role, &new_jti, updated_at)?;

    let public = UserPublic {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    };

    let body = AuthResponse {
        token: token.clone(),
        user: public,
    };
    let mut response = Json(body).into_response();
    set_auth_cookie(response.headers_mut(), &token);
    Ok(response)
}
    let cookie_name = std::env::var("SESSION_COOKIE_NAME")
        .unwrap_or_else(|_| "auth_token".into());

    let cookie = format!(
        "{}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict",
        cookie_name
    );
    headers.insert("Set-Cookie", cookie.parse().unwrap());
}

/// Create a user account.
#[allow(dead_code)]
pub async fn register(
    Db(pool): Db,
    Json(input): Json<CreateUser>,
) -> Result<impl axum::response::IntoResponse, AppError> {
    let existing: Option<uuid::Uuid> = sqlx::query_scalar("SELECT id FROM users WHERE email = $1")
        .bind(&input.email)
        .fetch_optional(&pool)
        .await?;
    if existing.is_some() {
        return Err(AppError::bad_request("Email already registered"));
    }

    let password_hash = hash(&input.password, DEFAULT_COST)?;

    let user = sqlx::query_as::<_, UserPublic>(
        r#"INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'member') RETURNING id, email, name, role"#,
    )
    .bind(&input.email)
    .bind(&password_hash)
    .bind(&input.name)
    .fetch_one(&pool)
    .await?;

    let jwt_user_id = user.id.to_string();
    let jti = Uuid::new_v4().to_string();
    let token = create_token(&jwt_user_id, &user.email, &user.role, &jti, 0)?;

    let public = UserPublic {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    };

    let body = AuthResponse {
        token: token.clone(),
        user: public,
    };
    let mut response = Json(body).into_response();
    set_auth_cookie(response.headers_mut(), &token);
    Ok(response)
}

pub async fn login(
    Db(pool): Db,
    Json(input): Json<LoginRequest>,
) -> Result<impl axum::response::IntoResponse, AppError> {
    let user = sqlx::query_as::<_, crate::models::User>(
        r#"SELECT id, email, password_hash, name, role, created_at, updated_at FROM users WHERE email = $1"#,
    )
    .bind(&input.email)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::unauthorized("Invalid email or password"))?;

    let valid = verify(&input.password, &user.password_hash)?;
    if !valid {
        return Err(AppError::unauthorized("Invalid email or password"));
    }

    let updated_at = user.updated_at.and_utc().timestamp() as usize;
    let jti = Uuid::new_v4().to_string();
    let token = create_token(&user.id.to_string(), &user.email, &user.role, &jti, updated_at)?;

    let public = UserPublic {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    };

    let body = AuthResponse {
        token: token.clone(),
        user: public,
    };
    let mut response = Json(body).into_response();
    set_auth_cookie(response.headers_mut(), &token);
    Ok(response)
}

/// Issue a fresh token for the currently authenticated user.
pub async fn refresh(
    auth: AuthUser,
    Db(pool): Db,
) -> Result<impl axum::response::IntoResponse, AppError> {
    let user = sqlx::query_as::<_, crate::models::User>(
        r#"SELECT id, email, password_hash, name, role, created_at, updated_at FROM users WHERE id = $1"#,
    )
    .bind(auth.user_id.parse::<uuid::Uuid>()?)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("User not found"))?;

    let updated_at = user.updated_at.and_utc().timestamp() as usize;
    let new_jti = Uuid::new_v4().to_string();
    let token = create_token(&user.id.to_string(), &user.email, &user.role, &new_jti, updated_at)?;

    let public = UserPublic {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    };

    let body = AuthResponse {
        token: token.clone(),
        user: public,
    };
    let mut response = Json(body).into_response();
    set_auth_cookie(response.headers_mut(), &token);
    Ok(response)
}

#[derive(Debug, Deserialize)]
pub struct ResetPasswordRequest {
    pub email: String,
}

pub async fn reset_password(
    Json(input): Json<ResetPasswordRequest>,
    Db(pool): Db,
) -> Result<impl axum::response::IntoResponse, AppError> {
    let user = sqlx::query_as::<_, crate::models::User>(
        r#"SELECT id, password_hash, email, role FROM users WHERE email = $1"#,
    )
    .bind(&input.email)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("User not found"))?;

    let id = user.id;
    let email = user.email.clone();
    let role = user.role;

    let updated_at = chrono::Utc::now().timestamp() as usize;
    let new_jti = Uuid::new_v4().to_string();
    let new_token = create_token(&id.to_string(), &email, &role, &new_jti, updated_at)?;

    let body = serde_json::json!({ "success": true, "token": new_token });
    let mut response = Json(body).into_response();
    set_auth_cookie(response.headers_mut(), &new_token);
    Ok(response)
}

pub async fn me(
    auth: AuthUser,
    Db(pool): Db,
) -> Result<Json<UserPublic>, AppError> {
    let user = sqlx::query_as::<_, UserPublic>(
        "SELECT id, email, name, role FROM users WHERE id = $1",
    )
    .bind(auth.user_id.parse::<uuid::Uuid>()?)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| anyhow::anyhow!("User not found"))?;

    Ok(Json(user))
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateProfileRequest {
    #[validate(length(max = 100, message = "Name must not exceed 100 characters"))]
    pub name: Option<String>,
}

pub async fn update_me(
    auth: AuthUser,
    Db(pool): Db,
    ValidatedJson(input): ValidatedJson<UpdateProfileRequest>,
) -> Result<Json<UserPublic>, AppError> {
    let id = auth.user_id.parse::<uuid::Uuid>()?;
    let name = input.name.map(|s| xss::sanitize_plain(&s));
    let user = sqlx::query_as::<_, UserPublic>(
        r#"UPDATE users SET name = COALESCE($2, name), updated_at = NOW() WHERE id = $1
           RETURNING id, email, name, role"#,
    )
    .bind(id)
    .bind(name.as_deref())
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("User not found"))?;
    Ok(Json(user))
}

#[derive(Debug, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

pub async fn change_password(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<ChangePasswordRequest>,
) -> Result<impl axum::response::IntoResponse, AppError> {
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

    let updated_at = chrono::Utc::now().timestamp() as usize;
    let new_jti = Uuid::new_v4().to_string();
    let user_email = auth.email.clone();
    let user_role = auth.role.clone();
    let new_token =
        create_token(&auth.user_id, &user_email, &user_role, &new_jti, updated_at)?;

    let body = serde_json::json!({ "success": true });
    let mut response = Json(body).into_response();
    set_auth_cookie(response.headers_mut(), &new_token);
    Ok(response)
}

pub async fn logout(
    _auth: AuthUser,
    Db(_pool): Db,
) -> Result<impl axum::response::IntoResponse, AppError> {
    let body = serde_json::json!({ "success": true });
    let mut response = Json(body).into_response();
    clear_auth_cookie(response.headers_mut());
    Ok(response)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::auth::{decode, Claims, DecodingKey, Validation};
    use std::env;

    #[test]
    fn test_create_token() {
        env::set_var("JWT_SECRET", "test_secret");
        let token = create_token("user1", "user@example.com", "user", "jti-1", 0)
            .expect("Failed to create token");
        assert!(!token.is_empty());
    }

    #[test]
    fn test_create_token_roundtrip_claims() {
        env::set_var("JWT_SECRET", "test_secret");
        let token =
            create_token("user42", "user@example.com", "user", "jti-42", 0).expect("Failed to create token");
        let key = DecodingKey::from_secret("test_secret".as_bytes());
        let data = decode::<Claims>(&token, &key, &Validation::default())
            .expect("Token should be valid");
        assert_eq!(data.claims.sub, "user42");
        assert_eq!(data.claims.email, "user@example.com");
        assert_eq!(data.claims.role, "user");
        assert_eq!(data.claims.jti, "jti-42");
        assert_eq!(data.claims.pwd_changed_at, 0);
    }

    #[test]
    fn test_create_token_invalid_secret_fails_decode() {
        env::set_var("JWT_SECRET", "test_secret");
        let token =
            create_token("user1", "user@example.com", "user", "jti-1", 0).expect("Failed to create token");
        let key = DecodingKey::from_secret("wrong_secret".as_bytes());
        let result = decode::<Claims>(&token, &key, &Validation::default());
        assert!(result.is_err());
    }

    #[test]
    fn test_auth_user_require_admin_allows_admin() {
        let admin_user = AuthUser {
            user_id: "1".into(),
            email: "admin@example.com".into(),
            role: "admin".into(),
        };
        assert_eq!(admin_user.require_admin(), Ok(()));
    }

    #[test]
    fn test_auth_user_require_admin_forbids_non_admin() {
        let non_admin = AuthUser {
            user_id: "2".into(),
            email: "user@example.com".into(),
            role: "user".into(),
        };
        assert_eq!(non_admin.require_admin(), Err(StatusCode::FORBIDDEN));
    }

    #[test]
    fn test_auth_user_require_admin_forbids_empty_role() {
        let no_role = AuthUser {
            user_id: "3".into(),
            email: "guest@example.com".into(),
            role: "".into(),
        };
        assert_eq!(no_role.require_admin(), Err(StatusCode::FORBIDDEN));
    }

    #[test]
    fn test_auth_user_require_member_allows_member() {
        let member_user = AuthUser {
            user_id: "4".into(),
            email: "member@example.com".into(),
            role: "member".into(),
        };
        assert_eq!(member_user.require_member(), Ok(()));
    }

    #[test]
    fn test_auth_user_require_member_forbids_admin() {
        let admin_user = AuthUser {
            user_id: "1".into(),
            email: "admin@example.com".into(),
            role: "admin".into(),
        };
        assert_eq!(admin_user.require_member(), Err(StatusCode::FORBIDDEN));
    }

    #[test]
    fn test_auth_user_require_member_forbids_empty_role() {
        let no_role = AuthUser {
            user_id: "5".into(),
            email: "guest@example.com".into(),
            role: "".into(),
        };
        assert_eq!(no_role.require_member(), Err(StatusCode::FORBIDDEN));
    }
}
