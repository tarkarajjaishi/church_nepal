use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct NewsletterSubscriber {
    pub id: uuid::Uuid,
    pub email: String,
    pub name: String,
    pub active: bool,
    pub subscribed_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateSubscriber {
    pub email: String,
    #[serde(default)]
    pub name: Option<String>,
}
