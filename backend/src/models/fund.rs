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
    pub donor_name: String,
    pub donor_email: String,
    pub donor_phone: String,
    pub fund_id: Option<uuid::Uuid>,
    pub amount: i64,
    pub frequency: String,
    pub payment_method: String,
    pub status: String,
    pub next_date: Option<chrono::NaiveDate>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateRecurringDonation {
    pub donor_name: String,
    pub donor_email: String,
    pub donor_phone: Option<String>,
    pub fund_id: Option<uuid::Uuid>,
    pub amount: i64,
    pub frequency: Option<String>,
    pub payment_method: Option<String>,
}
