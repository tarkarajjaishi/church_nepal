//! Help Desk models.
//!
//! Composite responses are explicitly nested — no `#[serde(flatten)]`, which
//! has bitten the presentation client repeatedly.
//!
//! Nothing here stores an age, a response time or an SLA verdict. Those are
//! functions of the current clock, so they are computed on read from the
//! timestamps and returned as extra fields the database never sees.

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct HelpdeskCategory {
    pub id: uuid::Uuid,
    pub name: String,
    pub slug: String,
    pub description: String,
    pub icon: String,
    pub color: String,
    /// Hours the team aims to respond in, and to resolve in.
    pub response_hours: i32,
    pub resolve_hours: i32,
    pub sort_order: i32,
    pub is_active: bool,
    pub open_count: i64,
}

#[derive(Debug, Deserialize)]
pub struct UpsertCategory {
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub response_hours: Option<i32>,
    pub resolve_hours: Option<i32>,
    pub sort_order: Option<i32>,
    pub is_active: Option<bool>,
}

/// A ticket as read back.
///
/// `age_hours`, `response_hours_taken`, `response_breached` and
/// `resolve_breached` are derived per request. A stored "breached" flag would
/// be wrong from the moment the deadline passed until something happened to
/// rewrite it — which is exactly when the report matters.
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Ticket {
    pub id: uuid::Uuid,
    pub ticket_code: String,
    pub subject: String,
    pub body: String,
    pub category_id: Option<uuid::Uuid>,
    pub category_name: Option<String>,
    pub category_color: Option<String>,
    pub person_id: Option<uuid::Uuid>,
    pub reporter_name: String,
    pub reporter_contact: String,
    pub asset_id: Option<uuid::Uuid>,
    pub asset_name: Option<String>,
    pub location: String,
    pub priority: String,
    pub status: String,
    pub assignee_name: String,
    pub assignee_contact: String,
    pub opened_at: chrono::NaiveDateTime,
    pub first_responded_at: Option<chrono::NaiveDateTime>,
    pub resolved_at: Option<chrono::NaiveDateTime>,
    pub closed_at: Option<chrono::NaiveDateTime>,
    pub due_at: Option<chrono::NaiveDateTime>,
    pub resolution: String,
    pub reopen_count: i32,
    pub comment_count: i64,
    /// SLA targets copied from the category so the client can show the
    /// deadline without a second lookup.
    pub response_target_hours: i32,
    pub resolve_target_hours: i32,

    #[sqlx(default)]
    pub age_hours: i64,
    /// Hours between opening and the first human reply; None until answered.
    #[sqlx(default)]
    pub response_hours_taken: Option<i64>,
    /// Unanswered past the response target, or answered too late.
    #[sqlx(default)]
    pub response_breached: bool,
    /// Still unresolved past the resolve target, or resolved too late.
    #[sqlx(default)]
    pub resolve_breached: bool,
}

#[derive(Debug, Serialize)]
pub struct TicketPage {
    pub data: Vec<Ticket>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub total_pages: i64,
}

#[derive(Debug, Deserialize, Default)]
pub struct TicketFilter {
    pub search: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub category_id: Option<uuid::Uuid>,
    pub assignee: Option<String>,
    /// `unassigned`, `breached` or `mine` — views a queue actually needs.
    pub view: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub sort: Option<String>,
    pub dir: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct NewTicket {
    pub subject: String,
    pub body: Option<String>,
    pub category_id: Option<uuid::Uuid>,
    pub person_id: Option<uuid::Uuid>,
    pub reporter_name: String,
    pub reporter_contact: Option<String>,
    pub asset_id: Option<uuid::Uuid>,
    pub location: Option<String>,
    pub priority: Option<String>,
    /// Assign at creation. Left empty, the ticket goes into the queue
    /// unclaimed, which is the honest default.
    pub assignee_name: Option<String>,
    pub assignee_contact: Option<String>,
    /// Defaults to now. Backdating exists so a church moving off a
    /// spreadsheet keeps the real age of what is still outstanding — an
    /// imported ticket that has been open for a month must look a month old.
    pub opened_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTicket {
    pub subject: Option<String>,
    pub body: Option<String>,
    pub category_id: Option<uuid::Uuid>,
    pub asset_id: Option<uuid::Uuid>,
    pub location: Option<String>,
    pub priority: Option<String>,
    pub due_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ClaimInput {
    pub assignee_name: String,
    pub assignee_contact: Option<String>,
    /// Take a ticket someone else already holds. Off by default so a routine
    /// claim can never quietly steal work in progress.
    pub force: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct StatusInput {
    pub status: String,
    /// Required when moving to `resolved` — the database refuses it otherwise.
    pub resolution: Option<String>,
    pub note: Option<String>,
    pub author_name: Option<String>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Comment {
    pub id: uuid::Uuid,
    pub ticket_id: uuid::Uuid,
    pub author_name: String,
    pub body: String,
    pub is_internal: bool,
    /// Empty for a person typing; set for status/assignment events.
    pub event_kind: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct NewComment {
    pub body: String,
    pub author_name: Option<String>,
    pub is_internal: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct TicketDetail {
    pub ticket: Ticket,
    pub comments: Vec<Comment>,
    /// Other tickets raised against the same asset — a projector on its fourth
    /// ticket is a replacement decision, not a fifth repair.
    pub related: Vec<TicketBrief>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct TicketBrief {
    pub id: uuid::Uuid,
    pub ticket_code: String,
    pub subject: String,
    pub status: String,
    pub opened_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Article {
    pub id: uuid::Uuid,
    pub title: String,
    pub slug: String,
    pub body: String,
    pub category_id: Option<uuid::Uuid>,
    pub category_name: Option<String>,
    pub keywords: String,
    pub is_published: bool,
    pub view_count: i32,
    pub helpful_count: i32,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct UpsertArticle {
    pub title: String,
    pub body: Option<String>,
    pub category_id: Option<uuid::Uuid>,
    pub keywords: Option<String>,
    pub is_published: Option<bool>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct AgentLoad {
    pub name: String,
    pub open_tickets: i64,
    pub resolved_tickets: i64,
    pub breached: i64,
    /// Median would be better than a mean here, but the mean is what a small
    /// team can reason about and the sample is tiny either way.
    pub avg_resolve_hours: Option<i64>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct LabelCount {
    pub label: String,
    pub color: Option<String>,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct HelpdeskDashboard {
    pub open: i64,
    pub unassigned: i64,
    pub in_progress: i64,
    pub waiting: i64,
    pub resolved_this_month: i64,
    pub urgent_open: i64,
    /// Open tickets past their response or resolve target right now.
    pub breaching: i64,
    pub awaiting_first_reply: i64,
    pub reopened: i64,
    pub avg_response_hours: Option<i64>,
    pub avg_resolve_hours: Option<i64>,
    pub by_category: Vec<LabelCount>,
    pub by_priority: Vec<LabelCount>,
    pub agents: Vec<AgentLoad>,
    pub oldest_open: Vec<Ticket>,
    pub needs_reply: Vec<Ticket>,
}
