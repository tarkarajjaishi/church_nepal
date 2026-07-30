//! Help Desk handlers.
//!
//! Two rules shape this module:
//!
//! 1. Claiming a ticket is `UPDATE ... WHERE assignee_name = ''`. Two people
//!    pressing "Assign to me" together do not both succeed — the loser's
//!    statement matches no rows and gets told so. A read-then-write check
//!    would let both through.
//! 2. `first_responded_at` is written once, by a statement that only fires
//!    while it is NULL. Recomputing it from the latest comment would drag
//!    every response time towards zero and make the SLA report a lie.

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::helpdesk::*;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;

const UNIQUE_VIOLATION: &str = "23505";
const CHECK_VIOLATION: &str = "23514";

const STATUSES: [&str; 6] = [
    "open", "in_progress", "waiting", "resolved", "closed", "cancelled",
];
const PRIORITIES: [&str; 4] = ["low", "normal", "high", "urgent"];

fn map_db_error(e: sqlx::Error) -> AppError {
    match &e {
        sqlx::Error::Database(db) => match db.code().as_deref() {
            Some(UNIQUE_VIOLATION) => {
                let m = db.message();
                if m.contains("articles_slug") {
                    AppError::conflict("An article with that title already exists")
                } else if m.contains("categories_slug") {
                    AppError::conflict("A category with that name already exists")
                } else {
                    AppError::conflict("That value is already in use")
                }
            }
            Some(CHECK_VIOLATION) => {
                let m = db.message();
                if m.contains("resolved_is_complete") {
                    AppError::bad_request("Say what fixed it before marking a ticket resolved")
                } else if m.contains("priority") {
                    AppError::bad_request("Priority must be low, normal, high or urgent")
                } else if m.contains("status") {
                    AppError::bad_request("That is not a status a ticket can be in")
                } else if m.contains("body_not_blank") {
                    AppError::bad_request("A comment cannot be empty")
                } else if m.contains("sla_positive") {
                    AppError::bad_request("SLA hours must be greater than zero")
                } else {
                    AppError::bad_request("That value is out of range")
                }
            }
            _ => e.into(),
        },
        _ => e.into(),
    }
}

