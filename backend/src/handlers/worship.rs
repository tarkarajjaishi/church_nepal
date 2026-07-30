//! Worship Management handlers.
//!
//! Money-free module, but the same discipline applies as elsewhere: every
//! query is parameter-bound, aggregates are cast explicitly (SUM over INTEGER
//! returns BIGINT, over BIGINT returns NUMERIC — both need pinning), and no
//! aggregate is wrapped in unwrap_or, because a swallowed error that renders
//! as 0 is worse than a 500.

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::worship::*;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;

fn parse_date(s: &str) -> Result<chrono::NaiveDate, AppError> {
    chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d")
        .map_err(|_| AppError::bad_request("Invalid date, expected YYYY-MM-DD"))
}

fn parse_time(s: Option<&str>) -> Result<Option<chrono::NaiveTime>, AppError> {
    match s {
        Some(t) if !t.is_empty() => Ok(Some(
            chrono::NaiveTime::parse_from_str(t, "%H:%M")
                .or_else(|_| chrono::NaiveTime::parse_from_str(t, "%H:%M:%S"))
                .map_err(|_| AppError::bad_request("Invalid time, expected HH:MM"))?,
        )),
        _ => Ok(None),
    }
}

// ===========================================================================
// Roles
// ===========================================================================

pub async fn roles_list(Db(pool): Db) -> Result<Json<Vec<WorshipRole>>, AppError> {
    let rows = sqlx::query_as::<_, WorshipRole>(
        "SELECT * FROM worship_roles WHERE is_active ORDER BY sort_order, name",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

// ===========================================================================
// Members
// ===========================================================================

const MEMBER_SELECT: &str = r#"
    SELECT m.id, m.person_id, m.name, m.photo, m.phone, m.email, m.voice_type,
           m.experience, m.emergency_contact, m.emergency_phone, m.notes,
           m.is_leader, m.is_active,
           COALESCE(ARRAY_AGG(r.name ORDER BY r.sort_order)
                    FILTER (WHERE r.id IS NOT NULL), '{}') AS roles,
           COALESCE(ARRAY_AGG(r.id ORDER BY r.sort_order)
                    FILTER (WHERE r.id IS NOT NULL), '{}') AS role_ids
    FROM worship_members m
    LEFT JOIN worship_member_roles mr ON mr.member_id = m.id
    LEFT JOIN worship_roles r ON r.id = mr.role_id
"#;

#[derive(serde::Deserialize, Default)]
pub struct MemberQuery {
    pub role_id: Option<uuid::Uuid>,
    pub active: Option<bool>,
    pub search: Option<String>,
}

pub async fn members_list(
    Db(pool): Db,
    Query(q): Query<MemberQuery>,
) -> Result<Json<Vec<WorshipMember>>, AppError> {
    // The role filter is a semi-join in the WHERE clause, not a condition on
    // the joined rows: filtering the join would return the member with only
    // that one role attached, hiding the rest of what they play.
    let sql = format!(
        r#"{MEMBER_SELECT}
           WHERE ($1::boolean IS NULL OR m.is_active = $1)
             AND ($2::text IS NULL OR m.name ILIKE '%' || $2 || '%')
             AND ($3::uuid IS NULL OR EXISTS (
                   SELECT 1 FROM worship_member_roles x
                   WHERE x.member_id = m.id AND x.role_id = $3))
           GROUP BY m.id
           ORDER BY m.is_leader DESC, m.name"#
    );
    let rows = sqlx::query_as::<_, WorshipMember>(&sql)
        .bind(q.active)
        .bind(q.search.as_deref())
        .bind(q.role_id)
        .fetch_all(&pool)
        .await?;
    Ok(Json(rows))
}

async fn member_by_id(
    pool: &sqlx::PgPool,
    id: uuid::Uuid,
) -> Result<WorshipMember, AppError> {
    let sql = format!("{MEMBER_SELECT} WHERE m.id = $1 GROUP BY m.id");
    sqlx::query_as::<_, WorshipMember>(&sql)
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::not_found("Team member not found"))
}

pub async fn members_create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertMember>,
) -> Result<Json<WorshipMember>, AppError> {
    if input.name.trim().is_empty() {
        return Err(AppError::bad_request("Name is required"));
    }
    let mut tx = pool.begin().await?;
    let id: uuid::Uuid = sqlx::query_scalar(
        r#"INSERT INTO worship_members
             (person_id, name, photo, phone, email, voice_type, experience,
              emergency_contact, emergency_phone, notes, is_leader, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id"#,
    )
    .bind(input.person_id)
    .bind(input.name.trim())
    .bind(input.photo.unwrap_or_default())
    .bind(input.phone.unwrap_or_default())
    .bind(input.email.unwrap_or_default())
    .bind(input.voice_type.unwrap_or_else(|| "none".into()))
    .bind(input.experience.unwrap_or_else(|| "intermediate".into()))
    .bind(input.emergency_contact.unwrap_or_default())
    .bind(input.emergency_phone.unwrap_or_default())
    .bind(input.notes.unwrap_or_default())
    .bind(input.is_leader.unwrap_or(false))
    .bind(input.is_active.unwrap_or(true))
    .fetch_one(&mut *tx)
    .await?;

    for (i, role_id) in input.role_ids.unwrap_or_default().iter().enumerate() {
        sqlx::query(
            "INSERT INTO worship_member_roles (member_id, role_id, is_primary)
             VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",
        )
        .bind(id)
        .bind(role_id)
        .bind(i == 0)
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;
    Ok(Json(member_by_id(&pool, id).await?))
}

pub async fn members_update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpsertMember>,
) -> Result<Json<WorshipMember>, AppError> {
    let mut tx = pool.begin().await?;
    let found = sqlx::query(
        r#"UPDATE worship_members SET
             name = $2,
             person_id = $3,
             photo = COALESCE($4, photo),
             phone = COALESCE($5, phone),
             email = COALESCE($6, email),
             voice_type = COALESCE($7, voice_type),
             experience = COALESCE($8, experience),
             emergency_contact = COALESCE($9, emergency_contact),
             emergency_phone = COALESCE($10, emergency_phone),
             notes = COALESCE($11, notes),
             is_leader = COALESCE($12, is_leader),
             is_active = COALESCE($13, is_active),
             updated_at = NOW()
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(input.name.trim())
    .bind(input.person_id)
    .bind(input.photo)
    .bind(input.phone)
    .bind(input.email)
    .bind(input.voice_type)
    .bind(input.experience)
    .bind(input.emergency_contact)
    .bind(input.emergency_phone)
    .bind(input.notes)
    .bind(input.is_leader)
    .bind(input.is_active)
    .execute(&mut *tx)
    .await?;
    if found.rows_affected() == 0 {
        return Err(AppError::not_found("Team member not found"));
    }

    // Roles are replaced only when the caller sends the field, so a partial
    // update (e.g. toggling active) does not silently wipe someone's
    // instruments.
    if let Some(role_ids) = input.role_ids {
        sqlx::query("DELETE FROM worship_member_roles WHERE member_id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await?;
        for (i, role_id) in role_ids.iter().enumerate() {
            sqlx::query(
                "INSERT INTO worship_member_roles (member_id, role_id, is_primary)
                 VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",
            )
            .bind(id)
            .bind(role_id)
            .bind(i == 0)
            .execute(&mut *tx)
            .await?;
        }
    }
    tx.commit().await?;
    Ok(Json(member_by_id(&pool, id).await?))
}

pub async fn members_delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Deactivate rather than delete when the member appears in past service
    // history: removing them would rewrite who actually played.
    let used: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM service_assignments WHERE member_id = $1")
            .bind(id)
            .fetch_one(&pool)
            .await?;
    if used > 0 {
        sqlx::query("UPDATE worship_members SET is_active = false, updated_at = NOW() WHERE id = $1")
            .bind(id)
            .execute(&pool)
            .await?;
        return Ok(Json(serde_json::json!({
            "deactivated": true,
            "reason": format!("Appears in {used} service assignment(s), so was deactivated rather than deleted")
        })));
    }
    let res = sqlx::query("DELETE FROM worship_members WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Team member not found"));
    }
    Ok(Json(serde_json::json!({ "deleted": true })))
}

