use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Broadcast {
    pub id: uuid::Uuid,
    pub subject: String,
    pub body: String,
    pub broadcast_type: String,
    pub status: String,
    pub recipient_group: String,
    pub recipient_count: i32,
    pub sent_at: Option<chrono::NaiveDateTime>,
    pub scheduled_at: Option<chrono::NaiveDateTime>,
    pub template_body: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct BroadcastRecipient {
    pub id: uuid::Uuid,
    pub broadcast_id: uuid::Uuid,
    pub recipient_email: String,
    pub recipient_name: String,
    pub recipient_phone: String,
    pub status: String,
    pub sent_at: Option<chrono::NaiveDateTime>,
    pub opened_at: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBroadcast {
    pub subject: String,
    pub body: String,
    pub broadcast_type: Option<String>,
    pub recipient_group: Option<String>,
    pub template_body: Option<String>,
    pub scheduled_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBroadcast {
    pub subject: Option<String>,
    pub body: Option<String>,
    pub broadcast_type: Option<String>,
    pub recipient_group: Option<String>,
    pub template_body: Option<String>,
    pub scheduled_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct BroadcastStats {
    pub total: i64,
    pub sent: i64,
    pub pending: i64,
    pub failed: i64,
    pub opened: i64,
}