fn slugify(s: &str) -> String {
    let out: String = s
        .to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect();
    out.split('-')
        .filter(|p| !p.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}

fn hours_between(a: chrono::NaiveDateTime, b: chrono::NaiveDateTime) -> i64 {
    (b - a).num_hours()
}

/// "Now", taken from the database rather than from this process.
///
/// Every timestamp in this module was written by the database, so ages and
/// breach flags must be measured against the same clock. Using the API host's
/// clock works right up until the two drift or the database runs in a
/// different timezone, and then every SLA figure is quietly wrong by hours
/// with nothing to show for it.
///
/// Read once per request and passed down, so the filter that selects breached
/// tickets and the flags rendered on them describe the same instant.
async fn db_now(pool: &sqlx::PgPool) -> Result<chrono::NaiveDateTime, AppError> {
    Ok(sqlx::query_scalar("SELECT NOW()::timestamp")
        .fetch_one(pool)
        .await?)
}

/// Accept the three shapes a form or an import actually sends. A bare date
/// means end of the working day, not midnight — "due Friday" does not mean
/// the ticket was already late at 00:01 on Friday.
fn parse_stamp(s: Option<&str>) -> Result<Option<chrono::NaiveDateTime>, AppError> {
    let Some(v) = s.filter(|v| !v.is_empty()) else {
        return Ok(None);
    };
    chrono::NaiveDateTime::parse_from_str(v, "%Y-%m-%dT%H:%M:%S")
        .or_else(|_| chrono::NaiveDateTime::parse_from_str(v, "%Y-%m-%dT%H:%M"))
        .or_else(|_| chrono::NaiveDateTime::parse_from_str(v, "%Y-%m-%d %H:%M:%S"))
        .or_else(|_| {
            chrono::NaiveDate::parse_from_str(v, "%Y-%m-%d")
                .map(|d| d.and_hms_opt(17, 0, 0).unwrap())
        })
        .map(Some)
        .map_err(|_| AppError::bad_request("Invalid date/time, expected YYYY-MM-DD or an ISO timestamp"))
}

/// Fill the derived SLA fields. Never written back to the row.
fn enrich(tickets: &mut [Ticket], now: chrono::NaiveDateTime) {
    for t in tickets.iter_mut() {
        // Age stops accruing once the work is done — an eight-month-old
        // closed ticket is not an eight-month-old problem.
        let end = t.resolved_at.or(t.closed_at).unwrap_or(now);
        t.age_hours = hours_between(t.opened_at, end).max(0);

        t.response_hours_taken = t
            .first_responded_at
            .map(|r| hours_between(t.opened_at, r).max(0));

        let open = !matches!(t.status.as_str(), "resolved" | "closed" | "cancelled");

        // Compared as instants, not as whole hours.
        //
        // `num_hours()` truncates, so a ticket four and a half hours past a
        // four-hour target rounds down to "4 hours taken", and `4 > 4` is
        // false. The SQL that selects the breached queue compares timestamps
        // and counted it. The list and the flags on it then disagreed for
        // anything inside the first hour past its target — a whole hour every
        // ticket spends silently late.
        let deadline = |hours: i32| t.opened_at + chrono::Duration::hours(i64::from(hours));
        let response_due = deadline(t.response_target_hours);
        let resolve_due = deadline(t.resolve_target_hours);

        t.response_breached = match t.first_responded_at {
            Some(replied) => replied > response_due,
            // Unanswered: the clock is still running, so compare against now.
            None => open && now > response_due,
        };

        t.resolve_breached = match t.resolved_at {
            Some(r) => r > resolve_due,
            None => open && now > resolve_due,
        };
    }
}

// ===========================================================================
// Categories
// ===========================================================================

pub async fn categories_list(Db(pool): Db) -> Result<Json<Vec<HelpdeskCategory>>, AppError> {
    let rows = sqlx::query_as::<_, HelpdeskCategory>(
        r#"SELECT c.id, c.name, c.slug, c.description, c.icon, c.color,
                  c.response_hours, c.resolve_hours, c.sort_order, c.is_active,
                  (SELECT COUNT(*) FROM helpdesk_tickets t
                   WHERE t.category_id = c.id
                     AND t.status NOT IN ('resolved','closed','cancelled'))::bigint AS open_count
           FROM helpdesk_categories c ORDER BY c.sort_order, c.name"#,
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn categories_create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertCategory>,
) -> Result<Json<serde_json::Value>, AppError> {
    if input.name.trim().is_empty() {
        return Err(AppError::bad_request("Name is required"));
    }
    let id: uuid::Uuid = sqlx::query_scalar(
        r#"INSERT INTO helpdesk_categories
             (name, slug, description, icon, color, response_hours, resolve_hours, sort_order, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id"#,
    )
    .bind(input.name.trim())
    .bind(slugify(&input.name))
    .bind(input.description.unwrap_or_default())
    .bind(input.icon.unwrap_or_else(|| "LifeBuoy".into()))
    .bind(input.color.unwrap_or_else(|| "#0b3c5d".into()))
    .bind(input.response_hours.unwrap_or(24))
    .bind(input.resolve_hours.unwrap_or(72))
    .bind(input.sort_order.unwrap_or(0))
    .bind(input.is_active.unwrap_or(true))
    .fetch_one(&pool)
    .await
    .map_err(map_db_error)?;
    Ok(Json(serde_json::json!({ "id": id })))
}

// ===========================================================================
// Tickets
// ===========================================================================

/// One SELECT, so the list and the detail can never disagree about a ticket.
///
/// The SLA targets fall back to sane defaults when a ticket has no category —
/// COALESCE rather than a NULL, so the derived breach flags stay meaningful.
const TICKET_SELECT: &str = r#"
    SELECT t.id, t.ticket_code, t.subject, t.body, t.category_id,
           c.name AS category_name, c.color AS category_color,
           t.person_id, t.reporter_name, t.reporter_contact,
           t.asset_id, a.name AS asset_name, t.location,
           t.priority, t.status, t.assignee_name, t.assignee_contact,
           t.opened_at, t.first_responded_at, t.resolved_at, t.closed_at, t.due_at,
           t.resolution, t.reopen_count,
           (SELECT COUNT(*) FROM helpdesk_comments hc
            WHERE hc.ticket_id = t.id AND hc.event_kind = '')::bigint AS comment_count,
           t.source, t.merged_into, t.satisfaction, t.satisfaction_note,
           (SELECT COUNT(*) FROM helpdesk_attachments ha
            WHERE ha.ticket_id = t.id)::bigint AS attachment_count,
           (SELECT COUNT(*) FROM helpdesk_watchers hw
            WHERE hw.ticket_id = t.id)::bigint AS watcher_count,
           COALESCE(c.response_hours, 24) AS response_target_hours,
           COALESCE(c.resolve_hours, 72) AS resolve_target_hours,
           0::bigint AS age_hours,
           NULL::bigint AS response_hours_taken,
           false AS response_breached,
           false AS resolve_breached
    FROM helpdesk_tickets t
    LEFT JOIN helpdesk_categories c ON c.id = t.category_id
    LEFT JOIN assets a ON a.id = t.asset_id
"#;

fn sort_column(sort: Option<&str>) -> &'static str {
    // Allowlist, never the caller's string — this is interpolated into SQL.
    match sort {
        Some("opened") => "t.opened_at",
        Some("priority") => {
            "CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END"
        }
        Some("status") => "t.status",
        Some("subject") => "t.subject",
        _ => "t.updated_at",
    }
}

pub async fn tickets_list(
    Db(pool): Db,
    Query(f): Query<TicketFilter>,
) -> Result<Json<TicketPage>, AppError> {
    let page = f.page.unwrap_or(1).max(1);
    let per_page = f.per_page.unwrap_or(25).clamp(1, 200);
    let offset = (page - 1) * per_page;
    let now = db_now(&pool).await?;

    // `breached` is expressed here in SQL rather than filtered in Rust after
    // the fact, or paging would return short pages of arbitrary size.
    let where_sql = r#"
        WHERE ($1::text IS NULL OR (
                t.subject ILIKE '%' || $1 || '%' OR t.body ILIKE '%' || $1 || '%'
             OR t.ticket_code ILIKE '%' || $1 || '%'
             OR t.reporter_name ILIKE '%' || $1 || '%' OR t.location ILIKE '%' || $1 || '%'))
          AND ($2::text IS NULL OR (
                CASE $2
                  WHEN 'open' THEN t.status NOT IN ('resolved','closed','cancelled')
                  WHEN 'done' THEN t.status IN ('resolved','closed')
                  ELSE t.status = $2
                END))
          AND ($3::text IS NULL OR t.priority = $3)
          AND ($4::uuid IS NULL OR t.category_id = $4)
          AND ($5::text IS NULL OR lower(t.assignee_name) = lower($5))
          AND ($6::text IS NULL OR (
                CASE $6
                  WHEN 'unassigned' THEN t.assignee_name = ''
                       AND t.status NOT IN ('resolved','closed','cancelled')
                  WHEN 'breached' THEN t.status NOT IN ('resolved','closed','cancelled')
                       AND (
                         (t.first_responded_at IS NULL
                          AND $7::timestamp > t.opened_at
                              + make_interval(hours => COALESCE(c.response_hours, 24)))
                         OR $7::timestamp > t.opened_at
                              + make_interval(hours => COALESCE(c.resolve_hours, 72))
                       )
                  WHEN 'awaiting_reply' THEN t.first_responded_at IS NULL
                       AND t.status NOT IN ('resolved','closed','cancelled')
                  ELSE TRUE
                END))
    "#;

    macro_rules! bind_filters {
        ($q:expr) => {
            $q.bind(f.search.as_deref())
                .bind(f.status.as_deref())
                .bind(f.priority.as_deref())
                .bind(f.category_id)
                .bind(f.assignee.as_deref())
                .bind(f.view.as_deref())
                .bind(now)
        };
    }

    let count_sql = format!(
        "SELECT COUNT(*) FROM helpdesk_tickets t
         LEFT JOIN helpdesk_categories c ON c.id = t.category_id {where_sql}"
    );
    let total: i64 = bind_filters!(sqlx::query_scalar(&count_sql))
        .fetch_one(&pool)
        .await?;

    let dir = if f.dir.as_deref() == Some("asc") { "ASC" } else { "DESC" };
    let order = sort_column(f.sort.as_deref());
    let sql =
        format!("{TICKET_SELECT} {where_sql} ORDER BY {order} {dir}, t.opened_at DESC LIMIT $8 OFFSET $9");

    let mut data = bind_filters!(sqlx::query_as::<_, Ticket>(&sql))
        .bind(per_page)
        .bind(offset)
        .fetch_all(&pool)
        .await?;
    enrich(&mut data, now);

    Ok(Json(TicketPage {
        data,
        total,
        page,
        per_page,
        total_pages: (total + per_page - 1) / per_page,
    }))
}

/// Exposed so the public form allocates codes from the same locked sequence.
/// Two allocators would eventually hand out the same number.
pub(crate) async fn next_ticket_code_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
) -> Result<String, AppError> {
    next_ticket_code(tx).await
}

async fn next_ticket_code(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
) -> Result<String, AppError> {
    let row: Option<(String, i64, i32)> = sqlx::query_as(
        "SELECT prefix, next_value, padding FROM receipt_sequences
         WHERE scope = 'helpdesk_ticket' FOR UPDATE",
    )
    .fetch_optional(&mut **tx)
    .await?;
    let (prefix, value, padding) = row
        .ok_or_else(|| AppError::internal("Ticket sequence missing — run migration 068"))?;
    sqlx::query(
        "UPDATE receipt_sequences SET next_value = next_value + 1, updated_at = NOW()
         WHERE scope = 'helpdesk_ticket'",
    )
    .execute(&mut **tx)
    .await?;
    Ok(format!("{prefix}-{:0width$}", value, width = padding as usize))
}

pub async fn tickets_create(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<NewTicket>,
) -> Result<Json<serde_json::Value>, AppError> {
    if input.subject.trim().is_empty() {
        return Err(AppError::bad_request("What is the problem?"));
    }
    if input.reporter_name.trim().is_empty() {
        return Err(AppError::bad_request("Who is reporting it?"));
    }
    let priority = input.priority.unwrap_or_else(|| "normal".into());
    if !PRIORITIES.contains(&priority.as_str()) {
        return Err(AppError::bad_request(
            "Priority must be low, normal, high or urgent",
        ));
    }

    let opened = parse_stamp(input.opened_at.as_deref())?;
    if let Some(o) = opened {
        if o > db_now(&pool).await? {
            return Err(AppError::bad_request("A ticket cannot be raised in the future"));
        }
    }

    let mut tx = pool.begin().await?;
    let code = next_ticket_code(&mut tx).await?;

    // due_at is derived from the category's resolve target at creation, then
    // left alone — a later SLA change must not silently move deadlines on
    // tickets people are already working to. It hangs off opened_at, not
    // NOW(), so an imported ticket is already overdue if it really is.
    let id: uuid::Uuid = sqlx::query_scalar(
        r#"INSERT INTO helpdesk_tickets
             (ticket_code, subject, body, category_id, person_id, reporter_name,
              reporter_contact, asset_id, location, priority, assignee_name,
              assignee_contact, opened_at, due_at, updated_at, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
                   COALESCE($14, NOW()),
                   COALESCE($14, NOW()) + make_interval(hours => COALESCE(
                       (SELECT resolve_hours FROM helpdesk_categories WHERE id = $4), 72)),
                   COALESCE($14, NOW()),
                   $13)
           RETURNING id"#,
    )
    .bind(&code)
    .bind(input.subject.trim())
    .bind(input.body.unwrap_or_default())
    .bind(input.category_id)
    .bind(input.person_id)
    .bind(input.reporter_name.trim())
    .bind(input.reporter_contact.unwrap_or_default())
    .bind(input.asset_id)
    .bind(input.location.unwrap_or_default())
    .bind(&priority)
    .bind(input.assignee_name.clone().unwrap_or_default().trim())
    .bind(input.assignee_contact.unwrap_or_default())
    .bind(&auth.email)
    .bind(opened)
    .fetch_one(&mut *tx)
    .await
    .map_err(map_db_error)?;

    tx.commit().await?;
    Ok(Json(serde_json::json!({ "id": id, "ticket_code": code })))
}

pub async fn tickets_get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<TicketDetail>, AppError> {
    let now = db_now(&pool).await?;
    let sql = format!("{TICKET_SELECT} WHERE t.id = $1");
    let mut found = sqlx::query_as::<_, Ticket>(&sql)
        .bind(id)
        .fetch_all(&pool)
        .await?;
    if found.is_empty() {
        return Err(AppError::not_found("Ticket not found"));
    }
    enrich(&mut found, now);
    let ticket = found.remove(0);

    let comments = sqlx::query_as::<_, Comment>(
        "SELECT * FROM helpdesk_comments WHERE ticket_id = $1 ORDER BY created_at",
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    // Other tickets against the same asset. Empty when the ticket names no
    // asset, rather than "every other ticket", which would be noise.
    let related = match ticket.asset_id {
        Some(asset_id) => {
            sqlx::query_as::<_, TicketBrief>(
                "SELECT id, ticket_code, subject, status, opened_at
                 FROM helpdesk_tickets
                 WHERE asset_id = $1 AND id <> $2
                 ORDER BY opened_at DESC LIMIT 10",
            )
            .bind(asset_id)
            .bind(id)
            .fetch_all(&pool)
            .await?
        }
        None => Vec::new(),
    };

    Ok(Json(TicketDetail { ticket, comments, related }))
}

pub async fn tickets_update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdateTicket>,
) -> Result<Json<serde_json::Value>, AppError> {
    let due = parse_stamp(input.due_at.as_deref())?;

    let res = sqlx::query(
        r#"UPDATE helpdesk_tickets SET
             subject = COALESCE($2, subject),
             body = COALESCE($3, body),
             category_id = COALESCE($4, category_id),
             asset_id = COALESCE($5, asset_id),
             location = COALESCE($6, location),
             priority = COALESCE($7, priority),
             due_at = COALESCE($8, due_at),
             updated_at = NOW()
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(input.subject.as_deref().map(str::trim).filter(|s| !s.is_empty()))
    .bind(input.body.as_deref())
    .bind(input.category_id)
    .bind(input.asset_id)
    .bind(input.location.as_deref())
    .bind(input.priority.as_deref())
    .bind(due)
    .execute(&pool)
    .await
    .map_err(map_db_error)?;

    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Ticket not found"));
    }
    Ok(Json(serde_json::json!({ "updated": true })))
}

/// Claim a ticket.
///
/// The whole point of this handler is the `WHERE assignee_name = ''`: two
/// volunteers pressing the button together cannot both succeed, and the one
/// who lost finds out instead of working on someone else's ticket.
pub async fn tickets_claim(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<ClaimInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    let name = input.assignee_name.trim();
    if name.is_empty() {
        return Err(AppError::bad_request("Who is taking it?"));
    }
    let force = input.force.unwrap_or(false);

    let res = sqlx::query(
        "UPDATE helpdesk_tickets
         SET assignee_name = $2, assignee_contact = $3,
             status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END,
             updated_at = NOW()
         WHERE id = $1 AND ($4 OR assignee_name = '')",
    )
    .bind(id)
    .bind(name)
    .bind(input.assignee_contact.unwrap_or_default())
    .bind(force)
    .execute(&pool)
    .await
    .map_err(map_db_error)?;

    if res.rows_affected() == 0 {
        // Distinguish "gone" from "someone beat you to it" — the second is a
        // normal race between two willing volunteers, not an error.
        let holder: Option<String> =
            sqlx::query_scalar("SELECT assignee_name FROM helpdesk_tickets WHERE id = $1")
                .bind(id)
                .fetch_optional(&pool)
                .await?;
        return match holder {
            None => Err(AppError::not_found("Ticket not found")),
            Some(who) => Err(AppError::conflict(format!(
                "{who} already picked this one up"
            ))),
        };
    }

    log_event(&pool, id, &format!("Assigned to {name}"), "assigned").await?;
    // Best effort: the assignment has already happened, and failing the
    // request because the mail server is down would undo work that succeeded.
    crate::handlers::helpdesk_notify::assigned(&pool, id).await;
    Ok(Json(serde_json::json!({ "assigned_to": name })))
}

pub async fn tickets_release(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let res = sqlx::query(
        "UPDATE helpdesk_tickets SET assignee_name = '', assignee_contact = '',
                status = CASE WHEN status = 'in_progress' THEN 'open' ELSE status END,
                updated_at = NOW()
         WHERE id = $1 AND assignee_name <> ''",
    )
    .bind(id)
    .execute(&pool)
    .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::conflict("That ticket is not assigned to anyone"));
    }
    log_event(&pool, id, "Returned to the queue", "released").await?;
    Ok(Json(serde_json::json!({ "released": true })))
}

