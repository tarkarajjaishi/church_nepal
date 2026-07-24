use crate::handlers::ValidatedJson;
use crate::security::xss;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateVerse, Paginated, Pagination, UpdateVerse, Verse};

pub async fn list(Db(pool): Db, Query(p): Query<Pagination>) -> Result<Json<Paginated<Verse>>, AppError> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM verses").fetch_one(&pool).await?;
    let rows = sqlx::query_as::<_, Verse>("SELECT * FROM verses ORDER BY is_pinned DESC, sort_order ASC, created_at DESC LIMIT $1 OFFSET $2")
        .bind(p.limit()).bind(p.offset()).fetch_all(&pool).await?;
    Ok(Json(Paginated::new(rows, total, &p)))
}

pub async fn get(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<Verse>, AppError> {
    let row = sqlx::query_as::<_, Verse>("SELECT * FROM verses WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Verse not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, Db(pool): Db, ValidatedJson(input): ValidatedJson<CreateVerse>) -> Result<Json<Verse>, AppError> {
     let row = sqlx::query_as::<_, Verse>(
         r#"INSERT INTO verses (text, ref_text, ne) VALUES ($1,$2,$3) RETURNING *"#,
     )
     .bind(xss::sanitize_plain(&input.text))
     .bind(xss::sanitize_plain(&input.ref_text))
     .bind(xss::sanitize_plain(&input.ne))
     .fetch_one(&pool).await?;
     Ok(Json(row))
 }

 pub async fn update(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, ValidatedJson(input): ValidatedJson<UpdateVerse>) -> Result<Json<Verse>, AppError> {
     let existing = sqlx::query_as::<_, Verse>("SELECT * FROM verses WHERE id = $1")
         .bind(id)
         .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Verse not found"))?;
     let row = sqlx::query_as::<_, Verse>(
         r#"UPDATE verses SET text=COALESCE($2,text), ref_text=COALESCE($3,ref_text), ne=COALESCE($4,ne) WHERE id=$1 RETURNING *"#,
     )
     .bind(id)
     .bind(input.text.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.text.as_deref()))
     .bind(input.ref_text.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.ref_text.as_deref()))
     .bind(input.ne.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.ne.as_deref()))
     .fetch_one(&pool).await?;
     Ok(Json(row))
 }

pub async fn delete(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM verses WHERE id = $1")
        .bind(id)
        .execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Verse>, AppError> {
    let row = sqlx::query_as::<_, Verse>(
        "UPDATE verses SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Verse not found"))?;
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
) -> Result<Json<Verse>, AppError> {
    let row = sqlx::query_as::<_, Verse>(
        "UPDATE verses SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Verse not found"))?;
    Ok(Json(row))
}

/// Pin a verse as "Verse of the Day". Unpins all others first (only one can be pinned).
pub async fn pin(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Verse>, AppError> {
    // Unpin all verses first
    sqlx::query("UPDATE verses SET is_pinned = FALSE")
        .execute(&pool)
        .await?;

    // Pin the requested verse
    let row = sqlx::query_as::<_, Verse>(
        "UPDATE verses SET is_pinned = TRUE WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Verse not found"))?;
    Ok(Json(row))
}
