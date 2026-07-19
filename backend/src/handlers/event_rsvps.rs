use crate::tenant::Db;
use axum::extract::Path;
use axum::Json;
use crate::error::AppError;
use crate::models::event_rsvp::{EventRsvp, CreateEventRsvp};

pub async fn list_by_event(
    Db(pool): Db,
    Path(event_id): Path<uuid::Uuid>,
) -> Result<Json<Vec<EventRsvp>>, AppError> {
    let rows = sqlx::query_as::<_, EventRsvp>(
        "SELECT * FROM event_rsvps WHERE event_id = $1 ORDER BY created_at DESC",
    )
    .bind(event_id)
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn create_public(
    Db(pool): Db,
    Json(input): Json<CreateEventRsvp>,
) -> Result<Json<EventRsvp>, AppError> {
    let row = sqlx::query_as::<_, EventRsvp>(
        r#"INSERT INTO event_rsvps (event_id, name, email, phone, guests)
           VALUES ($1, $2, $3, $4, $5) RETURNING *"#,
    )
    .bind(input.event_id)
    .bind(&input.name)
    .bind(&input.email)
    .bind(&input.phone)
    .bind(input.guests.unwrap_or(1))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn delete(
    _auth: crate::auth::AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM event_rsvps WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
