//! The things that make a small team fast: watchers, merging duplicates,
//! canned replies, article suggestions and bulk actions.
//!
//! None of it is clever. All of it removes typing that a volunteer would
//! otherwise do at 9pm on a Tuesday.

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;

// ---------------------------------------------------------------------------
// Watchers
// ---------------------------------------------------------------------------

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct Watcher {
    pub email: String,
    pub name: String,
    pub added_by: String,
    pub added_at: chrono::NaiveDateTime,
}

#[derive(Debug, serde::Deserialize)]
pub struct NewWatcher {
    pub email: String,
    pub name: Option<String>,
}

/// Follow a ticket you did not raise.
///
/// The warden wants to know when the boiler is fixed even though the cleaner
/// reported it. Without this they ask in person, which is the thing a help
/// desk is supposed to replace.
pub async fn watch(
    auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<NewWatcher>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Lowercased, because the primary key is (ticket, email) and `Ram@x.org`
    // added twice in different capitalisation would send two of everything.
    let email = input.email.trim().to_lowercase();
    if !email.contains('@') {
        return Err(AppError::bad_request("That does not look like an email address"));
    }

    let res = sqlx::query(
        "INSERT INTO helpdesk_watchers (ticket_id, email, name, added_by)
         SELECT $1, $2, $3, $4
         WHERE EXISTS (SELECT 1 FROM helpdesk_tickets WHERE id = $1)
         ON CONFLICT (ticket_id, email) DO NOTHING",
    )
    .bind(id)
    .bind(&email)
    .bind(input.name.unwrap_or_default().trim())
    .bind(&auth.email)
    .execute(&pool)
    .await?;

    // Zero rows means either no such ticket or already watching. Both are
    // "nothing to do", and telling them apart would leak whether an id exists.
    Ok(Json(serde_json::json!({ "watching": true, "added": res.rows_affected() > 0 })))
}

pub async fn unwatch(
    _auth: AuthUser,
    Db(pool): Db,
    Path((id, email)): Path<(uuid::Uuid, String)>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM helpdesk_watchers WHERE ticket_id = $1 AND email = $2")
        .bind(id)
        .bind(email.trim().to_lowercase())
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "watching": false })))
}

// ---------------------------------------------------------------------------
// Duplicates
// ---------------------------------------------------------------------------

#[derive(Debug, serde::Deserialize)]
pub struct MergeInput {
    /// The ticket this one is a duplicate of — the one that stays open.
    pub into: uuid::Uuid,
}

