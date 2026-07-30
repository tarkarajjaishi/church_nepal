//! Worship Management models.
//!
//! Composite responses here are NOT flattened. The presentation module used
//! `#[serde(flatten)]` throughout, which produced four separate client bugs
//! where a wrapper was assumed and `undefined` was read at runtime. Explicit
//! nesting costs one extra key and removes that whole class of mistake.

use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct WorshipRole {
    pub id: uuid::Uuid,
    pub name: String,
    pub slug: String,
    pub category: String,
    pub icon: String,
    pub sort_order: i32,
    pub is_active: bool,
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct WorshipMember {
    pub id: uuid::Uuid,
    pub person_id: Option<uuid::Uuid>,
    pub name: String,
    pub photo: String,
    pub phone: String,
    pub email: String,
    pub voice_type: String,
    pub experience: String,
    pub emergency_contact: String,
    pub emergency_phone: String,
    pub notes: String,
    pub is_leader: bool,
    pub is_active: bool,
    /// Role names, aggregated so the roster does not need N+1 lookups.
    pub roles: Vec<String>,
    pub role_ids: Vec<uuid::Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertMember {
    pub name: String,
    pub person_id: Option<uuid::Uuid>,
    pub photo: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub voice_type: Option<String>,
    pub experience: Option<String>,
    pub emergency_contact: Option<String>,
    pub emergency_phone: Option<String>,
    pub notes: Option<String>,
    pub is_leader: Option<bool>,
    pub is_active: Option<bool>,
    pub role_ids: Option<Vec<uuid::Uuid>>,
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct WorshipService {
    pub id: uuid::Uuid,
    pub name: String,
    pub service_date: chrono::NaiveDate,
    pub start_time: Option<chrono::NaiveTime>,
    pub end_time: Option<chrono::NaiveTime>,
    pub theme: String,
    pub speaker: String,
    pub service_type: String,
    pub description: String,
    pub status: String,
    pub worship_leader: String,
    pub notes: String,
    pub attachments: serde_json::Value,
    pub playlist_id: Option<uuid::Uuid>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

/// List row with the counts the index page shows, so it does not fetch every
/// plan's items just to display "7 items, 3 songs".
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct WorshipServiceRow {
    pub id: uuid::Uuid,
    pub name: String,
    pub service_date: chrono::NaiveDate,
    pub start_time: Option<chrono::NaiveTime>,
    pub theme: String,
    pub speaker: String,
    pub service_type: String,
    pub status: String,
    pub worship_leader: String,
    pub item_count: i64,
    pub song_count: i64,
    pub team_count: i64,
    pub planned_seconds: i64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ServicePlanItem {
    pub id: uuid::Uuid,
    pub service_id: uuid::Uuid,
    pub sort_order: i32,
    pub item_kind: String,
    pub title: String,
    pub song_id: Option<uuid::Uuid>,
    pub song_title: Option<String>,
    pub song_default_key: Option<String>,
    pub song_bpm: Option<i32>,
    pub song_key: String,
    pub leader: String,
    pub planned_seconds: i32,
    pub actual_seconds: Option<i32>,
    pub notes: String,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ServiceAssignment {
    pub id: uuid::Uuid,
    pub service_id: uuid::Uuid,
    pub member_id: uuid::Uuid,
    pub member_name: String,
    pub member_photo: String,
    pub role_id: Option<uuid::Uuid>,
    pub role_name: Option<String>,
    pub role_category: Option<String>,
    pub status: String,
    pub notes: String,
}

/// Explicitly nested, not flattened — see the module comment.
#[derive(Debug, Serialize)]
pub struct ServicePlan {
    pub service: WorshipService,
    pub items: Vec<ServicePlanItem>,
    pub team: Vec<ServiceAssignment>,
    pub planned_seconds: i64,
    pub actual_seconds: i64,
}

#[derive(Debug, Deserialize)]
pub struct UpsertService {
    pub name: String,
    pub service_date: String,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
    pub theme: Option<String>,
    pub speaker: Option<String>,
    pub service_type: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub worship_leader: Option<String>,
    pub notes: Option<String>,
    pub playlist_id: Option<uuid::Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertPlanItem {
    pub item_kind: Option<String>,
    pub title: Option<String>,
    pub song_id: Option<uuid::Uuid>,
    pub song_key: Option<String>,
    pub leader: Option<String>,
    pub planned_seconds: Option<i32>,
    pub actual_seconds: Option<i32>,
    pub notes: Option<String>,
    pub position: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct ReorderInput {
    pub ids: Vec<uuid::Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct AssignInput {
    pub member_id: uuid::Uuid,
    pub role_id: Option<uuid::Uuid>,
    pub status: Option<String>,
    pub notes: Option<String>,
}

// ---------------------------------------------------------------------------
// Rehearsals
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Rehearsal {
    pub id: uuid::Uuid,
    pub service_id: Option<uuid::Uuid>,
    pub service_name: Option<String>,
    pub title: String,
    pub rehearsal_date: chrono::NaiveDate,
    pub start_time: Option<chrono::NaiveTime>,
    pub end_time: Option<chrono::NaiveTime>,
    pub location: String,
    pub agenda: String,
    pub notes: String,
    pub status: String,
    pub invited_count: i64,
    pub present_count: i64,
}

#[derive(Debug, Deserialize)]
pub struct UpsertRehearsal {
    pub title: Option<String>,
    pub service_id: Option<uuid::Uuid>,
    pub rehearsal_date: String,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
    pub location: Option<String>,
    pub agenda: Option<String>,
    pub notes: Option<String>,
    pub status: Option<String>,
    pub member_ids: Option<Vec<uuid::Uuid>>,
}

#[derive(Debug, Deserialize)]
pub struct AttendanceInput {
    pub member_id: uuid::Uuid,
    pub status: String,
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct SongUsage {
    pub id: uuid::Uuid,
    pub title: String,
    pub song_key: String,
    pub use_count: i32,
    pub last_used_at: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct RoleGap {
    pub role_name: String,
    pub member_count: i64,
}

#[derive(Debug, Serialize)]
pub struct WorshipDashboard {
    pub upcoming_services: Vec<WorshipServiceRow>,
    pub next_rehearsal: Option<Rehearsal>,
    pub active_members: i64,
    pub total_members: i64,
    pub leaders: i64,
    pub songs_total: i64,
    pub services_this_month: i64,
    pub pending_invites: i64,
    pub most_used_songs: Vec<SongUsage>,
    /// Roles nobody on the roster can cover — the single most useful thing a
    /// worship leader wants to know before rostering a service.
    pub uncovered_roles: Vec<RoleGap>,
}
