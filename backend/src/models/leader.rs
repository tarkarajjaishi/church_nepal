use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Leader {
    pub id: uuid::Uuid,
    pub name: String,
    pub role: String,
    pub category: String,
    pub image: String,
    pub bio: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateLeader {
    pub name: String,
    pub role: String,
    pub category: String,
    pub image: String,
    pub bio: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLeader {
    pub name: Option<String>,
    pub role: Option<String>,
    pub category: Option<String>,
    pub image: Option<String>,
    pub bio: Option<String>,
}
