use crate::tenant::Db;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{ContactMessage, CreateContactMessage, UpdateContactMessage};
use crate::email;
use axum::extract::Path;
use axum::Json;
use uuid::Uuid;

pub async fn create(
    Db(pool): Db,
    Json(input): Json<CreateContactMessage>,
) -> Result<Json<ContactMessage>, AppError> {
    if let Some(ref hp) = input.honeypot {
        if !hp.trim().is_empty() {
            return Err(AppError::bad_request("Invalid submission"));
        }
    }

    let name = input.name.unwrap_or_default().trim().to_string();
    let email = input.email.unwrap_or_default().trim().to_string();
    let message = input.message.unwrap_or_default().trim().to_string();

    if name.is_empty() || email.is_empty() || message.is_empty() {
        return Err(AppError::bad_request("Name, email, and message are required"));
    }

    let row = sqlx::query_as::<_, ContactMessage>(
        r#"INSERT INTO contact_messages
           (message_type, name, email, phone, message, category, anonymous, visit_date, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new')
           RETURNING *"#,
    )
    .bind(input.message_type.unwrap_or_else(|| "contact".to_string()))
    .bind(&name)
    .bind(&email)
    .bind(input.phone.unwrap_or_default())
    .bind(&message)
    .bind(input.category.unwrap_or_default())
    .bind(input.anonymous.unwrap_or(false))
    .bind(input.visit_date.unwrap_or_default())
    .fetch_one(&pool)
    .await?;

    let _ = email::notify_admin(&pool, &row).await;

    Ok(Json(row))
}

pub async fn list(
    _auth: AuthUser,
    Db(pool): Db,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Vec<ContactMessage>>, AppError> {
    let mut query_builder = sqlx::QueryBuilder::new("SELECT * FROM contact_messages WHERE 1=1");
    if let Some(mt) = params.get("message_type") {
        query_builder.push(" AND message_type = ").push_bind(mt);
    }
    if let Some(s) = params.get("status") {
        query_builder.push(" AND status = ").push_bind(s);
    }
    if let Some(cat) = params.get("category") {
        query_builder.push(" AND category = ").push_bind(cat);
    }
    query_builder.push(" ORDER BY created_at DESC");
    let rows = query_builder.build_query_as::<ContactMessage>().fetch_all(&pool).await?;
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
