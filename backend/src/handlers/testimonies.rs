use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateTestimony, Testimony, UpdateTestimony};

pub async fn list(State(pool): State<PgPool>) -> Result<Json<Vec<Testimony>>, AppError> {
    let rows = sqlx::query_as!(Testimony, "SELECT * FROM testimonies ORDER BY created_at DESC").fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<Testimony>, AppError> {
    let row = sqlx::query_as!(Testimony, "SELECT * FROM testimonies WHERE id = $1", id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Testimony not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, State(pool): State<PgPool>, Json(input): Json<CreateTestimony>) -> Result<Json<Testimony>, AppError> {
    let row = sqlx::query_as!(Testimony, r#"INSERT INTO testimonies (name, role, quote, image, rating) VALUES ($1,$2,$3,$4,$5) RETURNING *"#,
        input.name, input.role, input.quote, input.image, input.rating).fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateTestimony>) -> Result<Json<Testimony>, AppError> {
    let existing = sqlx::query_as!(Testimony, "SELECT * FROM testimonies WHERE id = $1", id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Testimony not found"))?;
    let row = sqlx::query_as!(Testimony, r#"UPDATE testimonies SET name=COALESCE($2,name), role=COALESCE($3,role), quote=COALESCE($4,quote), image=COALESCE($5,image), rating=COALESCE($6,rating) WHERE id=$1 RETURNING *"#,
        id, input.name.as_deref().unwrap_or(&existing.name), input.role.as_deref().unwrap_or(&existing.role), input.quote.as_deref().unwrap_or(&existing.quote), input.image.as_deref().unwrap_or(&existing.image), input.rating.unwrap_or(existing.rating)).fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query!("DELETE FROM testimonies WHERE id = $1", id).execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
pub async fn toggle(
    _auth: AuthUser,
    State(pool): State<PgPool>,
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
    State(pool): State<PgPool>,
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