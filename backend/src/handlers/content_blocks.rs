use crate::handlers::ValidatedJson;
use crate::security::xss;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::handlers::audit::create_audit_entry;
use crate::models::{ContentBlock, CreateContentBlock, Paginated, Pagination, UpdateContentBlock};

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

pub async fn list(Db(pool): Db, Query(p): Query<Pagination>) -> Result<Json<Paginated<ContentBlock>>, AppError> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM content_blocks").fetch_one(&pool).await?;
    let rows = sqlx::query_as::<_, ContentBlock>("SELECT * FROM content_blocks ORDER BY sort_order ASC LIMIT $1 OFFSET $2")
        .bind(p.limit()).bind(p.offset()).fetch_all(&pool).await?;
    Ok(Json(Paginated::new(rows, total, &p)))
}

pub async fn list_enabled(Db(pool): Db) -> Result<Json<Vec<ContentBlock>>, AppError> {
    let rows = sqlx::query_as::<_, ContentBlock>("SELECT * FROM content_blocks WHERE enabled = TRUE ORDER BY sort_order ASC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get_by_key(Db(pool): Db, Path(key): Path<String>) -> Result<Json<ContentBlock>, AppError> {
    let row = sqlx::query_as::<_, ContentBlock>("SELECT * FROM content_blocks WHERE section_key = $1")
        .bind(&key)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Content block not found"))?;
    Ok(Json(row))
}

pub async fn get(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<ContentBlock>, AppError> {
    let row = sqlx::query_as::<_, ContentBlock>("SELECT * FROM content_blocks WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Content block not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, Db(pool): Db, ValidatedJson(input): ValidatedJson<CreateContentBlock>) -> Result<Json<ContentBlock>, AppError> {
     let title = xss::sanitize_html(&input.title);
     let subtitle = xss::sanitize_plain(&input.subtitle);
     let body = xss::sanitize_html(&input.body);
     let row = sqlx::query_as::<_, ContentBlock>(
         "INSERT INTO content_blocks (section_key, title, subtitle, body, image, icon, items) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *"
     )
     .bind(&input.section_key).bind(&title).bind(&subtitle)
     .bind(&body).bind(&input.image).bind(&input.icon).bind(&input.items)
      .fetch_one(&pool).await?;
      let _ = create_audit_entry(&pool, &_auth.email, "create", "content_block", &row.id.to_string(), json!({"id": row.id, "section_key": row.section_key})).await;
     Ok(Json(row))
 }

pub async fn update(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, ValidatedJson(input): ValidatedJson<UpdateContentBlock>) -> Result<Json<ContentBlock>, AppError> {
     let existing = sqlx::query_as::<_, ContentBlock>("SELECT * FROM content_blocks WHERE id = $1")
         .bind(id)
         .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Content block not found"))?;
     let row = sqlx::query_as::<_, ContentBlock>(
         "UPDATE content_blocks SET title=COALESCE($2,title), subtitle=COALESCE($3,subtitle), body=COALESCE($4,body), image=COALESCE($5,image), icon=COALESCE($6,icon), items=COALESCE($7,items), sort_order=COALESCE($8,sort_order), updated_at=NOW() WHERE id=$1 RETURNING *"
     )
     .bind(id)
     .bind(input.title.as_deref().map(|t| xss::sanitize_html(t)).unwrap_or_else(|| existing.title.clone()))
     .bind(input.subtitle.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.subtitle.as_deref()).unwrap_or(""))
     .bind(input.body.as_deref().map(|t| xss::sanitize_html(t)).or(existing.body.as_deref()).unwrap_or(""))
     .bind(input.image.as_deref().or(existing.image.as_deref()).unwrap_or_else(|| "".to_string()))
     .bind(input.icon.as_deref().or(existing.icon.as_deref()).unwrap_or_else(|| "".to_string()))
     .bind(input.items.as_ref().or(existing.items.as_ref()))
      .bind(input.sort_order)
      .fetch_one(&pool).await?;
      let _ = create_audit_entry(&pool, &_auth.email, "update", "content_block", &row.id.to_string(), json!({"id": row.id, "section_key": row.section_key})).await;
      Ok(Json(row))
  }

pub async fn delete(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM content_blocks WHERE id = $1")
        .bind(id)
        .execute(&pool).await?;
    let _ = create_audit_entry(&pool, &_auth.email, "delete", "content_block", &id.to_string(), json!({"id": id})).await;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn toggle(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<ContentBlock>, AppError> {
    let row = sqlx::query_as::<_, ContentBlock>("UPDATE content_blocks SET enabled = NOT enabled WHERE id = $1 RETURNING *")
        .bind(id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Content block not found"))?;
    let _ = create_audit_entry(&pool, &_auth.email, "toggle", "content_block", &row.id.to_string(), json!({"id": row.id, "enabled": row.enabled})).await;
    Ok(Json(row))
}

pub async fn reorder(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, Json(input): Json<ReorderRequest>) -> Result<Json<ContentBlock>, AppError> {
    let row = sqlx::query_as::<_, ContentBlock>("UPDATE content_blocks SET sort_order = $2 WHERE id = $1 RETURNING *")
        .bind(id).bind(input.sort_order).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Content block not found"))?;
    Ok(Json(row))
}

pub async fn batch_reorder(_auth: AuthUser, Db(pool): Db, Json(input): Json<BatchReorderRequest>) -> Result<Json<Vec<ContentBlock>>, AppError> {
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
