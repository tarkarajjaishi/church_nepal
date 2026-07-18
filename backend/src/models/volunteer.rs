use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct VolunteerTeam {
    pub id: uuid::Uuid,
    pub name: String,
    pub description: String,
    pub color: String,
    pub enabled: bool,
    pub sort_order: i32,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct VolunteerShift {
    pub id: uuid::Uuid,
    pub team_id: uuid::Uuid,
    pub title: String,
    pub shift_date: chrono::NaiveDate,
    pub start_time: String,
    pub end_time: String,
    pub location: String,
    pub slots: i32,
    pub notes: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct VolunteerAssignment {
    pub id: uuid::Uuid,
    pub shift_id: uuid::Uuid,
    pub person_id: Option<uuid::Uuid>,
    pub name: String,
    pub status: String,
    pub notes: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateVolunteerTeam {
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateVolunteerTeam {
    pub name: Option<String>,
    pub description: Option<String>,
    pub color: Option<String>,
    pub enabled: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CreateVolunteerShift {
    pub team_id: uuid::Uuid,
    pub title: String,
    pub shift_date: String,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
    pub location: Option<String>,
    pub slots: Option<i32>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateVolunteerShift {
    pub team_id: Option<uuid::Uuid>,
    pub title: Option<String>,
    pub shift_date: Option<String>,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
    pub location: Option<String>,
    pub slots: Option<i32>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateVolunteerAssignment {
    pub shift_id: uuid::Uuid,
    pub name: String,
    pub notes: Option<String>,
}
