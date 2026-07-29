use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::NaiveDateTime;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Notification {
    pub id: Uuid,
    pub user_id: Uuid,
    pub r#type: String,
    pub title: String,
    pub message: String,
    pub read: bool,
    pub related_id: Option<Uuid>,
    pub related_type: Option<String>,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateNotification {
    pub user_id: Uuid,
    pub r#type: String,
    pub title: String,
    pub message: String,
    pub related_id: Option<Uuid>,
    pub related_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateNotificationRead {
    pub id: Uuid,
    pub read: bool,
}
