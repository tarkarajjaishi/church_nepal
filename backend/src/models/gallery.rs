use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct GalleryItem {
    pub id: uuid::Uuid,
    pub title: String,
    pub category: String,
    pub image: String,
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
}
