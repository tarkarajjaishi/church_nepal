use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct EventRsvp {
    pub id: uuid::Uuid,
    pub event_id: uuid::Uuid,
    pub name: String,
    pub email: String,
    pub phone: String,
    pub guests: i32,
    pub status: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateEventRsvp {
    pub event_id: uuid::Uuid,
    pub name: String,
    pub email: String,
    pub phone: String,
    pub guests: Option<i32>,
}
