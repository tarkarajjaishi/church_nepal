use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct BlogPost {
    pub id: uuid::Uuid,
    pub title: String,
    pub slug: String,
    pub content: String,
    pub excerpt: String,
    pub author: String,
    pub category: String,
    pub image: String,
    pub published: bool,
    pub featured: bool,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateBlogPost {
    pub title: String,
    pub slug: String,
    pub content: String,
    #[serde(default)]
    pub excerpt: Option<String>,
    #[serde(default)]
    pub author: Option<String>,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub image: Option<String>,
    #[serde(default)]
    pub published: Option<bool>,
    #[serde(default)]
    pub featured: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBlogPost {
    pub title: Option<String>,
    pub slug: Option<String>,
    pub content: Option<String>,
    pub excerpt: Option<String>,
    pub author: Option<String>,
    pub category: Option<String>,
    pub image: Option<String>,
    pub published: Option<bool>,
    pub featured: Option<bool>,
}
