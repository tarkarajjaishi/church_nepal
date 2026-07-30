//! Drill-down: the records behind one row of a report.
//!
//! A report answers "how much". This answers "which ones". Without it, the
//! only way to check a figure that looks wrong is to open the module and
//! rebuild the filter by hand — and a figure nobody can check is a figure
//! nobody trusts for long.
//!
//! Each drill runs against the **same period and the same conditions** as the
//! report row it came from. If the eight gifts listed here do not add to the
//! Rs 1,750 in the table, one of the two is wrong, and the integration test
//! asserts they agree for every report that has a drill.
//!
//! Not every report has one: a breakdown by fund is already the detail, and a
//! monthly attendance count drills to a list of names the church may not want
//! on a screen. Reports without a drill say so rather than opening an empty
//! panel.

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::report::*;
use crate::permissions;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;

/// Which reports can be drilled, what the clicked value means, and where the
/// full picture lives.
fn drillable(key: &str) -> Option<(&'static str, &'static str)> {
    // (the column whose value identifies a row, the module page for "see all")
    match key {
        "giving-summary" => Some(("donor", "/admin/donations")),
        "giving-by-fund" => Some(("fund", "/admin/funds")),
        "offering-collections" => Some(("category", "/admin/offering-management/offerings")),
        "membership" => Some(("status", "/admin/people")),
        "worship-team" => Some(("name", "/admin/worship/team")),
        "asset-register" => Some(("category", "/admin/assets/register")),
        "library-circulation" => Some(("title", "/admin/library/catalogue")),
        "helpdesk-performance" => Some(("area", "/admin/helpdesk/tickets")),
        // Attendance rows are already one service each — the row *is* the
        // detail, and drilling would list who attended, which is a different
        // and more sensitive question than this report asks.
        _ => None,
    }
}

pub async fn drill(
    auth: AuthUser,
    Db(pool): Db,
    Path(key): Path<String>,
    Query(q): Query<DrillQuery>,
) -> Result<Json<DrillDown>, AppError> {
    let (_, permission) = crate::handlers::reports::describe(&key)
        .ok_or_else(|| AppError::not_found("There is no report by that name"))?;

    // The same gate as the report itself. A drill-down returns *more* detail
    // than the report, so it can never be the looser check.
    let held = crate::handlers::reports::permissions_of(&pool, &auth).await;
    if !permissions::allows(&held, permission) {
        return Err(AppError::forbidden(
            "You do not have access to the records behind this report",
        ));
    }

    let (_, link_base) = drillable(&key).ok_or_else(|| {
        AppError::bad_request("This report's rows are already the detail — there is nothing under them")
    })?;

    let value = q.value.clone().unwrap_or_default();
    if value.is_empty() {
        return Err(AppError::bad_request("Nothing was selected"));
    }

    let today: chrono::NaiveDate = sqlx::query_scalar("SELECT CURRENT_DATE")
        .fetch_one(&pool)
        .await?;
    let (from, to) = crate::handlers::reports::resolve_window(
        q.period.as_deref(),
        q.from.as_deref(),
        q.to.as_deref(),
        today,
    )?;

    let mut d = DrillDown {
        label: value.clone(),
        columns: Vec::new(),
        rows: Vec::new(),
        total: 0,
        link: Some(link_base.to_string()),
    };

    match key.as_str() {
        "giving-summary" => giving(&pool, &value, from, to, &mut d).await?,
        "giving-by-fund" => by_fund(&pool, &value, from, to, &mut d).await?,
        "offering-collections" => offerings(&pool, &value, from, to, &mut d).await?,
        "membership" => membership(&pool, &value, &mut d).await?,
        "worship-team" => worship(&pool, &value, from, to, &mut d).await?,
        "asset-register" => assets(&pool, &value, &mut d).await?,
        "library-circulation" => library(&pool, &value, from, to, &mut d).await?,
        "helpdesk-performance" => helpdesk(&pool, &value, from, to, &mut d).await?,
        _ => unreachable!("drillable() and this match are the same list"),
    }
    Ok(Json(d))
}

const GIVEN: &str = "status = 'completed' AND refund_status <> 'refunded'";

