use crate::tenant::Db;
use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{Campaign, CreateCampaign, UpdateCampaign};

pub async fn list(Db(pool): Db) -> Result<Json<Vec<Campaign>>, AppError> {
    let rows = sqlx::query_as::<_, Campaign>("SELECT * FROM campaigns ORDER BY created_at DESC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<Campaign>, AppError> {
    let row = sqlx::query_as::<_, Campaign>("SELECT * FROM campaigns WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Campaign not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, Db(pool): Db, Json(input): Json<CreateCampaign>) -> Result<Json<Campaign>, AppError> {
    let raised = input.raised.unwrap_or(0);
    let row = sqlx::query_as::<_, Campaign>(
        r#"INSERT INTO campaigns (title, raised, goal) VALUES ($1,$2,$3) RETURNING *"#,
    )
    .bind(&input.title)
    .bind(raised)
    .bind(input.goal)
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateCampaign>) -> Result<Json<Campaign>, AppError> {
    let existing = sqlx::query_as::<_, Campaign>("SELECT * FROM campaigns WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Campaign not found"))?;
    let row = sqlx::query_as::<_, Campaign>(
        r#"UPDATE campaigns SET title=COALESCE($2,title), raised=COALESCE($3,raised), goal=COALESCE($4,goal) WHERE id=$1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.title.as_deref().unwrap_or(&existing.title))
    .bind(input.raised.unwrap_or(existing.raised))
    .bind(input.goal.unwrap_or(existing.goal))
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM campaigns WHERE id = $1")
        .bind(id)
        .execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Campaign>, AppError> {
    let row = sqlx::query_as::<_, Campaign>(
        "UPDATE campaigns SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Campaign not found"))?;
    Ok(Json(row))
}

#[derive(serde::Deserialize)]
pub struct ReorderRequest {
    pub sort_order: i32,
}

pub async fn reorder(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<ReorderRequest>,
) -> Result<Json<Campaign>, AppError> {
    let row = sqlx::query_as::<_, Campaign>(
        "UPDATE campaigns SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Campaign not found"))?;
    Ok(Json(row))
}
