//! Offering Management module.
//!
//! Money is always `i64` minor units (paisa). Never f64 — a float cannot hold
//! 0.01 exactly, and rounding drift in a giving ledger is unacceptable.

use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct OfferingCategory {
    pub id: uuid::Uuid,
    pub name: String,
    pub slug: String,
    pub description: String,
    pub color: String,
    pub icon: String,
    pub default_fund_id: Option<uuid::Uuid>,
    pub is_active: bool,
    pub sort_order: i32,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct UpsertOfferingCategory {
    pub name: String,
    pub slug: Option<String>,
    pub description: Option<String>,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub default_fund_id: Option<uuid::Uuid>,
    pub is_active: Option<bool>,
    pub sort_order: Option<i32>,
}

// ---------------------------------------------------------------------------
// Bank accounts
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct BankAccount {
    pub id: uuid::Uuid,
    pub bank_name: String,
    pub account_name: String,
    pub account_number: String,
    pub branch: String,
    pub swift_code: String,
    pub currency: String,
    pub opening_balance: i64,
    pub current_balance: i64,
    pub is_active: bool,
    pub notes: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct UpsertBankAccount {
    pub bank_name: String,
    pub account_name: Option<String>,
    pub account_number: String,
    pub branch: Option<String>,
    pub swift_code: Option<String>,
    pub currency: Option<String>,
    pub opening_balance: Option<i64>,
    pub is_active: Option<bool>,
    pub notes: Option<String>,
}

// ---------------------------------------------------------------------------
// Cash counting
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct CashCount {
    pub id: uuid::Uuid,
    pub offering_id: Option<uuid::Uuid>,
    pub count_date: chrono::NaiveDate,
    pub service_name: String,
    pub counter_one: String,
    pub counter_two: String,
    pub supervisor: String,
    pub expected_total: i64,
    pub counted_total: i64,
    pub variance: i64,
    pub variance_reason: String,
    pub status: String,
    pub is_locked: bool,
    pub approved_by: Option<String>,
    pub approved_at: Option<chrono::NaiveDateTime>,
    pub notes: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct CashCountLine {
    pub id: uuid::Uuid,
    pub cash_count_id: uuid::Uuid,
    pub denomination: i64,
    pub label: String,
    pub quantity: i32,
    pub subtotal: i64,
    pub counted_by: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize)]
pub struct CashCountWithLines {
    #[serde(flatten)]
    pub count: CashCount,
    pub lines: Vec<CashCountLine>,
}

#[derive(Debug, Deserialize)]
pub struct CashCountLineInput {
    pub denomination: i64,
    pub label: Option<String>,
    pub quantity: i32,
    /// "one" | "two" — which counter recorded this tally.
    pub counted_by: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertCashCount {
    pub offering_id: Option<uuid::Uuid>,
    pub count_date: Option<String>,
    pub service_name: Option<String>,
    pub counter_one: Option<String>,
    pub counter_two: Option<String>,
    pub supervisor: Option<String>,
    pub expected_total: Option<i64>,
    pub variance_reason: Option<String>,
    pub notes: Option<String>,
    pub lines: Option<Vec<CashCountLineInput>>,
}

// ---------------------------------------------------------------------------
// Deposits
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Deposit {
    pub id: uuid::Uuid,
    pub deposit_date: chrono::NaiveDate,
    pub bank_account_id: Option<uuid::Uuid>,
    pub reference_no: String,
    pub amount: i64,
    pub slip_url: String,
    pub deposited_by: String,
    pub verified_by: Option<String>,
    pub verified_at: Option<chrono::NaiveDateTime>,
    pub status: String,
    pub notes: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct UpsertDeposit {
    pub deposit_date: Option<String>,
    pub bank_account_id: Option<uuid::Uuid>,
    pub reference_no: Option<String>,
    pub amount: Option<i64>,
    pub slip_url: Option<String>,
    pub deposited_by: Option<String>,
    pub notes: Option<String>,
    /// Offerings banked by this deposit.
    pub offering_ids: Option<Vec<uuid::Uuid>>,
}

// ---------------------------------------------------------------------------
// Enriched offering row for the admin table.
//
// The table shows category and fund names, not ids, so they are joined here
// rather than fetched per row by the client (which would be N+1 over the page).
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct OfferingRow {
    pub id: uuid::Uuid,
    pub receipt_no: Option<String>,
    pub service_date: chrono::NaiveDate,
    pub service_time: Option<chrono::NaiveTime>,
    pub service_name: String,
    pub offering_type: String,
    pub category_id: Option<uuid::Uuid>,
    pub category_name: Option<String>,
    pub category_color: Option<String>,
    pub fund_id: Option<uuid::Uuid>,
    pub fund_name: Option<String>,
    pub donor_person_id: Option<uuid::Uuid>,
    pub donor_name: String,
    pub is_anonymous: bool,
    pub giver_type: String,
    pub total_amount: i64,
    pub currency: String,
    pub payment_method: String,
    pub reference_no: String,
    pub bank_account_id: Option<uuid::Uuid>,
    pub status: String,
    pub entered_by: String,
    pub approved_by: Option<String>,
    pub approved_at: Option<chrono::NaiveDateTime>,
    pub notes: Option<String>,
    pub created_at: chrono::NaiveDateTime,
}

/// Filters for the offerings table. Every field is optional; the handler binds
/// only what is present so the query stays parameterised.
#[derive(Debug, Deserialize, Default)]
pub struct OfferingFilter {
    pub from_date: Option<String>,
    pub to_date: Option<String>,
    pub category_id: Option<uuid::Uuid>,
    pub fund_id: Option<uuid::Uuid>,
    pub service_name: Option<String>,
    pub payment_method: Option<String>,
    pub status: Option<String>,
    pub donor: Option<String>,
    pub min_amount: Option<i64>,
    pub max_amount: Option<i64>,
    pub search: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub sort: Option<String>,
    pub dir: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct OfferingPage {
    pub data: Vec<OfferingRow>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub total_pages: i64,
    /// Sum of `total_amount` across the whole filtered set, not just this page —
    /// a finance table needs the filtered total, not the visible one.
    pub filtered_total: i64,
}

#[derive(Debug, Deserialize)]
pub struct UpsertOffering {
    pub service_date: String,
    pub service_time: Option<String>,
    pub service_name: Option<String>,
    pub category_id: Option<uuid::Uuid>,
    pub fund_id: Option<uuid::Uuid>,
    pub donor_person_id: Option<uuid::Uuid>,
    pub donor_name: Option<String>,
    pub is_anonymous: Option<bool>,
    pub giver_type: Option<String>,
    pub total_amount: i64,
    pub currency: Option<String>,
    pub payment_method: Option<String>,
    pub reference_no: Option<String>,
    pub bank_account_id: Option<uuid::Uuid>,
    pub notes: Option<String>,
    pub attachments: Option<serde_json::Value>,
    /// When true the offering is submitted for approval and gets a receipt
    /// number; otherwise it is saved as a draft.
    pub submit: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct ApprovalInput {
    pub reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BulkStatusInput {
    pub ids: Vec<uuid::Uuid>,
    pub reason: Option<String>,
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize)]
pub struct OfferingDashboard {
    pub today: i64,
    pub this_week: i64,
    pub this_month: i64,
    pub this_year: i64,
    pub total_donations: i64,
    pub online_giving: i64,
    pub cash_giving: i64,
    pub pending_deposits: i64,
    pub pending_deposit_count: i64,
    pub pending_approval_count: i64,
    pub active_campaigns: i64,
    pub total_donors: i64,
    pub currency: String,
    pub monthly_trend: Vec<TrendPoint>,
    pub daily_trend: Vec<TrendPoint>,
    pub by_category: Vec<Breakdown>,
    pub by_payment_method: Vec<Breakdown>,
    pub weekly_comparison: Vec<TrendPoint>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct TrendPoint {
    pub label: String,
    pub amount: i64,
    pub count: i64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Breakdown {
    pub label: String,
    pub color: Option<String>,
    pub amount: i64,
    pub count: i64,
}

// ---------------------------------------------------------------------------
// Fund allocation
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct FundAllocationRule {
    pub id: uuid::Uuid,
    pub category_id: uuid::Uuid,
    pub fund_id: uuid::Uuid,
    pub fund_name: Option<String>,
    pub percentage_bps: i32,
    pub sort_order: i32,
}

#[derive(Debug, Deserialize)]
pub struct AllocationRuleInput {
    pub fund_id: uuid::Uuid,
    pub percentage_bps: i32,
}

#[derive(Debug, Deserialize)]
pub struct SetAllocationRules {
    pub rules: Vec<AllocationRuleInput>,
}
