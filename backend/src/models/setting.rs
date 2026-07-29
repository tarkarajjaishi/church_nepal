use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Setting {
    pub id: uuid::Uuid,
    pub key: String,
    pub value: String,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSetting {
    pub value: String,
}
