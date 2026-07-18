use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Pledge {
    pub id: uuid::Uuid,
    pub campaign_id: uuid::Uuid,
    pub person_name: String,
    pub person_email: String,
    pub amount: i64,
    pub fulfilled_amount: i64,
    pub status: String,
    pub notes: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreatePledge {
    pub campaign_id: uuid::Uuid,
    pub person_name: String,
    pub person_email: String,
    pub amount: i64,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePledge {
    pub person_name: Option<String>,
    pub person_email: Option<String>,
    pub amount: Option<i64>,
    pub fulfilled_amount: Option<i64>,
    pub status: Option<String>,
    pub notes: Option<String>,
}
