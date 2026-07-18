use crate::tenant::Db;
use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::form::{Form, FormSubmission, CreateForm, UpdateForm, SubmitForm};

pub async fn list(
    _auth: AuthUser,
    Db(pool): Db,
) -> Result<Json<Vec<Form>>, AppError> {
    let rows = sqlx::query_as::<_, Form>(
        "SELECT * FROM forms ORDER BY created_at DESC",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn get(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Form>, AppError> {
    let row = sqlx::query_as::<_, Form>(
        "SELECT * FROM forms WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Form not found"))?;
    Ok(Json(row))
}

pub async fn create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CreateForm>,
) -> Result<Json<Form>, AppError> {
    let row = sqlx::query_as::<_, Form>(
        r#"INSERT INTO forms (title, description, fields, status, submit_action)
           VALUES ($1, $2, $3, $4, $5) RETURNING *"#,
    )
    .bind(&input.title)
    .bind(input.description.as_deref().unwrap_or(""))
    .bind(&input.fields)
    .bind(input.status.as_deref().unwrap_or("active"))
    .bind(input.submit_action.as_deref().unwrap_or("email"))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdateForm>,
) -> Result<Json<Form>, AppError> {
    let existing = sqlx::query_as::<_, Form>(
        "SELECT * FROM forms WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Form not found"))?;

    let row = sqlx::query_as::<_, Form>(
        r#"UPDATE forms SET
            title = COALESCE($2, title),
            description = COALESCE($3, description),
            fields = COALESCE($4, fields),
            status = COALESCE($5, status),
            submit_action = COALESCE($6, submit_action),
            updated_at = NOW()
         WHERE id = $1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.title.as_deref().unwrap_or(&existing.title))
    .bind(input.description.as_deref().unwrap_or(&existing.description))
    .bind(input.fields.as_ref().unwrap_or(&existing.fields))
    .bind(input.status.as_deref().unwrap_or(&existing.status))
    .bind(input.submit_action.as_deref().unwrap_or(&existing.submit_action))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM forms WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn submit_public(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<SubmitForm>,
) -> Result<Json<FormSubmission>, AppError> {
    let _form = sqlx::query_as::<_, Form>(
        "SELECT * FROM forms WHERE id = $1 AND status = 'active'",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Form not found or inactive"))?;

    let row = sqlx::query_as::<_, FormSubmission>(
        r#"INSERT INTO form_submissions (form_id, data)
           VALUES ($1, $2) RETURNING *"#,
    )
    .bind(id)
    .bind(&input.data)
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn list_submissions(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Vec<FormSubmission>>, AppError> {
    let rows = sqlx::query_as::<_, FormSubmission>(
        "SELECT * FROM form_submissions WHERE form_id = $1 ORDER BY created_at DESC",
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}