async fn giving(
    pool: &sqlx::PgPool,
    donor: &str,
    from: chrono::NaiveDate,
    to: chrono::NaiveDate,
    d: &mut DrillDown,
) -> Result<(), AppError> {
    // Grouped by the same expression the report groups by, so the gifts listed
    // here are exactly the ones that made the total in the table. "Anonymous"
    // in the report means a blank donor_name, and must mean the same here.
    let rows = sqlx::query_as::<_, (chrono::NaiveDateTime, i64, String, String, String)>(&format!(
        "SELECT created_at,
                (amount - COALESCE(refund_amount, 0))::bigint,
                COALESCE(NULLIF(payment_method,''), 'other'),
                COALESCE(transaction_id,''),
                COALESCE(notes,'')
         FROM donations
         WHERE {GIVEN} AND created_at::date BETWEEN $1 AND $2
           AND COALESCE(NULLIF(donor_name,''), 'Anonymous') = $3
         ORDER BY created_at DESC LIMIT 500"
    ))
    .bind(from)
    .bind(to)
    .bind(donor)
    .fetch_all(pool)
    .await?;

    d.total = rows.len() as i64;
    d.columns = vec![
        Column::new("date", "Date", ColumnKind::Date),
        Column::new("amount", "Amount", ColumnKind::Money),
        Column::new("method", "How", ColumnKind::Text),
        Column::new("reference", "Reference", ColumnKind::Text),
        Column::new("notes", "Notes", ColumnKind::Text),
    ];
    d.rows = rows
        .into_iter()
        .map(|(at, amount, method, reference, notes)| {
            serde_json::json!({
                "date": at.date().to_string(), "amount": amount,
                "method": method, "reference": reference, "notes": notes,
            })
        })
        .collect();
    Ok(())
}

async fn by_fund(
    pool: &sqlx::PgPool,
    fund: &str,
    from: chrono::NaiveDate,
    to: chrono::NaiveDate,
    d: &mut DrillDown,
) -> Result<(), AppError> {
    let rows = sqlx::query_as::<_, (chrono::NaiveDateTime, String, i64, String)>(&format!(
        "SELECT dn.created_at,
                COALESCE(NULLIF(dn.donor_name,''), 'Anonymous'),
                (dn.amount - COALESCE(dn.refund_amount, 0))::bigint,
                COALESCE(NULLIF(dn.payment_method,''), 'other')
         FROM donations dn JOIN funds f ON f.id = dn.fund_id
         WHERE {GIVEN} AND dn.created_at::date BETWEEN $1 AND $2 AND f.name = $3
         ORDER BY dn.created_at DESC LIMIT 500"
    ))
    .bind(from)
    .bind(to)
    .bind(fund)
    .fetch_all(pool)
    .await?;

    d.total = rows.len() as i64;
    d.columns = vec![
        Column::new("date", "Date", ColumnKind::Date),
        Column::new("donor", "Donor", ColumnKind::Text),
        Column::new("amount", "Amount", ColumnKind::Money),
        Column::new("method", "How", ColumnKind::Text),
    ];
    d.rows = rows
        .into_iter()
        .map(|(at, donor, amount, method)| {
            serde_json::json!({
                "date": at.date().to_string(), "donor": donor,
                "amount": amount, "method": method,
            })
        })
        .collect();
    Ok(())
}

async fn offerings(
    pool: &sqlx::PgPool,
    category: &str,
    from: chrono::NaiveDate,
    to: chrono::NaiveDate,
    d: &mut DrillDown,
) -> Result<(), AppError> {
    let rows = sqlx::query_as::<_, (chrono::NaiveDate, String, i64, String, String)>(
        "SELECT o.service_date,
                COALESCE(NULLIF(o.service_name,''), 'Service'),
                o.total_amount::bigint,
                o.status,
                COALESCE(o.receipt_no,'')
         FROM offerings o LEFT JOIN offering_categories c ON c.id = o.category_id
         WHERE o.service_date BETWEEN $1 AND $2
           AND COALESCE(c.name, 'Uncategorised') = $3
         ORDER BY o.service_date DESC LIMIT 500",
    )
    .bind(from)
    .bind(to)
    .bind(category)
    .fetch_all(pool)
    .await?;

    d.total = rows.len() as i64;
    d.columns = vec![
        Column::new("date", "Service date", ColumnKind::Date),
        Column::new("service", "Service", ColumnKind::Text),
        Column::new("amount", "Amount", ColumnKind::Money),
        Column::new("status", "Status", ColumnKind::Text),
        Column::new("receipt", "Receipt", ColumnKind::Text),
    ];
    d.rows = rows
        .into_iter()
        .map(|(date, service, amount, status, receipt)| {
            serde_json::json!({
                "date": date.to_string(), "service": service,
                "amount": amount, "status": status, "receipt": receipt,
            })
        })
        .collect();
    Ok(())
}

