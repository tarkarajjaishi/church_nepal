use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Testimony {
    pub id: uuid::Uuid,
    pub name: String,
    pub role: String,
    pub quote: String,
    pub image: String,
    pub rating: i32,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateTestimony {
    pub name: String,
    pub role: String,
    pub quote: String,
    pub image: String,
    pub rating: i32,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTestimony {
    pub name: Option<String>,
    pub role: Option<String>,
    pub quote: Option<String>,
    pub image: Option<String>,
    pub rating: Option<i32>,
    pub sort_order: Option<i32>,
}
