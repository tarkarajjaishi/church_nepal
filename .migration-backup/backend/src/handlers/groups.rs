use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateGroup, CreateMemberApplication, Group, MemberApplication, Paginated, Pagination, UpdateGroup};
use crate::handlers::audit::create_audit_entry;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct GroupFilter {
    pub day: Option<String>,
    pub category: Option<String>,
    pub location: Option<String>,
}

pub async fn list(Db(pool): Db, Query(p): Query<Pagination>, Query(f): Query<GroupFilter>) -> Result<Json<Paginated<Group>>, AppError> {
    let mut query = String::from("SELECT * FROM groups WHERE 1=1");
    let mut params: Vec<String> = Vec::new();
    
    if let Some(day) = &f.day {
        let idx = params.len() + 1;
        query.push_str(&format!(" AND meeting_day = ${}", idx));
        params.push(day.clone());
    }
    if let Some(category) = &f.category {
        let idx = params.len() + 1;
        query.push_str(&format!(" AND category = ${}", idx));
        params.push(category.clone());
    }
    if let Some(location) = &f.location {
        let idx = params.len() + 1;
        query.push_str(&format!(" AND location ILIKE ${}", idx));
        params.push(format!("%{}%", location));
    }
    
    let count_query = query.replace("SELECT *", "SELECT COUNT(*)");
    let total: i64 = sqlx::query_scalar(&count_query)
        .fetch_one(&pool)
        .await?
        .unwrap_or(0);
    
    query.push_str(" ORDER BY sort_order ASC, created_at ASC");
    
    // Add pagination parameters
    query.push_str(" LIMIT $");
    query.push_str(&(params.len() + 1).to_string());
    query.push_str(" OFFSET $");
    query.push_str(&(params.len() + 2).to_string());
    
    let mut sql_query = sqlx::query_as::<_, Group>(&query);
    for param in params {
        sql_query = sql_query.bind(param);
    }
    sql_query = sql_query.bind(p.limit()).bind(p.offset());
    
    let rows = sql_query.fetch_all(&pool).await?;
    Ok(Json(Paginated::new(rows, total, &p)))
}

pub async fn get(Db(pool): Db, Path(id): Path<i32>) -> Result<Json<Group>, AppError> {
    let row = sqlx::query_as::<_, Group>("SELECT * FROM groups WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Group not found"))?;
    Ok(Json(row))
}

pub async fn create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CreateGroup>,
) -> Result<Json<Group>, AppError> {
    let row = sqlx::query_as::<_, Group>(
        "INSERT INTO groups (slug, name, description, meeting_day, meeting_time, location, leader_id, category, image_url, max_members, enabled, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *",
    )
    .bind(&input.slug)
    .bind(&input.name)
    .bind(&input.description)
    .bind(&input.meeting_day)
    .bind(&input.meeting_time)
    .bind(&input.location)
    .bind(input.leader_id)
    .bind(&input.category)
    .bind(&input.image_url)
    .bind(input.max_members)
    .bind(input.enabled.unwrap_or(true))
    .bind(input.sort_order.unwrap_or(0))
    .fetch_one(&pool)
    .await?;
    let _ = create_audit_entry(&pool, &auth.email, "create", "group", &row.id.to_string(), Some(serde_json::json!({"id": row.id}))).await;
    Ok(Json(row))
}

pub async fn update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<i32>,
    Json(input): Json<UpdateGroup>,
) -> Result<Json<Group>, AppError> {
    // Verify the group exists
    let _existing = sqlx::query_as::<_, Group>("SELECT * FROM groups WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Group not found"))?;

    let row = sqlx::query_as::<_, Group>(
        "UPDATE groups SET
            slug = COALESCE($2, slug),
            name = COALESCE($3, name),
            description = COALESCE($4, description),
            meeting_day = COALESCE($5, meeting_day),
            meeting_time = COALESCE($6, meeting_time),
            location = COALESCE($7, location),
            leader_id = COALESCE($8, leader_id),
            category = COALESCE($9, category),
            image_url = COALESCE($10, image_url),
            max_members = COALESCE($11, max_members),
            enabled = COALESCE($12, enabled),
            sort_order = COALESCE($13, sort_order),
            updated_at = now()
         WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(&input.slug)
    .bind(&input.name)
    .bind(&input.description)
    .bind(&input.meeting_day)
    .bind(&input.meeting_time)
    .bind(&input.location)
    .bind(input.leader_id)
    .bind(&input.category)
    .bind(&input.image_url)
    .bind(input.max_members)
    .bind(input.enabled)
    .bind(input.sort_order)
    .fetch_one(&pool)
    .await?;
    let _ = create_audit_entry(&pool, &auth.email, "update", "group", &row.id.to_string(), Some(serde_json::json!({"id": row.id}))).await;
    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<i32>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM groups WHERE id = $1")
        .bind(id)
    .execute(&pool)
    .await?;
    let _ = create_audit_entry(&pool, &auth.email, "delete", "group", &id.to_string(), Some(serde_json::json!({"id": id}))).await;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<i32>,
) -> Result<Json<Group>, AppError> {
    let row = sqlx::query_as::<_, Group>(
        "UPDATE groups SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Group not found"))?;
    let _ = create_audit_entry(&pool, &auth.email, "toggle", "group", &row.id.to_string(), Some(serde_json::json!({"id": row.id}))).await;
    Ok(Json(row))
}

#[derive(serde::Deserialize)]
pub struct ReorderRequest {
    pub sort_order: i32,
}

pub async fn reorder(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<i32>,
    Json(input): Json<ReorderRequest>,
) -> Result<Json<Group>, AppError> {
    let row = sqlx::query_as::<_, Group>(
        "UPDATE groups SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Group not found"))?;
    Ok(Json(row))
}

#[derive(Debug, Deserialize)]
pub struct JoinGroupRequest {
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
    pub how_found: Option<String>,
    #[serde(alias = "interestAreas")]
    pub interest_areas: Option<String>,
    pub testimony: Option<String>,
}

pub async fn join(
    Db(pool): Db,
    Path(group_id): Path<i32>,
    Json(input): Json<JoinGroupRequest>,
) -> Result<Json<MemberApplication>, AppError> {
    let group = sqlx::query_as::<_, Group>("SELECT * FROM groups WHERE id = $1")
        .bind(group_id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Group not found"))?;

    let dob = input.date_of_birth.as_deref()
        .and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

    let how_found = input.how_found.unwrap_or_else(|| {
        format!("Group Join Request: {} (ID: {})", group.name, group_id)
    });

    let row = sqlx::query_as::<_, MemberApplication>(
        r#"INSERT INTO member_applications (first_name, last_name, email, phone, address, city, date_of_birth, gender, marital_status, baptism_status, church_background, how_found, interest_areas, testimony)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *"#
    )
    .bind(&input.first_name)
    .bind(input.last_name.as_deref().unwrap_or(""))
    .bind(&input.email)
    .bind(input.phone.as_deref().unwrap_or(""))
    .bind(input.address)
    .bind(input.city)
    .bind(dob)
    .bind(input.gender)
    .bind(input.marital_status)
    .bind(input.baptism_status.as_deref().unwrap_or("not_baptized"))
    .bind(input.church_background)
    .bind(Some(how_found))
    .bind(input.interest_areas.as_deref())
    .bind(input.testimony)
    .fetch_one(&pool)
    .await?;

    Ok(Json(row))
}
