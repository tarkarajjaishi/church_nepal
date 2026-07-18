use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct AuditLog {
    pub id: uuid::Uuid,
    pub user_email: String,
    pub action: String,
    pub entity_type: String,
    pub entity_id: String,
    pub details: Option<serde_json::Value>,
    pub created_at: chrono::NaiveDateTime,
}
