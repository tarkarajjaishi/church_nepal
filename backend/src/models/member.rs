use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Member {
    pub id: uuid::Uuid,
    pub name: String,
    pub role: String,
    pub since: String,
    pub image: String,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
    pub created_at: chrono::NaiveDateTime,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub member_status: String,
    pub notes: Option<String>,
    pub joined_date: Option<chrono::NaiveDate>,
    pub household_id: Option<uuid::Uuid>,
}

#[derive(Debug, Deserialize, Default)]
pub struct MemberListQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub search: Option<String>,
    pub household_id: Option<uuid::Uuid>,
    pub tag_id: Option<uuid::Uuid>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMember {
    pub name: String,
    pub role: String,
    pub since: String,
    pub image: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub member_status: Option<String>,
    pub notes: Option<String>,
    pub joined_date: Option<String>,
    pub household_id: Option<uuid::Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMember {
    pub name: Option<String>,
    pub role: Option<String>,
    pub since: Option<String>,
    pub image: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub member_status: Option<String>,
    pub notes: Option<String>,
    pub joined_date: Option<String>,
    pub household_id: Option<uuid::Uuid>,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Household {
    pub id: uuid::Uuid,
    pub name: String,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub notes: Option<String>,
    pub enabled: bool,
    pub sort_order: i32,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateHousehold {
    pub name: String,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateHousehold {
    pub name: Option<String>,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub notes: Option<String>,
    pub enabled: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct MemberTag {
    pub id: uuid::Uuid,
    pub name: String,
    pub color: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateMemberTag {
    pub name: String,
    pub color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct MemberNote {
    pub id: uuid::Uuid,
    pub member_id: uuid::Uuid,
    pub author: String,
    pub note: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateMemberNote {
    pub author: Option<String>,
    pub note: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct MemberCustomField {
    pub id: uuid::Uuid,
    pub member_id: uuid::Uuid,
    pub field_key: String,
    pub field_value: Option<String>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateMemberCustomField {
    pub member_id: uuid::Uuid,
    pub field_key: String,
    pub field_value: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMemberCustomField {
    pub field_key: Option<String>,
    pub field_value: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BulkAction {
    pub ids: Vec<uuid::Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct MemberSearchQuery {
    pub search: Option<String>,
    pub household_id: Option<uuid::Uuid>,
    pub tag_id: Option<uuid::Uuid>,
    pub status: Option<String>,
}
