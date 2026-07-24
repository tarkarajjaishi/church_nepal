use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreatePortfolioProject, Paginated, Pagination, PortfolioProject, UpdatePortfolioProject};
use crate::handlers::audit::create_audit_entry;

#[derive(serde::Deserialize)]
pub struct ReorderRequest {
    pub sort_order: i32,
}

pub async fn list(Db(pool): Db, Query(p): Query<Pagination>) -> Result<Json<Paginated<PortfolioProject>>, AppError> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM portfolio").fetch_one(&pool).await?;
    let rows = sqlx::query_as::<_, PortfolioProject>("SELECT * FROM portfolio ORDER BY sort_order ASC, created_at DESC LIMIT $1 OFFSET $2")
        .bind(p.limit()).bind(p.offset()).fetch_all(&pool).await?;
    Ok(Json(Paginated::new(rows, total, &p)))
}

pub async fn get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<PortfolioProject>, AppError> {
    let row = sqlx::query_as::<_, PortfolioProject>("SELECT * FROM portfolio WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Portfolio project not found"))?;
    Ok(Json(row))
}

pub async fn create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CreatePortfolioProject>,
) -> Result<Json<PortfolioProject>, AppError> {
    let row = sqlx::query_as::<_, PortfolioProject>(
        r#"INSERT INTO portfolio (title, description, image, category, client, year, url, featured)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *"#,
    )
    .bind(&input.title)
    .bind(&input.description)
    .bind(input.image.unwrap_or_default())
    .bind(input.category.unwrap_or_default())
    .bind(input.client.unwrap_or_default())
    .bind(input.year.unwrap_or_default())
    .bind(input.url)
    .bind(input.featured.unwrap_or(false))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdatePortfolioProject>,
) -> Result<Json<PortfolioProject>, AppError> {
    let existing = sqlx::query_as::<_, PortfolioProject>("SELECT * FROM portfolio WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Portfolio project not found"))?;

    let row = sqlx::query_as::<_, PortfolioProject>(
        r#"UPDATE portfolio SET
            title = COALESCE($2, title),
            description = COALESCE($3, description),
            image = COALESCE($4, image),
            category = COALESCE($5, category),
            client = COALESCE($6, client),
            year = COALESCE($7, year),
            url = COALESCE($8, url),
            featured = COALESCE($9, featured),
            enabled = COALESCE($10, enabled),
            sort_order = COALESCE($11, sort_order),
            updated_at = NOW()
           WHERE id = $1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.title.as_deref().unwrap_or(&existing.title))
    .bind(input.description.as_deref().unwrap_or(&existing.description))
    .bind(input.image.as_deref().unwrap_or(&existing.image))
    .bind(input.category.as_deref().unwrap_or(&existing.category))
    .bind(input.client.as_deref().unwrap_or(&existing.client))
    .bind(input.year.as_deref().unwrap_or(&existing.year))
    .bind(input.url.as_deref().unwrap_or(existing.url.as_deref().unwrap_or("")))
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
) -> Result<Json<PortfolioProject>, AppError> {
    let row = sqlx::query_as::<_, PortfolioProject>(
        "UPDATE portfolio SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Portfolio project not found"))?;
    Ok(Json(row))
}

pub async fn reorder(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<ReorderRequest>,
) -> Result<Json<PortfolioProject>, AppError> {
    let row = sqlx::query_as::<_, PortfolioProject>(
        "UPDATE portfolio SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Portfolio project not found"))?;
    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM portfolio WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
