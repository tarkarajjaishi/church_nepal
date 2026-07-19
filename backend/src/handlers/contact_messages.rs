use crate::tenant::Db;
use axum::extract::Path;
use axum::Json;
use uuid::Uuid;

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{ContactMessage, CreateContactMessage, UpdateContactMessage};

pub async fn create(
    Db(pool): Db,
    Json(input): Json<CreateContactMessage>,
) -> Result<Json<ContactMessage>, AppError> {
    let row = sqlx::query_as::<_, ContactMessage>(
        r#"INSERT INTO contact_messages
           (message_type, name, email, phone, message, category, anonymous, visit_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *"#,
    )
    .bind(input.message_type.unwrap_or_else(|| "contact".to_string()))
    .bind(input.name.unwrap_or_default())
    .bind(input.email.unwrap_or_default())
    .bind(input.phone.unwrap_or_default())
    .bind(input.message.unwrap_or_default())
    .bind(input.category.unwrap_or_default())
    .bind(input.anonymous.unwrap_or(false))
    .bind(input.visit_date.unwrap_or_default())
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn list(
    _auth: AuthUser,
    Db(pool): Db,
) -> Result<Json<Vec<ContactMessage>>, AppError> {
    let rows = sqlx::query_as::<_, ContactMessage>(
        "SELECT * FROM contact_messages ORDER BY created_at DESC",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn get(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<Uuid>,
) -> Result<Json<ContactMessage>, AppError> {
    let row = sqlx::query_as::<_, ContactMessage>(
        "SELECT * FROM contact_messages WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Message not found"))?;
    Ok(Json(row))
}

pub async fn update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<Uuid>,
    Json(input): Json<UpdateContactMessage>,
) -> Result<Json<ContactMessage>, AppError> {
    let row = sqlx::query_as::<_, ContactMessage>(
        r#"UPDATE contact_messages SET
           status = COALESCE($2, status),
           notes = COALESCE($3, notes),
           answered_at = $4
           WHERE id = $1
           RETURNING *"#,
    )
    .bind(id)
    .bind(input.status)
    .bind(input.notes)
    .bind(input.answered_at)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Message not found"))?;
    Ok(Json(row))
}

pub async fn mark_read(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<Uuid>,
) -> Result<Json<ContactMessage>, AppError> {
    let row = sqlx::query_as::<_, ContactMessage>(
        "UPDATE contact_messages SET status = 'read' WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Message not found"))?;
    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM contact_messages WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
