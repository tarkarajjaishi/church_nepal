use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Donation {
    pub id: uuid::Uuid,
    pub donor_name: String,
    pub donor_email: String,
    pub donor_phone: String,
    pub amount: i64,
    pub payment_method: String,
    pub campaign_id: Option<uuid::Uuid>,
    pub fund_id: Option<uuid::Uuid>,
    pub transaction_id: String,
    pub status: String,
    pub notes: String,
    pub refund_amount: i64,
    pub refund_status: String,
    pub refunded_at: Option<chrono::NaiveDateTime>,
    pub refund_reason: String,
    pub gateway_refund_id: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct InitiateDonation {
    pub donor_name: Option<String>,
    pub donor_email: Option<String>,
    pub donor_phone: Option<String>,
    pub amount: i64,
    pub payment_method: String,
    pub campaign_id: Option<uuid::Uuid>,
    pub notes: Option<String>,
    pub fund_id: Option<uuid::Uuid>,
    pub frequency: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct EsewaCallback {
    pub oid: String,
    pub amt: String,
    #[serde(rename = "refId")]
    pub ref_id: String,
    #[serde(rename = "refId2")]
    pub ref_id2: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct KhaltiCallback {
    pub token: String,
    pub amount: i64,
}

#[derive(Debug, Deserialize)]
pub struct StripeCallback {
    pub session_id: String,
}
