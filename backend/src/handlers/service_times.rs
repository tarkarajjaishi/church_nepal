use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateServiceTime, ServiceTime, UpdateServiceTime};

pub async fn list(State(pool): State<PgPool>) -> Result<Json<Vec<ServiceTime>>, AppError> {
    let rows = sqlx::query_as!(ServiceTime, "SELECT * FROM service_times ORDER BY sort_order ASC").fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<ServiceTime>, AppError> {
    let row = sqlx::query_as!(ServiceTime, "SELECT * FROM service_times WHERE id = $1", id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Service time not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, State(pool): State<PgPool>, Json(input): Json<CreateServiceTime>) -> Result<Json<ServiceTime>, AppError> {
    let sort_order = input.sort_order.unwrap_or(0);
    let row = sqlx::query_as!(ServiceTime, r#"INSERT INTO service_times (name, name_ne, day, time, icon, sort_order) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *"#,
        input.name, input.name_ne, input.day, input.time, input.icon, sort_order).fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateServiceTime>) -> Result<Json<ServiceTime>, AppError> {
    let existing = sqlx::query_as!(ServiceTime, "SELECT * FROM service_times WHERE id = $1", id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Service time not found"))?;
    let row = sqlx::query_as!(ServiceTime, r#"UPDATE service_times SET name=COALESCE($2,name), name_ne=COALESCE($3,name_ne), day=COALESCE($4,day), time=COALESCE($5,time), icon=COALESCE($6,icon), sort_order=COALESCE($7,sort_order) WHERE id=$1 RETURNING *"#,
        id, input.name.as_deref().unwrap_or(&existing.name), input.name_ne.as_deref().unwrap_or(&existing.name_ne), input.day.as_deref().unwrap_or(&existing.day), input.time.as_deref().unwrap_or(&existing.time), input.icon.as_deref().unwrap_or(&existing.icon), input.sort_order.unwrap_or(existing.sort_order.unwrap_or(0))).fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, State(pool): State<PgPool>, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query!("DELETE FROM service_times WHERE id = $1", id).execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
pub async fn toggle(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<ServiceTime>, AppError> {
    let row = sqlx::query_as::<_, ServiceTime>(
        "UPDATE service_times SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("ServiceTime not found"))?;
    Ok(Json(row))
}