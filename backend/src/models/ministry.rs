use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
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

#[derive(Debug, Deserialize)]
pub struct CreateMinistry {
    pub name: String,
    pub name_ne: String,
    pub description: String,
    pub leader: String,
    pub meeting: String,
    pub image: String,
    pub icon: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMinistry {
    pub name: Option<String>,
    pub name_ne: Option<String>,
    pub description: Option<String>,
    pub leader: Option<String>,
    pub meeting: Option<String>,
    pub image: Option<String>,
    pub icon: Option<String>,
    pub sort_order: Option<i32>,
}
