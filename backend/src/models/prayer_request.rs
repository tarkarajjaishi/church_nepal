use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, FromRow, Validate)]
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

#[derive(Debug, Deserialize, Validate)]
pub struct CreatePrayerRequest {
    #[serde(default)]
    #[validate(length(max = 200, message = "Name must not exceed 200 characters"))]
    pub name: Option<String>,
    #[serde(default)]
    #[validate(email(message = "Email must be valid"), length(max = 255))]
    pub email: Option<String>,
    #[serde(default)]
    #[validate(length(max = 30, message = "Phone must not exceed 30 characters"))]
    pub phone: Option<String>,
    #[validate(length(max = 100, message = "Category must not exceed 100 characters"))]
    pub category: Option<String>,
    #[validate(length(min = 1, max = 5000, message = "Message must be 1-5000 characters"))]
    pub message: String,
    #[serde(default)]
    pub anonymous: Option<bool>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdatePrayerRequest {
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub is_public: Option<bool>,
}
