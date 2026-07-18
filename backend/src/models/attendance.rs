use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Attendance {
    pub id: uuid::Uuid,
    pub event_id: Option<uuid::Uuid>,
    pub person_id: Option<uuid::Uuid>,
    pub name: String,
    pub service_date: chrono::NaiveDate,
    pub service_name: String,
    pub checked_in_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateAttendance {
    pub event_id: Option<uuid::Uuid>,
    pub name: String,
    pub service_date: String,
    pub service_name: String,
}
