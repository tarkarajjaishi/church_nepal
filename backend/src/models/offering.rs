use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Offering {
    pub id: uuid::Uuid,
    pub service_date: chrono::NaiveDate,
    pub service_name: String,
    pub offering_type: String,
    pub total_amount: i64,
    pub currency: String,
    pub recorded_by: String,
    pub notes: Option<String>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateOffering {
    pub service_date: String,
    pub service_name: Option<String>,
    pub offering_type: Option<String>,
    pub total_amount: Option<i64>,
    pub currency: Option<String>,
    pub recorded_by: Option<String>,
    pub notes: Option<String>,
    pub items: Option<Vec<CreateOfferingItem>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateOffering {
    pub service_date: Option<String>,
    pub service_name: Option<String>,
    pub offering_type: Option<String>,
    pub total_amount: Option<i64>,
    pub currency: Option<String>,
    pub recorded_by: Option<String>,
    pub notes: Option<String>,
    pub items: Option<Vec<CreateOfferingItem>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct OfferingItem {
    pub id: uuid::Uuid,
    pub offering_id: uuid::Uuid,
    pub denomination: String,
    pub count: i32,
    pub amount: i64,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateOfferingItem {
    pub denomination: String,
    pub count: i32,
    pub amount: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OfferingWithItems {
    #[serde(flatten)]
    pub offering: Offering,
    pub items: Vec<OfferingItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OfferingStats {
    pub total_this_month: i64,
    pub total_this_year: i64,
    pub total_all_time: i64,
    pub count_this_month: i64,
    pub avg_per_service: i64,
    pub by_type: Vec<TypeStat>,
    pub monthly_trend: Vec<MonthlyStat>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct TypeStat {
    pub offering_type: String,
    pub total: i64,
    pub count: i64,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct MonthlyStat {
    pub month: String,
    pub total: i64,
    pub count: i64,
}
