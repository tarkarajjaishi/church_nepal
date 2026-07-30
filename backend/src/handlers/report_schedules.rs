//! Scheduled report delivery.
//!
//! A schedule points at a saved report and a list of recipients. The worker in
//! `main.rs` picks up whatever is due on its 60-second tick, renders the PDF
//! and emails it.
//!
//! Two rules that stop this becoming a mail loop:
//!
//! 1. **`next_run_at` is advanced before the send is attempted.** A report that
//!    cannot be generated — a module uninstalled, a database down — would
//!    otherwise stay due and be retried every 60 seconds forever. It retries
//!    on the next cycle instead, and the failure is recorded.
//!
//! 2. **A silent SMTP no-op is a failure, not a success.** `email.rs` returns
//!    `Ok(())` when `SMTP_HOST` is unset, which is right for a receipt nobody
//!    is waiting on and wrong here: a schedule that records "sent" while
//!    sending nothing is the single worst outcome, because the treasurer
//!    stops checking.

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::report::*;
use crate::tenant::Db;
use axum::extract::Path;
use axum::Json;
use chrono::{Datelike, Timelike};

const FREQUENCIES: [&str; 3] = ["daily", "weekly", "monthly"];

/// Split a recipient list on commas, semicolons or newlines, and keep only
/// entries that look like addresses.
///
/// A schedule with one typo among five addresses should still reach the other
/// four, and should say which one it dropped rather than failing the send.
pub fn parse_recipients(s: &str) -> (Vec<String>, Vec<String>) {
    let mut good = Vec::new();
    let mut bad = Vec::new();
    for raw in s.split([',', ';', '\n', '\r']) {
        let e = raw.trim();
        if e.is_empty() {
            continue;
        }
        // Deliberately loose: a full RFC 5322 check rejects addresses that
        // work, and the real test is whether the mail server accepts it.
        let at = e.find('@');
        let valid = match at {
            Some(i) => i > 0 && e[i + 1..].contains('.') && !e.contains(' ') && !e.ends_with('.'),
            None => false,
        };
        if valid { good.push(e.to_string()) } else { bad.push(e.to_string()) }
    }
    (good, bad)
}

/// When this schedule should next fire, strictly after `after`.
///
/// Always forward: computing "the next Monday at 07:00" from a time that is
/// already past Monday 07:00 has to land on next week, or the schedule fires
/// again on the same tick and the treasurer gets sixty copies.
pub fn next_run(
    frequency: &str,
    day_of_week: i32,
    day_of_month: i32,
    hour: i32,
    after: chrono::NaiveDateTime,
) -> chrono::NaiveDateTime {
    let at = |d: chrono::NaiveDate| d.and_hms_opt(hour.clamp(0, 23) as u32, 0, 0).unwrap();

    match frequency {
        "daily" => {
            let today = at(after.date());
            if today > after { today } else { at(after.date().succ_opt().unwrap()) }
        }
        "monthly" => {
            let dom = day_of_month.clamp(1, 28) as u32;
            let this = chrono::NaiveDate::from_ymd_opt(after.year(), after.month(), dom)
                .map(at)
                .filter(|d| *d > after);
            this.unwrap_or_else(|| {
                let next = after
                    .date()
                    .with_day(1)
                    .unwrap()
                    .checked_add_months(chrono::Months::new(1))
                    .unwrap();
                at(chrono::NaiveDate::from_ymd_opt(next.year(), next.month(), dom).unwrap())
            })
        }
        // weekly, and anything unrecognised — a schedule with a frequency
        // nobody implemented must still fire on some sane cadence rather than
        // never, which would look identical to it being switched off.
        _ => {
            let want = day_of_week.clamp(0, 6) as u32;
            let mut d = after.date();
            for _ in 0..8 {
                if d.weekday().num_days_from_sunday() == want && at(d) > after {
                    return at(d);
                }
                d = d.succ_opt().unwrap();
            }
            at(d)
        }
    }
}

fn validate(input: &UpsertSchedule) -> Result<Vec<String>, AppError> {
    if let Some(f) = input.frequency.as_deref() {
        if !FREQUENCIES.contains(&f) {
            return Err(AppError::bad_request(format!(
                "A report can be sent daily, weekly or monthly — not \"{f}\""
            )));
        }
    }
    let (good, bad) = parse_recipients(&input.recipients);
    // The specific complaint first. "Give at least one email address" when the
    // user typed one and got the domain wrong sends them looking for an empty
    // box rather than at the typo.
    if !bad.is_empty() {
        return Err(AppError::bad_request(format!(
            "This does not look like an email address: {}",
            bad.join(", ")
        )));
    }
    if input.is_active.unwrap_or(true) && good.is_empty() {
        return Err(AppError::bad_request(
            "Give at least one email address, or switch the schedule off",
        ));
    }
    Ok(good)
}

