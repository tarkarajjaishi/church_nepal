use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, FromRow, Validate)]
pub struct ChurchEvent {
    pub id: uuid::Uuid,
    pub title: String,
    pub date: String,
    pub display_date: String,
    pub time: String,
    pub location: String,
    pub image: String,
    pub description: String,
    pub capacity: Option<i32>,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
    pub published_at: Option<chrono::NaiveDateTime>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateEvent {
    #[validate(length(min = 1, max = 200, message = "Title must be 1-200 characters"))]
    pub title: String,
    pub date: String,
    pub display_date: String,
    pub time: String,
    #[validate(length(max = 200, message = "Location must not exceed 200 characters"))]
    pub location: String,
    pub image: String,
    #[validate(length(max = 10000, message = "Description must not exceed 10000 characters"))]
    pub description: String,
    pub capacity: Option<i32>,
    #[serde(default)]
    pub published_at: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateEvent {
    #[validate(length(max = 200, message = "Title must not exceed 200 characters"))]
    pub title: Option<String>,
    pub date: Option<String>,
    pub display_date: Option<String>,
    pub time: Option<String>,
    #[validate(length(max = 200, message = "Location must not exceed 200 characters"))]
    pub location: Option<String>,
    pub image: Option<String>,
    #[validate(length(max = 10000, message = "Description must not exceed 10000 characters"))]
    pub description: Option<String>,
    pub capacity: Option<i32>,
    pub published_at: Option<chrono::NaiveDateTime>,
}
