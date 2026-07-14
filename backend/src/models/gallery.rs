use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct GalleryItem {
    pub id: uuid::Uuid,
    pub title: String,
    pub category: String,
    pub image: String,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateGalleryItem {
    pub title: String,
    pub category: String,
    pub image: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateGalleryItem {
    pub title: Option<String>,
    pub category: Option<String>,
    pub image: Option<String>,
    pub sort_order: Option<i32>,
}
