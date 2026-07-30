//! Asset Management models.
//!
//! Money is `i64` minor units (paisa), as everywhere else in this codebase.
//! Composite responses are explicitly nested, not `#[serde(flatten)]`.

use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Categories & suppliers
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct AssetCategory {
    pub id: uuid::Uuid,
    pub name: String,
    pub slug: String,
    pub description: String,
    pub icon: String,
    pub color: String,
    pub default_useful_life_years: i32,
    pub is_reservable: bool,
    pub sort_order: i32,
    pub is_active: bool,
    /// How many live (non-disposed) assets sit in this category.
    pub asset_count: i64,
}

#[derive(Debug, Deserialize)]
pub struct UpsertCategory {
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub default_useful_life_years: Option<i32>,
    pub is_reservable: Option<bool>,
    pub sort_order: Option<i32>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Supplier {
    pub id: uuid::Uuid,
    pub name: String,
    pub contact_person: String,
    pub phone: String,
    pub email: String,
    pub address: String,
    pub website: String,
    pub notes: String,
    pub is_active: bool,
    pub asset_count: i64,
}

#[derive(Debug, Deserialize)]
pub struct UpsertSupplier {
    pub name: String,
    pub contact_person: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub website: Option<String>,
    pub notes: Option<String>,
    pub is_active: Option<bool>,
}

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

/// Row as stored. `current_value` is NOT here — see `AssetRow`.
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Asset {
    pub id: uuid::Uuid,
    pub asset_code: String,
    pub name: String,
    pub category_id: Option<uuid::Uuid>,
    pub description: String,
    pub serial_number: String,
    pub barcode: String,
    pub manufacturer: String,
    pub model: String,
    pub purchase_date: Option<chrono::NaiveDate>,
    pub purchase_cost: i64,
    pub salvage_value: i64,
    pub depreciation_method: String,
    pub useful_life_years: i32,
    pub supplier_id: Option<uuid::Uuid>,
    pub warranty_expires: Option<chrono::NaiveDate>,
    pub building: String,
    pub room: String,
    pub department: String,
    pub condition: String,
    pub status: String,
    pub photo: String,
    pub attachments: serde_json::Value,
    pub notes: String,
    pub is_reservable: bool,
    pub disposed_at: Option<chrono::NaiveDate>,
    pub disposal_reason: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

/// List/detail row enriched with joins and derived values.
///
/// `current_value` and `accumulated_depreciation` are computed on read, never
/// stored: a depreciated value is a function of cost, date, method and life,
/// so a stored copy is wrong the day after it is written.
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct AssetRow {
    pub id: uuid::Uuid,
    pub asset_code: String,
    pub name: String,
    pub category_id: Option<uuid::Uuid>,
    pub category_name: Option<String>,
    pub category_color: Option<String>,
    pub serial_number: String,
    pub manufacturer: String,
    pub model: String,
    pub purchase_date: Option<chrono::NaiveDate>,
    pub purchase_cost: i64,
    pub salvage_value: i64,
    pub depreciation_method: String,
    pub useful_life_years: i32,
    pub supplier_id: Option<uuid::Uuid>,
    pub supplier_name: Option<String>,
    pub warranty_expires: Option<chrono::NaiveDate>,
    pub building: String,
    pub room: String,
    pub department: String,
    pub condition: String,
    pub status: String,
    pub photo: String,
    pub is_reservable: bool,
    pub notes: String,
    /// Who currently holds it, when there is an open assignment.
    pub assigned_to: Option<String>,
    pub updated_at: chrono::NaiveDateTime,

    #[sqlx(default)]
    pub current_value: i64,
    #[sqlx(default)]
    pub accumulated_depreciation: i64,
    #[sqlx(default)]
    pub warranty_status: String,
}

#[derive(Debug, Serialize)]
pub struct AssetPage {
    pub data: Vec<AssetRow>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub total_pages: i64,
    /// Purchase cost across the whole filtered set, not just the page.
    pub filtered_cost: i64,
    pub filtered_current_value: i64,
}

#[derive(Debug, Deserialize, Default)]
pub struct AssetFilter {
    pub search: Option<String>,
    pub category_id: Option<uuid::Uuid>,
    pub status: Option<String>,
    pub condition: Option<String>,
    pub building: Option<String>,
    pub supplier_id: Option<uuid::Uuid>,
    pub reservable: Option<bool>,
    pub warranty: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub sort: Option<String>,
    pub dir: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertAsset {
    pub name: String,
    pub category_id: Option<uuid::Uuid>,
    pub description: Option<String>,
    pub serial_number: Option<String>,
    pub barcode: Option<String>,
    pub manufacturer: Option<String>,
    pub model: Option<String>,
    pub purchase_date: Option<String>,
    pub purchase_cost: Option<i64>,
    pub salvage_value: Option<i64>,
    pub depreciation_method: Option<String>,
    pub useful_life_years: Option<i32>,
    pub supplier_id: Option<uuid::Uuid>,
    pub warranty_expires: Option<String>,
    pub building: Option<String>,
    pub room: Option<String>,
    pub department: Option<String>,
    pub condition: Option<String>,
    pub status: Option<String>,
    pub photo: Option<String>,
    pub notes: Option<String>,
    pub is_reservable: Option<bool>,
}

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct AssetAssignment {
    pub id: uuid::Uuid,
    pub asset_id: uuid::Uuid,
    pub asset_name: Option<String>,
    pub asset_code: Option<String>,
    pub person_id: Option<uuid::Uuid>,
    pub assigned_to: String,
    pub department: String,
    pub assigned_at: chrono::NaiveDate,
    pub due_back: Option<chrono::NaiveDate>,
    pub returned_at: Option<chrono::NaiveDate>,
    pub condition_out: String,
    pub condition_in: Option<String>,
    pub notes: String,
}

#[derive(Debug, Deserialize)]
pub struct AssignInput {
    pub assigned_to: String,
    pub person_id: Option<uuid::Uuid>,
    pub department: Option<String>,
    pub due_back: Option<String>,
    pub condition_out: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ReturnInput {
    pub condition_in: Option<String>,
    pub notes: Option<String>,
}

// ---------------------------------------------------------------------------
// Reservations
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct AssetReservation {
    pub id: uuid::Uuid,
    pub asset_id: uuid::Uuid,
    pub asset_name: Option<String>,
    pub asset_code: Option<String>,
    pub requested_by: String,
    pub person_id: Option<uuid::Uuid>,
    pub purpose: String,
    pub starts_on: chrono::NaiveDate,
    pub ends_on: chrono::NaiveDate,
    pub status: String,
    pub approved_by: Option<String>,
    pub approved_at: Option<chrono::NaiveDateTime>,
    pub reject_reason: String,
    pub notes: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct ReserveInput {
    pub requested_by: String,
    pub person_id: Option<uuid::Uuid>,
    pub purpose: Option<String>,
    pub starts_on: String,
    pub ends_on: String,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DecisionInput {
    pub reason: Option<String>,
}

// ---------------------------------------------------------------------------
// Maintenance
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Maintenance {
    pub id: uuid::Uuid,
    pub asset_id: uuid::Uuid,
    pub asset_name: Option<String>,
    pub asset_code: Option<String>,
    pub maintenance_kind: String,
    pub title: String,
    pub description: String,
    pub scheduled_for: Option<chrono::NaiveDate>,
    pub performed_on: Option<chrono::NaiveDate>,
    pub next_due: Option<chrono::NaiveDate>,
    pub technician: String,
    pub supplier_id: Option<uuid::Uuid>,
    pub supplier_name: Option<String>,
    pub cost: i64,
    pub status: String,
    pub condition_after: Option<String>,
    pub notes: String,
}

#[derive(Debug, Deserialize)]
pub struct UpsertMaintenance {
    pub maintenance_kind: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub scheduled_for: Option<String>,
    pub performed_on: Option<String>,
    pub next_due: Option<String>,
    pub technician: Option<String>,
    pub supplier_id: Option<uuid::Uuid>,
    pub cost: Option<i64>,
    pub status: Option<String>,
    pub condition_after: Option<String>,
    pub notes: Option<String>,
}

// ---------------------------------------------------------------------------
// Detail & dashboard
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize)]
pub struct AssetDetail {
    pub asset: AssetRow,
    pub assignments: Vec<AssetAssignment>,
    pub reservations: Vec<AssetReservation>,
    pub maintenance: Vec<Maintenance>,
    /// Everything spent on maintenance over the asset's life.
    pub maintenance_cost_total: i64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct CategoryValue {
    pub label: String,
    pub color: Option<String>,
    pub count: i64,
    pub cost: i64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct StatusCount {
    pub label: String,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct AssetDashboard {
    pub total_assets: i64,
    pub total_cost: i64,
    pub total_current_value: i64,
    pub total_depreciation: i64,
    pub available: i64,
    pub assigned: i64,
    pub in_maintenance: i64,
    pub overdue_returns: i64,
    pub maintenance_due: i64,
    pub warranty_expiring: i64,
    pub pending_reservations: i64,
    pub maintenance_spend_year: i64,
    pub by_category: Vec<CategoryValue>,
    pub by_status: Vec<StatusCount>,
    pub upcoming_maintenance: Vec<Maintenance>,
    pub expiring_warranties: Vec<AssetRow>,
}
