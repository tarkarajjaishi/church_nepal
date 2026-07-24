use crate::handlers::ValidatedJson;
use crate::security::xss;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;
use crate::auth::{AuthUser, MemberGuard};
use crate::error::AppError;
use crate::handlers::audit::create_audit_entry;
use crate::models::*;

// ─── People CRUD ───

pub async fn list(
     Db(pool): Db,
     Query(q): Query<ListQuery>,
 ) -> Result<Json<Vec<Person>>, AppError> {
     let mut sql = String::from("SELECT * FROM people WHERE 1=1");
     let mut params: Vec<String> = Vec::new();

     if let Some(ref status) = q.status {
         sql.push_str(" AND member_status = $1");
         params.push(status.clone());
     }
     if let Some(ref search) = q.search {
         let idx = params.len() + 1;
         sql.push_str(&format!(" AND (first_name ILIKE ${} OR last_name ILIKE ${} OR email ILIKE ${})", idx, idx, idx));
         params.push(format!("%{}%", xss::sanitize_plain(search)));
     }
     if let Some(ref household_id) = q.household_id {
         let idx = params.len() + 1;
         sql.push_str(&format!(" AND household_id = ${}", idx));
         params.push(household_id.clone());
     }
     sql.push_str(" ORDER BY sort_order ASC, created_at DESC");

     let mut query = sqlx::query_as::<_, Person>(&sql);
     for p in &params {
         query = query.bind(p);
     }
     let rows = query.fetch_all(&pool).await?;
     Ok(Json(rows))
 }

#[derive(serde::Deserialize, Default)]
pub struct ListQuery {
    pub status: Option<String>,
    pub search: Option<String>,
    pub household_id: Option<String>,
    pub tag_id: Option<String>,
}

pub async fn get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Person>, AppError> {
    let row = sqlx::query_as::<_, Person>("SELECT * FROM people WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Person not found"))?;
    Ok(Json(row))
}

pub async fn create(
     _auth: AuthUser,
     Db(pool): Db,
     Json(input): Json<CreatePerson>,
 ) -> Result<Json<Person>, AppError> {
     let joined = input.joined_date.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());
     let row = sqlx::query_as::<_, Person>(
         r#"INSERT INTO people (first_name, last_name, email, phone, address, city, photo, member_status, household_id, notes, joined_date)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *"#
     )
     .bind(xss::sanitize_plain(&input.first_name))
     .bind(input.last_name.as_deref().map(|s| xss::sanitize_plain(s)).unwrap_or_default())
     .bind(xss::sanitize_plain(&input.email.as_deref().unwrap_or_default()))
     .bind(xss::sanitize_plain(&input.phone.as_deref().unwrap_or_default()))
     .bind(xss::sanitize_plain(&input.address.as_deref().unwrap_or_default()))
     .bind(xss::sanitize_plain(&input.city.as_deref().unwrap_or_default()))
     .bind(&input.photo)
     .bind(input.member_status.as_deref().unwrap_or("visitor"))
     .bind(input.household_id)
     .bind(xss::sanitize_option_plain(input.notes.as_deref()))
     .bind(joined)
     .fetch_one(&pool).await?;
     let _ = create_audit_entry(&pool, &_auth.email, "create", "person", &row.id.to_string(), Some(serde_json::json!({"id": row.id}))).await;
     Ok(Json(row))
 }