const SELECT: &str = r#"
    SELECT sc.id, sc.saved_report_id, sc.frequency, sc.day_of_week, sc.day_of_month,
           sc.hour, sc.recipients, sc.is_active, sc.next_run_at, sc.last_run_at,
           sc.last_status, sc.last_error, sc.run_count, sc.created_by,
           s.name AS report_name
    FROM report_schedules sc
    JOIN saved_reports s ON s.id = sc.saved_report_id
"#;

pub async fn list(auth: AuthUser, Db(pool): Db) -> Result<Json<Vec<ReportSchedule>>, AppError> {
    let rows = sqlx::query_as::<_, ReportSchedule>(&format!("{SELECT} ORDER BY sc.next_run_at"))
        .fetch_all(&pool)
        .await?;

    // Only schedules of reports the caller can run. A schedule's name and
    // recipient list say what someone is watching and who is watching it.
    let held = crate::handlers::reports::permissions_of(&pool, &auth).await;
    let mut out = Vec::new();
    for r in rows {
        let key: Option<String> =
            sqlx::query_scalar("SELECT report_key FROM saved_reports WHERE id = $1")
                .bind(r.saved_report_id)
                .fetch_optional(&pool)
                .await?;
        let allowed = key
            .as_deref()
            .and_then(crate::handlers::reports::describe)
            .map(|(_, p)| crate::permissions::allows(&held, p))
            .unwrap_or(false);
        if allowed {
            out.push(r);
        }
    }
    Ok(Json(out))
}

pub async fn create(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertSchedule>,
) -> Result<Json<serde_json::Value>, AppError> {
    let good = validate(&input)?;

    // Prove the caller can run the report before agreeing to email it to a
    // list every week. Without this, a schedule is a way to have the server
    // send you figures you may not open yourself.
    let (saved, q, view) =
        crate::handlers::saved_reports::resolve(&pool, input.saved_report_id).await?;
    crate::handlers::reports::build(&auth, &pool, &saved.report_key, &q, &view).await?;

    let now: chrono::NaiveDateTime = sqlx::query_scalar("SELECT NOW()::timestamp")
        .fetch_one(&pool)
        .await?;
    let frequency = input.frequency.clone().unwrap_or_else(|| "weekly".into());
    let next = next_run(
        &frequency,
        input.day_of_week.unwrap_or(1),
        input.day_of_month.unwrap_or(1),
        input.hour.unwrap_or(7),
        now,
    );

    let id: uuid::Uuid = sqlx::query_scalar(
        r#"INSERT INTO report_schedules
             (saved_report_id, frequency, day_of_week, day_of_month, hour,
              recipients, is_active, next_run_at, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id"#,
    )
    .bind(input.saved_report_id)
    .bind(&frequency)
    .bind(input.day_of_week.unwrap_or(1))
    .bind(input.day_of_month.unwrap_or(1))
    .bind(input.hour.unwrap_or(7))
    .bind(good.join(", "))
    .bind(input.is_active.unwrap_or(true))
    .bind(next)
    .bind(&auth.email)
    .fetch_one(&pool)
    .await?;

    Ok(Json(serde_json::json!({ "id": id, "next_run_at": next })))
}

pub async fn update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpsertSchedule>,
) -> Result<Json<serde_json::Value>, AppError> {
    let good = validate(&input)?;
    let now: chrono::NaiveDateTime = sqlx::query_scalar("SELECT NOW()::timestamp")
        .fetch_one(&pool)
        .await?;
    let frequency = input.frequency.clone().unwrap_or_else(|| "weekly".into());
    let next = next_run(
        &frequency,
        input.day_of_week.unwrap_or(1),
        input.day_of_month.unwrap_or(1),
        input.hour.unwrap_or(7),
        now,
    );

    let res = sqlx::query(
        r#"UPDATE report_schedules SET
             frequency = $2, day_of_week = $3, day_of_month = $4, hour = $5,
             recipients = $6, is_active = $7, next_run_at = $8, updated_at = NOW()
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(&frequency)
    .bind(input.day_of_week.unwrap_or(1))
    .bind(input.day_of_month.unwrap_or(1))
    .bind(input.hour.unwrap_or(7))
    .bind(good.join(", "))
    .bind(input.is_active.unwrap_or(true))
    .bind(next)
    .execute(&pool)
    .await?;

    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Schedule not found"));
    }
    Ok(Json(serde_json::json!({ "updated": true, "next_run_at": next })))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let res = sqlx::query("DELETE FROM report_schedules WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Schedule not found"));
    }
    Ok(Json(serde_json::json!({ "deleted": true })))
}

