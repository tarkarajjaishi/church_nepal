use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ContactInfo {
    pub id: uuid::Uuid,
    pub address: String,
    pub phone: String,
    pub email: String,
    pub hours: String,
    pub map_url: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateContactInfo {
    pub address: String,
    pub phone: String,
    pub email: String,
    pub hours: String,
    #[serde(default)]
    pub map_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateContactInfo {
    pub address: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub hours: Option<String>,
    pub map_url: Option<String>,
}
