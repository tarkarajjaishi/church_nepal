use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Member {
    pub id: uuid::Uuid,
    pub name: String,
    pub role: String,
    pub since: String,
    pub image: String,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateMember {
    pub name: String,
    pub role: String,
    pub since: String,
    pub image: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMember {
    pub name: Option<String>,
    pub role: Option<String>,
    pub since: Option<String>,
    pub image: Option<String>,
    pub sort_order: Option<i32>,
}
