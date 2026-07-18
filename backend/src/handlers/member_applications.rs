use crate::tenant::Db;
use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::member_application::*;

pub async fn list(Db(pool): Db) -> Result<Json<Vec<MemberApplication>>, AppError> {
    let rows = sqlx::query_as::<_, MemberApplication>(
        "SELECT * FROM member_applications ORDER BY created_at DESC"
    ).fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(
    Db(pool): Db, Path(id): Path<uuid::Uuid>,
) -> Result<Json<MemberApplication>, AppError> {
    let row = sqlx::query_as::<_, MemberApplication>("SELECT * FROM member_applications WHERE id = $1")
        .bind(id).fetch_optional(&pool).await?
        .ok_or_else(|| AppError::not_found("Application not found"))?;
    Ok(Json(row))
}

// Public endpoint - no auth required
pub async fn create(
    Db(pool): Db,
    Json(input): Json<CreateMemberApplication>,
) -> Result<Json<MemberApplication>, AppError> {
    let dob = input.date_of_birth.as_deref()
        .and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

    let row = sqlx::query_as::<_, MemberApplication>(
        r#"INSERT INTO member_applications (first_name, last_name, email, phone, address, city, date_of_birth, gender, marital_status, baptism_status, church_background, how_found, interest_areas, testimony)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *"#
    )
    .bind(&input.first_name)
    .bind(input.last_name.as_deref().unwrap_or(""))
    .bind(&input.email)
    .bind(input.phone.as_deref().unwrap_or(""))
    .bind(&input.address)
    .bind(&input.city)
    .bind(dob)
    .bind(&input.gender)
    .bind(&input.marital_status)
    .bind(input.baptism_status.as_deref().unwrap_or("not_baptized"))
    .bind(&input.church_background)
    .bind(&input.how_found)
    .bind(&input.interest_areas)
    .bind(&input.testimony)
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdateMemberApplication>,
) -> Result<Json<MemberApplication>, AppError> {
    let row = sqlx::query_as::<_, MemberApplication>(
        r#"UPDATE member_applications SET
            status=COALESCE($2,status), reviewed_by=COALESCE($3,reviewed_by),
            notes=COALESCE($4,notes), reviewed_at=NOW(), updated_at=NOW()
         WHERE id=$1 RETURNING *"#
    )
    .bind(id)
    .bind(&input.status)
    .bind(&input.reviewed_by)
    .bind(&input.notes)
    .fetch_optional(&pool).await?
    .ok_or_else(|| AppError::not_found("Application not found"))?;
    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM member_applications WHERE id = $1")
        .bind(id).execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn stats(Db(pool): Db) -> Result<Json<serde_json::Value>, AppError> {
    let total: (i64,) = sqlx::query_as("SELECT COUNT(*)::bigint FROM member_applications")
        .fetch_one(&pool).await?;
    let pending: (i64,) = sqlx::query_as("SELECT COUNT(*)::bigint FROM member_applications WHERE status = 'pending'")
        .fetch_one(&pool).await?;
    let approved: (i64,) = sqlx::query_as("SELECT COUNT(*)::bigint FROM member_applications WHERE status = 'approved'")
        .fetch_one(&pool).await?;
    let this_month: (i64,) = sqlx::query_as("SELECT COUNT(*)::bigint FROM member_applications WHERE created_at >= date_trunc('month', CURRENT_DATE)")
        .fetch_one(&pool).await?;

    Ok(Json(serde_json::json!({
        "total": total.0,
        "pending": pending.0,
        "approved": approved.0,
        "this_month": this_month.0,
    })))
}
