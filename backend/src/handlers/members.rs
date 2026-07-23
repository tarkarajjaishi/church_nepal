use crate::tenant::Db;
use axum::extract::{Path, Query, Multipart};
use axum::http::header;
use axum::response::IntoResponse;
use axum::Json;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{
    CreateMember, Member, MemberListQuery, UpdateMember,
    BulkAction, CreateHousehold, UpdateHousehold, Household,
    MemberTag, CreateMemberTag,
    MemberNote, CreateMemberNote,
    CreateMemberCustomField,
};
use std::collections::HashMap;

fn escape_csv(s: &str) -> String {
    if s.contains(',') || s.contains('"') || s.contains('\n') {
        format!("\"{}\"", s.replace('"', "\"\""))
    } else {
        s.to_string()
    }
}

fn simple_csv_parse(bytes: &[u8]) -> Result<Vec<Vec<String>>, AppError> {
    let text = String::from_utf8(bytes.to_vec()).map_err(|_| AppError::bad_request("Invalid UTF-8 in CSV"))?;
    let mut rows = Vec::new();
    let mut current = Vec::new();
    let mut field = String::new();
    let mut in_quotes = false;

    for ch in text.chars() {
        match ch {
            '"' => {
                if in_quotes {
                    field.push('"');
                    in_quotes = false;
                } else {
                    in_quotes = true;
                }
            }
            ',' => {
                if in_quotes {
                    field.push(',');
                } else {
                    current.push(field.clone());
                    field.clear();
                }
            }
            '\n' | '\r' => {
                if in_quotes {
                    field.push('\n');
                } else {
                    current.push(field.clone());
                    field.clear();
                    if current.iter().any(|c| !c.is_empty()) || current.len() > 1 {
                        rows.push(current);
                    }
                    current = Vec::new();
                }
            }
            other => field.push(other),
        }
    }
    if !field.is_empty() || current.len() > 1 {
        current.push(field);
        rows.push(current);
    }

    if let Some(first) = rows.first() {
        if first.iter().all(|c| c.is_empty()) {
            rows.remove(0);
        }
    }

    Ok(rows)
}

fn csv_row_to_map(row: &[String], headers: &[String]) -> HashMap<String, String> {
    let mut map = HashMap::new();
    for (i, header) in headers.iter().enumerate() {
        if let Some(val) = row.get(i) {
            map.insert(header.clone(), val.clone());
        }
    }
    map
}

fn get_val(map: &HashMap<String, String>, key: Option<&str>) -> Option<String> {
    key.and_then(|k| map.get(k).cloned())
}

pub async fn list(Db(pool): Db, Query(q): Query<MemberListQuery>) -> Result<Json<Paginated<Member>>, AppError> {
    let mut sql = String::from("SELECT * FROM members WHERE 1=1");
    let mut count_sql = String::from("SELECT COUNT(*) FROM members WHERE 1=1");

    if let Some(ref status) = q.status {
        sql.push_str(&format!(" AND member_status = '{}'", status));
        count_sql.push_str(&format!(" AND member_status = '{}'", status));
    }
    if let Some(ref search) = q.search {
        sql.push_str(&format!(" AND (name ILIKE '%{}%' OR email ILIKE '%{}%' OR phone ILIKE '%{}%')", search, search, search));
        count_sql.push_str(&format!(" AND (name ILIKE '%{}%' OR email ILIKE '%{}%' OR phone ILIKE '%{}%')", search, search, search));
    }
    if let Some(household_id) = q.household_id {
        sql.push_str(&format!(" AND household_id = '{}'", household_id));
        count_sql.push_str(&format!(" AND household_id = '{}'", household_id));
    }
    if let Some(tag_id) = q.tag_id {
        sql.push_str(&format!(" AND id IN (SELECT member_id FROM member_tag_assignments WHERE tag_id = '{}')", tag_id));
        count_sql.push_str(&format!(" AND id IN (SELECT member_id FROM member_tag_assignments WHERE tag_id = '{}')", tag_id));
    }
    sql.push_str(" ORDER BY COALESCE(sort_order, 0) ASC, created_at DESC");

    let per_page = q.per_page.unwrap_or(50).clamp(1, 200);
    let page = q.page.unwrap_or(1).max(1);
    let offset = (page - 1) * per_page;

    let total: i64 = sqlx::query_scalar(&count_sql).fetch_one(&pool).await?;
    let rows = sqlx::query_as::<_, Member>(&sql)
        .bind(per_page).bind(offset)
        .fetch_all(&pool).await?;
    let total_pages = (total as f64 / per_page as f64).ceil() as i64;
    Ok(Json(Paginated {
        data: rows,
        total,
        page,
        per_page,
        total_pages,
    }))
}

