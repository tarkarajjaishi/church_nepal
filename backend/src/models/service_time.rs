use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ServiceTime {
    pub id: uuid::Uuid,
    pub name: String,
    pub name_ne: String,
    pub day: String,
    pub time: String,
    pub icon: String,
    pub sort_order: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateServiceTime {
    pub name: String,
    pub name_ne: String,
    pub day: String,
    pub time: String,
    pub icon: String,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateServiceTime {
    pub name: Option<String>,
    pub name_ne: Option<String>,
    pub day: Option<String>,
    pub time: Option<String>,
    pub icon: Option<String>,
    pub sort_order: Option<i32>,
}
