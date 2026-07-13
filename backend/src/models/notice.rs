use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Notice {
    pub id: uuid::Uuid,
    pub title: String,
    pub date: String,
    pub category: String,
    pub text: String,
    pub urgent: bool,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateNotice {
    pub title: String,
    pub date: String,
    pub category: String,
    pub text: String,
    pub urgent: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateNotice {
    pub title: Option<String>,
    pub date: Option<String>,
    pub category: Option<String>,
    pub text: Option<String>,
    pub urgent: Option<bool>,
}
