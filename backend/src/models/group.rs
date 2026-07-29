use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Group {
    pub id: i32,
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub meeting_day: Option<String>,
    pub meeting_time: Option<String>,
    pub location: Option<String>,
    pub leader_id: Option<i32>,
    pub category: Option<String>,
    pub image_url: Option<String>,
    pub max_members: Option<i32>,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
    pub updated_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateGroup {
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub meeting_day: Option<String>,
    pub meeting_time: Option<String>,
    pub location: Option<String>,
    pub leader_id: Option<i32>,
    pub category: Option<String>,
    pub image_url: Option<String>,
    pub max_members: Option<i32>,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateGroup {
    pub slug: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub meeting_day: Option<String>,
    pub meeting_time: Option<String>,
    pub location: Option<String>,
    pub leader_id: Option<i32>,
    pub category: Option<String>,
    pub image_url: Option<String>,
    pub max_members: Option<i32>,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
}
