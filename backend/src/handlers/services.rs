use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateService, Service, UpdateService};

#[derive(serde::Deserialize)]
pub struct ReorderRequest {
    pub sort_order: i32,
}

pub async fn list(State(pool): State<PgPool>) -> Result<Json<Vec<Service>>, AppError> {
    let rows = sqlx::query_as::<_, Service>("SELECT * FROM services ORDER BY sort_order ASC, created_at DESC")
        .fetch_all(&pool)
        .await?;
    Ok(Json(rows))
}

pub async fn get(
    State(pool): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Service>, AppError> {
    let row = sqlx::query_as::<_, Service>("SELECT * FROM services WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Service not found"))?;
    Ok(Json(row))
}

pub async fn create(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Json(input): Json<CreateService>,
) -> Result<Json<Service>, AppError> {
    let row = sqlx::query_as::<_, Service>(
        r#"INSERT INTO services (title, description, category, price, image, featured)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *"#,
    )
    .bind(&input.title)
    .bind(&input.description)
    .bind(input.category.unwrap_or_default())
    .bind(input.price.unwrap_or(0.0))
    .bind(input.image.unwrap_or_default())
    .bind(input.featured.unwrap_or(false))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn update(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdateService>,
) -> Result<Json<Service>, AppError> {
    let existing = sqlx::query_as::<_, Service>("SELECT * FROM services WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Service not found"))?;

    let row = sqlx::query_as::<_, Service>(
        r#"UPDATE services SET
            title = COALESCE($2, title),
            description = COALESCE($3, description),
            category = COALESCE($4, category),
            price = COALESCE($5, price),
            image = COALESCE($6, image),
            featured = COALESCE($7, featured),
            enabled = COALESCE($8, enabled),
            sort_order = COALESCE($9, sort_order),
            updated_at = NOW()
           WHERE id = $1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.title.as_deref().unwrap_or(&existing.title))
    .bind(input.description.as_deref().unwrap_or(&existing.description))
    .bind(input.category.as_deref().unwrap_or(&existing.category))
    .bind(input.price.unwrap_or(existing.price.unwrap_or(0.0)))
    .bind(input.image.as_deref().unwrap_or(&existing.image))
    .bind(input.featured.unwrap_or(existing.featured))
    .bind(input.enabled.unwrap_or(existing.enabled))
    .bind(input.sort_order.or(existing.sort_order))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn toggle(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Service>, AppError> {
    let row = sqlx::query_as::<_, Service>(
        "UPDATE services SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Service not found"))?;
    Ok(Json(row))
}

pub async fn reorder(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<ReorderRequest>,
) -> Result<Json<Service>, AppError> {
    let row = sqlx::query_as::<_, Service>(
        "UPDATE services SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Service not found"))?;
    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM services WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
