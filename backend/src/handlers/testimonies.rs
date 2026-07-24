use crate::handlers::ValidatedJson;
use crate::security::xss;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::handlers::audit::create_audit_entry;
use crate::models::{CreateTestimony, Paginated, Pagination, Testimony, UpdateTestimony};
use crate::email;
use chrono::Utc;

#[derive(Debug, Deserialize)]
pub struct RejectTestimonyInput {
    pub reason: Option<String>,
}

pub async fn list(Db(pool): Db, Query(p): Query<Pagination>) -> Result<Json<Paginated<Testimony>>, AppError> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM testimonies").fetch_one(&pool).await?;
    let rows = sqlx::query_as::<_, Testimony>("SELECT * FROM testimonies ORDER BY created_at DESC LIMIT $1 OFFSET $2")
        .bind(p.limit()).bind(p.offset()).fetch_all(&pool).await?;
    Ok(Json(Paginated::new(rows, total, &p)))
}

pub async fn list_public(Db(pool): Db, Query(p): Query<Pagination>) -> Result<Json<Paginated<Testimony>>, AppError> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM testimonies WHERE status = 'approved' AND (enabled IS NULL OR enabled = true)")
        .fetch_one(&pool).await?;
    let rows = sqlx::query_as::<_, Testimony>("SELECT * FROM testimonies WHERE status = 'approved' AND (enabled IS NULL OR enabled = true) ORDER BY created_at DESC LIMIT $1 OFFSET $2")
        .bind(p.limit()).bind(p.offset()).fetch_all(&pool).await?;
    Ok(Json(Paginated::new(rows, total, &p)))
}

pub async fn get(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<Testimony>, AppError> {
    let row = sqlx::query_as::<_, Testimony>("SELECT * FROM testimonies WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Testimony not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, Db(pool): Db, ValidatedJson(input): ValidatedJson<CreateTestimony>) -> Result<Json<Testimony>, AppError> {
     let name = xss::sanitize_plain(&input.name);
     let role = xss::sanitize_plain(&input.role);
     let quote = xss::sanitize_plain(&input.quote);
     let row = sqlx::query_as::<_, Testimony>(
         r#"INSERT INTO testimonies (name, role, quote, image, rating, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *"#,
     )
     .bind(&name)
     .bind(&role)
     .bind(&quote)
     .bind(&input.image)
     .bind(input.rating)
     .bind("approved")
     .fetch_one(&pool).await?;
     Ok(Json(row))
 }

 pub async fn submit_public(Db(pool): Db, ValidatedJson(input): ValidatedJson<CreateTestimony>) -> Result<Json<Testimony>, AppError> {
     let name = xss::sanitize_plain(&input.name);
     let role = xss::sanitize_plain(&input.role);
     let quote = xss::sanitize_plain(&input.quote);
     let row = sqlx::query_as::<_, Testimony>(
         r#"INSERT INTO testimonies (name, role, quote, image, rating, status) VALUES ($1,$2,$3,$4,$5,'pending') RETURNING *"#,
     )
     .bind(&name)
     .bind(&role)
     .bind(&quote)
     .bind(&input.image)
     .bind(input.rating)
     .fetch_one(&pool).await?;

     let testimony_name = name.clone();
     let row_id = row.id;
     let pool_for_email = pool.clone();
     tokio::spawn(async move {
         let _ = email::notify_admin_new_testimony(&pool_for_email, &testimony_name, &row_id).await;
     });

     Ok(Json(row))
 }

pub async fn update(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, ValidatedJson(input): ValidatedJson<UpdateTestimony>) -> Result<Json<Testimony>, AppError> {
     let existing = sqlx::query_as::<_, Testimony>("SELECT * FROM testimonies WHERE id = $1")
         .bind(id)
         .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Testimony not found"))?;
     let row = sqlx::query_as::<_, Testimony>(
         r#"UPDATE testimonies SET name=COALESCE($2,name), role=COALESCE($3,role), quote=COALESCE($4,quote), image=COALESCE($5,image), rating=COALESCE($6,rating), status=COALESCE($7,status) WHERE id=$1 RETURNING *"#,
     )
     .bind(id)
     .bind(input.name.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.name.as_deref()))
     .bind(input.role.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.role.as_deref()))
     .bind(input.quote.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.quote.as_deref()))
     .bind(input.image.as_deref().or(existing.image.as_deref()))
     .bind(input.rating.unwrap_or(existing.rating))
     .bind(input.status.unwrap_or(existing.status))
     .fetch_one(&pool).await?;
     Ok(Json(row))
 }

pub async fn delete(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM testimonies WHERE id = $1")
        .bind(id)
        .execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn approve(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<Testimony>, AppError> {
    let row = sqlx::query_as::<_, Testimony>(
        "UPDATE testimonies SET status = 'approved' WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Testimony not found"))?;

    let _ = create_audit_entry(
        &pool,
        &_auth.email,
        "approve_testimony",
        &id.to_string(),
        "testimony",
        Some(serde_json::json!({
            "testimony_name": row.name,
        })),
    )
    .await;

    Ok(Json(row))
}

pub async fn reject(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<RejectTestimonyInput>,
) -> Result<Json<Testimony>, AppError> {
    let existing = sqlx::query_as::<_, Testimony>("SELECT * FROM testimonies WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Testimony not found"))?;

    let row = sqlx::query_as::<_, Testimony>(
        "UPDATE testimonies SET status = 'rejected' WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Testimony not found"))?;

    let _ = create_audit_entry(
        &pool,
        &_auth.email,
        "reject_testimony",
        &id.to_string(),
        "testimony",
        Some(serde_json::json!({
            "testimony_name": existing.name,
            "reason": input.reason,
        })),
    )
    .await;

    Ok(Json(row))
}

pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Testimony>, AppError> {
    let row = sqlx::query_as::<_, Testimony>(
        "UPDATE testimonies SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Testimony not found"))?;
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
) -> Result<Json<Testimony>, AppError> {
    let row = sqlx::query_as::<_, Testimony>(
        "UPDATE testimonies SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Testimony not found"))?;
    Ok(Json(row))
}
