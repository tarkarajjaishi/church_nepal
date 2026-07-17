use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct TeamMember {
    pub id: uuid::Uuid,
    pub name: String,
    pub role: String,
    pub bio: String,
    pub image: String,
    pub category: String,
    pub featured: bool,
    pub enabled: bool,
    pub sort_order: Option<i32>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateTeamMember {
    pub name: String,
    pub role: String,
    #[serde(default)]
    pub bio: Option<String>,
    #[serde(default)]
    pub image: Option<String>,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub featured: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTeamMember {
    pub name: Option<String>,
    pub role: Option<String>,
    pub bio: Option<String>,
    pub image: Option<String>,
    pub category: Option<String>,
    pub featured: Option<bool>,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
}
