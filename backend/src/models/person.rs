use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Person {
    pub id: uuid::Uuid,
    pub first_name: String,
    pub last_name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub photo: Option<String>,
    pub member_status: String,
    pub household_id: Option<uuid::Uuid>,
    pub notes: Option<String>,
    pub joined_date: Option<chrono::NaiveDate>,
    pub enabled: bool,
    pub sort_order: i32,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreatePerson {
    pub first_name: String,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub photo: Option<String>,
    pub member_status: Option<String>,
    pub household_id: Option<uuid::Uuid>,
    pub notes: Option<String>,
    pub joined_date: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePerson {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub photo: Option<String>,
    pub member_status: Option<String>,
    pub household_id: Option<uuid::Uuid>,
    pub notes: Option<String>,
    pub joined_date: Option<String>,
    pub enabled: Option<bool>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct PersonWithTags {
    #[sqlx(flatten)]
    pub person: Person,
    pub tags: Option<serde_json::Value>,
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
pub struct Tag {
    pub id: uuid::Uuid,
    pub name: String,
    pub color: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateTag {
    pub name: String,
    pub color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct PersonNote {
    pub id: uuid::Uuid,
    pub person_id: uuid::Uuid,
    pub author: String,
    pub note: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreatePersonNote {
    pub author: Option<String>,
    pub note: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct GroupMembership {
    pub id: uuid::Uuid,
    pub group_id: i32,
    pub person_id: uuid::Uuid,
    pub role: String,
    pub joined_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateGroupMembership {
    pub group_id: i32,
    pub person_id: uuid::Uuid,
    pub role: Option<String>,
}
