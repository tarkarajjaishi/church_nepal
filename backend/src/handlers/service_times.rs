use crate::tenant::Db;
use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateServiceTime, ServiceTime, UpdateServiceTime};

pub async fn list(Db(pool): Db) -> Result<Json<Vec<ServiceTime>>, AppError> {
    let rows = sqlx::query_as::<_, ServiceTime>("SELECT * FROM service_times ORDER BY sort_order ASC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<ServiceTime>, AppError> {
    let row = sqlx::query_as::<_, ServiceTime>("SELECT * FROM service_times WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Service time not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, Db(pool): Db, Json(input): Json<CreateServiceTime>) -> Result<Json<ServiceTime>, AppError> {
    let sort_order = input.sort_order.unwrap_or(0);
    let row = sqlx::query_as::<_, ServiceTime>(
        r#"INSERT INTO service_times (name, name_ne, day, time, icon, sort_order) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *"#,
    )
    .bind(&input.name)
    .bind(&input.name_ne)
    .bind(&input.day)
    .bind(&input.time)
    .bind(&input.icon)
    .bind(sort_order)
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateServiceTime>) -> Result<Json<ServiceTime>, AppError> {
    let existing = sqlx::query_as::<_, ServiceTime>("SELECT * FROM service_times WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Service time not found"))?;
    let row = sqlx::query_as::<_, ServiceTime>(
        r#"UPDATE service_times SET name=COALESCE($2,name), name_ne=COALESCE($3,name_ne), day=COALESCE($4,day), time=COALESCE($5,time), icon=COALESCE($6,icon), sort_order=COALESCE($7,sort_order) WHERE id=$1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.name.as_deref().unwrap_or(&existing.name))
    .bind(input.name_ne.as_deref().unwrap_or(&existing.name_ne))
    .bind(input.day.as_deref().unwrap_or(&existing.day))
    .bind(input.time.as_deref().unwrap_or(&existing.time))
    .bind(input.icon.as_deref().unwrap_or(&existing.icon))
    .bind(input.sort_order.unwrap_or(existing.sort_order.unwrap_or(0)))
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM service_times WHERE id = $1")
        .bind(id)
        .execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
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

#[derive(serde::Deserialize)]
pub struct ReorderRequest {
    pub sort_order: i32,
}

pub async fn reorder(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<ReorderRequest>,
) -> Result<Json<ServiceTime>, AppError> {
    let row = sqlx::query_as::<_, ServiceTime>(
        "UPDATE service_times SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("ServiceTime not found"))?;
    Ok(Json(row))
}
