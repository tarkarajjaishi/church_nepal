use crate::tenant::Db;
use axum::extract::Path;
use axum::Json;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::fund::*;
use crate::handlers::audit::create_audit_entry;

// ===== Funds =====

pub async fn list(
    Db(pool): Db,
) -> Result<Json<Vec<Fund>>, AppError> {
    let rows = sqlx::query_as::<_, Fund>(
        "SELECT * FROM funds ORDER BY sort_order ASC, created_at DESC",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Fund>, AppError> {
    let row = sqlx::query_as::<_, Fund>(
        "SELECT * FROM funds WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Fund not found"))?;
    Ok(Json(row))
}

pub async fn create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CreateFund>,
) -> Result<Json<Fund>, AppError> {
    let row = sqlx::query_as::<_, Fund>(
        r#"INSERT INTO funds (name, description, fund_type)
            VALUES ($1, $2, $3) RETURNING *"#,
    )
    .bind(&input.name)
    .bind(input.description.as_deref().unwrap_or(""))
    .bind(input.fund_type.as_deref().unwrap_or("general"))
    .fetch_one(&pool)
    .await?;

    let _ = create_audit_entry(
        &pool,
        &_auth.email,
        "create",
        "fund",
        &row.id.to_string(),
        Some(serde_json::json!({"id": row.id, "name": row.name})),
    )
    .await;

    Ok(Json(row))
}

pub async fn update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdateFund>,
) -> Result<Json<Fund>, AppError> {
    let existing = sqlx::query_as::<_, Fund>(
        "SELECT * FROM funds WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Fund not found"))?;

    let row = sqlx::query_as::<_, Fund>(
        r#"UPDATE funds SET
            name = COALESCE($2, name),
            description = COALESCE($3, description),
            fund_type = COALESCE($4, fund_type),
            is_active = COALESCE($5, is_active),
            updated_at = NOW()
         WHERE id = $1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.name.as_deref().unwrap_or(&existing.name))
    .bind(input.description.as_deref().or(existing.description.as_deref()))
    .bind(input.fund_type.as_deref().or(existing.fund_type.as_deref()))
    .bind(input.is_active.unwrap_or(existing.is_active))
    .fetch_one(&pool)
    .await?;

    let _ = create_audit_entry(
        &pool,
        &_auth.email,
        "update",
        "fund",
        &row.id.to_string(),
        Some(serde_json::json!({"id": row.id, "name": row.name})),
    )
    .await;

    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM funds WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;

    let _ = create_audit_entry(
        &pool,
        &_auth.email,
        "delete",
        "fund",
        &id.to_string(),
        Some(serde_json::json!({"id": id})),
    )
    .await;

    Ok(Json(serde_json::json!({ "deleted": true })))
}

// ===== Recurring Donations =====

pub async fn list_recurring(
    Db(pool): Db,
) -> Result<Json<Vec<RecurringDonation>>, AppError> {
    let rows = sqlx::query_as::<_, RecurringDonation>(
        "SELECT * FROM recurring_donations ORDER BY created_at DESC",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn create_recurring(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CreateRecurringDonation>,
) -> Result<Json<RecurringDonation>, AppError> {
    let row = sqlx::query_as::<_, RecurringDonation>(
        r#"INSERT INTO recurring_donations (member_id, amount, interval, gateway)
            VALUES ($1, $2, $3, $4) RETURNING *"#,
    )
    .bind(input.member_id)
    .bind(input.amount)
    .bind(input.interval.as_deref().unwrap_or("monthly"))
    .bind(input.gateway.as_deref().unwrap_or("stripe"))
    .fetch_one(&pool)
    .await?;

    let _ = create_audit_entry(
        &pool,
        &_auth.email,
        "create",
        "recurring_donation",
        &row.id.to_string(),
        Some(serde_json::json!({"id": row.id, "amount": row.amount, "interval": row.interval})),
    )
    .await;

    Ok(Json(row))
}
