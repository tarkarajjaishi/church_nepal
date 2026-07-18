use crate::tenant::Db;
use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateTeamMember, TeamMember, UpdateTeamMember};

#[derive(serde::Deserialize)]
pub struct ReorderRequest {
    pub sort_order: i32,
}

pub async fn list(Db(pool): Db) -> Result<Json<Vec<TeamMember>>, AppError> {
    let rows = sqlx::query_as::<_, TeamMember>("SELECT * FROM team ORDER BY sort_order ASC, created_at DESC")
        .fetch_all(&pool)
        .await?;
    Ok(Json(rows))
}

pub async fn get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<TeamMember>, AppError> {
    let row = sqlx::query_as::<_, TeamMember>("SELECT * FROM team WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Team member not found"))?;
    Ok(Json(row))
}

pub async fn create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CreateTeamMember>,
) -> Result<Json<TeamMember>, AppError> {
    let row = sqlx::query_as::<_, TeamMember>(
        r#"INSERT INTO team (name, role, bio, image, category, featured)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *"#,
    )
    .bind(&input.name)
    .bind(&input.role)
    .bind(input.bio.unwrap_or_default())
    .bind(input.image.unwrap_or_default())
    .bind(input.category.unwrap_or_default())
    .bind(input.featured.unwrap_or(false))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdateTeamMember>,
) -> Result<Json<TeamMember>, AppError> {
    let existing = sqlx::query_as::<_, TeamMember>("SELECT * FROM team WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Team member not found"))?;

    let row = sqlx::query_as::<_, TeamMember>(
        r#"UPDATE team SET
            name = COALESCE($2, name),
            role = COALESCE($3, role),
            bio = COALESCE($4, bio),
            image = COALESCE($5, image),
            category = COALESCE($6, category),
            featured = COALESCE($7, featured),
            enabled = COALESCE($8, enabled),
            sort_order = COALESCE($9, sort_order),
            updated_at = NOW()
           WHERE id = $1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.name.as_deref().unwrap_or(&existing.name))
    .bind(input.role.as_deref().unwrap_or(&existing.role))
    .bind(input.bio.as_deref().unwrap_or(&existing.bio))
    .bind(input.image.as_deref().unwrap_or(&existing.image))
    .bind(input.category.as_deref().unwrap_or(&existing.category))
    .bind(input.featured.unwrap_or(existing.featured))
    .bind(input.enabled.unwrap_or(existing.enabled))
    .bind(input.sort_order.or(existing.sort_order))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<TeamMember>, AppError> {
    let row = sqlx::query_as::<_, TeamMember>(
        "UPDATE team SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Team member not found"))?;
    Ok(Json(row))
}

pub async fn reorder(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<ReorderRequest>,
) -> Result<Json<TeamMember>, AppError> {
    let row = sqlx::query_as::<_, TeamMember>(
        "UPDATE team SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Team member not found"))?;
    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM team WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
