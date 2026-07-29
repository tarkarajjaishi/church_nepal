use crate::handlers::audit::create_audit_entry;
use crate::handlers::ValidatedJson;
use crate::security::xss;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateNotice, Notice, Paginated, Pagination, UpdateNotice};
use chrono::Utc;
pub async fn list(Db(pool): Db, Query(p): Query<Pagination>) -> Result<Json<Paginated<Notice>>, AppError> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM notices").fetch_one(&pool).await?;
    let rows = sqlx::query_as::<_, Notice>("SELECT * FROM notices ORDER BY created_at DESC LIMIT $1 OFFSET $2")
        .bind(p.limit()).bind(p.offset()).fetch_all(&pool).await?;
    Ok(Json(Paginated::new(rows, total, &p)))
}

pub async fn get(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<Notice>, AppError> {
    let row = sqlx::query_as::<_, Notice>("SELECT * FROM notices WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Notice not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, Db(pool): Db, ValidatedJson(input): ValidatedJson<CreateNotice>) -> Result<Json<Notice>, AppError> {
      let title = xss::sanitize_plain(&input.title);
      let category = xss::sanitize_plain(&input.category);
      let text = xss::sanitize_plain(&input.text);
      let urgent = input.urgent.unwrap_or(false);
      let enabled = match input.published_at {
          Some(ref at) if *at > Utc::now().naive_utc() => false,
          Some(_) => true,
          None => input.enabled.unwrap_or(false),
      };
      let row = sqlx::query_as::<_, Notice>(
          "INSERT INTO notices (title, date, category, text, urgent, enabled, published_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *")
      .bind(&title)
      .bind(&input.date)
      .bind(&category)
      .bind(&text)
      .bind(urgent)
      .bind(enabled)
      .bind(input.published_at)
      .fetch_one(&pool).await?;
      let _ = create_audit_entry(&pool, &_auth.email, "create", "notice", &row.id.to_string(), Some(serde_json::json!({"id": row.id, "title": row.title}))).await;
      Ok(Json(row))
  }

pub async fn update(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, ValidatedJson(input): ValidatedJson<UpdateNotice>) -> Result<Json<Notice>, AppError> {
      let existing = sqlx::query_as::<_, Notice>("SELECT * FROM notices WHERE id = $1")
          .bind(id)
          .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Notice not found"))?;

      let enabled = match input.published_at {
          Some(ref at) if *at > Utc::now().naive_utc() => false,
          Some(_) => true,
          None => input.enabled.unwrap_or(existing.enabled.unwrap_or(false)),
      };

      let row = sqlx::query_as::<_, Notice>(
          "UPDATE notices SET title=COALESCE($2,title), date=COALESCE($3,date), category=COALESCE($4,category), text=COALESCE($5,text), urgent=COALESCE($6,urgent), enabled=COALESCE($7,enabled), published_at=COALESCE($8,published_at) WHERE id=$1 RETURNING *")
      .bind(id)
      .bind(input.title.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.title.as_deref()))
      .bind(input.date.as_deref().or(existing.date.as_deref()))
      .bind(input.category.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.category.as_deref()))
      .bind(input.text.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.text.as_deref()))
      .bind(input.urgent.unwrap_or(existing.urgent))
      .bind(enabled)
      .bind(input.published_at)
      .fetch_one(&pool).await?;
      let _ = create_audit_entry(&pool, &_auth.email, "update", "notice", &row.id.to_string(), Some(serde_json::json!({"id": row.id, "title": row.title}))).await;
      Ok(Json(row))
  }

pub async fn delete(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM notices WHERE id = $1")
        .bind(id)
        .execute(&pool).await?;
    let _ = create_audit_entry(&pool, &_auth.email, "delete", "notice", &id.to_string(), Some(serde_json::json!({"id": id}))).await;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Notice>, AppError> {
    let row = sqlx::query_as::<_, Notice>(
        "UPDATE notices SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Notice not found"))?;
    let _ = create_audit_entry(&pool, &_auth.email, "toggle", "notice", &row.id.to_string(), Some(serde_json::json!({"id": row.id, "title": row.title}))).await;
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
) -> Result<Json<Notice>, AppError> {
    let row = sqlx::query_as::<_, Notice>(
        "UPDATE notices SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Notice not found"))?;
    let _ = create_audit_entry(&pool, &_auth.email, "reorder", "notice", &row.id.to_string(), Some(serde_json::json!({"id": row.id, "title": row.title}))).await;
    Ok(Json(row))
}