// ===========================================================================
// Services
// ===========================================================================


#[derive(serde::Deserialize, Default)]
pub struct ServiceQuery {
    pub from_date: Option<String>,
    pub to_date: Option<String>,
    pub status: Option<String>,
    pub upcoming: Option<bool>,
}

pub async fn services_list(
    Db(pool): Db,
    Query(q): Query<ServiceQuery>,
) -> Result<Json<Vec<WorshipServiceRow>>, AppError> {
    // planned_seconds is summed in a correlated subquery rather than the main
    // aggregate: SUM over a column multiplied by the assignments join would
    // count each item once per team member.
    let sql = r#"
        SELECT s.id, s.name, s.service_date, s.start_time, s.theme, s.speaker,
               s.service_type, s.status, s.worship_leader,
               (SELECT COUNT(*) FROM service_plan_items i WHERE i.service_id = s.id)::bigint AS item_count,
               (SELECT COUNT(*) FROM service_plan_items i WHERE i.service_id = s.id AND i.song_id IS NOT NULL)::bigint AS song_count,
               (SELECT COUNT(*) FROM service_assignments a WHERE a.service_id = s.id)::bigint AS team_count,
               (SELECT COALESCE(SUM(i.planned_seconds),0) FROM service_plan_items i WHERE i.service_id = s.id)::bigint AS planned_seconds
        FROM worship_services s
        WHERE ($1::date IS NULL OR s.service_date >= $1)
          AND ($2::date IS NULL OR s.service_date <= $2)
          AND ($3::text IS NULL OR s.status = $3)
          AND ($4::boolean IS NOT TRUE OR s.service_date >= CURRENT_DATE)
        ORDER BY s.service_date DESC, s.start_time NULLS LAST
        LIMIT 200"#;

    let from = q.from_date.as_deref().map(parse_date).transpose()?;
    let to = q.to_date.as_deref().map(parse_date).transpose()?;

    let rows = sqlx::query_as::<_, WorshipServiceRow>(sql)
        .bind(from)
        .bind(to)
        .bind(q.status.as_deref())
        .bind(q.upcoming)
        .fetch_all(&pool)
        .await?;
    Ok(Json(rows))
}