pub async fn get(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<Member>, AppError> {
    let row = sqlx::query_as::<_, Member>("SELECT * FROM members WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Member not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, Db(pool): Db, Json(input): Json<CreateMember>) -> Result<Json<Member>, AppError> {
    let joined = input.joined_date.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());
    let row = sqlx::query_as::<_, Member>(
        r#"INSERT INTO members (name, role, since, image, email, phone, address, city, member_status, notes, joined_date, household_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *"#,
    )
    .bind(&input.name)
    .bind(&input.role)
    .bind(&input.since)
    .bind(&input.image)
    .bind(&input.email)
    .bind(&input.phone)
    .bind(&input.address)
    .bind(&input.city)
    .bind(input.member_status.as_deref().unwrap_or("member"))
    .bind(&input.notes)
    .bind(joined)
    .bind(input.household_id)
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateMember>) -> Result<Json<Member>, AppError> {
    let existing = sqlx::query_as::<_, Member>("SELECT * FROM members WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Member not found"))?;

    let joined = input.joined_date.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok()).or(existing.joined_date);

    let row = sqlx::query_as::<_, Member>(
        r#"UPDATE members SET
            name=COALESCE($2,name), role=COALESCE($3,role), since=COALESCE($4,since), image=COALESCE($5,image),
            email=COALESCE($6,email), phone=COALESCE($7,phone), address=COALESCE($8,address), city=COALESCE($9,city),
            member_status=COALESCE($10,member_status), notes=COALESCE($11,notes), joined_date=COALESCE($12,joined_date),
            household_id=COALESCE($13,household_id), enabled=COALESCE($14,enabled), sort_order=COALESCE($15,sort_order),
            updated_at=NOW()
         WHERE id=$1 RETURNING *"#
    )
    .bind(id)
    .bind(input.name.as_deref().unwrap_or(&existing.name))
    .bind(input.role.as_deref().unwrap_or(&existing.role))
    .bind(input.since.as_deref().unwrap_or(&existing.since))
    .bind(input.image.as_deref().unwrap_or(&existing.image))
    .bind(input.email.as_deref().or(existing.email.as_deref()))
    .bind(input.phone.as_deref().or(existing.phone.as_deref()))
    .bind(input.address.as_deref().or(existing.address.as_deref()))
    .bind(input.city.as_deref().or(existing.city.as_deref()))
    .bind(input.member_status.as_deref().unwrap_or(&existing.member_status))
    .bind(input.notes.as_deref().or(existing.notes.as_deref()))
    .bind(joined)
    .bind(input.household_id.or(existing.household_id))
    .bind(input.enabled.unwrap_or(existing.enabled.unwrap_or(true)))
    .bind(input.sort_order.unwrap_or(existing.sort_order.unwrap_or(0)))
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM members WHERE id = $1")
        .bind(id)
        .execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Member>, AppError> {
    let row = sqlx::query_as::<_, Member>(
        "UPDATE members SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Member not found"))?;
    Ok(Json(row))
}

#[derive(serde::Deserialize)]
pub struct ReorderRequest {
    pub sort_order: i32,
}

pub async fn reorder(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<ReorderRequest>,
) -> Result<Json<Member>, AppError> {
    let row = sqlx::query_as::<_, Member>(
        "UPDATE members SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Member not found"))?;
    Ok(Json(row))
}

// ─── Households CRUD ───

