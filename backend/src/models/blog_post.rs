use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, FromRow, Validate)]
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
    pub published_at: Option<chrono::NaiveDateTime>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateBlogPost {
    #[validate(length(min = 1, max = 200, message = "Title must be 1-200 characters"))]
    pub title: String,
    #[validate(length(min = 1, max = 200, message = "Slug must be 1-200 characters"))]
    pub slug: String,
    #[validate(length(min = 1, max = 20000, message = "Content must be 1-20000 characters"))]
    pub content: String,
    #[validate(length(max = 3000, message = "Excerpt must not exceed 3000 characters"))]
    #[serde(default)]
    pub excerpt: Option<String>,
    #[validate(length(max = 200, message = "Author must not exceed 200 characters"))]
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
    #[serde(default)]
    pub published_at: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateBlogPost {
    #[validate(length(max = 200, message = "Title must not exceed 200 characters"))]
    pub title: Option<String>,
    #[validate(length(max = 200, message = "Slug must not exceed 200 characters"))]
    pub slug: Option<String>,
    #[validate(length(max = 20000, message = "Content must not exceed 20000 characters"))]
    pub content: Option<String>,
    #[validate(length(max = 3000, message = "Excerpt must not exceed 3000 characters"))]
    pub excerpt: Option<String>,
    #[validate(length(max = 200, message = "Author must not exceed 200 characters"))]
    pub author: Option<String>,
    pub category: Option<String>,
    pub image: Option<String>,
    pub published: Option<bool>,
    pub featured: Option<bool>,
    pub published_at: Option<chrono::NaiveDateTime>,
}