pub async fn services_get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<ServicePlan>, AppError> {
    let service = sqlx::query_as::<_, WorshipService>("SELECT * FROM worship_services WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Service plan not found"))?;

    let items = sqlx::query_as::<_, ServicePlanItem>(
        r#"SELECT i.id, i.service_id, i.sort_order, i.item_kind, i.title,
                  i.song_id, sg.title AS song_title, sg.song_key AS song_default_key,
                  sg.bpm AS song_bpm, i.song_key, i.leader,
                  i.planned_seconds, i.actual_seconds, i.notes
           FROM service_plan_items i
           LEFT JOIN songs sg ON sg.id = i.song_id
           WHERE i.service_id = $1 ORDER BY i.sort_order"#,
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    let team = sqlx::query_as::<_, ServiceAssignment>(
        r#"SELECT a.id, a.service_id, a.member_id, m.name AS member_name,
                  m.photo AS member_photo, a.role_id, r.name AS role_name,
                  r.category AS role_category, a.status, a.notes
           FROM service_assignments a
           JOIN worship_members m ON m.id = a.member_id
           LEFT JOIN worship_roles r ON r.id = a.role_id
           WHERE a.service_id = $1
           ORDER BY r.sort_order NULLS LAST, m.name"#,
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    // SUM over INTEGER yields BIGINT in Postgres; cast anyway so a column type
    // change cannot silently turn this into NUMERIC and 500 at decode time.
    let planned_seconds: i64 = items.iter().map(|i| i64::from(i.planned_seconds)).sum();
    let actual_seconds: i64 = items
        .iter()
        .filter_map(|i| i.actual_seconds.map(i64::from))
        .sum();

    Ok(Json(ServicePlan {
        service,
        items,
        team,
        planned_seconds,
        actual_seconds,
    }))
}

pub async fn services_create(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertService>,
) -> Result<Json<WorshipService>, AppError> {
    if input.name.trim().is_empty() {
        return Err(AppError::bad_request("Service name is required"));
    }
    let date = parse_date(&input.service_date)?;
    let start = parse_time(input.start_time.as_deref())?;
    let end = parse_time(input.end_time.as_deref())?;
    if let (Some(s), Some(e)) = (start, end) {
        if e <= s {
            return Err(AppError::bad_request("End time must be after the start time"));
        }
    }

    let row = sqlx::query_as::<_, WorshipService>(
        r#"INSERT INTO worship_services
             (name, service_date, start_time, end_time, theme, speaker, service_type,
              description, status, worship_leader, notes, playlist_id, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *"#,
    )
    .bind(input.name.trim())
    .bind(date)
    .bind(start)
    .bind(end)
    .bind(input.theme.unwrap_or_default())
    .bind(input.speaker.unwrap_or_default())
    .bind(input.service_type.unwrap_or_else(|| "sunday".into()))
    .bind(input.description.unwrap_or_default())
    .bind(input.status.unwrap_or_else(|| "draft".into()))
    .bind(input.worship_leader.unwrap_or_default())
    .bind(input.notes.unwrap_or_default())
    .bind(input.playlist_id)
    .bind(&auth.email)
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn services_update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpsertService>,
) -> Result<Json<WorshipService>, AppError> {
    let date = parse_date(&input.service_date)?;
    let start = parse_time(input.start_time.as_deref())?;
    let end = parse_time(input.end_time.as_deref())?;
    if let (Some(s), Some(e)) = (start, end) {
        if e <= s {
            return Err(AppError::bad_request("End time must be after the start time"));
        }
    }
    let row = sqlx::query_as::<_, WorshipService>(
        r#"UPDATE worship_services SET
             name=$2, service_date=$3, start_time=$4, end_time=$5,
             theme=COALESCE($6,theme), speaker=COALESCE($7,speaker),
             service_type=COALESCE($8,service_type), description=COALESCE($9,description),
             status=COALESCE($10,status), worship_leader=COALESCE($11,worship_leader),
             notes=COALESCE($12,notes), playlist_id=$13, updated_at=NOW()
           WHERE id=$1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.name.trim())
    .bind(date)
    .bind(start)
    .bind(end)
    .bind(input.theme)
    .bind(input.speaker)
    .bind(input.service_type)
    .bind(input.description)
    .bind(input.status)
    .bind(input.worship_leader)
    .bind(input.notes)
    .bind(input.playlist_id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Service plan not found"))?;
    Ok(Json(row))
}

pub async fn services_delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let res = sqlx::query("DELETE FROM worship_services WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Service plan not found"));
    }
    Ok(Json(serde_json::json!({ "deleted": true })))
}

