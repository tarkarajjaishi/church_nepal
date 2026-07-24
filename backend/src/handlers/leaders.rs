use crate::handlers::ValidatedJson;
use crate::security::xss;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::handlers::audit::create_audit_entry;
use crate::models::{CreateLeader, Leader, Paginated, Pagination, UpdateLeader};

pub async fn list(Db(pool): Db, Query(p): Query<Pagination>) -> Result<Json<Paginated<Leader>>, AppError> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM leaders").fetch_one(&pool).await?;
    let rows = sqlx::query_as::<_, Leader>("SELECT * FROM leaders ORDER BY created_at DESC LIMIT $1 OFFSET $2")
        .bind(p.limit()).bind(p.offset()).fetch_all(&pool).await?;
    Ok(Json(Paginated::new(rows, total, &p)))
}

pub async fn get(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<Leader>, AppError> {
    let row = sqlx::query_as::<_, Leader>("SELECT * FROM leaders WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Leader not found"))?;
    Ok(Json(row))
}

pub async fn create(auth: AuthUser, Db(pool): Db, ValidatedJson(input): ValidatedJson<CreateLeader>) -> Result<Json<Leader>, AppError> {
     let row = sqlx::query_as::<_, Leader>(
         "INSERT INTO leaders (name, role, category, image, bio) VALUES ($1,$2,$3,$4,$5) RETURNING *"
     )
     .bind(xss::sanitize_plain(&input.name))
     .bind(xss::sanitize_plain(&input.role))
     .bind(xss::sanitize_plain(&input.category))
     .bind(&input.image)
     .bind(xss::sanitize_plain(&input.bio))
     .fetch_one(&pool).await?;
     let _ = create_audit_entry(&pool, &auth.email, "create", "leader", &row.id.to_string(), Some(serde_json::json!({"id": row.id, "name": row.name}))).await;
     Ok(Json(row))
 }

  pub async fn update(auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, ValidatedJson(input): ValidatedJson<UpdateLeader>) -> Result<Json<Leader>, AppError> {
      let existing = sqlx::query_as::<_, Leader>("SELECT * FROM leaders WHERE id = $1")
          .bind(id)
          .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Leader not found"))?;
      let row = sqlx::query_as::<_, Leader>(
          "UPDATE leaders SET name=COALESCE($2,name), role=COALESCE($3,role), category=COALESCE($4,category), image=COALESCE($5,image), bio=COALESCE($6,bio) WHERE id=$1 RETURNING *"
      )
      .bind(id)
      .bind(input.name.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.name.as_deref()))
      .bind(input.role.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.role.as_deref()))
      .bind(input.category.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.category.as_deref()))
      .bind(input.image.as_deref().or(existing.image.as_deref()))
      .bind(input.bio.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.bio.as_deref()))
      .fetch_one(&pool).await?;
      let _ = create_audit_entry(&pool, &auth.email, "update", "leader", &row.id.to_string(), Some(serde_json::json!({"id": row.id, "name": row.name}))).await;
      Ok(Json(row))
  }

pub async fn delete(auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM leaders WHERE id = $1")
        .bind(id)
        .execute(&pool).await?;
    let _ = create_audit_entry(&pool, &auth.email, "delete", "leader", &id.to_string(), Some(serde_json::json!({"id": id}))).await;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Leader>, AppError> {
    let row = sqlx::query_as::<_, Leader>(
        "UPDATE leaders SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Leader not found"))?;
    let _ = create_audit_entry(&pool, &_auth.email, "toggle", "leader", &row.id.to_string(), Some(serde_json::json!({"id": row.id, "name": row.name}))).await;
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
) -> Result<Json<Leader>, AppError> {
    let row = sqlx::query_as::<_, Leader>(
        "UPDATE leaders SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Leader not found"))?;
    let _ = create_audit_entry(&pool, &_auth.email, "reorder", "leader", &row.id.to_string(), Some(serde_json::json!({"id": row.id, "name": row.name}))).await;
    Ok(Json(row))
}
