//! Church Library models.
//!
//! Money is `i64` minor units. Composite responses are explicitly nested.
//!
//! Note there is no `available_copies` field anywhere: availability is derived
//! from copies without an open loan, never stored.

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct LibraryCategory {
    pub id: uuid::Uuid,
    pub name: String,
    pub slug: String,
    pub description: String,
    pub icon: String,
    pub color: String,
    pub sort_order: i32,
    pub is_active: bool,
    pub book_count: i64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Author {
    pub id: uuid::Uuid,
    pub name: String,
    pub bio: String,
    pub photo: String,
    pub book_count: i64,
}

/// Book row for lists and detail.
///
/// `total_copies` / `available_copies` are computed in SQL from the copies and
/// their open loans — a counter column would let two borrowers take the last
/// copy of a book.
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct BookRow {
    pub id: uuid::Uuid,
    pub title: String,
    pub subtitle: String,
    pub isbn: String,
    pub publisher: String,
    pub edition: String,
    pub language: String,
    pub category_id: Option<uuid::Uuid>,
    pub category_name: Option<String>,
    pub category_color: Option<String>,
    pub description: String,
    pub keywords: String,
    pub pages: Option<i32>,
    pub publication_year: Option<i32>,
    pub cover_url: String,
    pub material_kind: String,
    pub digital_url: String,
    pub is_active: bool,
    pub authors: Vec<String>,
    pub total_copies: i64,
    pub available_copies: i64,
    pub on_loan: i64,
    /// Damaged, lost or withdrawn — excluded from `total_copies`, but the
    /// librarian still needs to see that the shelf is short.
    pub out_of_circulation: i64,
    pub holds_waiting: i64,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize)]
pub struct BookPage {
    pub data: Vec<BookRow>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub total_pages: i64,
}

