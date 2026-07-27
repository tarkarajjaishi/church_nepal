use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, FromRow, Validate)]
pub struct Ministry {
    pub id: uuid::Uuid,
    pub name: String,
    pub name_ne: String,
    pub description: String,
    pub leader: String,
    pub meeting: String,
    pub image: String,
    pub icon: String,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateMinistry {
    #[validate(length(min = 1, max = 100, message = "Name must be 1-100 characters"))]
    pub name: String,
    #[validate(length(max = 100, message = "Name NE must not exceed 100 characters"))]
    pub name_ne: String,
    #[validate(length(max = 5000, message = "Description must not exceed 5000 characters"))]
    pub description: String,
    #[validate(length(max = 200, message = "Leader must not exceed 200 characters"))]
    pub leader: String,
    #[validate(length(max = 200, message = "Meeting must not exceed 200 characters"))]
    pub meeting: String,
    pub image: String,
    #[validate(length(max = 100, message = "Icon must not exceed 100 characters"))]
    pub icon: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateMinistry {
    #[validate(length(min = 1, max = 100, message = "Name must be 1-100 characters"))]
    pub name: Option<String>,
    #[validate(length(max = 100, message = "Name NE must not exceed 100 characters"))]
    pub name_ne: Option<String>,
    #[validate(length(max = 5000, message = "Description must not exceed 5000 characters"))]
    pub description: Option<String>,
    #[validate(length(max = 200, message = "Leader must not exceed 200 characters"))]
    pub leader: Option<String>,
    #[validate(length(max = 200, message = "Meeting must not exceed 200 characters"))]
    pub meeting: Option<String>,
    pub image: Option<String>,
    #[validate(length(max = 100, message = "Icon must not exceed 100 characters"))]
    pub icon: Option<String>,
}