/// Fold a duplicate into the ticket it duplicates.
///
/// Three people reporting the same dead lightbulb is three tickets, and
/// closing two of them silently loses the fact that three people cared and
/// that all three are waiting to hear. So the duplicate row stays, its
/// reporter becomes a watcher on the survivor, and its photos move across —
/// they are evidence of the same fault.
pub async fn merge(
    auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<MergeInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    if input.into == id {
        return Err(AppError::bad_request("A ticket cannot be a duplicate of itself"));
    }

    let mut tx = pool.begin().await?;

    // Refuse to build a chain. If the target is itself already merged, the
    // reporter of this one would follow a pointer to a closed ticket.
    let target: Option<(String, Option<uuid::Uuid>)> =
        sqlx::query_as("SELECT ticket_code, merged_into FROM helpdesk_tickets WHERE id = $1")
            .bind(input.into)
            .fetch_optional(&mut *tx)
            .await?;
    let Some((target_code, target_merged)) = target else {
        return Err(AppError::not_found("The ticket you are merging into does not exist"));
    };
    if target_merged.is_some() {
        return Err(AppError::bad_request(
            "That ticket is itself a duplicate — merge into the original instead",
        ));
    }

    let dup: Option<(String, String, String, Option<uuid::Uuid>)> = sqlx::query_as(
        "SELECT ticket_code, reporter_name, reporter_contact, merged_into
         FROM helpdesk_tickets WHERE id = $1 FOR UPDATE",
    )
    .bind(id)
    .fetch_optional(&mut *tx)
    .await?;
    let Some((dup_code, reporter, contact, already)) = dup else {
        return Err(AppError::not_found("Ticket not found"));
    };
    if already.is_some() {
        return Err(AppError::bad_request("That ticket has already been merged"));
    }

    sqlx::query(
        "UPDATE helpdesk_tickets
            SET merged_into = $2,
                status = 'closed',
                closed_at = COALESCE(closed_at, NOW()),
                resolution = CASE WHEN resolution = ''
                                  THEN 'Merged into ' || $3 || ' — the same fault.'
                                  ELSE resolution END
          WHERE id = $1",
    )
    .bind(id)
    .bind(input.into)
    .bind(&target_code)
    .execute(&mut *tx)
    .await?;

    // The photos are of the same fault, so they belong on the ticket that is
    // still being worked.
    sqlx::query("UPDATE helpdesk_attachments SET ticket_id = $2 WHERE ticket_id = $1")
        .bind(id)
        .bind(input.into)
        .execute(&mut *tx)
        .await?;

    // So the person who reported the duplicate still hears when it is fixed.
    if contact.contains('@') {
        sqlx::query(
            "INSERT INTO helpdesk_watchers (ticket_id, email, name, added_by)
             VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
        )
        .bind(input.into)
        .bind(contact.trim().to_lowercase())
        .bind(&reporter)
        .bind(&auth.email)
        .execute(&mut *tx)
        .await?;
    }

    // Both sides get a note, so neither ticket's history has a silent jump.
    sqlx::query(
        "INSERT INTO helpdesk_comments (ticket_id, author_name, body, is_internal, event_kind)
         VALUES ($1, $2, $3, TRUE, 'merged'), ($4, $2, $5, TRUE, 'merged')",
    )
    .bind(id)
    .bind(&auth.email)
    .bind(format!("Merged into {target_code} as a duplicate."))
    .bind(input.into)
    .bind(format!("{dup_code} ({reporter}) reported the same thing and was merged in here."))
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(Json(serde_json::json!({ "merged_into": input.into, "target": target_code })))
}

// ---------------------------------------------------------------------------
// Canned replies
// ---------------------------------------------------------------------------

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct CannedReply {
    pub id: uuid::Uuid,
    pub title: String,
    pub body: String,
    pub category_id: Option<uuid::Uuid>,
    pub use_count: i32,
}

