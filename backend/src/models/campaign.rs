use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Campaign {
    pub id: uuid::Uuid,
    pub title: String,
    pub raised: i64,
    pub goal: i64,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateCampaign {
    pub title: String,
    pub raised: Option<i64>,
    pub goal: i64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCampaign {
    pub title: Option<String>,
    pub raised: Option<i64>,
    pub goal: Option<i64>,
}
