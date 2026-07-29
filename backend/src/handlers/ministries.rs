use crate::handlers::ValidatedJson;
use crate::security::xss;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::handlers::audit::create_audit_entry;
use crate::models::{CreateMinistry, Ministry, Paginated, Pagination, UpdateMinistry};

pub async fn list(Db(pool): Db, Query(p): Query<Pagination>) -> Result<Json<Paginated<Ministry>>, AppError> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM ministries").fetch_one(&pool).await?;
    let rows = sqlx::query_as::<_, Ministry>("SELECT * FROM ministries ORDER BY created_at DESC LIMIT $1 OFFSET $2")
        .bind(p.limit()).bind(p.offset()).fetch_all(&pool).await?;
    Ok(Json(Paginated::new(rows, total, &p)))
}

pub async fn get(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<Ministry>, AppError> {
    let row = sqlx::query_as::<_, Ministry>("SELECT * FROM ministries WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Ministry not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, Db(pool): Db, ValidatedJson(input): ValidatedJson<CreateMinistry>) -> Result<Json<Ministry>, AppError> {
    let row = sqlx::query_as::<_, Ministry>(
        r#"INSERT INTO ministries (name, name_ne, description, leader, meeting, image, icon) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *"#,
    )
    .bind(xss::sanitize_plain(&input.name))
    .bind(xss::sanitize_plain(&input.name_ne))
    .bind(xss::sanitize_plain(&input.description))
    .bind(xss::sanitize_plain(&input.leader))
    .bind(xss::sanitize_plain(&input.meeting))
    .bind(&input.image)
    .bind(xss::sanitize_plain(&input.icon))
    .fetch_one(&pool).await?;
    let _ = create_audit_entry(&pool, &_auth.email, "create", "ministry", &row.id.to_string(), Some(serde_json::json!({"id": row.id}))).await;
    Ok(Json(row))
 }
 
pub async fn update(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, ValidatedJson(input): ValidatedJson<UpdateMinistry>) -> Result<Json<Ministry>, AppError> {
    let existing = sqlx::query_as::<_, Ministry>("SELECT * FROM ministries WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Ministry not found"))?;
    let row = sqlx::query_as::<_, Ministry>(
        r#"UPDATE ministries SET name=COALESCE($2,name), name_ne=COALESCE($3,name_ne), description=COALESCE($4,description), leader=COALESCE($5,leader), meeting=COALESCE($6,meeting), image=COALESCE($7,image), icon=COALESCE($8,icon) WHERE id=$1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.name.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.name.as_deref()))
    .bind(input.name_ne.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.name_ne.as_deref()))
    .bind(input.description.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.description.as_deref()))
    .bind(input.leader.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.leader.as_deref()))
    .bind(input.meeting.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.meeting.as_deref()))
    .bind(input.image.as_deref().or(existing.image.as_deref()))
    .bind(input.icon.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.icon.as_deref()))
    .fetch_one(&pool).await?;
    let _ = create_audit_entry(&pool, &_auth.email, "update", "ministry", &row.id.to_string(), Some(serde_json::json!({"id": row.id}))).await;
    Ok(Json(row))
 }
 
pub async fn delete(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM ministries WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    let _ = create_audit_entry(&pool, &_auth.email, "delete", "ministry", &id.to_string(), Some(serde_json::json!({"id": id}))).await;
    Ok(Json(serde_json::json!({ "deleted": true })))
 }
 
pub async fn toggle(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<Ministry>, AppError> {
    let row = sqlx::query_as::<_, Ministry>("UPDATE ministries SET enabled = NOT enabled WHERE id = $1 RETURNING *")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Ministry not found"))?;
    let _ = create_audit_entry(&pool, &_auth.email, "toggle", "ministry", &row.id.to_string(), Some(serde_json::json!({"id": row.id, "enabled": row.enabled})).await;
    Ok(Json(row))
 }
 
#[derive(serde::Deserialize)]
pub struct ReorderRequest {
    pub sort_order: i32,
}

pub async fn reorder(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, Json(input): Json<ReorderRequest>) -> Result<Json<Ministry>, AppError> {
    let row = sqlx::query_as::<_, Ministry>("UPDATE ministries SET sort_order = $2 WHERE id = $1 RETURNING *")
        .bind(id)
        .bind(input.sort_order)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Ministry not found"))?;
    let _ = create_audit_entry(&pool, &_auth.email, "reorder", "ministry", &row.id.to_string(), Some(serde_json::json!({"id": row.id, "sort_order": input.sort_order}))).await;
    Ok(Json(row))
 }
