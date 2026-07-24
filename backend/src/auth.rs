use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use axum::http::StatusCode;
use chrono::{Utc, Duration};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

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
pub struct AuthUser {
    pub user_id: String,
    pub email: String,
    pub role: String,
}

impl AuthUser {
    pub fn require_admin(&self) -> Result<(), StatusCode> {
        if self.role == "admin" {
            Ok(())
        } else {
            Err(StatusCode::FORBIDDEN)
        }
    }

    pub fn require_member(&self) -> Result<(), StatusCode> {
        if self.role == "member" {
            Ok(())
        } else {
            Err(StatusCode::FORBIDDEN)
        }
    }
}

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let token = parts
            .headers
            .get("cookie")
            .and_then(|v| v.to_str().ok())
            .and_then(|c| {
                c.split(';').find_map(|pair| {
                    let mut kv = pair.trim().splitn(2, '=');
                    match (kv.next(), kv.next()) {
                        (Some(k), Some(v)) if k == "auth_token" => Some(v),
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
            .ok_or(StatusCode::UNAUTHORIZED)?;

        let secret = std::env::var("JWT_SECRET").map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

        // Verify idle timeout
        let now = Utc::now().timestamp() as usize;
        let idle_timeout: u64 = std::env::var("SESSION_IDLE_TIMEOUT_SECS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(900);

        if now.saturating_sub(token_data.claims.last_active_at) > idle_timeout as usize {
            return Err(StatusCode::UNAUTHORIZED);
        }

        // Verify absolute timeout
        let max_age_secs: u64 = std::env::var("SESSION_COOKIE_MAX_AGE")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(86400);

        if now.saturating_sub(token_data.claims.iat) > max_age_secs as usize {
            return Err(StatusCode::UNAUTHORIZED);
        }

        if let Some(pool) = parts.extensions.get::<sqlx::PgPool>() {
            if let Ok(updated_at) = sqlx::query_scalar::<_, chrono::NaiveDateTime>(
                "SELECT updated_at FROM users WHERE id = $1",
            )
            .bind(&token_data.claims.sub)
            .fetch_optional(pool)
            .await
            {
                if let Some(ts) = updated_at {
                    let updated_ts = ts.and_utc().timestamp() as usize;
                    if updated_ts > token_data.claims.pwd_changed_at {
                        return Err(StatusCode::UNAUTHORIZED);
                    }
                }
            }
        }

        Ok(AuthUser {
            user_id: token_data.claims.sub,
            email: token_data.claims.email,
            role: token_data.claims.role,
        })
    }
}

pub struct MemberGuard(pub AuthUser);

impl<S> FromRequestParts<S> for MemberGuard
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let auth = AuthUser::from_request_parts(parts, state).await?;
        auth.require_member()?;
        Ok(MemberGuard(auth))
    }
}

pub struct AdminGuard(pub AuthUser);

impl<S> FromRequestParts<S> for AdminGuard
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let auth = AuthUser::from_request_parts(parts, state).await?;
        auth.require_admin()?;
        Ok(AdminGuard(auth))
    }
}

pub fn create_token(
    user_id: &str,
    email: &str,
    role: &str,
    jti: &str,
    pwd_changed_at: usize,
) -> Result<String, jsonwebtoken::errors::Error> {
    let secret = std::env::var("JWT_SECRET").unwrap_or_default();
    let now = chrono::Utc::now().timestamp() as usize;
    let exp = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::hours(24))
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

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
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
