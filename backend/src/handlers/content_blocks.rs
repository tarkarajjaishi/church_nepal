use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{ContentBlock, CreateContentBlock, UpdateContentBlock};

#[derive(serde::Deserialize)]
pub struct ReorderRequest {
    pub sort_order: i32,
}

#[derive(serde::Deserialize)]
pub struct ReorderItem {
    pub id: uuid::Uuid,
    pub sort_order: i32,
}

#[derive(serde::Deserialize)]
pub struct BatchReorderRequest {
    pub items: Vec<ReorderItem>,
}

pub async fn list(State(pool): State<PgPool>) -> Result<Json<Vec<ContentBlock>>, AppError> {
    let rows = sqlx::query_as::<_, ContentBlock>("SELECT * FROM content_blocks ORDER BY sort_order ASC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn list_enabled(State(pool): State<PgPool>) -> Result<Json<Vec<ContentBlock>>, AppError> {
    let rows = sqlx::query_as::<_, ContentBlock>("SELECT * FROM content_blocks WHERE enabled = TRUE ORDER BY sort_order ASC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get_by_key(State(pool): State<PgPool>, Path(key): Path<String>) -> Result<Json<ContentBlock>, AppError> {
    let row = sqlx::query_as::<_, ContentBlock>("SELECT * FROM content_blocks WHERE section_key = $1")
        .bind(&key)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Content block not found"))?;
    Ok(Json(row))
}

pub async fn get(State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<ContentBlock>, AppError> {
    let row = sqlx::query_as::<_, ContentBlock>("SELECT * FROM content_blocks WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Content block not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, State(pool): State<PgPool>, Json(input): Json<CreateContentBlock>) -> Result<Json<ContentBlock>, AppError> {
    let row = sqlx::query_as::<_, ContentBlock>(
        "INSERT INTO content_blocks (section_key, title, subtitle, body, image, icon, items) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *"
    )
    .bind(&input.section_key).bind(&input.title).bind(&input.subtitle)
    .bind(&input.body).bind(&input.image).bind(&input.icon).bind(&input.items)
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateContentBlock>) -> Result<Json<ContentBlock>, AppError> {
    let existing = sqlx::query_as::<_, ContentBlock>("SELECT * FROM content_blocks WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Content block not found"))?;
    let row = sqlx::query_as::<_, ContentBlock>(
        "UPDATE content_blocks SET title=COALESCE($2,title), subtitle=COALESCE($3,subtitle), body=COALESCE($4,body), image=COALESCE($5,image), icon=COALESCE($6,icon), items=COALESCE($7,items), sort_order=COALESCE($8,sort_order), updated_at=NOW() WHERE id=$1 RETURNING *"
    )
    .bind(id)
    .bind(input.title.as_deref().unwrap_or(&existing.title))
    .bind(input.subtitle.as_deref().or(existing.subtitle.as_deref()).unwrap_or(""))
    .bind(input.body.as_deref().or(existing.body.as_deref()).unwrap_or(""))
    .bind(input.image.as_deref().or(existing.image.as_deref()).unwrap_or(""))
    .bind(input.icon.as_deref().or(existing.icon.as_deref()).unwrap_or(""))
    .bind(input.items.as_ref().or(existing.items.as_ref()))
    .bind(input.sort_order)
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM content_blocks WHERE id = $1")
        .bind(id)
        .execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn toggle(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<ContentBlock>, AppError> {
    let row = sqlx::query_as::<_, ContentBlock>("UPDATE content_blocks SET enabled = NOT enabled WHERE id = $1 RETURNING *")
        .bind(id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Content block not found"))?;
    Ok(Json(row))
}

pub async fn reorder(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>, Json(input): Json<ReorderRequest>) -> Result<Json<ContentBlock>, AppError> {
    let row = sqlx::query_as::<_, ContentBlock>("UPDATE content_blocks SET sort_order = $2 WHERE id = $1 RETURNING *")
        .bind(id).bind(input.sort_order).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Content block not found"))?;
    Ok(Json(row))
}

pub async fn batch_reorder(_auth: AuthUser, State(pool): State<PgPool>, Json(input): Json<BatchReorderRequest>) -> Result<Json<Vec<ContentBlock>>, AppError> {
    let mut tx = pool.begin().await.map_err(|e| AppError::internal(&e.to_string()))?;
    for item in &input.items {
        sqlx::query("UPDATE content_blocks SET sort_order = $2, updated_at = NOW() WHERE id = $1")
            .bind(item.id)
            .bind(item.sort_order)
            .execute(&mut *tx)
            .await
            .map_err(|e| AppError::internal(&e.to_string()))?;
    }
    tx.commit().await.map_err(|e| AppError::internal(&e.to_string()))?;
    let rows = sqlx::query_as::<_, ContentBlock>("SELECT * FROM content_blocks ORDER BY sort_order ASC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}
