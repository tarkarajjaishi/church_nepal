use crate::handlers::ValidatedJson;
use crate::security::xss;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::handlers::audit::create_audit_entry;
use crate::models::{ChurchEvent, CreateEvent, Paginated, Pagination, UpdateEvent};
use chrono::Utc;

pub async fn list(Db(pool): Db, Query(p): Query<Pagination>) -> Result<Json<Paginated<ChurchEvent>>, AppError> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events").fetch_one(&pool).await?;
    let rows = sqlx::query_as::<_, ChurchEvent>("SELECT * FROM events ORDER BY created_at DESC LIMIT $1 OFFSET $2")
        .bind(p.limit()).bind(p.offset()).fetch_all(&pool).await?;
    Ok(Json(Paginated::new(rows, total, &p)))
}

pub async fn get(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<ChurchEvent>, AppError> {
    let row = sqlx::query_as::<_, ChurchEvent>("SELECT * FROM events WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Event not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, Db(pool): Db, ValidatedJson(input): ValidatedJson<CreateEvent>) -> Result<Json<ChurchEvent>, AppError> {
     let title = xss::sanitize_plain(&input.title);
     let description = xss::sanitize_plain(&input.description);
     let location = xss::sanitize_plain(&input.location);
     let enabled = match input.published_at {
         Some(ref at) if *at > Utc::now().naive_utc() => false,
         Some(_) => true,
         None => true,
     };
     let row = sqlx::query_as::<_, ChurchEvent>(
         r#"INSERT INTO events (title, date, display_date, time, location, image, description, capacity, enabled, published_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *"#,
     )
     .bind(&title)
     .bind(&input.date)
     .bind(&input.display_date)
     .bind(&input.time)
     .bind(&location)
     .bind(&input.image)
     .bind(&description)
     .bind(input.capacity.unwrap_or(0))
     .bind(enabled)
     .bind(input.published_at)
      .fetch_one(&pool).await?;
      let _ = create_audit_entry(&pool, &_auth.email, "create", "event", &row.id.to_string(), Some(serde_json::json!({"id": row.id}))).await;
 }

pub async fn update(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, ValidatedJson(input): ValidatedJson<UpdateEvent>) -> Result<Json<ChurchEvent>, AppError> {
    let existing = sqlx::query_as::<_, ChurchEvent>("SELECT * FROM events WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Event not found"))?;

    let enabled = match input.published_at {
        Some(ref at) if *at > Utc::now().naive_utc() => false,
        Some(_) => true,
        None => input.enabled.unwrap_or(existing.enabled.unwrap_or(true)),
    };

    let row = sqlx::query_as::<_, ChurchEvent>(
        r#"UPDATE events SET title=COALESCE($2,title), date=COALESCE($3,date), display_date=COALESCE($4,display_date), time=COALESCE($5,time), location=COALESCE($6,location), image=COALESCE($7,image), description=COALESCE($8,description), capacity=COALESCE($9,capacity), enabled=COALESCE($10,enabled), published_at=COALESCE($11,published_at) WHERE id=$1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.title.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.title.as_deref()))
    .bind(input.date.as_deref().or(existing.date.as_deref()))
    .bind(input.display_date.as_deref().or(existing.display_date.as_deref()))
    .bind(input.time.as_deref().or(existing.time.as_deref()))
    .bind(input.location.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.location.as_deref()))
    .bind(input.image.as_deref().or(existing.image.as_deref()))
    .bind(input.description.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.description.as_deref()))
    .bind(input.capacity.unwrap_or(existing.capacity.unwrap_or(0)))
    .bind(enabled)
    .bind(input.published_at)
    .fetch_one(&pool).await?;
    let _ = create_audit_entry(&pool, &_auth.email, "update", "event", &row.id.to_string(), Some(serde_json::json!({"id": row.id}))).await;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM events WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    let _ = create_audit_entry(&pool, &_auth.email, "delete", "event", &id.to_string(), Some(serde_json::json!({"id": id}))).await;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<ChurchEvent>, AppError> {
    let row = sqlx::query_as::<_, ChurchEvent>(
        "UPDATE events SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("ChurchEvent not found"))?;
    let _ = create_audit_entry(&pool, &_auth.email, "toggle", "event", &row.id.to_string(), Some(serde_json::json!({"id": row.id, "enabled": row.enabled}))).await;
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
) -> Result<Json<ChurchEvent>, AppError> {
    let row = sqlx::query_as::<_, ChurchEvent>(
        "UPDATE events SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("ChurchEvent not found"))?;
    let _ = create_audit_entry(&pool, &_auth.email, "reorder", "event", &row.id.to_string(), Some(serde_json::json!({"id": row.id, "sort_order": input.sort_order}))).await;
    Ok(Json(row))
}