#[derive(Debug, Deserialize, Default)]
pub struct BookFilter {
    pub search: Option<String>,
    pub category_id: Option<uuid::Uuid>,
    pub material_kind: Option<String>,
    pub language: Option<String>,
    pub availability: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub sort: Option<String>,
    pub dir: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertBook {
    pub title: String,
    pub subtitle: Option<String>,
    pub isbn: Option<String>,
    pub publisher: Option<String>,
    pub edition: Option<String>,
    pub language: Option<String>,
    pub category_id: Option<uuid::Uuid>,
    pub description: Option<String>,
    pub keywords: Option<String>,
    pub pages: Option<i32>,
    pub publication_year: Option<i32>,
    pub cover_url: Option<String>,
    pub material_kind: Option<String>,
    pub digital_url: Option<String>,
    pub is_active: Option<bool>,
    /// Author names; created on demand so cataloguing is one step.
    pub authors: Option<Vec<String>>,
    /// How many physical copies to create alongside a new book.
    pub copies: Option<i32>,
    pub shelf: Option<String>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct BookCopy {
    pub id: uuid::Uuid,
    pub book_id: uuid::Uuid,
    pub copy_code: String,
    pub shelf: String,
    pub location: String,
    pub condition: String,
    pub acquired_on: Option<chrono::NaiveDate>,
    pub purchase_cost: i64,
    pub status: String,
    pub notes: String,
    /// Who currently has it, when it is out.
    pub borrower: Option<String>,
    pub due_on: Option<chrono::NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct AddCopies {
    pub count: Option<i32>,
    pub shelf: Option<String>,
    pub location: Option<String>,
    pub condition: Option<String>,
    pub purchase_cost: Option<i64>,
    pub acquired_on: Option<String>,
}

/// Librarian's edit of a single copy: repaired, reshelved, or written off.
#[derive(Debug, Deserialize)]
pub struct UpdateCopy {
    pub shelf: Option<String>,
    pub location: Option<String>,
    pub condition: Option<String>,
    /// `in_circulation`, `damaged`, `lost` or `withdrawn`.
    pub status: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Loan {
    pub id: uuid::Uuid,
    pub copy_id: uuid::Uuid,
    pub copy_code: String,
    pub book_id: uuid::Uuid,
    pub book_title: String,
    pub person_id: Option<uuid::Uuid>,
    pub borrower_name: String,
    pub borrower_contact: String,
    pub borrowed_on: chrono::NaiveDate,
    pub due_on: chrono::NaiveDate,
    pub returned_on: Option<chrono::NaiveDate>,
    pub renewals: i32,
    pub condition_out: String,
    pub condition_in: Option<String>,
    pub fee_assessed: i64,
    pub fee_paid: i64,
    pub notes: String,

    /// Days past due for an open loan; 0 when not overdue or already returned.
    #[sqlx(default)]
    pub days_overdue: i64,
    /// What the fee would be if returned today. Never written to the row.
    #[sqlx(default)]
    pub fee_accruing: i64,
}

#[derive(Debug, Deserialize)]
pub struct BorrowInput {
    /// Lend a specific copy, or let the API pick the first available one.
    pub copy_id: Option<uuid::Uuid>,
    pub book_id: Option<uuid::Uuid>,
    pub person_id: Option<uuid::Uuid>,
    pub borrower_name: String,
    pub borrower_contact: Option<String>,
    /// Defaults to today. Backdating exists so a librarian can enter books
    /// already out on the paper ledger when the library is first computerised.
    pub borrowed_on: Option<String>,
    pub due_on: Option<String>,
    pub condition_out: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ReturnInput {
    pub condition_in: Option<String>,
    pub fee_paid: Option<i64>,
    /// Waive the accrued fee — grace is a normal outcome in a church library.
    pub waive_fee: Option<bool>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct HoldInput {
    pub person_id: Option<uuid::Uuid>,
    pub requester_name: String,
    pub requester_contact: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Hold {
    pub id: uuid::Uuid,
    pub book_id: uuid::Uuid,
    pub book_title: String,
    pub person_id: Option<uuid::Uuid>,
    pub requester_name: String,
    pub requester_contact: String,
    pub status: String,
    pub notified_on: Option<chrono::NaiveDate>,
    pub notes: String,
    pub created_at: chrono::NaiveDateTime,
    /// Place in the queue for this title, oldest first.
    pub queue_position: i64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct LibrarySettings {
    pub loan_days: i32,
    pub max_renewals: i32,
    pub renewal_days: i32,
    pub daily_fee: i64,
    pub max_fee: i64,
    pub max_loans_per_person: i32,
    pub hold_days: i32,
}

#[derive(Debug, Deserialize)]
pub struct UpsertSettings {
    pub loan_days: Option<i32>,
    pub max_renewals: Option<i32>,
    pub renewal_days: Option<i32>,
    pub daily_fee: Option<i64>,
    pub max_fee: Option<i64>,
    pub max_loans_per_person: Option<i32>,
    pub hold_days: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct BookDetail {
    pub book: BookRow,
    pub copies: Vec<BookCopy>,
    pub loans: Vec<Loan>,
    pub holds: Vec<Hold>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Borrower {
    pub person_id: Option<uuid::Uuid>,
    pub name: String,
    pub contact: String,
    pub open_loans: i64,
    pub total_loans: i64,
    pub overdue: i64,
    pub fees_outstanding: i64,
    pub last_borrowed: Option<chrono::NaiveDate>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct TitleCount {
    pub label: String,
    pub color: Option<String>,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct LibraryDashboard {
    pub total_titles: i64,
    pub total_copies: i64,
    pub on_loan: i64,
    pub available: i64,
    pub overdue: i64,
    pub digital_titles: i64,
    pub active_borrowers: i64,
    pub holds_waiting: i64,
    pub fees_outstanding: i64,
    pub loans_this_month: i64,
    pub by_category: Vec<TitleCount>,
    pub most_borrowed: Vec<TitleCount>,
    pub overdue_loans: Vec<Loan>,
    pub due_soon: Vec<Loan>,
}