/// Copy a plan to a new date — the usual way a church builds next week.
pub async fn services_duplicate(
    auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpsertService>,
) -> Result<Json<ServicePlan>, AppError> {
    let date = parse_date(&input.service_date)?;
    let mut tx = pool.begin().await?;

    let src = sqlx::query_as::<_, WorshipService>("SELECT * FROM worship_services WHERE id = $1")
        .bind(id)
        .fetch_optional(&mut *tx)
        .await?
        .ok_or_else(|| AppError::not_found("Service plan not found"))?;

    let name = if input.name.trim().is_empty() {
        format!("{} (copy)", src.name)
    } else {
        input.name.trim().to_string()
    };

    let new_id: uuid::Uuid = sqlx::query_scalar(
        r#"INSERT INTO worship_services
             (name, service_date, start_time, end_time, theme, speaker, service_type,
              description, status, worship_leader, notes, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'draft',$9,$10,$11) RETURNING id"#,
    )
    .bind(&name)
    .bind(date)
    .bind(src.start_time)
    .bind(src.end_time)
    .bind(&src.theme)
    .bind(&src.speaker)
    .bind(&src.service_type)
    .bind(&src.description)
    .bind(&src.worship_leader)
    .bind(&src.notes)
    .bind(&auth.email)
    .fetch_one(&mut *tx)
    .await?;

    // Items copy across. Actual durations do NOT — they belong to the service
    // that was actually run, and carrying them over would fabricate history.
    sqlx::query(
        r#"INSERT INTO service_plan_items
             (service_id, sort_order, item_kind, title, song_id, song_key, leader,
              planned_seconds, notes)
           SELECT $2, sort_order, item_kind, title, song_id, song_key, leader,
                  planned_seconds, notes
           FROM service_plan_items WHERE service_id = $1"#,
    )
    .bind(id)
    .bind(new_id)
    .execute(&mut *tx)
    .await?;

    // The team carries over as invited, not accepted — nobody has agreed to
    // serve on a date that did not exist a moment ago.
    sqlx::query(
        r#"INSERT INTO service_assignments (service_id, member_id, role_id, status)
           SELECT $2, member_id, role_id, 'invited'
           FROM service_assignments WHERE service_id = $1"#,
    )
    .bind(id)
    .bind(new_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    services_get(Db(pool), Path(new_id)).await
}

// ===========================================================================
// Plan items
// ===========================================================================

pub async fn items_add(
    _auth: AuthUser,
    Db(pool): Db,
    Path(service_id): Path<uuid::Uuid>,
    Json(input): Json<UpsertPlanItem>,
) -> Result<Json<ServicePlanItem>, AppError> {
    let mut tx = pool.begin().await?;

    // Append with a gap of 10 so an item can later be inserted between two
    // others without renumbering the whole plan.
    let next: i32 = sqlx::query_scalar(
        "SELECT COALESCE(MAX(sort_order), 0) + 10 FROM service_plan_items WHERE service_id = $1",
    )
    .bind(service_id)
    .fetch_one(&mut *tx)
    .await?;

    // A song item titles itself from the song unless overridden, so adding a
    // song to a plan is one click rather than typing the name again.
    let title = match (input.title.as_deref(), input.song_id) {
        (Some(t), _) if !t.trim().is_empty() => t.trim().to_string(),
        (_, Some(song_id)) => sqlx::query_scalar::<_, String>("SELECT title FROM songs WHERE id = $1")
            .bind(song_id)
            .fetch_optional(&mut *tx)
            .await?
            .unwrap_or_else(|| "Song".into()),
        _ => "Item".into(),
    };

    let kind = match (input.item_kind.as_deref(), input.song_id) {
        (Some(k), _) if !k.is_empty() => k.to_string(),
        (_, Some(_)) => "song".into(),
        _ => "other".into(),
    };

    let id: uuid::Uuid = sqlx::query_scalar(
        r#"INSERT INTO service_plan_items
             (service_id, sort_order, item_kind, title, song_id, song_key, leader,
              planned_seconds, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id"#,
    )
    .bind(service_id)
    .bind(input.position.unwrap_or(next))
    .bind(&kind)
    .bind(&title)
    .bind(input.song_id)
    .bind(input.song_key.unwrap_or_default())
    .bind(input.leader.unwrap_or_default())
    .bind(input.planned_seconds.unwrap_or(0).max(0))
    .bind(input.notes.unwrap_or_default())
    .fetch_one(&mut *tx)
    .await?;

    // Adding a song to a plan counts as using it — this is what drives the
    // "most used songs" report and the library's last-used column.
    if let Some(song_id) = input.song_id {
        sqlx::query(
            "UPDATE songs SET use_count = use_count + 1, last_used_at = NOW() WHERE id = $1",
        )
        .bind(song_id)
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;

    let row = sqlx::query_as::<_, ServicePlanItem>(
        r#"SELECT i.id, i.service_id, i.sort_order, i.item_kind, i.title,
                  i.song_id, sg.title AS song_title, sg.song_key AS song_default_key,
                  sg.bpm AS song_bpm, i.song_key, i.leader,
                  i.planned_seconds, i.actual_seconds, i.notes
           FROM service_plan_items i LEFT JOIN songs sg ON sg.id = i.song_id
           WHERE i.id = $1"#,
    )
    .bind(id)
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn items_update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpsertPlanItem>,
) -> Result<Json<serde_json::Value>, AppError> {
    if let Some(sec) = input.planned_seconds {
        if sec < 0 {
            return Err(AppError::bad_request("Planned duration cannot be negative"));
        }
    }
    let res = sqlx::query(
        r#"UPDATE service_plan_items SET
             item_kind = COALESCE($2, item_kind),
             title = COALESCE($3, title),
             song_id = COALESCE($4, song_id),
             song_key = COALESCE($5, song_key),
             leader = COALESCE($6, leader),
             planned_seconds = COALESCE($7, planned_seconds),
             actual_seconds = COALESCE($8, actual_seconds),
             notes = COALESCE($9, notes)
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(input.item_kind)
    .bind(input.title)
    .bind(input.song_id)
    .bind(input.song_key)
    .bind(input.leader)
    .bind(input.planned_seconds)
    .bind(input.actual_seconds)
    .bind(input.notes)
    .execute(&pool)
    .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Plan item not found"));
    }
    Ok(Json(serde_json::json!({ "updated": true })))
}

pub async fn items_delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let res = sqlx::query("DELETE FROM service_plan_items WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Plan item not found"));
    }
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn items_reorder(
    _auth: AuthUser,
    Db(pool): Db,
    Path(service_id): Path<uuid::Uuid>,
    Json(input): Json<ReorderInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut tx = pool.begin().await?;
    for (i, id) in input.ids.iter().enumerate() {
        // Scoped to the service so a malformed request cannot reorder another
        // plan's items by id.
        sqlx::query("UPDATE service_plan_items SET sort_order = $3 WHERE id = $1 AND service_id = $2")
            .bind(id)
            .bind(service_id)
            .bind((i as i32 + 1) * 10)
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await?;
    Ok(Json(serde_json::json!({ "reordered": input.ids.len() })))
}

// ===========================================================================
// Team assignments
// ===========================================================================

pub async fn assign(
    _auth: AuthUser,
    Db(pool): Db,
    Path(service_id): Path<uuid::Uuid>,
    Json(input): Json<AssignInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Double-booking check: the same person cannot be rostered to two services
    // that overlap on the same date. Catching this at rostering time is the
    // whole point — discovering it on Sunday morning is too late.
    let clash: Option<String> = sqlx::query_scalar(
        r#"SELECT s2.name
           FROM service_assignments a
           JOIN worship_services s2 ON s2.id = a.service_id
           JOIN worship_services s1 ON s1.id = $1
           WHERE a.member_id = $2
             AND a.service_id <> $1
             AND s2.service_date = s1.service_date
             AND a.status <> 'declined'
             AND (s1.start_time IS NULL OR s2.start_time IS NULL
                  OR (s1.start_time, COALESCE(s1.end_time, s1.start_time + INTERVAL '90 minutes'))
                      OVERLAPS
                     (s2.start_time, COALESCE(s2.end_time, s2.start_time + INTERVAL '90 minutes')))
           LIMIT 1"#,
    )
    .bind(service_id)
    .bind(input.member_id)
    .fetch_optional(&pool)
    .await?;

    if let Some(other) = clash {
        return Err(AppError::conflict(format!(
            "Already rostered for an overlapping service that day: {other}"
        )));
    }

    sqlx::query(
        r#"INSERT INTO service_assignments (service_id, member_id, role_id, status, notes)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (service_id, member_id, role_id)
           DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes"#,
    )
    .bind(service_id)
    .bind(input.member_id)
    .bind(input.role_id)
    .bind(input.status.unwrap_or_else(|| "invited".into()))
    .bind(input.notes.unwrap_or_default())
    .execute(&pool)
    .await?;
    Ok(Json(serde_json::json!({ "assigned": true })))
}

pub async fn unassign(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let res = sqlx::query("DELETE FROM service_assignments WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Assignment not found"));
    }
    Ok(Json(serde_json::json!({ "removed": true })))
}

