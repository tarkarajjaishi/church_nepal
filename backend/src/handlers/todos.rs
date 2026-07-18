use crate::tenant::Db;
use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::todo::{CreateTodo, Todo, UpdateTodo};

pub async fn list(Db(pool): Db) -> Result<Json<Vec<Todo>>, AppError> {
    let rows = sqlx::query_as::<_, Todo>("SELECT * FROM todos ORDER BY sort_order ASC, created_at DESC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<Todo>, AppError> {
    let row = sqlx::query_as::<_, Todo>("SELECT * FROM todos WHERE id = $1")
        .bind(id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Todo not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, Db(pool): Db, Json(input): Json<CreateTodo>) -> Result<Json<Todo>, AppError> {
    let row = sqlx::query_as::<_, Todo>(
        "INSERT INTO todos (title, description, priority, status, due_date) VALUES ($1,$2,$3,$4,$5) RETURNING *"
    )
    .bind(&input.title).bind(&input.description).bind(&input.priority)
    .bind(&input.status).bind(&input.due_date)
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateTodo>) -> Result<Json<Todo>, AppError> {
    let existing = sqlx::query_as::<_, Todo>("SELECT * FROM todos WHERE id = $1")
        .bind(id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Todo not found"))?;
    let row = sqlx::query_as::<_, Todo>(
        "UPDATE todos SET title=COALESCE($2,title), description=COALESCE($3,description), priority=COALESCE($4,priority), status=COALESCE($5,status), due_date=COALESCE($6,due_date), sort_order=COALESCE($7,sort_order), updated_at=NOW() WHERE id=$1 RETURNING *"
    )
    .bind(id)
    .bind(input.title.as_deref().unwrap_or(&existing.title))
    .bind(input.description.as_deref().unwrap_or(&existing.description))
    .bind(input.priority.as_deref().unwrap_or(&existing.priority))
    .bind(input.status.as_deref().unwrap_or(&existing.status))
    .bind(input.due_date.as_deref().unwrap_or(&existing.due_date))
    .bind(input.sort_order)
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM todos WHERE id = $1").bind(id).execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn toggle_status(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<Todo>, AppError> {
    let row = sqlx::query_as::<_, Todo>(
        "UPDATE todos SET status = CASE WHEN status = 'done' THEN 'pending' ELSE 'done' END, updated_at = NOW() WHERE id = $1 RETURNING *"
    )
    .bind(id).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Todo not found"))?;
    Ok(Json(row))
}

#[derive(serde::Deserialize)]
pub struct ReorderRequest {
    pub sort_order: i32,
}

pub async fn reorder(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, Json(input): Json<ReorderRequest>) -> Result<Json<Todo>, AppError> {
    let row = sqlx::query_as::<_, Todo>("UPDATE todos SET sort_order = $2 WHERE id = $1 RETURNING *")
        .bind(id).bind(input.sort_order).fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Todo not found"))?;
    Ok(Json(row))
}
