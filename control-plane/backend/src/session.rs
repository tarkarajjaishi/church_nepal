use chrono::{Utc, Duration};
use sqlx::{PgPool, Postgres};
use uuid::Uuid;

pub async fn create_session(
    pool: &PgPool,
    admin_id: Uuid,
    user_agent: Option<String>,
    ip_address: Option<String>,
) -> Result<(Uuid, String), sqlx::Error> {
    let token = Uuid::new_v4().to_string();
    let expires_at = Utc::now() + Duration::days(30); // absolute timeout 30 days
    let id = sqlx::query_scalar!(
        r#"
        INSERT INTO sessions (admin_id, token, expires_at, last_used_at, user_agent, ip_address)
        VALUES ($1, $2, $3, NOW(), $4, $5)
        RETURNING id
        "#,
        admin_id,
        &token,
        expires_at,
        user_agent,
        ip_address
    )
    .fetch_one(pool)
    .await?;

    Ok((id, token))
}

pub async fn validate_session(
    pool: &PgPool,
    token: &str,
) -> Result<(Uuid, String, String), sqlx::Error> {
    // Fetch session with admin details
    let row = sqlx::query_as!(
        (Uuid, String, String),
        r#"
        SELECT s.admin_id, a.email, a.role
        FROM sessions s
        JOIN admins a ON s.admin_id = a.id
        WHERE s.token = $1
          AND s.expires_at > NOW()
          AND s.last_used_at + INTERVAL '30 minutes' > NOW()
        "#,
        token
    )
    .fetch_optional(pool)
    .await?;

    match row {
        Some((admin_id, email, role)) => {
            // Update last_used_at (we can do it asynchronously to not block response)
            let _ = sqlx::query!(
                "UPDATE sessions SET last_used_at = NOW() WHERE token = $1",
                token
            )
            .execute(pool)
            .await;
            Ok((admin_id, email, role))
        }
        None => Err(sqlx::Error::RowNotFound),
    }
}

pub async fn invalidate_session(pool: &PgPool, token: &str) -> Result<(), sqlx::Error> {
    sqlx::query!("DELETE FROM sessions WHERE token = $1", token)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn invalidate_sessions_for_admin(pool: &PgPool, admin_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query!("DELETE FROM sessions WHERE admin_id = $1", admin_id)
        .execute(pool)
        .await?;
    Ok(())
}
