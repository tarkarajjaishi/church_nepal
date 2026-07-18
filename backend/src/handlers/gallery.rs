use crate::tenant::Db;
use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateGalleryItem, GalleryItem, UpdateGalleryItem};

pub async fn list(Db(pool): Db) -> Result<Json<Vec<GalleryItem>>, AppError> {
    let rows = sqlx::query_as::<_, GalleryItem>("SELECT * FROM gallery ORDER BY created_at DESC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<GalleryItem>, AppError> {
    let row = sqlx::query_as::<_, GalleryItem>("SELECT * FROM gallery WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Gallery item not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, Db(pool): Db, Json(input): Json<CreateGalleryItem>) -> Result<Json<GalleryItem>, AppError> {
    let row = sqlx::query_as::<_, GalleryItem>(
        r#"INSERT INTO gallery (title, category, image) VALUES ($1,$2,$3) RETURNING *"#,
    )
    .bind(&input.title)
    .bind(&input.category)
    .bind(&input.image)
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateGalleryItem>) -> Result<Json<GalleryItem>, AppError> {
    let existing = sqlx::query_as::<_, GalleryItem>("SELECT * FROM gallery WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Gallery item not found"))?;
    let row = sqlx::query_as::<_, GalleryItem>(
        r#"UPDATE gallery SET title=COALESCE($2,title), category=COALESCE($3,category), image=COALESCE($4,image) WHERE id=$1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.title.as_deref().unwrap_or(&existing.title))
    .bind(input.category.as_deref().unwrap_or(&existing.category))
    .bind(input.image.as_deref().unwrap_or(&existing.image))
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM gallery WHERE id = $1")
        .bind(id)
        .execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<GalleryItem>, AppError> {
    let row = sqlx::query_as::<_, GalleryItem>(
        "UPDATE gallery SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("GalleryItem not found"))?;
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
) -> Result<Json<GalleryItem>, AppError> {
    let row = sqlx::query_as::<_, GalleryItem>(
        "UPDATE gallery SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("GalleryItem not found"))?;
    Ok(Json(row))
}