pub async fn tickets_status(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<StatusInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    if !STATUSES.contains(&input.status.as_str()) {
        return Err(AppError::bad_request(
            "That is not a status a ticket can be in",
        ));
    }
    let resolution = input.resolution.unwrap_or_default();
    if input.status == "resolved" && resolution.trim().is_empty() {
        return Err(AppError::bad_request(
            "Say what fixed it before marking a ticket resolved",
        ));
    }

    let current: Option<(String, Option<chrono::NaiveDateTime>)> =
        sqlx::query_as("SELECT status, closed_at FROM helpdesk_tickets WHERE id = $1")
            .bind(id)
            .fetch_optional(&pool)
            .await?;
    let (was, _) = current.ok_or_else(|| AppError::not_found("Ticket not found"))?;

    // Reopening is counted, not hidden. A ticket on its third reopen means
    // the fix never worked, and that is the number worth surfacing.
    let reopening = matches!(was.as_str(), "resolved" | "closed" | "cancelled")
        && !matches!(input.status.as_str(), "resolved" | "closed" | "cancelled");

    sqlx::query(
        r#"UPDATE helpdesk_tickets SET
             status = $2,
             resolution = CASE WHEN $3 <> '' THEN $3 ELSE resolution END,
             resolved_at = CASE
                 WHEN $2 = 'resolved' THEN COALESCE(resolved_at, NOW())
                 WHEN $4 THEN NULL
                 ELSE resolved_at END,
             closed_at = CASE
                 WHEN $2 = 'closed' THEN COALESCE(closed_at, NOW())
                 WHEN $4 THEN NULL
                 ELSE closed_at END,
             reopen_count = reopen_count + CASE WHEN $4 THEN 1 ELSE 0 END,
             updated_at = NOW()
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(&input.status)
    .bind(resolution.trim())
    .bind(reopening)
    .execute(&pool)
    .await
    .map_err(map_db_error)?;

    let label = if reopening {
        format!("Reopened ({was} → {})", input.status)
    } else {
        format!("Status {was} → {}", input.status)
    };
    log_event(&pool, id, &label, "status").await?;

    if let Some(note) = input.note.filter(|n| !n.trim().is_empty()) {
        add_comment_row(&pool, id, input.author_name.as_deref(), &note, false).await?;
    }

    // The message that closes the loop. Only on the way *out* — telling
    // someone their ticket is "in progress" every time it is nudged is how a
    // help desk teaches people to ignore it.
    if matches!(input.status.as_str(), "resolved" | "closed") && !reopening {
        crate::handlers::helpdesk_notify::resolved(&pool, id).await;
    }

    Ok(Json(serde_json::json!({ "status": input.status, "reopened": reopening })))
}

// ===========================================================================
// Comments
// ===========================================================================

/// System event rows. `event_kind` keeps them out of the response-time
/// calculation — an automatic "status changed" line is not someone replying.
async fn log_event(
    pool: &sqlx::PgPool,
    ticket_id: uuid::Uuid,
    body: &str,
    kind: &str,
) -> Result<(), AppError> {
    sqlx::query(
        "INSERT INTO helpdesk_comments (ticket_id, author_name, body, is_internal, event_kind)
         VALUES ($1, 'system', $2, true, $3)",
    )
    .bind(ticket_id)
    .bind(body)
    .bind(kind)
    .execute(pool)
    .await?;
    Ok(())
}

async fn add_comment_row(
    pool: &sqlx::PgPool,
    ticket_id: uuid::Uuid,
    author: Option<&str>,
    body: &str,
    internal: bool,
) -> Result<uuid::Uuid, AppError> {
    let id: uuid::Uuid = sqlx::query_scalar(
        "INSERT INTO helpdesk_comments (ticket_id, author_name, body, is_internal)
         VALUES ($1,$2,$3,$4) RETURNING id",
    )
    .bind(ticket_id)
    .bind(author.unwrap_or("").trim())
    .bind(body.trim())
    .bind(internal)
    .fetch_one(pool)
    .await
    .map_err(map_db_error)?;
    Ok(id)
}

pub async fn comments_add(
    auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<NewComment>,
) -> Result<Json<serde_json::Value>, AppError> {
    if input.body.trim().is_empty() {
        return Err(AppError::bad_request("A comment cannot be empty"));
    }
    let exists: Option<uuid::Uuid> =
        sqlx::query_scalar("SELECT id FROM helpdesk_tickets WHERE id = $1")
            .bind(id)
            .fetch_optional(&pool)
            .await?;
    if exists.is_none() {
        return Err(AppError::not_found("Ticket not found"));
    }

    let internal = input.is_internal.unwrap_or(false);
    let author = input.author_name.clone().unwrap_or_else(|| auth.email.clone());
    let comment_id = add_comment_row(&pool, id, Some(&author), &input.body, internal).await?;

    // Write-once, and only for a reply the reporter can actually see. An
    // internal note is the team talking to itself, not a response.
    //
    // `WHERE first_responded_at IS NULL` is what makes it write-once: a
    // second reply matches no rows, so the recorded response time stays the
    // first one however long the thread runs.
    let mut first = false;
    if !internal {
        let res = sqlx::query(
            "UPDATE helpdesk_tickets SET first_responded_at = NOW(), updated_at = NOW()
             WHERE id = $1 AND first_responded_at IS NULL",
        )
        .bind(id)
        .execute(&pool)
        .await?;
        first = res.rows_affected() == 1;
    }

    // Only a reply the reporter can see. An internal note is the team talking
    // to itself, and emailing it to the reporter would be worse than not
    // notifying at all.
    if !internal {
        crate::handlers::helpdesk_notify::replied(&pool, id, &input.body).await;
    }

    Ok(Json(serde_json::json!({
        "id": comment_id,
        "counted_as_first_response": first,
    })))
}

// ===========================================================================
// Knowledge base
// ===========================================================================

#[derive(serde::Deserialize, Default)]
pub struct ArticleQuery {
    pub search: Option<String>,
    pub category_id: Option<uuid::Uuid>,
}

pub async fn articles_list(
    Db(pool): Db,
    Query(q): Query<ArticleQuery>,
) -> Result<Json<Vec<Article>>, AppError> {
    let rows = sqlx::query_as::<_, Article>(
        r#"SELECT a.id, a.title, a.slug, a.body, a.category_id, c.name AS category_name,
                  a.keywords, a.is_published, a.view_count, a.helpful_count, a.updated_at
           FROM helpdesk_articles a
           LEFT JOIN helpdesk_categories c ON c.id = a.category_id
           WHERE ($1::text IS NULL OR (
                   a.title ILIKE '%' || $1 || '%' OR a.body ILIKE '%' || $1 || '%'
                OR a.keywords ILIKE '%' || $1 || '%'))
             AND ($2::uuid IS NULL OR a.category_id = $2)
           ORDER BY a.helpful_count DESC, a.title
           LIMIT 200"#,
    )
    .bind(q.search.as_deref())
    .bind(q.category_id)
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn articles_create(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertArticle>,
) -> Result<Json<serde_json::Value>, AppError> {
    if input.title.trim().is_empty() {
        return Err(AppError::bad_request("Title is required"));
    }
    let id: uuid::Uuid = sqlx::query_scalar(
        r#"INSERT INTO helpdesk_articles
             (title, slug, body, category_id, keywords, is_published, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id"#,
    )
    .bind(input.title.trim())
    .bind(slugify(&input.title))
    .bind(input.body.unwrap_or_default())
    .bind(input.category_id)
    .bind(input.keywords.unwrap_or_default())
    .bind(input.is_published.unwrap_or(true))
    .bind(&auth.email)
    .fetch_one(&pool)
    .await
    .map_err(map_db_error)?;
    Ok(Json(serde_json::json!({ "id": id })))
}

pub async fn articles_helpful(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let res = sqlx::query(
        "UPDATE helpdesk_articles SET helpful_count = helpful_count + 1 WHERE id = $1",
    )
    .bind(id)
    .execute(&pool)
    .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Article not found"));
    }
    Ok(Json(serde_json::json!({ "thanks": true })))
}

// ===========================================================================
// Dashboard
// ===========================================================================

pub async fn dashboard(Db(pool): Db) -> Result<Json<HelpdeskDashboard>, AppError> {
    let now = db_now(&pool).await?;

    let (open, unassigned, in_progress, waiting, urgent_open, awaiting): (
        i64, i64, i64, i64, i64, i64,
    ) = sqlx::query_as(
        "SELECT
           COUNT(*) FILTER (WHERE status NOT IN ('resolved','closed','cancelled')),
           COUNT(*) FILTER (WHERE assignee_name = '' AND status NOT IN ('resolved','closed','cancelled')),
           COUNT(*) FILTER (WHERE status = 'in_progress'),
           COUNT(*) FILTER (WHERE status = 'waiting'),
           COUNT(*) FILTER (WHERE priority = 'urgent' AND status NOT IN ('resolved','closed','cancelled')),
           COUNT(*) FILTER (WHERE first_responded_at IS NULL AND status NOT IN ('resolved','closed','cancelled'))
         FROM helpdesk_tickets",
    )
    .fetch_one(&pool)
    .await?;

    let resolved_this_month: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM helpdesk_tickets
         WHERE resolved_at >= date_trunc('month', CURRENT_DATE)",
    )
    .fetch_one(&pool)
    .await?;

    let reopened: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM helpdesk_tickets WHERE reopen_count > 0")
            .fetch_one(&pool)
            .await?;

    // Breaching right now — the same expression the `breached` view filter
    // uses, against the same bound instant, so the tile and the list can
    // never disagree.
    let breaching: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM helpdesk_tickets t
         LEFT JOIN helpdesk_categories c ON c.id = t.category_id
         WHERE t.status NOT IN ('resolved','closed','cancelled')
           AND ((t.first_responded_at IS NULL
                 AND $1::timestamp > t.opened_at + make_interval(hours => COALESCE(c.response_hours, 24)))
             OR $1::timestamp > t.opened_at + make_interval(hours => COALESCE(c.resolve_hours, 72)))",
    )
    .bind(now)
    .fetch_one(&pool)
    .await?;

    // Averages over answered/resolved tickets only. Including the unanswered
    // ones as zero would make a neglected queue look fast.
    //
    // ::float8 because AVG over an interval-derived value comes back NUMERIC,
    // which sqlx will not decode into f64.
    let (avg_response, avg_resolve): (Option<f64>, Option<f64>) = sqlx::query_as(
        "SELECT
           (AVG(EXTRACT(EPOCH FROM (first_responded_at - opened_at)) / 3600)
             FILTER (WHERE first_responded_at IS NOT NULL))::float8,
           (AVG(EXTRACT(EPOCH FROM (resolved_at - opened_at)) / 3600)
             FILTER (WHERE resolved_at IS NOT NULL))::float8
         FROM helpdesk_tickets",
    )
    .fetch_one(&pool)
    .await?;

    let by_category = sqlx::query_as::<_, LabelCount>(
        r#"SELECT COALESCE(c.name, 'Uncategorised') AS label, c.color, COUNT(t.id)::bigint AS count
           FROM helpdesk_tickets t LEFT JOIN helpdesk_categories c ON c.id = t.category_id
           WHERE t.status NOT IN ('resolved','closed','cancelled')
           GROUP BY c.name, c.color ORDER BY count DESC LIMIT 12"#,
    )
    .fetch_all(&pool)
    .await?;

    let by_priority = sqlx::query_as::<_, LabelCount>(
        r#"SELECT t.priority AS label, NULL::varchar AS color, COUNT(*)::bigint AS count
           FROM helpdesk_tickets t
           WHERE t.status NOT IN ('resolved','closed','cancelled')
           GROUP BY t.priority
           ORDER BY CASE t.priority
             WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END"#,
    )
    .fetch_all(&pool)
    .await?;

    let agents = sqlx::query_as::<_, AgentLoad>(
        r#"SELECT t.assignee_name AS name,
                  COUNT(*) FILTER (WHERE t.status NOT IN ('resolved','closed','cancelled'))::bigint AS open_tickets,
                  COUNT(*) FILTER (WHERE t.resolved_at IS NOT NULL)::bigint AS resolved_tickets,
                  COUNT(*) FILTER (
                    WHERE t.status NOT IN ('resolved','closed','cancelled')
                      AND $1::timestamp > t.opened_at + make_interval(hours => COALESCE(c.resolve_hours, 72))
                  )::bigint AS breached,
                  ROUND(AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.opened_at)) / 3600)
                        FILTER (WHERE t.resolved_at IS NOT NULL))::bigint AS avg_resolve_hours
           FROM helpdesk_tickets t LEFT JOIN helpdesk_categories c ON c.id = t.category_id
           WHERE t.assignee_name <> ''
           GROUP BY t.assignee_name
           ORDER BY open_tickets DESC, resolved_tickets DESC LIMIT 20"#,
    )
    .bind(now)
    .fetch_all(&pool)
    .await?;

    let mut oldest_open = sqlx::query_as::<_, Ticket>(&format!(
        "{TICKET_SELECT} WHERE t.status NOT IN ('resolved','closed','cancelled')
         ORDER BY t.opened_at LIMIT 8"
    ))
    .fetch_all(&pool)
    .await?;
    enrich(&mut oldest_open, now);

    let mut needs_reply = sqlx::query_as::<_, Ticket>(&format!(
        "{TICKET_SELECT} WHERE t.first_responded_at IS NULL
           AND t.status NOT IN ('resolved','closed','cancelled')
         ORDER BY t.opened_at LIMIT 8"
    ))
    .fetch_all(&pool)
    .await?;
    enrich(&mut needs_reply, now);

    Ok(Json(HelpdeskDashboard {
        open,
        unassigned,
        in_progress,
        waiting,
        resolved_this_month,
        urgent_open,
        breaching,
        awaiting_first_reply: awaiting,
        reopened,
        avg_response_hours: avg_response.map(|v| v.round() as i64),
        avg_resolve_hours: avg_resolve.map(|v| v.round() as i64),
        by_category,
        by_priority,
        agents,
        oldest_open,
        needs_reply,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn dt(day: u32, hour: u32) -> chrono::NaiveDateTime {
        chrono::NaiveDate::from_ymd_opt(2026, 7, day)
            .unwrap()
            .and_hms_opt(hour, 0, 0)
            .unwrap()
    }

    fn ticket(status: &str) -> Ticket {
        Ticket {
            id: uuid::Uuid::nil(),
            ticket_code: "HD-00001".into(),
            subject: "Sound desk dead".into(),
            body: String::new(),
            category_id: None,
            category_name: None,
            category_color: None,
            person_id: None,
            reporter_name: "Anjali".into(),
            reporter_contact: String::new(),
            asset_id: None,
            asset_name: None,
            location: String::new(),
            priority: "normal".into(),
            status: status.into(),
            assignee_name: String::new(),
            assignee_contact: String::new(),
            opened_at: dt(1, 9),
            first_responded_at: None,
            resolved_at: None,
            closed_at: None,
            due_at: None,
            resolution: String::new(),
            reopen_count: 0,
            comment_count: 0,
            source: "staff".into(),
            merged_into: None,
            satisfaction: None,
            satisfaction_note: String::new(),
            attachment_count: 0,
            watcher_count: 0,
            response_target_hours: 4,
            resolve_target_hours: 24,
            age_hours: 0,
            response_hours_taken: None,
            response_breached: false,
            resolve_breached: false,
        }
    }

    #[test]
    fn unanswered_ticket_breaches_once_the_target_passes() {
        let mut t = [ticket("open")];
        enrich(&mut t, dt(1, 12)); // 3h old, target 4h
        assert!(!t[0].response_breached);

        let mut t = [ticket("open")];
        enrich(&mut t, dt(1, 14)); // 5h old
        assert!(t[0].response_breached);
    }

    #[test]
    fn a_prompt_reply_never_breaches_however_long_the_ticket_stays_open() {
        let mut t = [ticket("in_progress")];
        t[0].first_responded_at = Some(dt(1, 10)); // answered in 1h
        enrich(&mut t, dt(9, 9)); // a week later
        assert!(!t[0].response_breached, "response was on time");
        assert!(t[0].resolve_breached, "but it is long past the resolve target");
        assert_eq!(t[0].response_hours_taken, Some(1));
    }

    #[test]
    fn a_closed_ticket_stops_ageing() {
        let mut t = [ticket("resolved")];
        t[0].first_responded_at = Some(dt(1, 10));
        t[0].resolved_at = Some(dt(1, 20)); // 11h, target 24h
        enrich(&mut t, dt(30, 9)); // a month later
        assert_eq!(t[0].age_hours, 11, "age is measured to resolution, not to now");
        assert!(!t[0].resolve_breached);
    }

    #[test]
    fn a_late_resolution_stays_breached_forever() {
        let mut t = [ticket("resolved")];
        t[0].first_responded_at = Some(dt(1, 10));
        t[0].resolved_at = Some(dt(3, 9)); // 48h, target 24h
        enrich(&mut t, dt(30, 9));
        assert!(t[0].resolve_breached, "closing it late does not un-breach it");
    }

    #[test]
    fn a_breach_starts_the_moment_the_target_passes_not_an_hour_later() {
        // The bug this pins: whole-hour arithmetic truncates, so a ticket 4h30
        // past a 4h target reported "4 hours taken" and 4 > 4 is false. The SQL
        // that builds the breached queue compares timestamps and had already
        // counted it, so the list showed a ticket its own flags called fine.
        let at = |h: u32, m: u32| {
            chrono::NaiveDate::from_ymd_opt(2026, 7, 1).unwrap().and_hms_opt(h, m, 0).unwrap()
        };
        let mut t = [ticket("open")]; // opened 09:00, response target 4h
        enrich(&mut t, at(13, 0)); // exactly on the deadline
        assert!(!t[0].response_breached, "on the deadline is not past it");

        let mut t = [ticket("open")];
        enrich(&mut t, at(13, 30)); // half an hour past
        assert!(t[0].response_breached, "half an hour late is late");
        assert_eq!(t[0].age_hours, 4, "the displayed age still reads in whole hours");
    }

    #[test]
    fn a_reply_a_minute_late_is_late() {
        let mut t = [ticket("in_progress")];
        t[0].first_responded_at = Some(
            chrono::NaiveDate::from_ymd_opt(2026, 7, 1).unwrap().and_hms_opt(13, 1, 0).unwrap(),
        );
        enrich(&mut t, dt(1, 14));
        assert!(t[0].response_breached);
        assert_eq!(t[0].response_hours_taken, Some(4), "still reported as 4h taken");
    }

    #[test]
    fn a_cancelled_ticket_never_breaches() {
        // Nobody was ever going to work on it, so it is not a missed target.
        let mut t = [ticket("cancelled")];
        enrich(&mut t, dt(30, 9));
        assert!(!t[0].response_breached);
        assert!(!t[0].resolve_breached);
    }

    #[test]
    fn slugify_collapses_punctuation_and_spaces() {
        assert_eq!(slugify("Projector won't turn on!"), "projector-won-t-turn-on");
        assert_eq!(slugify("  Wi-Fi   Setup  "), "wi-fi-setup");
    }
}
