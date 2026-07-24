use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, FromRow, Validate)]
pub struct Sermon {
    pub id: uuid::Uuid,
    pub title: String,
    pub speaker: String,
    pub date: String,
    pub duration: String,
    pub series: String,
    pub topic: String,
    pub image: String,
    pub description: String,
    pub video_url: Option<String>,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
    pub published_at: Option<chrono::NaiveDateTime>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateSermon {
    #[validate(length(min = 1, max = 200, message = "Title must be 1-200 characters"))]
    pub title: String,
    #[validate(length(max = 200, message = "Speaker must not exceed 200 characters"))]
    pub speaker: String,
    pub date: String,
    pub duration: String,
    #[validate(length(max = 200, message = "Series must not exceed 200 characters"))]
    pub series: String,
    #[validate(length(max = 200, message = "Topic must not exceed 200 characters"))]
    pub topic: String,
    pub image: String,
    #[validate(length(max = 10000, message = "Description must not exceed 10000 characters"))]
    pub description: String,
    #[serde(default)]
    pub video_url: Option<String>,
    #[serde(default)]
    pub enabled: Option<bool>,
    #[serde(default)]
    pub published_at: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateSermon {
    #[validate(length(max = 200, message = "Title must not exceed 200 characters"))]
    pub title: Option<String>,
    #[validate(length(max = 200, message = "Speaker must not exceed 200 characters"))]
    pub speaker: Option<String>,
    pub date: Option<String>,
    pub duration: Option<String>,
    #[validate(length(max = 200, message = "Series must not exceed 200 characters"))]
    pub series: Option<String>,
    #[validate(length(max = 200, message = "Topic must not exceed 200 characters"))]
    pub topic: Option<String>,
    pub image: Option<String>,
    #[validate(length(max = 10000, message = "Description must not exceed 10000 characters"))]
    pub description: Option<String>,
    pub video_url: Option<String>,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
    pub published_at: Option<chrono::NaiveDateTime>,
}
