use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Fund {
    pub id: uuid::Uuid,
    pub name: String,
    pub description: String,
    pub fund_type: String,
    pub is_active: bool,
    pub sort_order: i32,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateFund {
    pub name: String,
    pub description: Option<String>,
    pub fund_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateFund {
    pub name: Option<String>,
    pub description: Option<String>,
    pub fund_type: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct RecurringDonation {
    pub id: uuid::Uuid,
    pub member_id: Option<uuid::Uuid>,
    pub amount: i64,
    pub interval: String,
    pub gateway: String,
    pub next_charge_at: Option<chrono::NaiveDateTime>,
    pub active: bool,
    pub stripe_subscription_id: Option<String>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateRecurringDonation {
    pub member_id: Option<uuid::Uuid>,
    pub amount: i64,
    pub interval: Option<String>,
    pub gateway: Option<String>,
    pub stripe_customer_id: Option<String>,
}
