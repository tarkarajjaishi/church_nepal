use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct MemberApplication {
    pub id: uuid::Uuid,
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub phone: String,
    pub address: Option<String>,
    pub city: Option<String>,
    pub date_of_birth: Option<chrono::NaiveDate>,
    pub gender: Option<String>,
    pub marital_status: Option<String>,
    pub baptism_status: Option<String>,
    pub church_background: Option<String>,
    pub how_found: Option<String>,
    pub interest_areas: Option<String>,
    pub testimony: Option<String>,
    pub status: String,
    pub reviewed_by: Option<String>,
    pub reviewed_at: Option<chrono::NaiveDateTime>,
    pub notes: Option<String>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateMemberApplication {
    #[serde(alias = "firstName")]
    pub first_name: String,
    #[serde(alias = "lastName")]
    pub last_name: Option<String>,
    pub email: String,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    #[serde(alias = "dateOfBirth")]
    pub date_of_birth: Option<String>,
    pub gender: Option<String>,
    #[serde(alias = "maritalStatus")]
    pub marital_status: Option<String>,
    #[serde(alias = "baptismStatus")]
    pub baptism_status: Option<String>,
    #[serde(alias = "churchBackground")]
    pub church_background: Option<String>,
    #[serde(alias = "howFound")]
    pub how_found: Option<String>,
    #[serde(alias = "interestAreas")]
    pub interest_areas: Option<String>,
    pub testimony: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMemberApplication {
    pub status: Option<String>,
    pub reviewed_by: Option<String>,
    pub notes: Option<String>,
}