pub async fn list_households(Db(pool): Db) -> Result<Json<Vec<Household>>, AppError> {
    let rows = sqlx::query_as::<_, Household>("SELECT * FROM households ORDER BY sort_order ASC, created_at DESC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get_household(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<Household>, AppError> {
    let row = sqlx::query_as::<_, Household>("SELECT * FROM households WHERE id = $1")
        .bind(id).fetch_optional(&pool).await?
        .ok_or_else(|| AppError::not_found("Household not found"))?;
    Ok(Json(row))
}

pub async fn create_household(_auth: AuthUser, Db(pool): Db, Json(input): Json<CreateHousehold>) -> Result<Json<Household>, AppError> {
    let row = sqlx::query_as::<_, Household>(
        "INSERT INTO households (name, address, phone, notes) VALUES ($1,$2,$3,$4) RETURNING *"
    )
    .bind(&input.name).bind(&input.address).bind(&input.phone).bind(&input.notes)
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update_household(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateHousehold>) -> Result<Json<Household>, AppError> {
    let row = sqlx::query_as::<_, Household>(
        "UPDATE households SET name=COALESCE($2,name), address=COALESCE($3,address), phone=COALESCE($4,phone), notes=COALESCE($5,notes), enabled=COALESCE($6,enabled), updated_at=NOW() WHERE id=$1 RETURNING *"
    )
    .bind(id).bind(&input.name).bind(&input.address).bind(&input.phone).bind(&input.notes).bind(input.enabled)
    .fetch_optional(&pool).await?
    .ok_or_else(|| AppError::not_found("Household not found"))?;
    Ok(Json(row))
}

pub async fn delete_household(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("UPDATE members SET household_id = NULL WHERE household_id = $1").bind(id).execute(&pool).await?;
    sqlx::query("DELETE FROM households WHERE id = $1").bind(id).execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

// ─── Member Tags ───

pub async fn list_tags(Db(pool): Db) -> Result<Json<Vec<MemberTag>>, AppError> {
    let rows = sqlx::query_as::<_, MemberTag>("SELECT * FROM member_tags ORDER BY name ASC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn create_tag(_auth: AuthUser, Db(pool): Db, Json(input): Json<CreateMemberTag>) -> Result<Json<MemberTag>, AppError> {
    let row = sqlx::query_as::<_, MemberTag>(
        "INSERT INTO member_tags (name, color) VALUES ($1, $2) RETURNING *"
    )
    .bind(&input.name).bind(input.color.as_deref().unwrap_or("#3B82F6"))
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete_tag(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM member_tags WHERE id = $1").bind(id).execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn list_member_tags(Db(pool): Db, Path(member_id): Path<uuid::Uuid>) -> Result<Json<Vec<MemberTag>>, AppError> {
    let rows = sqlx::query_as::<_, MemberTag>(
        "SELECT t.* FROM member_tags t INNER JOIN member_tag_assignments mta ON t.id = mta.tag_id WHERE mta.member_id = $1 ORDER BY t.name"
    )
    .bind(member_id).fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn add_member_tag(_auth: AuthUser, Db(pool): Db, Path((member_id, tag_id)): Path<(uuid::Uuid, uuid::Uuid)>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("INSERT INTO member_tag_assignments (member_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING")
        .bind(member_id).bind(tag_id).execute(&pool).await?;
    Ok(Json(serde_json::json!({ "added": true })))
}

pub async fn remove_member_tag(_auth: AuthUser, Db(pool): Db, Path((member_id, tag_id)): Path<(uuid::Uuid, uuid::Uuid)>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM member_tag_assignments WHERE member_id = $1 AND tag_id = $2")
        .bind(member_id).bind(tag_id).execute(&pool).await?;
    Ok(Json(serde_json::json!({ "removed": true })))
}

// ─── Member Notes ───

pub async fn list_member_notes(Db(pool): Db, Path(member_id): Path<uuid::Uuid>) -> Result<Json<Vec<MemberNote>>, AppError> {
    let rows = sqlx::query_as::<_, MemberNote>("SELECT * FROM member_notes WHERE member_id = $1 ORDER BY created_at DESC")
        .bind(member_id).fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn create_member_note(_auth: AuthUser, Db(pool): Db, Path(member_id): Path<uuid::Uuid>, Json(input): Json<CreateMemberNote>) -> Result<Json<MemberNote>, AppError> {
    let row = sqlx::query_as::<_, MemberNote>(
        "INSERT INTO member_notes (member_id, author, note) VALUES ($1, $2, $3) RETURNING *"
    )
    .bind(member_id).bind(input.author.as_deref().unwrap_or("Admin")).bind(&input.note)
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete_member_note(_auth: AuthUser, Db(pool): Db, Path((member_id, note_id)): Path<(uuid::Uuid, uuid::Uuid)>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM member_notes WHERE id = $1 AND member_id = $2")
        .bind(note_id).bind(member_id).execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

// ─── Member Custom Fields ───

pub async fn list_member_custom_fields(Db(pool): Db, Path(member_id): Path<uuid::Uuid>) -> Result<Json<Vec<crate::models::MemberCustomField>>, AppError> {
    let rows = sqlx::query_as::<_, crate::models::MemberCustomField>("SELECT * FROM member_custom_fields WHERE member_id = $1 ORDER BY created_at DESC")
        .bind(member_id).fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn set_member_custom_field(_auth: AuthUser, Db(pool): Db, Json(input): Json<CreateMemberCustomField>) -> Result<Json<crate::models::MemberCustomField>, AppError> {
    let row = sqlx::query_as::<_, crate::models::MemberCustomField>(
        "INSERT INTO member_custom_fields (member_id, field_key, field_value) VALUES ($1, $2, $3) ON CONFLICT (member_id, field_key) DO UPDATE SET field_value = EXCLUDED.field_value RETURNING *"
    )
    .bind(input.member_id).bind(&input.field_key).bind(&input.field_value)
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete_member_custom_field(_auth: AuthUser, Db(pool): Db, Path((member_id, field_id)): Path<(uuid::Uuid, uuid::Uuid)>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM member_custom_fields WHERE id = $1 AND member_id = $2")
        .bind(field_id).bind(member_id).execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

// ─── CSV Export ───

pub async fn export_csv(Db(pool): Db) -> Result<impl IntoResponse, AppError> {
    let rows = sqlx::query_as::<_, Member>("SELECT * FROM members ORDER BY COALESCE(sort_order, 0) ASC, created_at DESC")
        .fetch_all(&pool).await?;

    let mut csv = String::from("ID,Name,Email,Phone,City,Status,Role,Since,Joined,Household,Notes,Image\n");
    for row in rows {
        csv.push_str(&format!(
            "{},{},{},{},{},{},{},{},{},{},{},{}\n",
            row.id,
            escape_csv(&row.name),
            escape_csv(&row.email.unwrap_or_default()),
            escape_csv(&row.phone.unwrap_or_default()),
            escape_csv(&row.city.unwrap_or_default()),
            escape_csv(&row.member_status),
            escape_csv(&row.role),
            escape_csv(&row.since),
            row.joined_date.map(|d| d.to_string()).unwrap_or_default(),
            row.household_id.map(|id| id.to_string()).unwrap_or_default(),
            escape_csv(&row.notes.unwrap_or_default()),
            escape_csv(&row.image),
        ));
    }

    Ok(([ (header::CONTENT_TYPE, "text/csv") ], csv))
}

// ─── CSV Import ───

#[derive(serde::Deserialize)]
pub struct ImportMapping {
    pub name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub city: Option<String>,
    pub role: Option<String>,
    pub since: Option<String>,
    pub image: Option<String>,
    pub member_status: Option<String>,
    pub household_id: Option<String>,
    pub notes: Option<String>,
    pub joined_date: Option<String>,
}

pub async fn import_csv(_auth: AuthUser, Db(pool): Db, mut multipart: Multipart) -> Result<Json<serde_json::Value>, AppError> {
    let mut csv_bytes: Option<Vec<u8>> = None;
    let mut mapping_json: Option<String> = None;

    while let Some(field) = multipart.next_field().await.map_err(|e| AppError::bad_request(format!("Multipart error: {}", e)))? {
        let name = field.name().unwrap_or("");
        if name == "file" {
            let data = field.bytes().await.map_err(|e| AppError::bad_request(format!("File read error: {}", e)))?;
            csv_bytes = Some(data.to_vec());
        } else if name == "mapping" {
            let data = field.text().await.map_err(|e| AppError::bad_request(format!("Mapping read error: {}", e)))?;
            mapping_json = Some(data);
        }
    }

    let csv_bytes = csv_bytes.ok_or_else(|| AppError::bad_request("No file uploaded"))?;
    let mapping: ImportMapping = mapping_json
        .map(|j| serde_json::from_str(&j))
        .transpose()
        .map_err(|_| AppError::bad_request("Invalid mapping JSON"))?
        .unwrap_or(ImportMapping {
            name: Some("Name".to_string()),
            email: Some("Email".to_string()),
            phone: Some("Phone".to_string()),
            city: Some("City".to_string()),
            role: Some("Role".to_string()),
            since: Some("Since".to_string()),
            image: Some("Image".to_string()),
            member_status: Some("Status".to_string()),
            household_id: None,
            notes: Some("Notes".to_string()),
            joined_date: Some("Joined".to_string()),
        });

    let all_rows = simple_csv_parse(&csv_bytes)?;
    if all_rows.is_empty() {
        return Ok(Json(serde_json::json!({ "imported": 0, "updated": 0, "errors": 0, "total": 0 })));
    }

    let headers = all_rows[0].clone();
    let data_rows = &all_rows[1..];

    let mut created = 0u32;
    let mut updated = 0u32;
    let mut errors = 0u32;

    for row in data_rows.iter() {
        let map = csv_row_to_map(row, &headers);

        let name = get_val(&map, mapping.name.as_deref()).filter(|s| !s.is_empty()).map(|s| s.to_string());
        if name.is_none() {
            errors += 1;
            continue;
        }
        let name = name.unwrap();

        let email = get_val(&map, mapping.email.as_deref()).filter(|s| !s.is_empty()).map(|s| s.to_string());
        let phone = get_val(&map, mapping.phone.as_deref()).filter(|s| !s.is_empty()).map(|s| s.to_string());
        let city = get_val(&map, mapping.city.as_deref()).filter(|s| !s.is_empty()).map(|s| s.to_string());
        let role = get_val(&map, mapping.role.as_deref()).filter(|s| !s.is_empty()).map(|s| s.to_string()).unwrap_or_else(|| "member".to_string());
        let since = get_val(&map, mapping.since.as_deref()).filter(|s| !s.is_empty()).map(|s| s.to_string()).unwrap_or_default();
        let image = get_val(&map, mapping.image.as_deref()).filter(|s| !s.is_empty()).map(|s| s.to_string()).unwrap_or_default();
        let member_status = get_val(&map, mapping.member_status.as_deref()).filter(|s| !s.is_empty()).map(|s| s.to_string()).unwrap_or_else(|| "member".to_string());
        let notes = get_val(&map, mapping.notes.as_deref()).filter(|s| !s.is_empty()).map(|s| s.to_string());
        let joined_date = get_val(&map, mapping.joined_date.as_deref()).filter(|s| !s.is_empty()).map(|s| s.to_string());
        let household_id = mapping.household_id.as_ref()
            .and_then(|h| get_val(&map, Some(h.as_str())))
            .filter(|s| !s.is_empty())
            .and_then(|s| uuid::Uuid::parse_str(&s).ok());

        let existing = if let Some(ref email) = email {
            sqlx::query_as::<_, (uuid::Uuid,)>("SELECT id FROM members WHERE email = $1")
                .bind(email).fetch_optional(&pool).await?
        } else {
            sqlx::query_as::<_, (uuid::Uuid,)>("SELECT id FROM members WHERE name = $1")
                .bind(&name).fetch_optional(&pool).await?
        };

        let joined = joined_date.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

        if let Some((existing_id,)) = existing {
            sqlx::query(
                r#"UPDATE members SET name=COALESCE($2,name), role=COALESCE($3,role), since=COALESCE($4,since), image=COALESCE($5,image),
                   email=COALESCE($6,email), phone=COALESCE($7,phone), address=COALESCE($8,address), city=COALESCE($9,city),
                   member_status=COALESCE($10,member_status), notes=COALESCE($11,notes), joined_date=COALESCE($12,joined_date), updated_at=NOW()
                   WHERE id=$1"#
            )
            .bind(existing_id)
            .bind(&name)
            .bind(&role)
            .bind(&since)
            .bind(&image)
            .bind(&email)
            .bind(&phone)
            .bind(&city)
            .bind(&city)
            .bind(&member_status)
            .bind(&notes)
            .bind(joined)
            .execute(&pool).await?;
            updated += 1;
        } else {
            sqlx::query(
                r#"INSERT INTO members (name, role, since, image, email, phone, address, city, member_status, notes, joined_date, household_id)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)"#
            )
            .bind(&name)
            .bind(&role)
            .bind(&since)
            .bind(&image)
            .bind(&email)
            .bind(&phone)
            .bind(&city)
            .bind(&city)
            .bind(&member_status)
            .bind(&notes)
            .bind(joined)
            .bind(household_id)
            .execute(&pool).await?;
            created += 1;
        }
    }

    Ok(Json(serde_json::json!({
        "imported": created,
        "updated": updated,
        "errors": errors,
        "total": data_rows.len(),
    })))
}

fn get_val(map: &HashMap<String, String>, key: Option<&str>) -> Option<String> {
    key.and_then(|k| map.get(k).cloned())
}

// ─── Bulk Actions ───

pub async fn bulk_delete(_auth: AuthUser, Db(pool): Db, Json(input): Json<BulkAction>) -> Result<Json<serde_json::Value>, AppError> {
    for id in &input.ids {
        sqlx::query("DELETE FROM members WHERE id = $1").bind(id).execute(&pool).await?;
    }
    Ok(Json(serde_json::json!({ "deleted": input.ids.len() })))
}

pub async fn bulk_set_status(_auth: AuthUser, Db(pool): Db, Json(input): Json<serde_json::Value>) -> Result<Json<serde_json::Value>, AppError> {
    let ids: Vec<uuid::Uuid> = serde_json::from_value(input.get("ids").cloned().unwrap_or_default()).map_err(|_| AppError::bad_request("Invalid ids"))?;
    let enabled: bool = serde_json::from_value(input.get("enabled").cloned().unwrap_or(serde_json::Value::Bool(true))).map_err(|_| AppError::bad_request("Invalid enabled"))?;

    for id in &ids {
        sqlx::query("UPDATE members SET enabled = $2 WHERE id = $1").bind(id).bind(enabled).execute(&pool).await?;
    }
    Ok(Json(serde_json::json!({ "updated": ids.len(), "enabled": enabled })))
}

pub async fn bulk_set_household(_auth: AuthUser, Db(pool): Db, Json(input): Json<serde_json::Value>) -> Result<Json<serde_json::Value>, AppError> {
    let ids: Vec<uuid::Uuid> = serde_json::from_value(input.get("ids").cloned().unwrap_or_default()).map_err(|_| AppError::bad_request("Invalid ids"))?;
    let household_id: Option<uuid::Uuid> = serde_json::from_value(input.get("householdId").cloned().unwrap_or_default()).ok();

    for id in &ids {
        sqlx::query("UPDATE members SET household_id = $2 WHERE id = $1").bind(id).bind(household_id).execute(&pool).await?;
    }
    Ok(Json(serde_json::json!({ "updated": ids.len() })))
}

pub async fn bulk_assign_tag(_auth: AuthUser, Db(pool): Db, Json(input): Json<serde_json::Value>) -> Result<Json<serde_json::Value>, AppError> {
    let ids: Vec<uuid::Uuid> = serde_json::from_value(input.get("ids").cloned().unwrap_or_default()).map_err(|_| AppError::bad_request("Invalid ids"))?;
    let tag_id: uuid::Uuid = serde_json::from_value(input.get("tagId").cloned().unwrap_or_default()).map_err(|_| AppError::bad_request("Invalid tagId"))?;

    for id in &ids {
        sqlx::query("INSERT INTO member_tag_assignments (member_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING")
            .bind(id).bind(tag_id).execute(&pool).await?;
    }
    Ok(Json(serde_json::json!({ "assigned": ids.len() })))
}