pub async fn assignment_status(
    _auth: AuthUser,
    Db(pool): Db,
    Path((id, status)): Path<(uuid::Uuid, String)>,
) -> Result<Json<serde_json::Value>, AppError> {
    const ALLOWED: [&str; 4] = ["invited", "accepted", "declined", "confirmed"];
    if !ALLOWED.contains(&status.as_str()) {
        return Err(AppError::bad_request(format!(
            "Status must be one of {}",
            ALLOWED.join(", ")
        )));
    }
    let res = sqlx::query("UPDATE service_assignments SET status = $2 WHERE id = $1")
        .bind(id)
        .bind(&status)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Assignment not found"));
    }
    Ok(Json(serde_json::json!({ "status": status })))
}

// ===========================================================================
// Rehearsals
// ===========================================================================

const REHEARSAL_SELECT: &str = r#"
    SELECT r.id, r.service_id, s.name AS service_name, r.title, r.rehearsal_date,
           r.start_time, r.end_time, r.location, r.agenda, r.notes, r.status,
           (SELECT COUNT(*) FROM rehearsal_attendees a WHERE a.rehearsal_id = r.id)::bigint AS invited_count,
           (SELECT COUNT(*) FROM rehearsal_attendees a WHERE a.rehearsal_id = r.id AND a.status = 'present')::bigint AS present_count
    FROM rehearsals r
    LEFT JOIN worship_services s ON s.id = r.service_id