async fn membership(
    pool: &sqlx::PgPool,
    status: &str,
    d: &mut DrillDown,
) -> Result<(), AppError> {
    let rows = sqlx::query_as::<_, (String, String, String, Option<chrono::NaiveDateTime>)>(
        "SELECT TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')),
                COALESCE(email,''), COALESCE(phone,''), created_at
         FROM people
         WHERE enabled AND COALESCE(NULLIF(member_status,''), 'unrecorded') = $1
         ORDER BY last_name, first_name LIMIT 500",
    )
    .bind(status)
    .fetch_all(pool)
    .await?;

    d.total = rows.len() as i64;
    d.columns = vec![
        Column::new("name", "Name", ColumnKind::Text),
        Column::new("email", "Email", ColumnKind::Text),
        Column::new("phone", "Phone", ColumnKind::Text),
        Column::new("joined", "On file since", ColumnKind::Date),
    ];
    d.rows = rows
        .into_iter()
        .map(|(name, email, phone, joined)| {
            serde_json::json!({
                "name": name, "email": email, "phone": phone,
                "joined": joined.map(|j| j.date().to_string()),
            })
        })
        .collect();
    Ok(())
}

async fn worship(
    pool: &sqlx::PgPool,
    member: &str,
    from: chrono::NaiveDate,
    to: chrono::NaiveDate,
    d: &mut DrillDown,
) -> Result<(), AppError> {
    let rows = sqlx::query_as::<_, (chrono::NaiveDate, String, String, String)>(
        "SELECT s.service_date, s.name, COALESCE(r.name, 'Team'), a.status
         FROM service_assignments a
         JOIN worship_members m ON m.id = a.member_id
         JOIN worship_services s ON s.id = a.service_id
         LEFT JOIN worship_roles r ON r.id = a.role_id
         WHERE m.name = $3 AND s.service_date BETWEEN $1 AND $2
         ORDER BY s.service_date DESC LIMIT 500",
    )
    .bind(from)
    .bind(to)
    .bind(member)
    .fetch_all(pool)
    .await?;

    d.total = rows.len() as i64;
    d.columns = vec![
        Column::new("date", "Service", ColumnKind::Date),
        Column::new("service", "Name", ColumnKind::Text),
        Column::new("role", "Role", ColumnKind::Text),
        Column::new("status", "Status", ColumnKind::Text),
    ];
    d.rows = rows
        .into_iter()
        .map(|(date, service, role, status)| {
            serde_json::json!({
                "date": date.to_string(), "service": service,
                "role": role, "status": status,
            })
        })
        .collect();
    Ok(())
}

async fn assets(pool: &sqlx::PgPool, category: &str, d: &mut DrillDown) -> Result<(), AppError> {
    let rows = sqlx::query_as::<_, (String, String, i64, String, Option<chrono::NaiveDate>)>(
        "SELECT a.name, COALESCE(a.asset_code,''), a.purchase_cost::bigint,
                a.status, a.purchase_date
         FROM assets a LEFT JOIN asset_categories c ON c.id = a.category_id
         WHERE a.status NOT IN ('disposed','lost')
           AND COALESCE(c.name, 'Uncategorised') = $1
         ORDER BY a.purchase_cost DESC LIMIT 500",
    )
    .bind(category)
    .fetch_all(pool)
    .await?;

    d.total = rows.len() as i64;
    d.columns = vec![
        Column::new("name", "Asset", ColumnKind::Text),
        Column::new("code", "Code", ColumnKind::Text),
        Column::new("cost", "Purchase cost", ColumnKind::Money),
        Column::new("status", "Status", ColumnKind::Text),
        Column::new("bought", "Bought", ColumnKind::Date),
    ];
    d.rows = rows
        .into_iter()
        .map(|(name, code, cost, status, bought)| {
            serde_json::json!({
                "name": name, "code": code, "cost": cost,
                "status": status, "bought": bought.map(|b| b.to_string()),
            })
        })
        .collect();
    Ok(())
}

