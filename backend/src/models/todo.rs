use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Todo {
    pub id: uuid::Uuid,
    pub title: String,
    pub description: String,
    pub priority: String,
    pub status: String,
    pub due_date: String,
    pub sort_order: Option<i32>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateTodo {
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default = "default_priority")]
    pub priority: String,
    #[serde(default = "default_status")]
    pub status: String,
    #[serde(default)]
    pub due_date: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTodo {
    pub title: Option<String>,
    pub description: Option<String>,
    pub priority: Option<String>,
    pub status: Option<String>,
    pub due_date: Option<String>,
    pub sort_order: Option<i32>,
}

fn default_priority() -> String { "medium".to_string() }
fn default_status() -> String { "pending".to_string() }
