use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, FromRow, Validate)]
pub struct Leader {
    pub id: uuid::Uuid,
    pub name: String,
    pub role: String,
    pub category: String,
    pub image: String,
    pub bio: String,
    pub social_links: Option<serde_json::Value>,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateLeader {
    #[validate(length(min = 1, max = 100, message = "Name must be 1-100 characters"))]
    pub name: String,
    #[validate(length(max = 100, message = "Role must not exceed 100 characters"))]
    pub role: String,
    #[validate(length(max = 50, message = "Category must not exceed 50 characters"))]
    pub category: String,
    pub image: String,
    #[validate(length(max = 5000, message = "Bio must not exceed 5000 characters"))]
    pub bio: String,
    #[serde(default)]
    pub social_links: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateLeader {
    #[validate(length(max = 100, message = "Name must not exceed 100 characters"))]
    pub name: Option<String>,
    #[validate(length(max = 100, message = "Role must not exceed 100 characters"))]
    pub role: Option<String>,
    #[validate(length(max = 50, message = "Category must not exceed 50 characters"))]
    pub category: Option<String>,
    pub image: Option<String>,
    #[validate(length(max = 5000, message = "Bio must not exceed 5000 characters"))]
    pub bio: Option<String>,
    pub social_links: Option<serde_json::Value>,
}
