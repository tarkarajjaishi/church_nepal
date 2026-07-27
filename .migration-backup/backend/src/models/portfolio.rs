use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct PortfolioProject {
    pub id: uuid::Uuid,
    pub title: String,
    pub description: String,
    pub image: String,
    pub category: String,
    pub client: String,
    pub year: String,
    pub url: Option<String>,
    pub featured: bool,
    pub enabled: bool,
    pub sort_order: Option<i32>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreatePortfolioProject {
    pub title: String,
    pub description: String,
    #[serde(default)]
    pub image: Option<String>,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub client: Option<String>,
    #[serde(default)]
    pub year: Option<String>,
    pub url: Option<String>,
    #[serde(default)]
    pub featured: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePortfolioProject {
    pub title: Option<String>,
    pub description: Option<String>,
    pub image: Option<String>,
    pub category: Option<String>,
    pub client: Option<String>,
    pub year: Option<String>,
    pub url: Option<String>,
    pub featured: Option<bool>,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
}
