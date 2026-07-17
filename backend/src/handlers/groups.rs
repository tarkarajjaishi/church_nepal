use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateGroup, Group, UpdateGroup};

pub async fn list(State(pool): State<PgPool>) -> Result<Json<Vec<Group>>, AppError> {
    let rows = sqlx::query_as::<_, Group>("SELECT * FROM groups ORDER BY sort_order ASC, created_at ASC")
        .fetch_all(&pool)
        .await?;
    Ok(Json(rows))
}

pub async fn get(State(pool): State<PgPool>, Path(id): Path<i32>) -> Result<Json<Group>, AppError> {
    let row = sqlx::query_as::<_, Group>("SELECT * FROM groups WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Group not found"))?;
    Ok(Json(row))
}

pub async fn create(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Json(input): Json<CreateGroup>,
) -> Result<Json<Group>, AppError> {
    let row = sqlx::query_as::<_, Group>(
        "INSERT INTO groups (slug, name, description, meeting_day, meeting_time, location, leader_id, category, image_url, max_members, enabled, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *",
    )
    .bind(&input.slug)
    .bind(&input.name)
    .bind(&input.description)
    .bind(&input.meeting_day)
    .bind(&input.meeting_time)
    .bind(&input.location)
    .bind(input.leader_id)
    .bind(&input.category)
    .bind(&input.image_url)
    .bind(input.max_members)
    .bind(input.enabled.unwrap_or(true))
    .bind(input.sort_order.unwrap_or(0))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn update(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
    Json(input): Json<UpdateGroup>,
) -> Result<Json<Group>, AppError> {
    // Verify the group exists
    let _existing = sqlx::query_as::<_, Group>("SELECT * FROM groups WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Group not found"))?;

    let row = sqlx::query_as::<_, Group>(
        "UPDATE groups SET
            slug = COALESCE($2, slug),
            name = COALESCE($3, name),
            description = COALESCE($4, description),
            meeting_day = COALESCE($5, meeting_day),
            meeting_time = COALESCE($6, meeting_time),
            location = COALESCE($7, location),
            leader_id = COALESCE($8, leader_id),
            category = COALESCE($9, category),
            image_url = COALESCE($10, image_url),
            max_members = COALESCE($11, max_members),
            enabled = COALESCE($12, enabled),
            sort_order = COALESCE($13, sort_order),
            updated_at = now()
         WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(&input.slug)
    .bind(&input.name)
    .bind(&input.description)
    .bind(&input.meeting_day)
    .bind(&input.meeting_time)
    .bind(&input.location)
    .bind(input.leader_id)
    .bind(&input.category)
    .bind(&input.image_url)
    .bind(input.max_members)
    .bind(input.enabled)
    .bind(input.sort_order)
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM groups WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn toggle(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> Result<Json<Group>, AppError> {
    let row = sqlx::query_as::<_, Group>(
        "UPDATE groups SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Group not found"))?;
    Ok(Json(row))
}

#[derive(serde::Deserialize)]
pub struct ReorderRequest {
    pub sort_order: i32,
}

pub async fn reorder(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
    Json(input): Json<ReorderRequest>,
) -> Result<Json<Group>, AppError> {
    let row = sqlx::query_as::<_, Group>(
        "UPDATE groups SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Group not found"))?;
    Ok(Json(row))
}