pub async fn replies(Db(pool): Db) -> Result<Json<Vec<CannedReply>>, AppError> {
    // Most-used first: the reply someone reaches for ten times a week should
    // not be the eleventh in the list.
    let rows = sqlx::query_as::<_, CannedReply>(
        "SELECT id, title, body, category_id, use_count
         FROM helpdesk_replies
         ORDER BY use_count DESC, title",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

/// Count a use. Fire-and-forget from the client; the ordering above is the
/// only thing that depends on it.
pub async fn reply_used(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("UPDATE helpdesk_replies SET use_count = use_count + 1 WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

// ---------------------------------------------------------------------------
// Article suggestions
// ---------------------------------------------------------------------------

#[derive(Debug, serde::Deserialize)]
pub struct SuggestQuery {
    pub q: String,
}

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct Suggestion {
    pub id: uuid::Uuid,
    pub title: String,
    pub slug: String,
    pub keywords: String,
}

/// Articles that might already answer this, ranked by how many of the words
/// typed so far appear in them.
///
/// Deliberately not full-text search: the corpus is a few dozen articles, and
/// a tsvector index would be more machinery than the whole feature.
pub async fn suggest(
    Db(pool): Db,
    Query(q): Query<SuggestQuery>,
) -> Result<Json<Vec<Suggestion>>, AppError> {
    // Words that appear in every article rank nothing and match everything.
    // Without this, "how do I book the hall" suggests all four articles
    // because they all contain "the".
    const NOISE: &[&str] = &[
        "the", "and", "for", "you", "your", "our", "with", "that", "this", "have", "has",
        "was", "are", "not", "but", "can", "could", "would", "should", "will", "when",
        "what", "where", "how", "why", "any", "all", "get", "got", "did", "does", "from",
        "there", "here", "been", "they", "them", "his", "her", "its", "please", "thanks",
    ];

    let words: Vec<String> = q
        .q
        .split(|c: char| !c.is_alphanumeric())
        .map(|w| w.to_lowercase())
        .filter(|w| w.chars().count() >= 3 && !NOISE.contains(&w.as_str()))
        .take(8)
        .map(|w| format!("%{w}%"))
        .collect();
    if words.is_empty() {
        return Ok(Json(Vec::new()));
    }

    let rows = sqlx::query_as::<_, Suggestion>(
        // Title and keyword hits outrank a word buried in the body, and a
        // single passing mention in a body is not a suggestion — two words, or
        // one in the title or keywords, is the bar.
        "WITH scored AS (
             SELECT id, title, slug, keywords, view_count,
                    (SELECT count(*) FROM unnest($1::text[]) w WHERE lower(title) LIKE w) * 3
                  + (SELECT count(*) FROM unnest($1::text[]) w WHERE lower(keywords) LIKE w) * 2
                  + (SELECT count(*) FROM unnest($1::text[]) w WHERE lower(body) LIKE w)
                    AS score
               FROM helpdesk_articles
              WHERE is_published
         )
         SELECT id, title, slug, keywords FROM scored
          WHERE score >= 2
          ORDER BY score DESC, view_count DESC
          LIMIT 5",
    )
    .bind(&words)
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

// ---------------------------------------------------------------------------
// Bulk actions
// ---------------------------------------------------------------------------

#[derive(Debug, serde::Deserialize)]
pub struct BulkInput {
    pub ids: Vec<uuid::Uuid>,
    pub action: String,
    /// For `assign`, `priority`, `category` and `close`.
    pub value: Option<String>,
    pub category_id: Option<uuid::Uuid>,
}

/// One change across a selection.
///
/// Notably absent: bulk resolve. Resolving needs a sentence saying what was
/// done, and one sentence pasted across nine unrelated tickets is a lie in
/// nine records. Closing does not need one, so closing is here.
pub async fn bulk(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<BulkInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    if input.ids.is_empty() {
        return Err(AppError::bad_request("Nothing was selected"));
    }
    if input.ids.len() > 200 {
        return Err(AppError::bad_request("Too many at once — select 200 or fewer"));
    }

    let value = input.value.unwrap_or_default();
    let changed = match input.action.as_str() {
        "assign" => {
            if value.trim().is_empty() {
                return Err(AppError::bad_request("Who should these go to?"));
            }
            sqlx::query(
                "UPDATE helpdesk_tickets
                    SET assignee_name = $2,
                        status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END
                  WHERE id = ANY($1) AND merged_into IS NULL",
            )
            .bind(&input.ids)
            .bind(value.trim())
            .execute(&pool)
            .await?
        }
        "priority" => {
            if !matches!(value.as_str(), "low" | "normal" | "high" | "urgent") {
                return Err(AppError::bad_request("Unknown priority"));
            }
            sqlx::query("UPDATE helpdesk_tickets SET priority = $2 WHERE id = ANY($1)")
                .bind(&input.ids)
                .bind(&value)
                .execute(&pool)
                .await?
        }
        "category" => {
            sqlx::query("UPDATE helpdesk_tickets SET category_id = $2 WHERE id = ANY($1)")
                .bind(&input.ids)
                .bind(input.category_id)
                .execute(&pool)
                .await?
        }
        "close" => {
            // Only what is already finished. Closing something still open
            // makes a queue look tidy while the fault stays broken.
            sqlx::query(
                "UPDATE helpdesk_tickets
                    SET status = 'closed', closed_at = COALESCE(closed_at, NOW())
                  WHERE id = ANY($1) AND status = 'resolved'",
            )
            .bind(&input.ids)
            .execute(&pool)
            .await?
        }
        other => {
            return Err(AppError::bad_request(format!("Unknown action: {other}")));
        }
    };

    let n = changed.rows_affected() as i64;
    if n > 0 {
        sqlx::query(
            "INSERT INTO helpdesk_comments (ticket_id, author_name, body, is_internal, event_kind)
             SELECT id, $2, $3, TRUE, 'bulk' FROM helpdesk_tickets WHERE id = ANY($1)",
        )
        .bind(&input.ids)
        .bind(&auth.email)
        .bind(format!("Changed as part of a bulk {} action.", input.action))
        .execute(&pool)
        .await?;
    }

    // Reporting the requested count rather than the changed count would hide
    // that "close" skipped everything still open.
    Ok(Json(serde_json::json!({
        "changed": n,
        "requested": input.ids.len(),
        "skipped": input.ids.len() as i64 - n,
    })))
}
