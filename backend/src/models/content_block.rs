use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, FromRow, Validate)]
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

#[derive(Debug, Deserialize, Validate)]
pub struct CreateContentBlock {
    #[validate(length(min = 1, max = 100, message = "Section key must be 1-100 characters"))]
    pub section_key: String,
    #[validate(length(max = 200, message = "Title must not exceed 200 characters"))]
    pub title: String,
    #[serde(default)]
    pub subtitle: String,
    #[validate(length(max = 20000, message = "Body must not exceed 20000 characters"))]
    #[serde(default)]
    pub body: String,
    #[serde(default)]
    pub image: String,
    #[serde(default)]
    pub icon: String,
    #[serde(default)]
    pub items: serde_json::Value,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateContentBlock {
    #[validate(length(max = 200, message = "Title must not exceed 200 characters"))]
    pub title: Option<String>,
    #[validate(length(max = 200, message = "Subtitle must not exceed 500 characters"))]
    pub subtitle: Option<String>,
    #[validate(length(max = 20000, message = "Body must not exceed 20000 characters"))]
    pub body: Option<String>,
    pub image: Option<String>,
    pub icon: Option<String>,
    pub items: Option<serde_json::Value>,
    pub sort_order: Option<i32>,
}
