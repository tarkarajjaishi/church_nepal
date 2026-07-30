//! Help desk notifications.
//!
//! Every one of these is **best effort and logged**. A ticket that is already
//! saved must not be lost because the mail server is down, so nothing here
//! returns an error to the caller — but every attempt lands in
//! `helpdesk_notifications` with its outcome, because "was the reporter ever
//! told it was fixed?" needs an answer that is not somebody's inbox.
//!
//! The recipient of every message is worked out from the ticket rather than
//! passed in, so a notification cannot be aimed somewhere the ticket does not
//! actually reach.

use sqlx::PgPool;

/// A ticket's own address book: the reporter, the assignee, the watchers.
struct Audience {
    reporter: Option<String>,
    assignee: Option<String>,
    watchers: Vec<String>,
}

/// Looks like an address. The same deliberately loose test the schedules use —
/// a full RFC check rejects addresses that work, and the mail server is the
/// real arbiter.
fn is_email(s: &str) -> bool {
    match s.find('@') {
        Some(i) => i > 0 && s[i + 1..].contains('.') && !s.contains(' ') && !s.ends_with('.'),
        None => false,
    }
}

async fn audience(pool: &PgPool, ticket_id: uuid::Uuid) -> Audience {
    let row: Option<(String, String)> = sqlx::query_as(
        "SELECT reporter_contact, assignee_contact FROM helpdesk_tickets WHERE id = $1",
    )
    .bind(ticket_id)
    .fetch_optional(pool)
    .await
    .ok()
    .flatten();

    let (reporter, assignee) = row
        .map(|(r, a)| {
            (
                Some(r).filter(|s| is_email(s)),
                Some(a).filter(|s| is_email(s)),
            )
        })
        .unwrap_or((None, None));

    let watchers: Vec<String> =
        sqlx::query_scalar("SELECT email FROM helpdesk_watchers WHERE ticket_id = $1")
            .bind(ticket_id)
            .fetch_all(pool)
            .await
            .unwrap_or_default();

    Audience { reporter, assignee, watchers }
}

struct Summary {
    code: String,
    subject: String,
    status: String,
    reporter: String,
    assignee: String,
    resolution: String,
    token: String,
}

async fn summary(pool: &PgPool, ticket_id: uuid::Uuid) -> Option<Summary> {
    let row: Option<(String, String, String, String, String, String, String)> = sqlx::query_as(
        "SELECT ticket_code, subject, status, reporter_name, assignee_name, resolution, public_token
         FROM helpdesk_tickets WHERE id = $1",
    )
    .bind(ticket_id)
    .fetch_optional(pool)
    .await
    .ok()
    .flatten();

    row.map(|(code, subject, status, reporter, assignee, resolution, token)| Summary {
        code,
        subject,
        status,
        reporter,
        assignee,
        resolution,
        token,
    })
}

/// The link a reporter follows to see their own ticket.
fn tracking_link(token: &str) -> String {
    let base = std::env::var("PUBLIC_SITE_URL")
        .unwrap_or_else(|_| "http://localhost:3005".to_string());
    format!("{}/support/{token}", base.trim_end_matches('/'))
}

async fn record(
    pool: &PgPool,
    ticket_id: uuid::Uuid,
    kind: &str,
    to: &[String],
    result: &anyhow::Result<()>,
) {
    let (status, error) = match result {
        Ok(()) => ("sent", String::new()),
        Err(e) => ("failed", e.to_string()),
    };
    let _ = sqlx::query(
        "INSERT INTO helpdesk_notifications (ticket_id, kind, recipients, status, error)
         VALUES ($1,$2,$3,$4,$5)",
    )
    .bind(ticket_id)
    .bind(kind)
    .bind(to.join(", "))
    .bind(status)
    .bind(error)
    .execute(pool)
    .await;
}

/// Has this notification already gone out for this ticket?
///
/// Used for the once-only messages. An acknowledgement sent twice is annoying;
/// an escalation sent every minute until somebody fixes the projector is why
/// people filter the help desk into a folder they never open.
async fn already_sent(pool: &PgPool, ticket_id: uuid::Uuid, kind: &str) -> bool {
    sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (SELECT 1 FROM helpdesk_notifications
                        WHERE ticket_id = $1 AND kind = $2 AND status = 'sent')",
    )
    .bind(ticket_id)
    .bind(kind)
    .fetch_one(pool)
    .await
    .unwrap_or(false)
}

