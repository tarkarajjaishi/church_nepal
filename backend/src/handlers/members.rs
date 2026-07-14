use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateMember, Member, UpdateMember};

pub async fn list(State(pool): State<PgPool>) -> Result<Json<Vec<Member>>, AppError> {
    let rows = sqlx::query_as!(Member, "SELECT * FROM members ORDER BY created_at DESC").fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<Member>, AppError> {
    let row = sqlx::query_as!(Member, "SELECT * FROM members WHERE id = $1", id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Member not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, State(pool): State<PgPool>, Json(input): Json<CreateMember>) -> Result<Json<Member>, AppError> {
    let row = sqlx::query_as!(Member, r#"INSERT INTO members (name, role, since, image) VALUES ($1,$2,$3,$4) RETURNING *"#,
        input.name, input.role, input.since, input.image).fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateMember>) -> Result<Json<Member>, AppError> {
    let existing = sqlx::query_as!(Member, "SELECT * FROM members WHERE id = $1", id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Member not found"))?;
    let row = sqlx::query_as!(Member, r#"UPDATE members SET name=COALESCE($2,name), role=COALESCE($3,role), since=COALESCE($4,since), image=COALESCE($5,image) WHERE id=$1 RETURNING *"#,
        id, input.name.as_deref().unwrap_or(&existing.name), input.role.as_deref().unwrap_or(&existing.role), input.since.as_deref().unwrap_or(&existing.since), input.image.as_deref().unwrap_or(&existing.image)).fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query!("DELETE FROM members WHERE id = $1", id).execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
pub async fn toggle(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Member>, AppError> {
    let row = sqlx::query_as::<_, Member>(
        "UPDATE members SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Member not found"))?;
    Ok(Json(row))
}