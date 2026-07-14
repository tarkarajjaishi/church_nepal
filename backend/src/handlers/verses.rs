use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateVerse, UpdateVerse, Verse};

pub async fn list(State(pool): State<PgPool>) -> Result<Json<Vec<Verse>>, AppError> {
    let rows = sqlx::query_as!(Verse, "SELECT * FROM verses ORDER BY created_at DESC").fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<Verse>, AppError> {
    let row = sqlx::query_as!(Verse, "SELECT * FROM verses WHERE id = $1", id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Verse not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, State(pool): State<PgPool>, Json(input): Json<CreateVerse>) -> Result<Json<Verse>, AppError> {
    let row = sqlx::query_as!(Verse, r#"INSERT INTO verses (text, ref_text, ne) VALUES ($1,$2,$3) RETURNING *"#,
        input.text, input.ref_text, input.ne).fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateVerse>) -> Result<Json<Verse>, AppError> {
    let existing = sqlx::query_as!(Verse, "SELECT * FROM verses WHERE id = $1", id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Verse not found"))?;
    let row = sqlx::query_as!(Verse, r#"UPDATE verses SET text=COALESCE($2,text), ref_text=COALESCE($3,ref_text), ne=COALESCE($4,ne) WHERE id=$1 RETURNING *"#,
        id, input.text.as_deref().unwrap_or(&existing.text), input.ref_text.as_deref().unwrap_or(&existing.ref_text), input.ne.as_deref().unwrap_or(&existing.ne)).fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query!("DELETE FROM verses WHERE id = $1", id).execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
pub async fn toggle(
    _auth: AuthUser,
    State(pool): State<PgPool>,
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
    State(pool): State<PgPool>,
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