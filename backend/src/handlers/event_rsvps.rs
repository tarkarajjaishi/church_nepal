use crate::tenant::Db;
use axum::extract::Path;
use axum::Json;
use crate::error::AppError;
use crate::models::event_rsvp::{EventRsvp, CreateEventRsvp};
use crate::models::event::ChurchEvent;

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

fn send_event_rsvp_confirmation(rsvp: &EventRsvp, event: &ChurchEvent) {
    let subject = format!("RSVP Confirmed: {}", event.title);
    let body = format!(
        "Dear {},\n\nThank you for registering for {}. We have reserved {} spot(s) for you.\n\nEvent Details:\nDate: {}\nTime: {}\nLocation: {}\n\nPlease arrive 10 minutes early. See you there!\n\nGrace Nepal Church",
        rsvp.name, event.title, rsvp.guests, event.display_date, event.time, event.location
    );
    eprintln!(
        "[EMAIL] To: {} <{}>\nSubject: {}\n{}\n",
        rsvp.name, rsvp.email, subject, body
    );
}

pub async fn create_public(
    Db(pool): Db,
    Json(input): Json<CreateEventRsvp>,
) -> Result<Json<EventRsvp>, AppError> {
    let capacity: Option<i32> = sqlx::query_scalar(
        "SELECT capacity FROM events WHERE id = $1"
    )
    .bind(input.event_id)
    .fetch_optional(&pool)
    .await?
    .flatten()
    .unwrap_or(0);

    let accepted_count: i32 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(guests), 0) FROM event_rsvps WHERE event_id = $1 AND status = 'registered'"
    )
    .bind(input.event_id)
    .fetch_one(&pool)
    .await?;

    let status = if capacity > 0 && accepted_count >= capacity {
        "waitlist"
    } else {
        "registered"
    };

    let row = sqlx::query_as::<_, EventRsvp>(
        r#"INSERT INTO event_rsvps (event_id, name, email, phone, guests, status)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *"#,
    )
    .bind(input.event_id)
    .bind(&input.name)
    .bind(&input.email)
    .bind(input.phone.unwrap_or_default())
    .bind(input.guests.unwrap_or(1))
    .bind(status)
    .fetch_one(&pool)
    .await?;

    let event = sqlx::query_as::<_, ChurchEvent>(
        "SELECT * FROM events WHERE id = $1"
    )
    .bind(input.event_id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Event not found"))?;

    send_event_rsvp_confirmation(&row, &event);

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
