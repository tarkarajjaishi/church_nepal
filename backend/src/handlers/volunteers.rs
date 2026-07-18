use crate::tenant::Db;
use axum::extract::{Path, State};
use axum::Json;
use chrono::NaiveDate;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::volunteer::*;

// ===== Teams =====

pub async fn list_teams(
    Db(pool): Db,
) -> Result<Json<Vec<VolunteerTeam>>, AppError> {
    let rows = sqlx::query_as::<_, VolunteerTeam>(
        "SELECT * FROM volunteer_teams ORDER BY sort_order ASC, created_at DESC",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn get_team(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<VolunteerTeam>, AppError> {
    let row = sqlx::query_as::<_, VolunteerTeam>(
        "SELECT * FROM volunteer_teams WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Volunteer team not found"))?;
    Ok(Json(row))
}

pub async fn create_team(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CreateVolunteerTeam>,
) -> Result<Json<VolunteerTeam>, AppError> {
    let row = sqlx::query_as::<_, VolunteerTeam>(
        r#"INSERT INTO volunteer_teams (name, description, color)
           VALUES ($1, $2, $3) RETURNING *"#,
    )
    .bind(&input.name)
    .bind(input.description.as_deref().unwrap_or(""))
    .bind(input.color.as_deref().unwrap_or("#3B82F6"))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn update_team(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdateVolunteerTeam>,
) -> Result<Json<VolunteerTeam>, AppError> {
    let existing = sqlx::query_as::<_, VolunteerTeam>(
        "SELECT * FROM volunteer_teams WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Volunteer team not found"))?;

    let row = sqlx::query_as::<_, VolunteerTeam>(
        r#"UPDATE volunteer_teams SET
            name = COALESCE($2, name),
            description = COALESCE($3, description),
            color = COALESCE($4, color),
            enabled = COALESCE($5, enabled)
         WHERE id = $1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.name.as_deref().unwrap_or(&existing.name))
    .bind(input.description.as_deref().unwrap_or(&existing.description))
    .bind(input.color.as_deref().unwrap_or(&existing.color))
    .bind(input.enabled.unwrap_or(existing.enabled))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn delete_team(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM volunteer_teams WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

// ===== Shifts =====

pub async fn list_shifts(
    Db(pool): Db,
) -> Result<Json<Vec<VolunteerShift>>, AppError> {
    let rows = sqlx::query_as::<_, VolunteerShift>(
        "SELECT * FROM volunteer_shifts ORDER BY shift_date DESC, created_at DESC",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn get_shift(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<VolunteerShift>, AppError> {
    let row = sqlx::query_as::<_, VolunteerShift>(
        "SELECT * FROM volunteer_shifts WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Volunteer shift not found"))?;
    Ok(Json(row))
}

pub async fn create_shift(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CreateVolunteerShift>,
) -> Result<Json<VolunteerShift>, AppError> {
    let date = NaiveDate::parse_from_str(&input.shift_date, "%Y-%m-%d")
        .map_err(|_| AppError::bad_request("Invalid date format, use YYYY-MM-DD"))?;

    let row = sqlx::query_as::<_, VolunteerShift>(
        r#"INSERT INTO volunteer_shifts (team_id, title, shift_date, start_time, end_time, location, slots, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *"#,
    )
    .bind(input.team_id)
    .bind(&input.title)
    .bind(date)
    .bind(input.start_time.as_deref().unwrap_or(""))
    .bind(input.end_time.as_deref().unwrap_or(""))
    .bind(input.location.as_deref().unwrap_or(""))
    .bind(input.slots.unwrap_or(1))
    .bind(input.notes.as_deref().unwrap_or(""))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn update_shift(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdateVolunteerShift>,
) -> Result<Json<VolunteerShift>, AppError> {
    let existing = sqlx::query_as::<_, VolunteerShift>(
        "SELECT * FROM volunteer_shifts WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Volunteer shift not found"))?;

    let date = input.shift_date.as_deref()
        .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok())
        .unwrap_or(existing.shift_date);

    let row = sqlx::query_as::<_, VolunteerShift>(
        r#"UPDATE volunteer_shifts SET
            team_id = COALESCE($2, team_id),
            title = COALESCE($3, title),
            shift_date = $4,
            start_time = COALESCE($5, start_time),
            end_time = COALESCE($6, end_time),
            location = COALESCE($7, location),
            slots = COALESCE($8, slots),
            notes = COALESCE($9, notes)
         WHERE id = $1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.team_id)
    .bind(input.title.as_deref().unwrap_or(&existing.title))
    .bind(date)
    .bind(input.start_time.as_deref().unwrap_or(&existing.start_time))
    .bind(input.end_time.as_deref().unwrap_or(&existing.end_time))
    .bind(input.location.as_deref().unwrap_or(&existing.location))
    .bind(input.slots.unwrap_or(existing.slots))
    .bind(input.notes.as_deref().unwrap_or(&existing.notes))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn delete_shift(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM volunteer_shifts WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

// ===== Assignments =====

pub async fn list_assignments(
    Db(pool): Db,
    Path(shift_id): Path<uuid::Uuid>,
) -> Result<Json<Vec<VolunteerAssignment>>, AppError> {
    let rows = sqlx::query_as::<_, VolunteerAssignment>(
        "SELECT * FROM volunteer_assignments WHERE shift_id = $1 ORDER BY created_at ASC",
    )
    .bind(shift_id)
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn create_assignment(
    _auth: AuthUser,
    Db(pool): Db,
    Path(shift_id): Path<uuid::Uuid>,
    Json(input): Json<CreateVolunteerAssignment>,
) -> Result<Json<VolunteerAssignment>, AppError> {
    let row = sqlx::query_as::<_, VolunteerAssignment>(
        r#"INSERT INTO volunteer_assignments (shift_id, name, notes)
           VALUES ($1, $2, $3) RETURNING *"#,
    )
    .bind(shift_id)
    .bind(&input.name)
    .bind(input.notes.as_deref().unwrap_or(""))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}
