use crate::tenant::Db;
use axum::extract::Path;
use axum::Json;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::broadcast::{Broadcast, CreateBroadcast};

pub async fn list(
    _auth: AuthUser,
    Db(pool): Db,
) -> Result<Json<Vec<Broadcast>>, AppError> {
    let rows = sqlx::query_as::<_, Broadcast>(
        "SELECT * FROM broadcasts ORDER BY created_at DESC",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn get(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Broadcast>, AppError> {
    let row = sqlx::query_as::<_, Broadcast>(
        "SELECT * FROM broadcasts WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Broadcast not found"))?;
    Ok(Json(row))
}

pub async fn create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CreateBroadcast>,
) -> Result<Json<Broadcast>, AppError> {
    let row = sqlx::query_as::<_, Broadcast>(
        r#"INSERT INTO broadcasts (subject, body, broadcast_type, recipient_group)
           VALUES ($1, $2, $3, $4) RETURNING *"#,
    )
    .bind(&input.subject)
    .bind(&input.body)
    .bind(input.broadcast_type.as_deref().unwrap_or("email"))
    .bind(input.recipient_group.as_deref().unwrap_or("all"))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM broadcasts WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn send(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let broadcast = sqlx::query_as::<_, Broadcast>(
        "SELECT * FROM broadcasts WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Broadcast not found"))?;

    if broadcast.status == "sent" {
        return Err(AppError::bad_request("Broadcast already sent"));
    }

    let subscribers = sqlx::query_as::<_, (String,)>(
        "SELECT email FROM newsletter_subscribers WHERE active = true",
    )
    .fetch_all(&pool)
    .await?;

    let count = subscribers.len() as i32;

    for (email,) in &subscribers {
        sqlx::query(
            "INSERT INTO broadcast_recipients (broadcast_id, recipient_email, status) VALUES ($1, $2, 'sent')",
        )
        .bind(id)
        .bind(email)
        .execute(&pool)
        .await?;
    }

    sqlx::query(
        "UPDATE broadcasts SET status = 'sent', recipient_count = $2, sent_at = NOW(), updated_at = NOW() WHERE id = $1",
    )
    .bind(id)
    .bind(count)
    .execute(&pool)
    .await?;

    Ok(Json(serde_json::json!({
        "sent": true,
        "recipient_count": count,
    })))
}
