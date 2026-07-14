use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ChurchEvent {
    pub id: uuid::Uuid,
    pub title: String,
    pub date: String,
    pub display_date: String,
    pub time: String,
    pub location: String,
    pub image: String,
    pub description: String,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateEvent {
    pub title: String,
    pub date: String,
    pub display_date: String,
    pub time: String,
    pub location: String,
    pub image: String,
    pub description: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateEvent {
    pub title: Option<String>,
    pub date: Option<String>,
    pub display_date: Option<String>,
    pub time: Option<String>,
    pub location: Option<String>,
    pub image: Option<String>,
    pub description: Option<String>,
    pub sort_order: Option<i32>,
}
