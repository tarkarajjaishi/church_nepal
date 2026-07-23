use crate::tenant::Db;
use axum::extract::Path;
use axum::Json;
use crate::error::AppError;
use crate::models::prayer_request::*;
use crate::handlers::audit::create_audit_entry;
use crate::email;
use crate::auth::AuthUser;

#[derive(Debug, Deserialize)]
pub struct ApprovePrayerInput {
    pub reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RejectPrayerInput {
    pub reason: Option<String>,
}

pub async fn create(
    Db(pool): Db,
    Json(input): Json<CreatePrayerRequest>,
) -> Result<Json<PrayerRequest>, AppError> {
    let row = sqlx::query_as::<_, PrayerRequest>(
        r#"INSERT INTO prayer_requests (name, email, phone, category, message, anonymous, is_public, pray_count, status)
           VALUES ($1, $2, $3, $4, $5, $6, false, 0, 'pending')
           RETURNING *"#,
    )
    .bind(input.name.unwrap_or_default())
    .bind(input.email.unwrap_or_default())
    .bind(input.phone.unwrap_or_default())
    .bind(input.category.unwrap_or_default())
    .bind(input.message)
    .bind(input.anonymous.unwrap_or(false))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn list_public(
    Db(pool): Db,
) -> Result<Json<Vec<PrayerRequest>>, AppError> {
    let rows = sqlx::query_as::<_, PrayerRequest>(
        "SELECT * FROM prayer_requests WHERE status = 'approved' AND is_public = true ORDER BY created_at DESC"
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn list_all(
    _auth: AuthUser,
    Db(pool): Db,
) -> Result<Json<Vec<PrayerRequest>>, AppError> {
    let rows = sqlx::query_as::<_, PrayerRequest>(
        "SELECT * FROM prayer_requests ORDER BY created_at DESC"
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn get(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<PrayerRequest>, AppError> {
    let row = sqlx::query_as::<_, PrayerRequest>(
        "SELECT * FROM prayer_requests WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Prayer request not found"))?;
    Ok(Json(row))
}

pub async fn approve(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<ApprovePrayerInput>,
) -> Result<Json<PrayerRequest>, AppError> {
    let existing = sqlx::query_as::<_, PrayerRequest>("SELECT * FROM prayer_requests WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Prayer request not found"))?;

    let row = sqlx::query_as::<_, PrayerRequest>(
        r#"UPDATE prayer_requests SET
            status = 'approved',
            is_public = true,
            updated_at = NOW()
           WHERE id = $1
           RETURNING *"#,
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Prayer request not found"))?;

    let pool_clone = pool.clone();
    let requester_name = existing.name.clone();
    let email = existing.email.clone();
    let reason_clone = input.reason.clone();
    tokio::spawn(async move {
        let _ = email::notify_prayer_request_decision(&pool_clone, &requester_name, &email, true, reason_clone.as_deref()).await;
    });

    let _ = create_audit_entry(
        &pool,
        &_auth.email,
        "approve_prayer_request",
        &id.to_string(),
        "prayer_request",
        Some(serde_json::json!({
            "requester_name": existing.name,
            "requester_email": existing.email,
            "reason": input.reason,
        })),
    )
    .await;

    Ok(Json(row))
}

pub async fn reject(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<RejectPrayerInput>,
) -> Result<Json<PrayerRequest>, AppError> {
    let existing = sqlx::query_as::<_, PrayerRequest>("SELECT * FROM prayer_requests WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Prayer request not found"))?;

    let row = sqlx::query_as::<_, PrayerRequest>(
        r#"UPDATE prayer_requests SET
            status = 'rejected',
            is_public = false,
            updated_at = NOW()
           WHERE id = $1
           RETURNING *"#,
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Prayer request not found"))?;

    let pool_clone = pool.clone();
    let requester_name = existing.name.clone();
    let email = existing.email.clone();
    let reason_clone = input.reason.clone();
    tokio::spawn(async move {
        let _ = email::notify_prayer_request_decision(&pool_clone, &requester_name, &email, false, reason_clone.as_deref()).await;
    });

    let _ = create_audit_entry(
        &pool,
        &_auth.email,
        "reject_prayer_request",
        &id.to_string(),
        "prayer_request",
        Some(serde_json::json!({
            "requester_name": existing.name,
            "requester_email": existing.email,
            "reason": input.reason,
        })),
    )
    .await;

    Ok(Json(row))
}

pub async fn update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdatePrayerRequest>,
) -> Result<Json<PrayerRequest>, AppError> {
    let row = sqlx::query_as::<_, PrayerRequest>(
        r#"UPDATE prayer_requests SET
            status = COALESCE($2, status),
            is_public = COALESCE($3, is_public),
            updated_at = NOW()
           WHERE id = $1
           RETURNING *"#,
    )
    .bind(id)
    .bind(input.status.as_deref())
    .bind(input.is_public)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Prayer request not found"))?;
    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM prayer_requests WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn pray(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<PrayerRequest>, AppError> {
    let row = sqlx::query_as::<_, PrayerRequest>(
        "UPDATE prayer_requests SET pray_count = pray_count + 1 WHERE id = $1 RETURNING *"
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Prayer request not found"))?;
    Ok(Json(row))
}