"#;

pub async fn rehearsals_list(Db(pool): Db) -> Result<Json<Vec<Rehearsal>>, AppError> {
    let sql = format!("{REHEARSAL_SELECT} ORDER BY r.rehearsal_date DESC, r.start_time NULLS LAST LIMIT 100");
    let rows = sqlx::query_as::<_, Rehearsal>(&sql).fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn rehearsals_create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertRehearsal>,
) -> Result<Json<Rehearsal>, AppError> {
    let date = parse_date(&input.rehearsal_date)?;
    let start = parse_time(input.start_time.as_deref())?;
    let end = parse_time(input.end_time.as_deref())?;
    if let (Some(s), Some(e)) = (start, end) {
        if e <= s {
            return Err(AppError::bad_request("End time must be after the start time"));
        }
    }

    let mut tx = pool.begin().await?;
    let id: uuid::Uuid = sqlx::query_scalar(
        r#"INSERT INTO rehearsals
             (service_id, title, rehearsal_date, start_time, end_time, location, agenda, notes, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id"#,
    )
    .bind(input.service_id)
    .bind(input.title.unwrap_or_else(|| "Rehearsal".into()))
    .bind(date)
    .bind(start)
    .bind(end)
    .bind(input.location.unwrap_or_default())
    .bind(input.agenda.unwrap_or_default())
    .bind(input.notes.unwrap_or_default())
    .bind(input.status.unwrap_or_else(|| "scheduled".into()))
    .fetch_one(&mut *tx)
    .await?;

    // When no explicit invitee list is given but the rehearsal is tied to a
    // service, invite that service's roster — which is who actually needs to
    // be there.
    let members: Vec<uuid::Uuid> = match (input.member_ids, input.service_id) {
        (Some(ids), _) => ids,
        (None, Some(sid)) => sqlx::query_scalar(
            "SELECT DISTINCT member_id FROM service_assignments WHERE service_id = $1 AND status <> 'declined'",
        )
        .bind(sid)
        .fetch_all(&mut *tx)
        .await?,
        _ => vec![],
    };
    for m in members {
        sqlx::query(
            "INSERT INTO rehearsal_attendees (rehearsal_id, member_id, status)
             VALUES ($1,$2,'invited') ON CONFLICT DO NOTHING",
        )
        .bind(id)
        .bind(m)
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;

    let sql = format!("{REHEARSAL_SELECT} WHERE r.id = $1");
    let row = sqlx::query_as::<_, Rehearsal>(&sql)
        .bind(id)
        .fetch_one(&pool)
        .await?;
    Ok(Json(row))
}

pub async fn rehearsals_attendance(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<AttendanceInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    const ALLOWED: [&str; 4] = ["invited", "present", "absent", "excused"];
    if !ALLOWED.contains(&input.status.as_str()) {
        return Err(AppError::bad_request(format!(
            "Status must be one of {}",
            ALLOWED.join(", ")
        )));
    }
    sqlx::query(
        "INSERT INTO rehearsal_attendees (rehearsal_id, member_id, status)
         VALUES ($1,$2,$3)
         ON CONFLICT (rehearsal_id, member_id) DO UPDATE SET status = EXCLUDED.status",
    )
    .bind(id)
    .bind(input.member_id)
    .bind(&input.status)
    .execute(&pool)
    .await?;
    Ok(Json(serde_json::json!({ "status": input.status })))
}

pub async fn rehearsals_delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let res = sqlx::query("DELETE FROM rehearsals WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Rehearsal not found"));
    }
    Ok(Json(serde_json::json!({ "deleted": true })))
}

