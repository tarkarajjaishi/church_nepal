use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, FromRow, Validate)]
pub struct Testimony {
    pub id: uuid::Uuid,
    pub name: String,
    pub role: String,
    pub quote: String,
    pub image: String,
    pub rating: i32,
    pub status: String,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateTestimony {
    #[validate(length(min = 1, max = 200, message = "Name must be 1-200 characters"))]
    pub name: String,
    #[validate(length(max = 200, message = "Role must not exceed 200 characters"))]
    pub role: String,
    #[validate(length(min = 1, max = 5000, message = "Quote must be 1-5000 characters"))]
    pub quote: String,
    pub image: String,
    pub rating: i32,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateTestimony {
    #[validate(length(max = 200, message = "Name must not exceed 200 characters"))]
    pub name: Option<String>,
    #[validate(length(max = 200, message = "Role must not exceed 200 characters"))]
    pub role: Option<String>,
    #[validate(length(max = 5000, message = "Quote must not exceed 5000 characters"))]
    pub quote: Option<String>,
    pub image: Option<String>,
    pub rating: Option<i32>,
    pub status: Option<String>,
}
