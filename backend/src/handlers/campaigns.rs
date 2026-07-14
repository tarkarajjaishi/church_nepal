use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{Campaign, CreateCampaign, UpdateCampaign};

pub async fn list(State(pool): State<PgPool>) -> Result<Json<Vec<Campaign>>, AppError> {
    let rows = sqlx::query_as!(Campaign, "SELECT * FROM campaigns ORDER BY created_at DESC").fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<Campaign>, AppError> {
    let row = sqlx::query_as!(Campaign, "SELECT * FROM campaigns WHERE id = $1", id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Campaign not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, State(pool): State<PgPool>, Json(input): Json<CreateCampaign>) -> Result<Json<Campaign>, AppError> {
    let raised = input.raised.unwrap_or(0);
    let row = sqlx::query_as!(Campaign, r#"INSERT INTO campaigns (title, raised, goal) VALUES ($1,$2,$3) RETURNING *"#,
        input.title, raised, input.goal).fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateCampaign>) -> Result<Json<Campaign>, AppError> {
    let existing = sqlx::query_as!(Campaign, "SELECT * FROM campaigns WHERE id = $1", id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Campaign not found"))?;
    let row = sqlx::query_as!(Campaign, r#"UPDATE campaigns SET title=COALESCE($2,title), raised=COALESCE($3,raised), goal=COALESCE($4,goal) WHERE id=$1 RETURNING *"#,
        id, input.title.as_deref().unwrap_or(&existing.title), input.raised.unwrap_or(existing.raised), input.goal.unwrap_or(existing.goal)).fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query!("DELETE FROM campaigns WHERE id = $1", id).execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
pub async fn toggle(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Campaign>, AppError> {
    let row = sqlx::query_as::<_, Campaign>(
        "UPDATE campaigns SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Campaign not found"))?;
    Ok(Json(row))
}