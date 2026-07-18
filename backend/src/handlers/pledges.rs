use crate::tenant::Db;
use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::pledge::*;

pub async fn list_all(
    Db(pool): Db,
) -> Result<Json<Vec<Pledge>>, AppError> {
    let rows = sqlx::query_as::<_, Pledge>(
        "SELECT * FROM pledges ORDER BY created_at DESC",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn list_by_campaign(
    Db(pool): Db,
    Path(campaign_id): Path<uuid::Uuid>,
) -> Result<Json<Vec<Pledge>>, AppError> {
    let rows = sqlx::query_as::<_, Pledge>(
        "SELECT * FROM pledges WHERE campaign_id = $1 ORDER BY created_at DESC",
    )
    .bind(campaign_id)
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Pledge>, AppError> {
    let row = sqlx::query_as::<_, Pledge>(
        "SELECT * FROM pledges WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Pledge not found"))?;
    Ok(Json(row))
}

pub async fn create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CreatePledge>,
) -> Result<Json<Pledge>, AppError> {
    let row = sqlx::query_as::<_, Pledge>(
        r#"INSERT INTO pledges (campaign_id, person_name, person_email, amount, notes)
           VALUES ($1, $2, $3, $4, $5) RETURNING *"#,
    )
    .bind(input.campaign_id)
    .bind(&input.person_name)
    .bind(&input.person_email)
    .bind(input.amount)
    .bind(input.notes.as_deref().unwrap_or(""))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdatePledge>,
) -> Result<Json<Pledge>, AppError> {
    let existing = sqlx::query_as::<_, Pledge>(
        "SELECT * FROM pledges WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Pledge not found"))?;

    let row = sqlx::query_as::<_, Pledge>(
        r#"UPDATE pledges SET
            person_name = COALESCE($2, person_name),
            person_email = COALESCE($3, person_email),
            amount = COALESCE($4, amount),
            fulfilled_amount = COALESCE($5, fulfilled_amount),
            status = COALESCE($6, status),
            notes = COALESCE($7, notes),
            updated_at = NOW()
         WHERE id = $1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.person_name.as_deref().unwrap_or(&existing.person_name))
    .bind(input.person_email.as_deref().unwrap_or(&existing.person_email))
    .bind(input.amount.unwrap_or(existing.amount))
    .bind(input.fulfilled_amount.unwrap_or(existing.fulfilled_amount))
    .bind(input.status.as_deref().unwrap_or(&existing.status))
    .bind(input.notes.as_deref().unwrap_or(&existing.notes))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM pledges WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
