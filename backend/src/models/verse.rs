use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, FromRow, Validate)]
pub struct Verse {
    pub id: uuid::Uuid,
    pub text: String,
    pub ref_text: String,
    pub ne: String,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
    pub is_pinned: Option<bool>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateVerse {
    #[validate(length(min = 1, max = 5000, message = "Verse text must be 1-5000 characters"))]
    pub text: String,
    #[validate(length(max = 200, message = "Reference must not exceed 200 characters"))]
    pub ref_text: String,
    #[validate(length(max = 5000, message = "Nepali text must not exceed 5000 characters"))]
    pub ne: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateVerse {
    #[validate(length(max = 5000, message = "Verse text must not exceed 5000 characters"))]
    pub text: Option<String>,
    #[validate(length(max = 200, message = "Reference must not exceed 200 characters"))]
    pub ref_text: Option<String>,
    #[validate(length(max = 5000, message = "Nepali text must not exceed 5000 characters"))]
    pub ne: Option<String>,
}
