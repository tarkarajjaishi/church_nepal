use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Verse {
    pub id: uuid::Uuid,
    pub text: String,
    pub ref_text: String,
    pub ne: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateVerse {
    pub text: String,
    pub ref_text: String,
    pub ne: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateVerse {
    pub text: Option<String>,
    pub ref_text: Option<String>,
    pub ne: Option<String>,
}