// ===========================================================================
// Dashboard
// ===========================================================================

pub async fn dashboard(Db(pool): Db) -> Result<Json<WorshipDashboard>, AppError> {
    // Each subquery needs an explicit alias: sqlx matches result columns to
    // struct fields by NAME, and an unaliased scalar subquery comes back as
    // "?column?", which fails with "no column found for name: item_count".
    let upcoming_services = sqlx::query_as::<_, WorshipServiceRow>(
        r#"SELECT s.id, s.name, s.service_date, s.start_time, s.theme, s.speaker,
                  s.service_type, s.status, s.worship_leader,
                  (SELECT COUNT(*) FROM service_plan_items i WHERE i.service_id = s.id)::bigint AS item_count,
                  (SELECT COUNT(*) FROM service_plan_items i WHERE i.service_id = s.id AND i.song_id IS NOT NULL)::bigint AS song_count,
                  (SELECT COUNT(*) FROM service_assignments a WHERE a.service_id = s.id)::bigint AS team_count,
                  (SELECT COALESCE(SUM(i.planned_seconds),0) FROM service_plan_items i WHERE i.service_id = s.id)::bigint AS planned_seconds
           FROM worship_services s
           WHERE s.service_date >= CURRENT_DATE AND s.status <> 'cancelled'
           ORDER BY s.service_date, s.start_time NULLS LAST LIMIT 5"#,
    )
    .fetch_all(&pool)
    .await?;

    let sql = format!(
        "{REHEARSAL_SELECT} WHERE r.rehearsal_date >= CURRENT_DATE AND r.status = 'scheduled'
         ORDER BY r.rehearsal_date, r.start_time NULLS LAST LIMIT 1"
    );
    let next_rehearsal = sqlx::query_as::<_, Rehearsal>(&sql)
        .fetch_optional(&pool)
        .await?;

    let (active_members, total_members, leaders): (i64, i64, i64) = sqlx::query_as(
        "SELECT COUNT(*) FILTER (WHERE is_active), COUNT(*),
                COUNT(*) FILTER (WHERE is_active AND is_leader)
         FROM worship_members",
    )
    .fetch_one(&pool)
    .await?;

    let songs_total: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM songs WHERE NOT is_archived")
            .fetch_one(&pool)
            .await?;

    let services_this_month: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM worship_services
         WHERE service_date >= date_trunc('month', CURRENT_DATE)::date",
    )
    .fetch_one(&pool)
    .await?;

    let pending_invites: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM service_assignments a
         JOIN worship_services s ON s.id = a.service_id
         WHERE a.status = 'invited' AND s.service_date >= CURRENT_DATE",
    )
    .fetch_one(&pool)
    .await?;

    let most_used_songs = sqlx::query_as::<_, SongUsage>(
        "SELECT id, title, song_key, use_count, last_used_at
         FROM songs WHERE NOT is_archived AND use_count > 0
         ORDER BY use_count DESC, last_used_at DESC NULLS LAST LIMIT 8",
    )
    .fetch_all(&pool)
    .await?;

    // Roles with nobody active who can play them. This is the gap a worship
    // leader needs before rostering, not after.
    let uncovered_roles = sqlx::query_as::<_, RoleGap>(
        r#"SELECT r.name AS role_name,
                  COUNT(m.id)::bigint AS member_count
           FROM worship_roles r
           LEFT JOIN worship_member_roles mr ON mr.role_id = r.id
           LEFT JOIN worship_members m ON m.id = mr.member_id AND m.is_active
           WHERE r.is_active
           GROUP BY r.id, r.name, r.sort_order
           HAVING COUNT(m.id) = 0
           ORDER BY r.sort_order"#,
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(WorshipDashboard {
        upcoming_services,
        next_rehearsal,
        active_members,
        total_members,
        leaders,
        songs_total,
        services_this_month,
        pending_invites,
        most_used_songs,
        uncovered_roles,
    }))
}
