use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Form {
    pub id: uuid::Uuid,
    pub title: String,
    pub description: String,
    pub fields: serde_json::Value,
    pub status: String,
    pub submit_action: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct FormSubmission {
    pub id: uuid::Uuid,
    pub form_id: uuid::Uuid,
    pub data: serde_json::Value,
    pub submitted_ip: Option<String>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateForm {
    pub title: String,
    pub description: Option<String>,
    pub fields: serde_json::Value,
    pub status: Option<String>,
    pub submit_action: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateForm {
    pub title: Option<String>,
    pub description: Option<String>,
    pub fields: Option<serde_json::Value>,
    pub status: Option<String>,
    pub submit_action: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SubmitForm {
    pub data: serde_json::Value,
}
