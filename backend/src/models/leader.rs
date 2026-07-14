use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
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

#[derive(Debug, Deserialize)]
pub struct CreateLeader {
    pub name: String,
    pub role: String,
    pub category: String,
    pub image: String,
    pub bio: String,
    #[serde(default)]
    pub social_links: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLeader {
    pub name: Option<String>,
    pub role: Option<String>,
    pub category: Option<String>,
    pub image: Option<String>,
    pub bio: Option<String>,
    pub social_links: Option<serde_json::Value>,
    pub sort_order: Option<i32>,
}