async fn send(
    pool: &PgPool,
    ticket_id: uuid::Uuid,
    kind: &str,
    to: Vec<String>,
    subject: String,
    body: String,
) {
    // De-duplicated case-insensitively: the reporter who is also a watcher
    // should get one copy, not two.
    let mut seen = std::collections::HashSet::new();
    let to: Vec<String> = to
        .into_iter()
        .filter(|e| is_email(e))
        .filter(|e| seen.insert(e.to_lowercase()))
        .collect();
    if to.is_empty() {
        return;
    }
    let result = crate::email::send_plain(pool, &to, &subject, &body).await;
    record(pool, ticket_id, kind, &to, &result).await;
}

/// "We have it." Sent once, when a ticket arrives from the public form.
pub async fn acknowledge(pool: &PgPool, ticket_id: uuid::Uuid) {
    if already_sent(pool, ticket_id, "acknowledged").await {
        return;
    }
    let Some(s) = summary(pool, ticket_id).await else { return };
    let a = audience(pool, ticket_id).await;
    let Some(reporter) = a.reporter else { return };

    let body = format!(
        "Dear {},\n\n\
         Thank you for telling us about this. We have logged it as {} and someone will look \
         at it.\n\n\
         What you reported:\n  {}\n\n\
         You can see how it is going, add anything you forgot, or send us a photo here:\n  {}\n\n\
         Grace Nepal Church\n",
        s.reporter,
        s.code,
        s.subject,
        tracking_link(&s.token),
    );
    send(
        pool,
        ticket_id,
        "acknowledged",
        vec![reporter],
        format!("{} — we have your report", s.code),
        body,
    )
    .await;
}

/// Somebody has picked it up. Sent to the person who did, so a ticket assigned
/// to a volunteer who is not looking at the admin panel still reaches them.
pub async fn assigned(pool: &PgPool, ticket_id: uuid::Uuid) {
    let Some(s) = summary(pool, ticket_id).await else { return };
    let a = audience(pool, ticket_id).await;
    let Some(assignee) = a.assignee else { return };

    let body = format!(
        "{} has been assigned to you.\n\n  {}\n\nReported by: {}\n",
        s.code, s.subject, s.reporter
    );
    send(
        pool,
        ticket_id,
        "assigned",
        vec![assignee],
        format!("{} is yours — {}", s.code, s.subject),
        body,
    )
    .await;
}

/// A reply the reporter can see. Internal notes deliberately do not trigger
/// this — the team talking to itself is not a message to anybody.
pub async fn replied(pool: &PgPool, ticket_id: uuid::Uuid, message: &str) {
    let Some(s) = summary(pool, ticket_id).await else { return };
    let a = audience(pool, ticket_id).await;
    let Some(reporter) = a.reporter else { return };

    let mut to = vec![reporter];
    to.extend(a.watchers);

    let body = format!(
        "There is an update on {}.\n\n  {}\n\n---\n{}\n---\n\nSee the whole thread here:\n  {}\n",
        s.code,
        s.subject,
        message.trim(),
        tracking_link(&s.token),
    );
    send(pool, ticket_id, "replied", to, format!("{} — an update", s.code), body).await;
}

/// It is fixed. The message that closes the loop, and the one most worth
/// getting right: it says what was done, not merely that something was.
pub async fn resolved(pool: &PgPool, ticket_id: uuid::Uuid) {
    let Some(s) = summary(pool, ticket_id).await else { return };
    let a = audience(pool, ticket_id).await;
    let Some(reporter) = a.reporter else { return };

    let mut to = vec![reporter];
    to.extend(a.watchers);

    let what = if s.resolution.trim().is_empty() {
        // The database refuses a resolved ticket with no resolution, so this
        // is only reachable for `closed`. Say so rather than leave a blank.
        "It has been closed.".to_string()
    } else {
        format!("What was done:\n  {}", s.resolution.trim())
    };

    let body = format!(
        "Dear {},\n\n\
         {} has been dealt with.\n\n  {}\n\n{}\n\n\
         If it is not right, write back on the same link and it will reopen:\n  {}\n\n\
         Grace Nepal Church\n",
        s.reporter,
        s.code,
        s.subject,
        what,
        tracking_link(&s.token),
    );
    send(
        pool,
        ticket_id,
        "resolved",
        to,
        format!("{} — sorted", s.code),
        body,
    )
    .await;
}

