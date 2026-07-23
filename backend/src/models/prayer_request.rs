use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct PrayerRequest {
    pub id: uuid::Uuid,
    pub name: String,
    pub email: String,
    pub phone: String,
    pub category: String,
    pub message: String,
    pub anonymous: bool,
    pub is_public: bool,
    pub pray_count: i32,
    pub status: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreatePrayerRequest {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub email: Option<String>,
    #[serde(default)]
    pub phone: Option<String>,
    #[serde(default)]
    pub category: Option<String>,
    pub message: String,
    #[serde(default)]
    pub anonymous: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePrayerRequest {
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub is_public: Option<bool>,
}