async fn library(
    pool: &sqlx::PgPool,
    title: &str,
    from: chrono::NaiveDate,
    to: chrono::NaiveDate,
    d: &mut DrillDown,
) -> Result<(), AppError> {
    let rows = sqlx::query_as::<_, (chrono::NaiveDate, String, String, Option<chrono::NaiveDate>, i64)>(
        "SELECT l.borrowed_on, l.borrower_name, cp.copy_code, l.returned_on,
                (l.fee_assessed - l.fee_paid)::bigint
         FROM book_loans l
         JOIN book_copies cp ON cp.id = l.copy_id
         JOIN library_books b ON b.id = cp.book_id
         WHERE b.title = $3 AND l.borrowed_on BETWEEN $1 AND $2
         ORDER BY l.borrowed_on DESC LIMIT 500",
    )
    .bind(from)
    .bind(to)
    .bind(title)
    .fetch_all(pool)
    .await?;

    d.total = rows.len() as i64;
    d.columns = vec![
        Column::new("borrowed", "Borrowed", ColumnKind::Date),
        Column::new("borrower", "Borrower", ColumnKind::Text),
        Column::new("copy", "Copy", ColumnKind::Text),
        Column::new("returned", "Returned", ColumnKind::Date),
        Column::new("owed", "Fee owed", ColumnKind::Money),
    ];
    d.rows = rows
        .into_iter()
        .map(|(borrowed, borrower, copy, returned, owed)| {
            serde_json::json!({
                "borrowed": borrowed.to_string(), "borrower": borrower, "copy": copy,
                "returned": returned.map(|r| r.to_string()), "owed": owed,
            })
        })
        .collect();
    Ok(())
}

async fn helpdesk(
    pool: &sqlx::PgPool,
    area: &str,
    from: chrono::NaiveDate,
    to: chrono::NaiveDate,
    d: &mut DrillDown,
) -> Result<(), AppError> {
    let rows = sqlx::query_as::<_, (String, String, String, String, String, chrono::NaiveDateTime)>(
        "SELECT t.ticket_code, t.subject, t.status, t.priority,
                COALESCE(NULLIF(t.assignee_name,''), 'unclaimed'), t.opened_at
         FROM helpdesk_tickets t LEFT JOIN helpdesk_categories c ON c.id = t.category_id
         WHERE t.opened_at::date BETWEEN $1 AND $2
           AND COALESCE(NULLIF(c.name,''), 'Uncategorised') = $3
         ORDER BY t.opened_at DESC LIMIT 500",
    )
    .bind(from)
    .bind(to)
    .bind(area)
    .fetch_all(pool)
    .await?;

    d.total = rows.len() as i64;
    d.columns = vec![
        Column::new("code", "Ticket", ColumnKind::Text),
        Column::new("subject", "Subject", ColumnKind::Text),
        Column::new("status", "Status", ColumnKind::Text),
        Column::new("priority", "Priority", ColumnKind::Text),
        Column::new("owner", "Owner", ColumnKind::Text),
        Column::new("opened", "Raised", ColumnKind::Date),
    ];
    d.rows = rows
        .into_iter()
        .map(|(code, subject, status, priority, owner, opened)| {
            serde_json::json!({
                "code": code, "subject": subject, "status": status,
                "priority": priority, "owner": owner,
                "opened": opened.date().to_string(),
            })
        })
        .collect();
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_drillable_report_exists_and_is_dispatched() {
        // A key in `drillable()` that the match below does not handle would
        // panic on `unreachable!` the first time somebody clicked a row.
        for key in [
            "giving-summary", "giving-by-fund", "offering-collections", "membership",
            "worship-team", "asset-register", "library-circulation", "helpdesk-performance",
        ] {
            assert!(drillable(key).is_some(), "{key} should be drillable");
            assert!(
                crate::handlers::reports::describe(key).is_some(),
                "{key} is not a real report"
            );
        }
    }

    #[test]
    fn a_report_whose_rows_are_already_the_detail_has_no_drill() {
        // Attendance rows are one service each, and drilling would list who
        // attended — a different and more sensitive question.
        assert!(drillable("attendance").is_none());
        assert!(drillable("not-a-report").is_none());
    }
}
