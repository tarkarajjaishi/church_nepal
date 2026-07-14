use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ContentBlock {
    pub id: uuid::Uuid,
    pub section_key: String,
    pub title: String,
    pub subtitle: Option<String>,
    pub body: Option<String>,
    pub image: Option<String>,
    pub icon: Option<String>,
    pub items: Option<serde_json::Value>,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Deserialize)]
pub struct CreateContentBlock {
    pub section_key: String,
    pub title: String,
    #[serde(default)]
    pub subtitle: String,
    #[serde(default)]
    pub body: String,
    #[serde(default)]
    pub image: String,
    #[serde(default)]
    pub icon: String,
    #[serde(default)]
    pub items: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub struct UpdateContentBlock {
    pub title: Option<String>,
    pub subtitle: Option<String>,
    pub body: Option<String>,
    pub image: Option<String>,
    pub icon: Option<String>,
    pub items: Option<serde_json::Value>,
    pub sort_order: Option<i32>,
}
