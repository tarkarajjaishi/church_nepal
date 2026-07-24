use crate::handlers::audit::create_audit_entry;
use crate::tenant::Db;
use axum::extract::Path;
use axum::Json;

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{ContactInfo, CreateContactInfo, UpdateContactInfo};

pub async fn list(Db(pool): Db) -> Result<Json<Vec<ContactInfo>>, AppError> {
    let rows = sqlx::query_as::<_, ContactInfo>("SELECT * FROM contact_info ORDER BY created_at DESC")
        .fetch_all(&pool)
        .await?;
    Ok(Json(rows))
}

pub async fn get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<ContactInfo>, AppError> {
    let row = sqlx::query_as::<_, ContactInfo>("SELECT * FROM contact_info WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Contact info not found"))?;
    Ok(Json(row))
}

pub async fn create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CreateContactInfo>,
) -> Result<Json<ContactInfo>, AppError> {
    let row = sqlx::query_as::<_, ContactInfo>(
        r#"INSERT INTO contact_info (address, phone, email, hours, map_url)
           VALUES ($1, $2, $3, $4, $5) RETURNING *"#,
    )
    .bind(&input.address)
    .bind(&input.phone)
    .bind(&input.email)
    .bind(&input.hours)
    .bind(input.map_url.unwrap_or_default())
    .fetch_one(&pool)
    .await?;
    let _ = create_audit_entry(&pool, &auth.email, "create", "contact_info", &row.id.to_string(), Some(serde_json::json!({"id": row.id}))).await;
    Ok(Json(row))
}

pub async fn update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdateContactInfo>,
) -> Result<Json<ContactInfo>, AppError> {
    let existing = sqlx::query_as::<_, ContactInfo>("SELECT * FROM contact_info WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Contact info not found"))?;

    let row = sqlx::query_as::<_, ContactInfo>(
        r#"UPDATE contact_info SET
            address = COALESCE($2, address),
            phone = COALESCE($3, phone),
            email = COALESCE($4, email),
            hours = COALESCE($5, hours),
            map_url = COALESCE($6, map_url),
            updated_at = NOW()
           WHERE id = $1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.address.as_deref().unwrap_or(&existing.address))
    .bind(input.phone.as_deref().unwrap_or(&existing.phone))
    .bind(input.email.as_deref().unwrap_or(&existing.email))
    .bind(input.hours.as_deref().unwrap_or(&existing.hours))
    .bind(input.map_url.as_deref().unwrap_or(&existing.map_url))
    .fetch_one(&pool)
    .await?;
    let _ = create_audit_entry(&pool, &auth.email, "update", "contact_info", &row.id.to_string(), Some(serde_json::json!({"id": row.id}))).await;
    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM contact_info WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    let _ = create_audit_entry(&pool, &auth.email, "delete", "contact_info", &id.to_string(), Some(serde_json::json!({"id": id}))).await;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
