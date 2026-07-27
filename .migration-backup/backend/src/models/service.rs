use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Service {
    pub id: uuid::Uuid,
    pub title: String,
    pub description: String,
    pub category: String,
    pub price: Option<f64>,
    pub image: String,
    pub featured: bool,
    pub enabled: bool,
    pub sort_order: Option<i32>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateService {
    pub title: String,
    pub description: String,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub price: Option<f64>,
    #[serde(default)]
    pub image: Option<String>,
    #[serde(default)]
    pub featured: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateService {
    pub title: Option<String>,
    pub description: Option<String>,
    pub category: Option<String>,
    pub price: Option<f64>,
    pub image: Option<String>,
    pub featured: Option<bool>,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
}
