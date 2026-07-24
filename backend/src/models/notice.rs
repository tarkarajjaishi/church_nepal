use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, FromRow, Validate)]
pub struct Notice {
    pub id: uuid::Uuid,
    pub title: String,
    pub date: String,
    pub category: String,
    pub text: String,
    pub urgent: bool,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
    pub published_at: Option<chrono::NaiveDateTime>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateNotice {
    #[validate(length(min = 1, max = 200, message = "Title must be 1-200 characters"))]
    pub title: String,
    pub date: String,
    #[validate(length(max = 100, message = "Category must not exceed 100 characters"))]
    pub category: String,
    #[validate(length(max = 10000, message = "Text must not exceed 10000 characters"))]
    pub text: String,
    pub urgent: Option<bool>,
    #[serde(default)]
    pub enabled: Option<bool>,
    #[serde(default)]
    pub published_at: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateNotice {
    #[validate(length(max = 200, message = "Title must not exceed 200 characters"))]
    pub title: Option<String>,
    pub date: Option<String>,
    #[validate(length(max = 100, message = "Category must not exceed 100 characters"))]
    pub category: Option<String>,
    #[validate(length(max = 10000, message = "Text must not exceed 10000 characters"))]
    pub text: Option<String>,
    pub urgent: Option<bool>,
    pub enabled: Option<bool>,
    pub published_at: Option<chrono::NaiveDateTime>,
}