/// The reporter has written back. Goes to whoever owns it, so a reply does not
/// sit unread in a ticket nobody is watching.
pub async fn reporter_replied(pool: &PgPool, ticket_id: uuid::Uuid) {
    let Some(s) = summary(pool, ticket_id).await else { return };
    let a = audience(pool, ticket_id).await;

    let mut to: Vec<String> = a.assignee.into_iter().collect();
    to.extend(a.watchers);
    if to.is_empty() {
        return;
    }

    let body = format!(
        "{} has a reply from {}.\n\n  {}\n\nStatus: {}\n",
        s.code, s.reporter, s.subject, s.status
    );
    send(
        pool,
        ticket_id,
        "reporter_replied",
        to,
        format!("{} — {} replied", s.code, s.reporter),
        body,
    )
    .await;
}

/// Past its service target and still open. Sent **once** per ticket.
///
/// The alternative — a reminder every time the job runs — is how a team learns
/// to filter the help desk into a folder they never open, at which point the
/// escalation has made things worse than no escalation.
pub async fn escalate(pool: &PgPool, ticket_id: uuid::Uuid, to: Vec<String>, why: &str) {
    let Some(s) = summary(pool, ticket_id).await else { return };

    let body = format!(
        "{} has passed its service target and is still open.\n\n  {}\n\n{}\n\nStatus: {}\nOwner: {}\n",
        s.code,
        s.subject,
        why,
        s.status,
        if s.assignee.is_empty() { "nobody has picked it up" } else { &s.assignee },
    );
    send(
        pool,
        ticket_id,
        "escalated",
        to,
        format!("Overdue: {} — {}", s.code, s.subject),
        body,
    )
    .await;
}

/// Find tickets past their target that nobody has been told about, and tell
/// somebody. Driven by the 60-second tick in main.rs.
pub async fn process_escalations(pool: &PgPool) {
    // Who to tell: everyone holding `helpdesk.manage`. Not a configured
    // address, which goes stale the moment that person leaves.
    let managers: Vec<String> = sqlx::query_scalar(
        "SELECT DISTINCT u.email
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN role_permissions rp ON rp.role_id = ur.role_id
         WHERE rp.permission IN ('helpdesk.manage', 'system.admin')",
    )
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    if managers.is_empty() {
        return;
    }

    let due: Vec<(uuid::Uuid, bool)> = match sqlx::query_as(
        "SELECT t.id, t.first_responded_at IS NULL
         FROM helpdesk_tickets t
         LEFT JOIN helpdesk_categories c ON c.id = t.category_id
         WHERE t.status NOT IN ('resolved','closed','cancelled')
           AND t.escalated_at IS NULL
           AND ((t.first_responded_at IS NULL
                 AND NOW() > t.opened_at + make_interval(hours => COALESCE(c.response_hours, 24)))
             OR NOW() > t.opened_at + make_interval(hours => COALESCE(c.resolve_hours, 72)))
         LIMIT 20",
    )
    .fetch_all(pool)
    .await
    {
        Ok(rows) => rows,
        // No help desk in this church. Not worth logging every minute.
        Err(_) => return,
    };

    for (id, unanswered) in due {
        // Stamped first. If the send fails, the ticket has still been escalated
        // once rather than retried every minute — the failure is in the
        // notification log, which is where you would look for it.
        if sqlx::query("UPDATE helpdesk_tickets SET escalated_at = NOW() WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await
            .is_err()
        {
            continue;
        }
        let why = if unanswered {
            "Nobody has replied to the person who reported it."
        } else {
            "It was answered, but it is still not fixed."
        };
        escalate(pool, id, managers.clone(), why).await;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_things_that_look_like_addresses_are_written_to() {
        assert!(is_email("treasurer@grace.org.np"));
        assert!(!is_email("9841000111"));
        assert!(!is_email("@grace.org"));
        assert!(!is_email("a@b"));
        assert!(!is_email(""));
    }

    #[test]
    fn the_tracking_link_points_at_the_public_site() {
        let link = tracking_link("abc123");
        assert!(link.ends_with("/support/abc123"));
        assert!(!link.contains("//support"), "no double slash from a trailing base");
    }
}
