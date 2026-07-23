use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
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

#[derive(Debug, Deserialize)]
pub struct CreateSermon {
    pub title: String,
    pub speaker: String,
    pub date: String,
    pub duration: String,
    pub series: String,
    pub topic: String,
    pub image: String,
    pub description: String,
    #[serde(default)]
    pub video_url: Option<String>,
    #[serde(default)]
    pub enabled: Option<bool>,
    #[serde(default)]
    pub published_at: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSermon {
    pub title: Option<String>,
    pub speaker: Option<String>,
    pub date: Option<String>,
    pub duration: Option<String>,
    pub series: Option<String>,
    pub topic: Option<String>,
    pub image: Option<String>,
    pub description: Option<String>,
    pub video_url: Option<String>,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
    pub published_at: Option<chrono::NaiveDateTime>,
}
