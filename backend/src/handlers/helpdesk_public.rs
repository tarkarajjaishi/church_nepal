//! Public help desk: reporting a fault without an account, and following it.
//!
//! The gap this closes is the whole point of a help desk. The person who
//! notices the broken tap is almost never the person with an admin login, so
//! every report used to go through somebody relaying it — and what does not
//! get relayed does not get fixed.
//!
//! Two rules shape what a stranger is allowed to see:
//!
//! 1. **The tracking token is random, not the ticket code.** `HD-00042` is
//!    sequential, so handing it out as a lookup key would let anyone read
//!    `HD-00041`. The token is 256 bits from `gen_random_uuid()` twice.
//!
//! 2. **The public view is a strict subset.** Internal notes, the assignee's
//!    contact details, who else is watching and every system event stay
//!    behind the admin API. A reporter sees their own report, the replies
//!    written to them, and the status.

use crate::error::AppError;
use crate::models::helpdesk::*;
use crate::tenant::Db;
use axum::extract::Path;
use axum::Json;

/// What a stranger may look at. Deliberately not `Ticket` — that struct grows
/// over time, and a public endpoint that returns "the ticket" would leak each
/// new internal field the day it was added.
#[derive(Debug, serde::Serialize)]
pub struct PublicTicket {
    pub ticket_code: String,
    pub subject: String,
    pub body: String,
    pub status: String,
    pub status_label: String,
    pub category_name: Option<String>,
    pub location: String,
    pub opened_at: chrono::NaiveDateTime,
    pub resolved_at: Option<chrono::NaiveDateTime>,
    pub resolution: String,
    /// Only the replies written to the reporter. Internal notes and system
    /// events are not theirs to read.
    pub replies: Vec<PublicReply>,
    pub attachments: Vec<PublicAttachment>,
    /// True once resolved and not yet rated, so the page can ask.
    pub can_rate: bool,
    pub satisfaction: Option<i32>,
}

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct PublicReply {
    pub author_name: String,
    pub body: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct PublicAttachment {
    pub url: String,
    pub filename: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct PublicReport {
    pub subject: String,
    pub body: Option<String>,
    pub category_id: Option<uuid::Uuid>,
    pub reporter_name: String,
    pub reporter_contact: String,
    pub location: Option<String>,
    /// Uploaded separately, then attached by URL. Public callers cannot set a
    /// priority — everything arrives as `normal` and the team decides, or an
    /// anonymous reporter could mark their own dripping tap as urgent and
    /// push a dead sound desk down the queue.
    #[serde(default)]
    pub attachment_urls: Vec<String>,
}

/// A word people can read, rather than the enum the database stores.
fn status_label(status: &str) -> &'static str {
    match status {
        "open" => "Received",
        "in_progress" => "Being worked on",
        "waiting" => "Waiting on something",
        "resolved" => "Fixed",
        "closed" => "Closed",
        "cancelled" => "Not going ahead",
        _ => "Received",
    }
}

fn new_token() -> String {
    format!(
        "{}{}",
        uuid::Uuid::new_v4().simple(),
        uuid::Uuid::new_v4().simple()
    )
}

/// Raise a ticket from the public site.
///
/// Rate-limited by the strict per-IP governor on `public_submit_routes` — the
/// same bucket as the contact form, because this is the same abuse surface.
pub async fn report(
    Db(pool): Db,
    Json(input): Json<PublicReport>,
) -> Result<Json<serde_json::Value>, AppError> {
    let subject = input.subject.trim();
    let name = input.reporter_name.trim();
    let contact = input.reporter_contact.trim();

    if subject.is_empty() {
        return Err(AppError::bad_request("Please say what is wrong"));
    }
    if name.is_empty() {
        return Err(AppError::bad_request("Please give your name"));
    }
    // Without a way to reach them there is no ticket to follow, no
    // acknowledgement and no way to say it is fixed — only a note in a queue.
    if contact.is_empty() {
        return Err(AppError::bad_request(
            "Please give an email address or phone number so we can come back to you",
        ));
    }
    if subject.chars().count() > 300 {
        return Err(AppError::bad_request("Please keep the summary shorter"));
    }

    let mut tx = pool.begin().await?;
    let code = crate::handlers::helpdesk::next_ticket_code_tx(&mut tx).await?;
    let token = new_token();

    let id: uuid::Uuid = sqlx::query_scalar(
        r#"INSERT INTO helpdesk_tickets
             (ticket_code, subject, body, category_id, reporter_name, reporter_contact,
              location, priority, source, public_token, created_by, due_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'normal','public',$8,'public form',
                   NOW() + make_interval(hours => COALESCE(
                       (SELECT resolve_hours FROM helpdesk_categories WHERE id = $4), 72)))
           RETURNING id"#,
    )
    .bind(&code)
    .bind(subject)
    .bind(input.body.unwrap_or_default())
    .bind(input.category_id)
    .bind(name)
    .bind(contact)
    .bind(input.location.unwrap_or_default())
    .bind(&token)
    .fetch_one(&mut *tx)
    .await?;

    // Attachments are URLs from the upload endpoint. Anything that is not one
    // of ours is dropped rather than stored — a ticket is not a way to get an
    // arbitrary link rendered in the admin panel.
    for url in input.attachment_urls.iter().take(5) {
        if !url.starts_with("/api/uploads/") && !url.starts_with("/uploads/") {
            continue;
        }
        let filename = url.rsplit('/').next().unwrap_or("attachment").to_string();
        sqlx::query(
            "INSERT INTO helpdesk_attachments (ticket_id, url, filename, uploaded_by)
             VALUES ($1,$2,$3,$4)",
        )
        .bind(id)
        .bind(url)
        .bind(filename)
        .bind(name)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    // Best effort: the ticket is already saved, and failing the whole request
    // because the mail server is down would lose a report we have.
    crate::handlers::helpdesk_notify::acknowledge(&pool, id).await;

    Ok(Json(serde_json::json!({
        "ticket_code": code,
        "token": token,
        "message": "Thank you — we have logged this and will come back to you.",
    })))
}

/// Follow a ticket by its token.
pub async fn track(
    Db(pool): Db,
    Path(token): Path<String>,
) -> Result<Json<PublicTicket>, AppError> {
    // Length-checked before it reaches the database, so a short guess costs a
    // string comparison rather than a query.
    if token.len() != 64 || !token.chars().all(|c| c.is_ascii_alphanumeric()) {
        return Err(AppError::not_found("No ticket found with that link"));
    }

    let row = sqlx::query_as::<_, (
        uuid::Uuid, String, String, String, String, Option<String>, String,
        chrono::NaiveDateTime, Option<chrono::NaiveDateTime>, String, Option<i32>,
    )>(
        "SELECT t.id, t.ticket_code, t.subject, t.body, t.status, c.name, t.location,
                t.opened_at, t.resolved_at, t.resolution, t.satisfaction
         FROM helpdesk_tickets t
         LEFT JOIN helpdesk_categories c ON c.id = t.category_id
         WHERE t.public_token = $1",
    )
    .bind(&token)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("No ticket found with that link"))?;

    let (id, code, subject, body, status, category, location, opened, resolved, resolution, rating) =
        row;

    // Public replies only. `is_internal` is the team talking to itself and
    // `event_kind` is the system talking to nobody.
    let replies = sqlx::query_as::<_, PublicReply>(
        "SELECT author_name, body, created_at FROM helpdesk_comments
         WHERE ticket_id = $1 AND NOT is_internal AND event_kind = ''
         ORDER BY created_at",
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    let attachments = sqlx::query_as::<_, PublicAttachment>(
        "SELECT url, filename FROM helpdesk_attachments WHERE ticket_id = $1 ORDER BY created_at",
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    Ok(Json(PublicTicket {
        ticket_code: code,
        subject,
        body,
        status_label: status_label(&status).to_string(),
        can_rate: matches!(status.as_str(), "resolved" | "closed") && rating.is_none(),
        status,
        category_name: category,
        location,
        opened_at: opened,
        resolved_at: resolved,
        resolution,
        replies,
        attachments,
        satisfaction: rating,
    }))
}

#[derive(Debug, serde::Deserialize)]
pub struct PublicComment {
    pub body: String,
}

/// Let the reporter add to their own ticket.
pub async fn add_reply(
    Db(pool): Db,
    Path(token): Path<String>,
    Json(input): Json<PublicComment>,
) -> Result<Json<serde_json::Value>, AppError> {
    if input.body.trim().is_empty() {
        return Err(AppError::bad_request("Please write something"));
    }
    let row: Option<(uuid::Uuid, String)> = sqlx::query_as(
        "SELECT id, reporter_name FROM helpdesk_tickets WHERE public_token = $1",
    )
    .bind(&token)
    .fetch_optional(&pool)
    .await?;
    let (id, reporter) = row.ok_or_else(|| AppError::not_found("No ticket found with that link"))?;

    sqlx::query(
        "INSERT INTO helpdesk_comments (ticket_id, author_name, body, is_internal)
         VALUES ($1,$2,$3,false)",
    )
    .bind(id)
    .bind(&reporter)
    .bind(input.body.trim())
    .execute(&pool)
    .await?;

    // A reply from the reporter does not count as the team's first response —
    // that would let a ticket nobody has looked at record a response time of
    // minutes because the reporter added a photo.
    //
    // It does reopen a resolved ticket: someone writing back after being told
    // it is fixed is telling you it is not.
    let reopened: Option<String> = sqlx::query_scalar(
        "UPDATE helpdesk_tickets
         SET status = 'open', resolved_at = NULL, reopen_count = reopen_count + 1,
             updated_at = NOW()
         WHERE id = $1 AND status IN ('resolved', 'closed')
         RETURNING ticket_code",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?;

    if reopened.is_some() {
        let _ = sqlx::query(
            "INSERT INTO helpdesk_comments (ticket_id, author_name, body, is_internal, event_kind)
             VALUES ($1, 'system', 'Reopened — the reporter wrote back', true, 'status')",
        )
        .bind(id)
        .execute(&pool)
        .await;
    }

    crate::handlers::helpdesk_notify::reporter_replied(&pool, id).await;

    Ok(Json(serde_json::json!({
        "added": true,
        "reopened": reopened.is_some(),
    })))
}

#[derive(Debug, serde::Deserialize)]
pub struct Rating {
    pub score: i32,
    pub note: Option<String>,
}

/// Did the fix work? Asked once, of the person who reported it.
pub async fn rate(
    Db(pool): Db,
    Path(token): Path<String>,
    Json(input): Json<Rating>,
) -> Result<Json<serde_json::Value>, AppError> {
    if !(1..=5).contains(&input.score) {
        return Err(AppError::bad_request("Please choose between 1 and 5"));
    }

    // Only once, and only after it was resolved. Rating an open ticket rates
    // work that has not happened, and re-rating turns the figure into whoever
    // clicked last.
    let res = sqlx::query(
        "UPDATE helpdesk_tickets
         SET satisfaction = $2, satisfaction_note = $3, satisfaction_at = NOW()
         WHERE public_token = $1
           AND status IN ('resolved', 'closed')
           AND satisfaction IS NULL",
    )
    .bind(&token)
    .bind(input.score)
    .bind(input.note.unwrap_or_default())
    .execute(&pool)
    .await?;

    if res.rows_affected() == 0 {
        return Err(AppError::conflict(
            "This can only be rated once, and only after it has been resolved",
        ));
    }
    Ok(Json(serde_json::json!({ "thank_you": true })))
}

/// The categories a public form may offer.
///
/// Not the admin list: that carries SLA hours and open counts, which are
/// nobody else's business.
pub async fn categories(Db(pool): Db) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let rows = sqlx::query_as::<_, (uuid::Uuid, String, String)>(
        "SELECT id, name, description FROM helpdesk_categories
         WHERE is_active ORDER BY sort_order, name",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(
        rows.into_iter()
            .map(|(id, name, description)| {
                serde_json::json!({ "id": id, "name": name, "description": description })
            })
            .collect(),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_token_is_long_and_random_rather_than_a_ticket_number() {
        // HD-00042 is sequential: handing it out as a lookup key would let
        // anyone read HD-00041.
        let a = new_token();
        let b = new_token();
        assert_eq!(a.len(), 64);
        assert_ne!(a, b);
        assert!(a.chars().all(|c| c.is_ascii_alphanumeric()));
    }

    #[test]
    fn statuses_are_translated_into_words_a_reporter_can_read() {
        assert_eq!(status_label("in_progress"), "Being worked on");
        assert_eq!(status_label("resolved"), "Fixed");
        assert_eq!(status_label("cancelled"), "Not going ahead");
        // An unknown status must not leak the raw enum into a public page.
        assert_eq!(status_label("something_new"), "Received");
    }
}
