use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ContactMessage {
    pub id: uuid::Uuid,
    pub message_type: String,
    pub name: String,
    pub email: String,
    pub phone: String,
    pub message: String,
    pub category: String,
    pub anonymous: bool,
    pub visit_date: String,
    pub status: String,
    pub notes: Option<String>,
    pub answered_at: Option<chrono::NaiveDateTime>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateContactMessage {
    #[serde(default)]
    pub message_type: Option<String>,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub email: Option<String>,
    #[serde(default)]
    pub phone: Option<String>,
    #[serde(default)]
    pub message: Option<String>,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub anonymous: Option<bool>,
    #[serde(default)]
    pub visit_date: Option<String>,
    #[serde(default)]
    pub honeypot: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateContactMessage {
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
    pub answered_at: Option<chrono::NaiveDateTime>,
}