/// Send one now, without waiting for its slot.
///
/// The point is to find out whether it works while somebody is watching,
/// rather than at 07:00 on Monday. It does not move `next_run_at`.
pub async fn send_now(
    auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let sched = sqlx::query_as::<_, ReportSchedule>(&format!("{SELECT} WHERE sc.id = $1"))
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Schedule not found"))?;

    match deliver(&pool, &sched, Some(&auth)).await {
        Ok(rows) => Ok(Json(serde_json::json!({
            "sent": true,
            "recipients": sched.recipients,
            "rows": rows,
        }))),
        Err(e) => Err(AppError::bad_request(format!("Could not send it: {e}"))),
    }
}

pub async fn deliveries(Db(pool): Db) -> Result<Json<Vec<ReportDelivery>>, AppError> {
    let rows = sqlx::query_as::<_, ReportDelivery>(
        "SELECT id, report_name, recipients, status, error, period_from, period_to,
                row_count, sent_at
         FROM report_deliveries ORDER BY sent_at DESC LIMIT 100",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

// ===========================================================================
// Delivery
// ===========================================================================

/// Build the report, render it, email it, and write the delivery record.
///
/// `as_user` is the live caller for a "send now"; the background worker passes
/// `None` and runs as the system. That is not a permission hole: creating the
/// schedule required being able to run the report, and the worker is executing
/// a configuration, not answering a request.
pub async fn deliver(
    pool: &sqlx::PgPool,
    sched: &ReportSchedule,
    as_user: Option<&AuthUser>,
) -> anyhow::Result<usize> {
    let system = AuthUser {
        user_id: "report-scheduler".into(),
        email: "scheduler@local".into(),
        role: "admin".into(),
    };
    let who = as_user.unwrap_or(&system);

    let (saved, q, view) = crate::handlers::saved_reports::resolve(pool, sched.saved_report_id)
        .await
        .map_err(|e| anyhow::anyhow!("{}", e.message))?;
    let mut report = crate::handlers::reports::build(who, pool, &saved.report_key, &q, &view)
        .await
        .map_err(|e| anyhow::anyhow!("{}", e.message))?;
    report.name = saved.name.clone();

    let (to, _) = parse_recipients(&sched.recipients);
    if to.is_empty() {
        anyhow::bail!("no valid recipients");
    }

    let pdf = crate::handlers::report_pdf::render(&report);
    let subject = format!("{} — {} to {}", report.name, report.from, report.to);
    let body = format!(
        "{}\n\n{}\n\nPeriod: {} to {}\n{}\n\nAttached as PDF.\n",
        report.name,
        report.description,
        report.from,
        report.to,
        report
            .stats
            .iter()
            .map(|s| format!("  {}: {}", s.label, s.value))
            .collect::<Vec<_>>()
            .join("\n"),
    );

    let result = crate::email::send_report(pool, &to, &subject, &body, &pdf, &report.name).await;

    let (status, error) = match &result {
        Ok(()) => ("sent", String::new()),
        Err(e) => ("failed", e.to_string()),
    };

    let _ = sqlx::query(
        r#"INSERT INTO report_deliveries
             (schedule_id, saved_report_id, report_name, recipients, status, error,
              period_from, period_to, row_count)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)"#,
    )
    .bind(sched.id)
    .bind(sched.saved_report_id)
    .bind(&report.name)
    .bind(to.join(", "))
    .bind(status)
    .bind(&error)
    .bind(report.from)
    .bind(report.to)
    .bind(report.rows.len() as i32)
    .execute(pool)
    .await;

    let _ = sqlx::query(
        "UPDATE report_schedules
         SET last_run_at = NOW(), last_status = $2, last_error = $3, run_count = run_count + 1
         WHERE id = $1",
    )
    .bind(sched.id)
    .bind(status)
    .bind(&error)
    .execute(pool)
    .await;

    result?;
    Ok(report.rows.len())
}

/// Fire everything that is due. Called from the 60-second tick in main.rs.
pub async fn process_due(pool: &sqlx::PgPool) {
    let due: Vec<ReportSchedule> = match sqlx::query_as::<_, ReportSchedule>(&format!(
        "{SELECT} WHERE sc.is_active AND sc.next_run_at <= NOW()"
    ))
    .fetch_all(pool)
    .await
    {
        Ok(rows) => rows,
        // A church without the reports migration has no such table. That is
        // not an error worth logging every minute.
        Err(_) => return,
    };

    for s in due {
        let now: chrono::NaiveDateTime =
            match sqlx::query_scalar("SELECT NOW()::timestamp").fetch_one(pool).await {
                Ok(t) => t,
                Err(_) => continue,
            };
        let next = next_run(&s.frequency, s.day_of_week, s.day_of_month, s.hour, now);

        // Advanced *first*. A report that cannot be generated would otherwise
        // stay due and be retried every 60 seconds for as long as it is
        // broken — which is a mail loop if the send half-works.
        if sqlx::query("UPDATE report_schedules SET next_run_at = $2 WHERE id = $1")
            .bind(s.id)
            .bind(next)
            .execute(pool)
            .await
            .is_err()
        {
            continue;
        }

        if let Err(e) = deliver(pool, &s, None).await {
            eprintln!("report schedule {} failed: {e}", s.id);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn at(y: i32, m: u32, d: u32, h: u32) -> chrono::NaiveDateTime {
        chrono::NaiveDate::from_ymd_opt(y, m, d).unwrap().and_hms_opt(h, 0, 0).unwrap()
    }

    #[test]
    fn the_next_run_is_always_in_the_future() {
        // The bug this prevents: computing "Monday 07:00" from a moment that
        // is already past it returns the same instant, the row stays due, and
        // the tick sends it again sixty seconds later. And again.
        for f in ["daily", "weekly", "monthly"] {
            for hour in [0, 7, 23] {
                let from = at(2026, 7, 30, hour as u32);
                let next = next_run(f, 1, 1, hour, from);
                assert!(next > from, "{f} at {hour}: {next} is not after {from}");
            }
        }
    }

    #[test]
    fn weekly_lands_on_the_chosen_day() {
        // 30 July 2026 is a Thursday.
        let thursday = at(2026, 7, 30, 9);
        let monday = next_run("weekly", 1, 1, 7, thursday);
        assert_eq!(monday.weekday().num_days_from_sunday(), 1);
        assert_eq!(monday.hour(), 7);
        assert_eq!(monday.date(), chrono::NaiveDate::from_ymd_opt(2026, 8, 3).unwrap());
    }

    #[test]
    fn a_slot_earlier_today_moves_to_the_next_one() {
        let after = at(2026, 7, 30, 18);
        assert_eq!(next_run("daily", 1, 1, 7, after).date(), chrono::NaiveDate::from_ymd_opt(2026, 7, 31).unwrap());
        // And one still to come today fires today.
        assert_eq!(next_run("daily", 1, 1, 23, at(2026, 7, 30, 9)).date(),
                   chrono::NaiveDate::from_ymd_opt(2026, 7, 30).unwrap());
    }

    #[test]
    fn monthly_never_lands_on_a_day_february_does_not_have() {
        // Asking for the 31st in a February is how a monthly job silently
        // skips a month. The column is capped at 28 for that reason.
        let next = next_run("monthly", 1, 31, 7, at(2026, 1, 20, 9));
        assert_eq!(next.day(), 28);
        let feb = next_run("monthly", 1, 28, 7, at(2026, 2, 1, 9));
        assert_eq!(feb, at(2026, 2, 28, 7));
    }

    #[test]
    fn monthly_rolls_into_the_next_month_once_the_day_has_passed() {
        let next = next_run("monthly", 1, 5, 7, at(2026, 7, 20, 9));
        assert_eq!(next, at(2026, 8, 5, 7));
    }

    #[test]
    fn a_frequency_nobody_implemented_still_fires() {
        // Never firing looks exactly like being switched off, and nobody
        // investigates a report they merely stopped receiving.
        let next = next_run("fortnightly", 1, 1, 7, at(2026, 7, 30, 9));
        assert!(next > at(2026, 7, 30, 9));
    }

    #[test]
    fn one_bad_address_does_not_take_the_others_down() {
        let (good, bad) = parse_recipients("a@b.org, not-an-address\nc@d.np; e@f.com");
        assert_eq!(good, vec!["a@b.org", "c@d.np", "e@f.com"]);
        assert_eq!(bad, vec!["not-an-address"]);
    }

    #[test]
    fn addresses_that_only_look_like_addresses_are_rejected() {
        for bad in ["@example.org", "a@b", "a b@c.org", "a@b.org."] {
            let (good, _) = parse_recipients(bad);
            assert!(good.is_empty(), "{bad} should not be accepted");
        }
        let (good, _) = parse_recipients("Treasurer@Grace-Church.org.np");
        assert_eq!(good.len(), 1);
    }
}