pub async fn update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdatePerson>,
) -> Result<Json<Person>, AppError> {
    let existing = sqlx::query_as::<_, Person>("SELECT * FROM people WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?
        .ok_or_else(|| AppError::not_found("Person not found"))?;

    let joined = input.joined_date.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

    let row = sqlx::query_as::<_, Person>(
        r#"UPDATE people SET
            first_name=COALESCE($2,first_name), last_name=COALESCE($3,last_name),
            email=COALESCE($4,email), phone=COALESCE($5,phone),
            address=COALESCE($6,address), city=COALESCE($7,city),
            photo=COALESCE($8,photo), member_status=COALESCE($9,member_status),
            household_id=COALESCE($10,household_id), notes=COALESCE($11,notes),
            joined_date=COALESCE($12,joined_date), enabled=COALESCE($13,enabled),
            sort_order=COALESCE($14,sort_order), updated_at=NOW()
         WHERE id=$1 RETURNING *"#
    )
    .bind(id)
    .bind(input.first_name.as_deref().unwrap_or(&existing.first_name))
    .bind(input.last_name.as_deref().unwrap_or(&existing.last_name))
    .bind(input.email.as_deref().unwrap_or(existing.email.as_deref().unwrap_or("")))
    .bind(input.phone.as_deref().unwrap_or(existing.phone.as_deref().unwrap_or("")))
    .bind(input.address.as_deref().unwrap_or(existing.address.as_deref().unwrap_or("")))
    .bind(input.city.as_deref().unwrap_or(existing.city.as_deref().unwrap_or("")))
    .bind(input.photo.as_deref().unwrap_or(existing.photo.as_deref().unwrap_or("")))
    .bind(input.member_status.as_deref().unwrap_or(&existing.member_status))
    .bind(input.household_id.or(existing.household_id))
    .bind(input.notes.as_deref().unwrap_or(existing.notes.as_deref().unwrap_or("")))
    .bind(joined.or(existing.joined_date))
    .bind(input.enabled.unwrap_or(existing.enabled))
    .bind(input.sort_order.unwrap_or(existing.sort_order))
    .fetch_one(&pool).await?;
    let _ = create_audit_entry(&pool, &auth.email, "update", "person", &row.id.to_string(), Some(serde_json::json!({"id": row.id}))).await;
    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM people WHERE id = $1")
        .bind(id).execute(&pool).await?;
    let _ = create_audit_entry(&pool, &auth.email, "delete", "person", &id.to_string(), Some(serde_json::json!({"id": id}))).await;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Person>, AppError> {
    let row = sqlx::query_as::<_, Person>("UPDATE people SET enabled = NOT enabled WHERE id = $1 RETURNING *")
        .bind(id).fetch_optional(&pool).await?
        .ok_or_else(|| AppError::not_found("Person not found"))?;
    let _ = create_audit_entry(&pool, &auth.email, "toggle", "person", &row.id.to_string(), Some(serde_json::json!({"id": row.id}))).await;
    Ok(Json(row))
}

#[derive(serde::Deserialize)]
pub struct ReorderRequest { pub sort_order: i32 }

pub async fn reorder(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<ReorderRequest>,
) -> Result<Json<Person>, AppError> {
    let row = sqlx::query_as::<_, Person>("UPDATE people SET sort_order = $2 WHERE id = $1 RETURNING *")
        .bind(id).bind(input.sort_order).fetch_optional(&pool).await?
        .ok_or_else(|| AppError::not_found("Person not found"))?;
    let _ = create_audit_entry(&pool, &auth.email, "reorder", "person", &row.id.to_string(), Some(serde_json::json!({"id": row.id}))).await;
    Ok(Json(row))
}

// ─── Households CRUD ───

pub async fn list_households(Db(pool): Db) -> Result<Json<Vec<Household>>, AppError> {
    let rows = sqlx::query_as::<_, Household>("SELECT * FROM households ORDER BY sort_order ASC, created_at DESC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get_household(
    Db(pool): Db, Path(id): Path<uuid::Uuid>,
) -> Result<Json<Household>, AppError> {
    let row = sqlx::query_as::<_, Household>("SELECT * FROM households WHERE id = $1")
        .bind(id).fetch_optional(&pool).await?
        .ok_or_else(|| AppError::not_found("Household not found"))?;
    Ok(Json(row))
}

pub async fn create_household(
    _auth: AuthUser, Db(pool): Db, Json(input): Json<CreateHousehold>,
) -> Result<Json<Household>, AppError> {
    let row = sqlx::query_as::<_, Household>(
        "INSERT INTO households (name, address, phone, notes) VALUES ($1,$2,$3,$4) RETURNING *"
    )
    .bind(&input.name).bind(&input.address).bind(&input.phone).bind(&input.notes)
    .fetch_one(&pool).await?;
    let _ = create_audit_entry(&pool, &auth.email, "create_household", "household", &row.id.to_string(), Some(serde_json::json!({"id": row.id}))).await;
    Ok(Json(row))
}

pub async fn update_household(
     _auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateHousehold>,
 ) -> Result<Json<Household>, AppError> {
     let row = sqlx::query_as::<_, Household>(
         "UPDATE households SET name=COALESCE($2,name), address=COALESCE($3,address), phone=COALESCE($4,phone), notes=COALESCE($5,notes), enabled=COALESCE($6,enabled), updated_at=NOW() WHERE id=$1 RETURNING *"
     )
     .bind(id)
     .bind(xss::sanitize_plain(&input.name.unwrap_or_default()))
     .bind(xss::sanitize_option_plain(input.address.as_deref()))
     .bind(xss::sanitize_plain(&input.phone.unwrap_or_default()))
     .bind(xss::sanitize_option_plain(input.notes.as_deref()))
     .bind(input.enabled)
     .fetch_optional(&pool).await?
     .ok_or_else(|| AppError::not_found("Household not found"))?;
     let _ = create_audit_entry(&pool, &_auth.email, "update_household", "household", &id.to_string(), Some(serde_json::json!({"id": id}))).await;
     Ok(Json(row))
 }

pub async fn delete_household(
    _auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("UPDATE people SET household_id = NULL WHERE household_id = $1").bind(id).execute(&pool).await?;
    sqlx::query("DELETE FROM households WHERE id = $1").bind(id).execute(&pool).await?;
    let _ = create_audit_entry(&pool, &auth.email, "delete_household", "household", &id.to_string(), Some(serde_json::json!({"id": id}))).await;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

// ─── Tags CRUD ───

pub async fn list_tags(Db(pool): Db) -> Result<Json<Vec<Tag>>, AppError> {
    let rows = sqlx::query_as::<_, Tag>("SELECT * FROM tags ORDER BY name ASC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn create_tag(
    _auth: AuthUser, Db(pool): Db, Json(input): Json<CreateTag>,
) -> Result<Json<Tag>, AppError> {
    let row = sqlx::query_as::<_, Tag>(
        "INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *"
    )
    .bind(&input.name).bind(input.color.as_deref().unwrap_or("#3B82F6"))
    .fetch_one(&pool).await?;
    let _ = create_audit_entry(&pool, &auth.email, "create_tag", "tag", &row.id.to_string(), Some(serde_json::json!({"id": row.id}))).await;
    Ok(Json(row))
}

pub async fn delete_tag(
    _auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM tags WHERE id = $1").bind(id).execute(&pool).await?;
    let _ = create_audit_entry(&pool, &auth.email, "delete_tag", "tag", &id.to_string(), Some(serde_json::json!({"id": id}))).await;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn add_person_tag(
    _auth: AuthUser, Db(pool): Db,
    Path((person_id, tag_id)): Path<(uuid::Uuid, uuid::Uuid)>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("INSERT INTO person_tags (person_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING")
        .bind(person_id).bind(tag_id).execute(&pool).await?;
    let _ = create_audit_entry(&pool, &auth.email, "add_tag", "person", &person_id.to_string(), Some(serde_json::json!({"id": person_id}))).await;
    Ok(Json(serde_json::json!({ "added": true })))
}

pub async fn remove_person_tag(
    _auth: AuthUser, Db(pool): Db,
    Path((person_id, tag_id)): Path<(uuid::Uuid, uuid::Uuid)>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM person_tags WHERE person_id = $1 AND tag_id = $2")
        .bind(person_id).bind(tag_id).execute(&pool).await?;
    let _ = create_audit_entry(&pool, &auth.email, "remove_tag", "person", &person_id.to_string(), Some(serde_json::json!({"id": person_id}))).await;
    Ok(Json(serde_json::json!({ "removed": true })))
}

pub async fn get_person_tags(
    Db(pool): Db, Path(person_id): Path<uuid::Uuid>,
) -> Result<Json<Vec<Tag>>, AppError> {
    let rows = sqlx::query_as::<_, Tag>(
        "SELECT t.* FROM tags t INNER JOIN person_tags pt ON t.id = pt.tag_id WHERE pt.person_id = $1 ORDER BY t.name"
    )
    .bind(person_id).fetch_all(&pool).await?;
    Ok(Json(rows))
}

// ─── Person Notes / Timeline ───

pub async fn list_person_notes(
    Db(pool): Db, Path(person_id): Path<uuid::Uuid>,
) -> Result<Json<Vec<PersonNote>>, AppError> {
    let rows = sqlx::query_as::<_, PersonNote>(
        "SELECT * FROM person_notes WHERE person_id = $1 ORDER BY created_at DESC"
    )
    .bind(person_id).fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn create_person_note(
    _auth: AuthUser, Db(pool): Db,
    Path(person_id): Path<uuid::Uuid>,
    Json(input): Json<CreatePersonNote>,
) -> Result<Json<PersonNote>, AppError> {
    let row = sqlx::query_as::<_, PersonNote>(
        "INSERT INTO person_notes (person_id, author, note) VALUES ($1, $2, $3) RETURNING *"
    )
    .bind(person_id).bind(input.author.as_deref().unwrap_or("Admin")).bind(&input.note)
    .fetch_one(&pool).await?;
    let _ = create_audit_entry(&pool, &auth.email, "create_note", "person", &row.id.to_string(), Some(serde_json::json!({"id": row.id}))).await;
    Ok(Json(row))
}

pub async fn delete_person_note(
    _auth: AuthUser, Db(pool): Db,
    Path((person_id, note_id)): Path<(uuid::Uuid, uuid::Uuid)>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM person_notes WHERE id = $1 AND person_id = $2")
        .bind(note_id).bind(person_id).execute(&pool).await?;
    let _ = create_audit_entry(&pool, &auth.email, "delete_note", "person", &note_id.to_string(), Some(serde_json::json!({"id": note_id}))).await;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

// ─── Group Memberships ───

pub async fn list_group_members(
    Db(pool): Db, Path(group_id): Path<i32>,
) -> Result<Json<Vec<Person>>, AppError> {
    let rows = sqlx::query_as::<_, Person>(
        "SELECT p.* FROM people p INNER JOIN group_memberships gm ON p.id = gm.person_id WHERE gm.group_id = $1 ORDER BY p.first_name"
    )
    .bind(group_id).fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn add_group_member(
    _auth: AuthUser, Db(pool): Db,
    Path(group_id): Path<i32>,
    Json(input): Json<CreateGroupMembership>,
) -> Result<Json<GroupMembership>, AppError> {
    let row = sqlx::query_as::<_, GroupMembership>(
        "INSERT INTO group_memberships (group_id, person_id, role) VALUES ($1, $2, $3) RETURNING *"
    )
    .bind(group_id).bind(input.person_id).bind(input.role.as_deref().unwrap_or("member"))
    .fetch_one(&pool).await?;
    let _ = create_audit_entry(&pool, &auth.email, "add_group_member", "group", &row.id.to_string(), Some(serde_json::json!({"id": row.id}))).await;
    Ok(Json(row))
}

pub async fn remove_group_member(
    _auth: AuthUser, Db(pool): Db,
    Path((group_id, person_id)): Path<(i32, uuid::Uuid)>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM group_memberships WHERE group_id = $1 AND person_id = $2")
        .bind(group_id).bind(person_id).execute(&pool).await?;
    let _ = create_audit_entry(&pool, &auth.email, "remove_group_member", "group", &person_id.to_string(), Some(serde_json::json!({"id": person_id}))).await;
    Ok(Json(serde_json::json!({ "removed": true })))
}

// ─── Member Directory (opt-in) ───

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct DirectoryEntry {
    pub id: uuid::Uuid,
    pub first_name: String,
    pub last_name: String,
    pub photo: Option<String>,
    pub member_status: String,
}

#[derive(serde::Deserialize, Default)]
pub struct DirectoryQuery {
    pub search: Option<String>,
}

#[derive(serde::Deserialize)]
pub struct DirectoryContact {
    pub person_id: uuid::Uuid,
    pub message: String,
}

pub async fn directory_list(
    _auth: MemberGuard,
    Db(pool): Db,
    Query(q): Query<DirectoryQuery>,
) -> Result<Json<Vec<DirectoryEntry>>, AppError> {
    let mut sql =
        String::from("SELECT id, first_name, last_name, photo, member_status FROM people WHERE directory_opt_in = true");
    let mut params: Vec<String> = Vec::new();

    if let Some(ref search) = q.search {
        let idx = params.len() + 1;
        sql.push_str(&format!(" AND (first_name ILIKE ${} OR last_name ILIKE ${})", idx, idx));
        params.push(format!("%{}%", xss::sanitize_plain(search)));
    }
    sql.push_str(" ORDER BY first_name ASC, last_name ASC");

    let mut query = sqlx::query_as::<_, DirectoryEntry>(&sql);
    for p in &params {
        query = query.bind(p);
    }
    let rows = query.fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn directory_contact(
    _auth: MemberGuard,
    Db(pool): Db,
    Json(input): Json<DirectoryContact>,
) -> Result<Json<serde_json::Value>, AppError> {
    let message_raw = input.message.trim();
    if message_raw.is_empty() {
        return Err(AppError::bad_request("Message is required"));
    }
    if message_raw.len() > 10000 {
        return Err(AppError::bad_request("Message exceeds maximum length"));
    }

    let recipient = sqlx::query_as::<_, Person>(
        "SELECT * FROM people WHERE id = $1 AND directory_opt_in = true",
    )
    .bind(input.person_id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Member not found in directory"))?;

    let sender = sqlx::query_as::<_, crate::models::member::Member>("SELECT * FROM members WHERE email = $1")
        .bind(&_auth.0.email)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Sender profile not found"))?;

    let message = xss::sanitize_plain(message_raw);

    sqlx::query(
        r#"INSERT INTO contact_messages
           (message_type, name, email, phone, message, category, anonymous, visit_date, status, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)"#,
    )
    .bind("directory")
    .bind(&sender.name)
    .bind(&sender.email)
    .bind(sender.phone.as_deref().unwrap_or(""))
    .bind(&message)
    .bind("member-directory")
    .bind(true)
    .bind("")
    .bind("new")
    .bind(format!(
        "To: {} {} (person_id: {})",
        recipient.first_name, recipient.last_name, recipient.id
    ))
    .execute(&pool)
    .await?;

    Ok(Json(serde_json::json!({ "sent": true })))
}

pub async fn stats(Db(pool): Db) -> Result<Json<serde_json::Value>, AppError> {
    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM people").fetch_one(&pool).await?;
    let visitors: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM people WHERE member_status = 'visitor'").fetch_one(&pool).await?;
    let regular: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM people WHERE member_status = 'regular'").fetch_one(&pool).await?;
    let members: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM people WHERE member_status = 'member'").fetch_one(&pool).await?;
    let inactive: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM people WHERE member_status = 'inactive'").fetch_one(&pool).await?;
    let households: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM households").fetch_one(&pool).await?;

    Ok(Json(serde_json::json!({
        "total": total.0,
        "visitors": visitors.0,
        "regular": regular.0,
        "members": members.0,
        "inactive": inactive.0,
        "households": households.0,
    })))
}
