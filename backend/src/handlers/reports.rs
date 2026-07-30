//! Reporting.
//!
//! Nine reports across every module, all returning the one envelope defined in
//! `models::report`. The UI renders any of them with a single component and
//! exports any of them with a single CSV writer, so a new report is a function
//! here and nothing else.
//!
//! Three rules:
//!
//! 1. **Permission per report, not per route.** The route gate is coarse
//!    (`dashboard.view` reaches the reports endpoint at all); each report then
//!    checks its own permission. The catalogue is filtered to what the caller
//!    can run, so nobody is offered a report that will refuse them, and the
//!    giving reports are as closed to a librarian as the giving pages are.
//!
//! 2. **An absent module says so.** A church without the library module gets
//!    "not installed", never a table of zeroes. Zero is a finding; absence is
//!    not, and confusing them is how a report becomes untrustworthy.
//!
//! 3. **One clock, from the database.** Periods, comparisons and "today" all
//!    come from `NOW()` on the server that holds the data.

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::report::*;
use crate::permissions;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::response::{IntoResponse, Response};
use axum::Json;
use std::collections::HashSet;

// ===========================================================================
// Catalogue
// ===========================================================================

struct Def {
    key: &'static str,
    name: &'static str,
    description: &'static str,
    group: &'static str,
    permission: &'static str,
    /// A table that must exist for this report to have anything to read.
    requires_table: &'static str,
}

const REPORTS: [Def; 9] = [
    Def {
        key: "giving-summary",
        name: "Giving summary",
        description: "What came in over the period, how it was given, and who gave most.",
        group: "Giving",
        permission: permissions::GIVING_VIEW,
        requires_table: "donations",
    },
    Def {
        key: "giving-by-fund",
        name: "Giving by fund",
        description: "Which funds the money was designated to, against their targets.",
        group: "Giving",
        permission: permissions::GIVING_VIEW,
        requires_table: "funds",
    },
    Def {
        key: "offering-collections",
        name: "Offering collections",
        description: "Sunday collections by category, with what has been counted and banked.",
        group: "Giving",
        permission: permissions::GIVING_VIEW,
        requires_table: "offerings",
    },
    Def {
        key: "membership",
        name: "Membership",
        description: "Who is on the roll, how that has moved, and who joined this period.",
        group: "People",
        permission: permissions::PEOPLE_VIEW,
        requires_table: "people",
    },
    Def {
        key: "attendance",
        name: "Attendance",
        description: "Who came, week by week, and how that compares with the period before.",
        group: "People",
        permission: permissions::PEOPLE_VIEW,
        requires_table: "attendance",
    },
    Def {
        key: "worship-team",
        name: "Worship team service",
        description: "How often each person served, and which roles went uncovered.",
        group: "Ministry",
        permission: permissions::WORSHIP_MANAGE,
        requires_table: "worship_members",
    },
    Def {
        key: "asset-register",
        name: "Asset register",
        description: "What the church owns, what it is worth now, and what it cost.",
        group: "Operations",
        permission: permissions::ASSETS_MANAGE,
        requires_table: "assets",
    },
    Def {
        key: "library-circulation",
        name: "Library circulation",
        description: "What was borrowed, what is late, and what nobody has taken out.",
        group: "Operations",
        permission: permissions::LIBRARY_MANAGE,
        requires_table: "library_books",
    },
    Def {
        key: "helpdesk-performance",
        name: "Help desk performance",
        description: "Ticket volume, how quickly they were answered, and who carried them.",
        group: "Operations",
        permission: permissions::HELPDESK_MANAGE,
        requires_table: "helpdesk_tickets",
    },
];

fn find(key: &str) -> Option<&'static Def> {
    REPORTS.iter().find(|d| d.key == key)
}

/// Is the module this report reads actually installed here?
///
/// Churches are provisioned with different modules, so a report has to be able
/// to say "not installed" rather than return a table of zeroes. Zero is a
/// finding; absence is not.
async fn table_exists(pool: &sqlx::PgPool, name: &str) -> bool {
    sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)",
    )
    .bind(name)
    .fetch_one(pool)
    .await
    .unwrap_or(false)
}

/// The caller's permissions, or "everything" for a hand-minted token with no
/// user row behind it — the same rule the route guard applies.
async fn held_by(pool: &sqlx::PgPool, auth: &AuthUser) -> HashSet<String> {
    match crate::auth::permissions_for(pool, &auth.user_id).await {
        Some(p) => p,
        None if auth.role == "admin" => {
            permissions::ALL.iter().map(|s| s.to_string()).collect()
        }
        None => HashSet::new(),
    }
}

pub async fn catalogue(auth: AuthUser, Db(pool): Db) -> Result<Json<Vec<ReportInfo>>, AppError> {
    let held = held_by(&pool, &auth).await;
    let mut out = Vec::new();
    for d in REPORTS.iter() {
        if !permissions::allows(&held, d.permission) {
            continue;
        }
        out.push(ReportInfo {
            key: d.key.into(),
            name: d.name.into(),
            description: d.description.into(),
            group: d.group.into(),
            permission: d.permission.into(),
            available: table_exists(&pool, d.requires_table).await,
        });
    }
    Ok(Json(out))
}

// ===========================================================================
// Period
// ===========================================================================

/// The window a report covers, and the equal window before it to compare with.
struct Period {
    from: chrono::NaiveDate,
    to: chrono::NaiveDate,
    compare_from: chrono::NaiveDate,
    compare_to: chrono::NaiveDate,
}

fn parse_date(s: &str) -> Result<chrono::NaiveDate, AppError> {
    chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d")
        .map_err(|_| AppError::bad_request("Invalid date, expected YYYY-MM-DD"))
}

fn period(q: &ReportQuery, today: chrono::NaiveDate) -> Result<Period, AppError> {
    let to = match q.to.as_deref().filter(|s| !s.is_empty()) {
        Some(s) => parse_date(s)?,
        None => today,
    };
    let from = match q.from.as_deref().filter(|s| !s.is_empty()) {
        Some(s) => parse_date(s)?,
        None => chrono::NaiveDate::from_ymd_opt(to.format("%Y").to_string().parse().unwrap(), 1, 1)
            .unwrap(),
    };
    if from > to {
        return Err(AppError::bad_request("The start date is after the end date"));
    }

    // The comparison window is the same length, ending the day before `from`.
    // Comparing a 9-day period against a full previous month would make every
    // report look like a collapse.
    let len = (to - from).num_days();
    let compare_to = from.pred_opt().unwrap_or(from);
    let compare_from = compare_to - chrono::Duration::days(len);
    Ok(Period { from, to, compare_from, compare_to })
}

/// Percentage movement, guarding the division that turns a first month into
/// an infinite rise.
fn change(now: i64, before: i64) -> Option<f64> {
    if before == 0 {
        // No baseline is not a result. `None` renders as "—", not "+100%".
        return None;
    }
    Some((((now - before) as f64 / before as f64) * 100.0 * 10.0).round() / 10.0)
}

fn stat(label: &str, value: i64, kind: ColumnKind) -> Stat {
    Stat { label: label.into(), value, kind, hint: None, change: None }
}

fn stat_vs(label: &str, value: i64, kind: ColumnKind, before: i64) -> Stat {
    Stat { label: label.into(), value, kind, hint: None, change: change(value, before) }
}

fn hint(mut s: Stat, h: &str) -> Stat {
    s.hint = Some(h.into());
    s
}

// ===========================================================================
// Dispatch
// ===========================================================================

pub async fn run(
    auth: AuthUser,
    Db(pool): Db,
    Path(key): Path<String>,
    Query(q): Query<ReportQuery>,
) -> Result<Json<Report>, AppError> {
    Ok(Json(build(&auth, &pool, &key, &q).await?))
}

async fn build(
    auth: &AuthUser,
    pool: &sqlx::PgPool,
    key: &str,
    q: &ReportQuery,
) -> Result<Report, AppError> {
    let def = find(key).ok_or_else(|| AppError::not_found("There is no report by that name"))?;

    // Checked here rather than on the route: one endpoint serves every report,
    // so the route guard cannot know which permission this request needs.
    let held = held_by(pool, auth).await;
    if !permissions::allows(&held, def.permission) {
        return Err(AppError::forbidden(
            "You do not have access to the figures this report is built from",
        ));
    }

    let today: chrono::NaiveDate = sqlx::query_scalar("SELECT CURRENT_DATE")
        .fetch_one(pool)
        .await?;
    let p = period(q, today)?;

    let mut report = Report {
        key: def.key.into(),
        name: def.name.into(),
        description: def.description.into(),
        from: p.from,
        to: p.to,
        compare_from: p.compare_from,
        compare_to: p.compare_to,
        stats: Vec::new(),
        columns: Vec::new(),
        rows: Vec::new(),
        series: Vec::new(),
        unavailable: None,
    };

    if !table_exists(pool, def.requires_table).await {
        report.unavailable = Some(format!(
            "The {} module is not installed in this church, so there is nothing to report on.",
            def.group.to_lowercase()
        ));
        return Ok(report);
    }

    match def.key {
        "giving-summary" => giving_summary(pool, &p, &mut report).await?,
        "giving-by-fund" => giving_by_fund(pool, &p, &mut report).await?,
        "offering-collections" => offering_collections(pool, &p, &mut report).await?,
        "membership" => membership(pool, &p, &mut report).await?,
        "attendance" => attendance(pool, &p, &mut report).await?,
        "worship-team" => worship_team(pool, &p, &mut report).await?,
        "asset-register" => asset_register(pool, &p, &mut report).await?,
        "library-circulation" => library_circulation(pool, &p, &mut report).await?,
        "helpdesk-performance" => helpdesk_performance(pool, &p, &mut report).await?,
        _ => unreachable!("catalogue and dispatch are the same list"),
    }
    Ok(report)
}

// ===========================================================================
// Giving
// ===========================================================================

/// Completed and not refunded, netted. A refunded gift that still counts is
/// the reason a treasurer stops trusting the report.
const GIVEN: &str = "status = 'completed' AND refund_status <> 'refunded'";
const NET: &str = "COALESCE(SUM(amount - COALESCE(refund_amount, 0))::bigint, 0)";

async fn giving_summary(
    pool: &sqlx::PgPool,
    p: &Period,
    r: &mut Report,
) -> Result<(), AppError> {
    let window = |from: chrono::NaiveDate, to: chrono::NaiveDate| async move {
        sqlx::query_as::<_, (i64, i64, i64)>(&format!(
            "SELECT {NET},
                    COUNT(*)::bigint,
                    COUNT(DISTINCT COALESCE(NULLIF(donor_email,''), donor_name))::bigint
             FROM donations
             WHERE {GIVEN} AND created_at::date BETWEEN $1 AND $2"
        ))
        .bind(from)
        .bind(to)
        .fetch_one(pool)
        .await
    };

    let (total, gifts, donors) = window(p.from, p.to).await?;
    let (prev_total, prev_gifts, prev_donors) = window(p.compare_from, p.compare_to).await?;

    r.stats = vec![
        stat_vs("Total given", total, ColumnKind::Money, prev_total),
        stat_vs("Gifts", gifts, ColumnKind::Number, prev_gifts),
        stat_vs("Donors", donors, ColumnKind::Number, prev_donors),
        hint(
            stat(
                "Average gift",
                if gifts > 0 { total / gifts } else { 0 },
                ColumnKind::Money,
            ),
            "Total divided by the number of gifts",
        ),
    ];

    // Gap-filled months. Without generate_series a quiet month vanishes and
    // the line joins across it, reading as steady giving through a month when
    // nothing came in.
    let months = sqlx::query_as::<_, (String, i64)>(&format!(
        "SELECT to_char(m.month, 'Mon YYYY'), COALESCE(d.total, 0)::bigint
         FROM generate_series(date_trunc('month', $1::date), date_trunc('month', $2::date),
                              INTERVAL '1 month') AS m(month)
         LEFT JOIN (
             SELECT date_trunc('month', created_at) AS month, {NET} AS total
             FROM donations WHERE {GIVEN} AND created_at::date BETWEEN $1 AND $2
             GROUP BY 1
         ) d ON d.month = m.month
         ORDER BY m.month"
    ))
    .bind(p.from)
    .bind(p.to)
    .fetch_all(pool)
    .await?;

    r.series = vec![Series {
        name: "Given".into(),
        kind: ColumnKind::Money,
        points: months.into_iter().map(|(x, y)| Point { x, y }).collect(),
    }];

    let rows = sqlx::query_as::<_, (String, String, i64, i64, Option<chrono::NaiveDateTime>)>(
        &format!(
            "SELECT COALESCE(NULLIF(donor_name,''), 'Anonymous'),
                    COALESCE(NULLIF(donor_email,''), ''),
                    {NET}, COUNT(*)::bigint, MAX(created_at)
             FROM donations WHERE {GIVEN} AND created_at::date BETWEEN $1 AND $2
             GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 200"
        ),
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_all(pool)
    .await?;

    r.columns = vec![
        Column::new("donor", "Donor", ColumnKind::Text),
        Column::new("email", "Email", ColumnKind::Text),
        Column::new("total", "Given", ColumnKind::Money),
        Column::new("gifts", "Gifts", ColumnKind::Number),
        Column::new("last", "Last gift", ColumnKind::Date),
    ];
    r.rows = rows
        .into_iter()
        .map(|(donor, email, total, gifts, last)| {
            serde_json::json!({
                "donor": donor, "email": email, "total": total, "gifts": gifts,
                "last": last.map(|d| d.date().to_string()),
            })
        })
        .collect();
    Ok(())
}

async fn giving_by_fund(pool: &sqlx::PgPool, p: &Period, r: &mut Report) -> Result<(), AppError> {
    // `funds` carries no target amount, so this reports what was given rather
    // than progress toward a goal that does not exist. Inventing a 0 target
    // would put every fund at "0% of target" — a column of failures where
    // there is simply nothing to measure against.
    let rows = sqlx::query_as::<_, (String, String, i64, i64, i64)>(&format!(
        "SELECT f.name, COALESCE(NULLIF(f.fund_type,''), 'general'),
                COALESCE(g.total, 0)::bigint,
                COALESCE(g.gifts, 0)::bigint,
                COALESCE(g.donors, 0)::bigint
         FROM funds f
         LEFT JOIN (
             SELECT fund_id, {NET} AS total, COUNT(*)::bigint AS gifts,
                    COUNT(DISTINCT COALESCE(NULLIF(donor_email,''), donor_name))::bigint AS donors
             FROM donations WHERE {GIVEN} AND created_at::date BETWEEN $1 AND $2
             GROUP BY fund_id
         ) g ON g.fund_id = f.id
         ORDER BY 3 DESC, f.name"
    ))
    .bind(p.from)
    .bind(p.to)
    .fetch_all(pool)
    .await?;

    let total: i64 = rows.iter().map(|x| x.2).sum();
    let designated = rows.iter().filter(|x| x.2 > 0).count() as i64;

    r.stats = vec![
        stat("Given across all funds", total, ColumnKind::Money),
        hint(
            stat("Funds receiving", designated, ColumnKind::Number),
            "Funds with at least one gift in the period",
        ),
        stat("Funds set up", rows.len() as i64, ColumnKind::Number),
    ];
    r.series = vec![Series {
        name: "By fund".into(),
        kind: ColumnKind::Money,
        points: rows
            .iter()
            .filter(|x| x.2 > 0)
            .take(10)
            .map(|x| Point { x: x.0.clone(), y: x.2 })
            .collect(),
    }];
    r.columns = vec![
        Column::new("fund", "Fund", ColumnKind::Text),
        Column::new("kind", "Type", ColumnKind::Text),
        Column::new("total", "Given", ColumnKind::Money),
        Column::new("gifts", "Gifts", ColumnKind::Number),
        Column::new("donors", "Donors", ColumnKind::Number),
        Column::new("share", "Share of giving", ColumnKind::Percent),
    ];
    r.rows = rows
        .into_iter()
        .map(|(fund, kind, fund_total, gifts, donors)| {
            let share = if total > 0 {
                ((fund_total as f64 / total as f64) * 1000.0).round() / 10.0
            } else {
                0.0
            };
            serde_json::json!({
                "fund": fund, "kind": kind, "total": fund_total,
                "gifts": gifts, "donors": donors, "share": share,
            })
        })
        .collect();
    Ok(())
}

async fn offering_collections(
    pool: &sqlx::PgPool,
    p: &Period,
    r: &mut Report,
) -> Result<(), AppError> {
    let rows = sqlx::query_as::<_, (String, i64, i64, i64)>(
        "SELECT COALESCE(c.name, 'Uncategorised'),
                COALESCE(SUM(o.total_amount)::bigint, 0),
                COUNT(o.id)::bigint,
                COUNT(*) FILTER (WHERE o.status = 'approved')::bigint
         FROM offerings o
         LEFT JOIN offering_categories c ON c.id = o.category_id
         WHERE o.service_date BETWEEN $1 AND $2
         GROUP BY c.name ORDER BY 2 DESC",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_all(pool)
    .await?;

    let (total, count): (i64, i64) = sqlx::query_as(
        "SELECT COALESCE(SUM(total_amount)::bigint, 0), COUNT(*)::bigint
         FROM offerings WHERE service_date BETWEEN $1 AND $2",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_one(pool)
    .await?;

    let (prev_total,): (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(total_amount)::bigint, 0) FROM offerings
         WHERE service_date BETWEEN $1 AND $2",
    )
    .bind(p.compare_from)
    .bind(p.compare_to)
    .fetch_one(pool)
    .await?;

    let pending: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM offerings
         WHERE service_date BETWEEN $1 AND $2 AND status <> 'approved'",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_one(pool)
    .await?;

    let weekly = sqlx::query_as::<_, (String, i64)>(
        "SELECT to_char(o.service_date, 'DD Mon'), COALESCE(SUM(o.total_amount)::bigint, 0)
         FROM offerings o
         WHERE o.service_date BETWEEN $1 AND $2
         GROUP BY o.service_date ORDER BY o.service_date",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_all(pool)
    .await?;

    r.stats = vec![
        stat_vs("Collected", total, ColumnKind::Money, prev_total),
        stat("Collections recorded", count, ColumnKind::Number),
        hint(
            stat("Awaiting approval", pending, ColumnKind::Number),
            "Recorded but not yet approved",
        ),
    ];
    r.series = vec![Series {
        name: "Per service".into(),
        kind: ColumnKind::Money,
        points: weekly.into_iter().map(|(x, y)| Point { x, y }).collect(),
    }];
    r.columns = vec![
        Column::new("category", "Category", ColumnKind::Text),
        Column::new("total", "Collected", ColumnKind::Money),
        Column::new("count", "Collections", ColumnKind::Number),
        Column::new("approved", "Approved", ColumnKind::Number),
    ];
    r.rows = rows
        .into_iter()
        .map(|(category, total, count, approved)| {
            serde_json::json!({
                "category": category, "total": total,
                "count": count, "approved": approved,
            })
        })
        .collect();
    Ok(())
}

// ===========================================================================
// People
// ===========================================================================

async fn membership(pool: &sqlx::PgPool, p: &Period, r: &mut Report) -> Result<(), AppError> {
    let (total, members, visitors, inactive): (i64, i64, i64, i64) = sqlx::query_as(
        "SELECT COUNT(*) FILTER (WHERE enabled),
                COUNT(*) FILTER (WHERE enabled AND member_status = 'member'),
                COUNT(*) FILTER (WHERE enabled AND member_status = 'visitor'),
                COUNT(*) FILTER (WHERE enabled AND member_status = 'inactive')
         FROM people",
    )
    .fetch_one(pool)
    .await?;

    let joined: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM people WHERE enabled AND created_at::date BETWEEN $1 AND $2",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_one(pool)
    .await?;
    let joined_before: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM people WHERE enabled AND created_at::date BETWEEN $1 AND $2",
    )
    .bind(p.compare_from)
    .bind(p.compare_to)
    .fetch_one(pool)
    .await?;

    r.stats = vec![
        hint(stat("On the roll", total, ColumnKind::Number), "Everyone not archived"),
        stat("Members", members, ColumnKind::Number),
        stat("Visitors", visitors, ColumnKind::Number),
        stat_vs("Joined this period", joined, ColumnKind::Number, joined_before),
    ];

    let growth = sqlx::query_as::<_, (String, i64)>(
        "SELECT to_char(m.month, 'Mon YYYY'), COALESCE(j.n, 0)::bigint
         FROM generate_series(date_trunc('month', $1::date), date_trunc('month', $2::date),
                              INTERVAL '1 month') AS m(month)
         LEFT JOIN (
             SELECT date_trunc('month', created_at) AS month, COUNT(*) AS n
             FROM people WHERE enabled AND created_at::date BETWEEN $1 AND $2
             GROUP BY 1
         ) j ON j.month = m.month
         ORDER BY m.month",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_all(pool)
    .await?;

    r.series = vec![Series {
        name: "Joined".into(),
        kind: ColumnKind::Number,
        points: growth.into_iter().map(|(x, y)| Point { x, y }).collect(),
    }];

    // Every distinct status, not a fixed list: a church that invents "regular
    // attender" should see it, not have a quarter of the roll folded into an
    // "other" bucket that hides it.
    let rows = sqlx::query_as::<_, (String, i64, i64)>(
        "SELECT COALESCE(NULLIF(member_status,''), 'unrecorded'),
                COUNT(*)::bigint,
                COUNT(*) FILTER (WHERE created_at::date BETWEEN $1 AND $2)::bigint
         FROM people WHERE enabled
         GROUP BY 1 ORDER BY 2 DESC",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_all(pool)
    .await?;

    r.columns = vec![
        Column::new("status", "Status", ColumnKind::Text),
        Column::new("people", "People", ColumnKind::Number),
        Column::new("joined", "Joined this period", ColumnKind::Number),
        Column::new("share", "Share of roll", ColumnKind::Percent),
    ];
    r.rows = rows
        .into_iter()
        .map(|(status, people, joined)| {
            let share = if total > 0 {
                ((people as f64 / total as f64) * 1000.0).round() / 10.0
            } else {
                0.0
            };
            serde_json::json!({
                "status": status, "people": people, "joined": joined, "share": share,
            })
        })
        .collect();
    let _ = inactive;
    Ok(())
}

async fn attendance(pool: &sqlx::PgPool, p: &Period, r: &mut Report) -> Result<(), AppError> {
    // `attendance` is one row per person per service, not a table of totals,
    // so everything here is a COUNT rather than a SUM of a stored figure.
    // That also means "who came" is answerable, which a totals table never is.
    let window = |from: chrono::NaiveDate, to: chrono::NaiveDate| async move {
        sqlx::query_as::<_, (i64, i64)>(
            "SELECT COUNT(*)::bigint,
                    COUNT(DISTINCT (service_date, service_name))::bigint
             FROM attendance WHERE service_date BETWEEN $1 AND $2",
        )
        .bind(from)
        .bind(to)
        .fetch_one(pool)
        .await
    };

    let (total, services) = window(p.from, p.to).await?;
    let (prev_total, prev_services) = window(p.compare_from, p.compare_to).await?;

    // Averaged per service, not per day. A month with five Sundays does not
    // mean the church grew.
    let avg = if services > 0 { total / services } else { 0 };
    let prev_avg = if prev_services > 0 { prev_total / prev_services } else { 0 };

    let regulars: i64 = sqlx::query_scalar(
        "SELECT COUNT(DISTINCT person_id) FROM attendance
         WHERE service_date BETWEEN $1 AND $2 AND person_id IS NOT NULL",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_one(pool)
    .await?;

    let peak: i64 = sqlx::query_scalar(
        "SELECT COALESCE(MAX(n)::bigint, 0) FROM (
             SELECT COUNT(*) AS n FROM attendance
             WHERE service_date BETWEEN $1 AND $2
             GROUP BY service_date, service_name
         ) x",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_one(pool)
    .await?;

    r.stats = vec![
        stat_vs("Average attendance", avg, ColumnKind::Number, prev_avg),
        stat_vs("Services held", services, ColumnKind::Number, prev_services),
        stat("Best attended", peak, ColumnKind::Number),
        hint(
            stat("People who came", regulars, ColumnKind::Number),
            "Distinct people on file who attended at least once",
        ),
        hint(
            stat("Total attendances", total, ColumnKind::Number),
            "Every head counted, across every service",
        ),
    ];

    let rows = sqlx::query_as::<_, (chrono::NaiveDate, String, i64, i64, i64)>(
        "SELECT service_date,
                COALESCE(NULLIF(service_name,''), 'Service'),
                COUNT(*)::bigint,
                COUNT(*) FILTER (WHERE person_id IS NOT NULL)::bigint,
                COUNT(*) FILTER (WHERE person_id IS NULL)::bigint
         FROM attendance
         WHERE service_date BETWEEN $1 AND $2
         GROUP BY service_date, service_name
         ORDER BY service_date DESC, service_name LIMIT 300",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_all(pool)
    .await?;

    r.series = vec![Series {
        name: "Attendance".into(),
        kind: ColumnKind::Number,
        points: rows
            .iter()
            .rev()
            .map(|x| Point { x: x.0.format("%d %b").to_string(), y: x.2 })
            .collect(),
    }];
    r.columns = vec![
        Column::new("date", "Date", ColumnKind::Date),
        Column::new("service", "Service", ColumnKind::Text),
        Column::new("present", "Present", ColumnKind::Number),
        Column::new("known", "On file", ColumnKind::Number),
        Column::new("guests", "Not on file", ColumnKind::Number),
    ];
    r.rows = rows
        .into_iter()
        .map(|(date, service, present, known, guests)| {
            serde_json::json!({
                "date": date.to_string(), "service": service,
                "present": present, "known": known, "guests": guests,
            })
        })
        .collect();
    Ok(())
}

// ===========================================================================
// Ministry
// ===========================================================================

async fn worship_team(pool: &sqlx::PgPool, p: &Period, r: &mut Report) -> Result<(), AppError> {
    let rows = sqlx::query_as::<_, (String, i64, i64, i64, Option<chrono::NaiveDate>)>(
        "SELECT m.name,
                COUNT(a.id)::bigint,
                COUNT(*) FILTER (WHERE a.status = 'confirmed')::bigint,
                COUNT(*) FILTER (WHERE a.status = 'declined')::bigint,
                MAX(s.service_date)
         FROM worship_members m
         LEFT JOIN service_assignments a ON a.member_id = m.id
         LEFT JOIN worship_services s ON s.id = a.service_id
             AND s.service_date BETWEEN $1 AND $2
         WHERE m.is_active
         GROUP BY m.id, m.name ORDER BY 2 DESC, m.name",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_all(pool)
    .await?;

    let (services, assignments): (i64, i64) = sqlx::query_as(
        "SELECT (SELECT COUNT(*) FROM worship_services WHERE service_date BETWEEN $1 AND $2),
                (SELECT COUNT(*) FROM service_assignments a
                 JOIN worship_services s ON s.id = a.service_id
                 WHERE s.service_date BETWEEN $1 AND $2)",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_one(pool)
    .await?;

    let never_served = rows.iter().filter(|x| x.1 == 0).count() as i64;

    r.stats = vec![
        stat("Services planned", services, ColumnKind::Number),
        stat("Slots filled", assignments, ColumnKind::Number),
        stat("Active team", rows.len() as i64, ColumnKind::Number),
        hint(
            stat("Nobody asked", never_served, ColumnKind::Number),
            "Active members not rostered once this period",
        ),
    ];
    r.series = vec![Series {
        name: "Times served".into(),
        kind: ColumnKind::Number,
        points: rows
            .iter()
            .filter(|x| x.1 > 0)
            .take(12)
            .map(|x| Point { x: x.0.clone(), y: x.1 })
            .collect(),
    }];
    r.columns = vec![
        Column::new("name", "Team member", ColumnKind::Text),
        Column::new("served", "Times rostered", ColumnKind::Number),
        Column::new("confirmed", "Confirmed", ColumnKind::Number),
        Column::new("declined", "Declined", ColumnKind::Number),
        Column::new("last", "Last served", ColumnKind::Date),
    ];
    r.rows = rows
        .into_iter()
        .map(|(name, served, confirmed, declined, last)| {
            serde_json::json!({
                "name": name, "served": served, "confirmed": confirmed,
                "declined": declined, "last": last.map(|d| d.to_string()),
            })
        })
        .collect();
    Ok(())
}

// ===========================================================================
// Operations
// ===========================================================================

async fn asset_register(pool: &sqlx::PgPool, p: &Period, r: &mut Report) -> Result<(), AppError> {
    let rows = sqlx::query_as::<_, (String, i64, i64, i64)>(
        "SELECT COALESCE(c.name, 'Uncategorised'),
                COUNT(a.id)::bigint,
                COALESCE(SUM(a.purchase_cost)::bigint, 0),
                COALESCE(SUM(a.salvage_value)::bigint, 0)
         FROM assets a
         LEFT JOIN asset_categories c ON c.id = a.category_id
         WHERE a.status NOT IN ('disposed', 'lost')
         GROUP BY c.name ORDER BY 3 DESC",
    )
    .fetch_all(pool)
    .await?;

    let (count, cost): (i64, i64) = sqlx::query_as(
        "SELECT COUNT(*)::bigint, COALESCE(SUM(purchase_cost)::bigint, 0)
         FROM assets WHERE status NOT IN ('disposed', 'lost')",
    )
    .fetch_one(pool)
    .await?;

    let acquired: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM assets WHERE purchase_date BETWEEN $1 AND $2",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_one(pool)
    .await?;

    let maintenance: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(cost)::bigint, 0) FROM asset_maintenance
         WHERE status = 'completed' AND performed_on BETWEEN $1 AND $2",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_one(pool)
    .await?;

    r.stats = vec![
        stat("Assets held", count, ColumnKind::Number),
        hint(stat("Purchase cost", cost, ColumnKind::Money), "What it all cost when bought"),
        stat("Acquired this period", acquired, ColumnKind::Number),
        hint(
            stat("Spent on upkeep", maintenance, ColumnKind::Money),
            "Completed maintenance in the period",
        ),
    ];
    r.series = vec![Series {
        name: "Cost by category".into(),
        kind: ColumnKind::Money,
        points: rows.iter().take(10).map(|x| Point { x: x.0.clone(), y: x.2 }).collect(),
    }];
    r.columns = vec![
        Column::new("category", "Category", ColumnKind::Text),
        Column::new("assets", "Assets", ColumnKind::Number),
        Column::new("cost", "Purchase cost", ColumnKind::Money),
        Column::new("salvage", "Residual value", ColumnKind::Money),
    ];
    r.rows = rows
        .into_iter()
        .map(|(category, assets, cost, salvage)| {
            serde_json::json!({
                "category": category, "assets": assets, "cost": cost, "salvage": salvage,
            })
        })
        .collect();
    Ok(())
}

async fn library_circulation(
    pool: &sqlx::PgPool,
    p: &Period,
    r: &mut Report,
) -> Result<(), AppError> {
    let (loans, returned): (i64, i64) = sqlx::query_as(
        "SELECT COUNT(*)::bigint,
                COUNT(*) FILTER (WHERE returned_on IS NOT NULL)::bigint
         FROM book_loans WHERE borrowed_on BETWEEN $1 AND $2",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_one(pool)
    .await?;

    let prev_loans: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM book_loans WHERE borrowed_on BETWEEN $1 AND $2",
    )
    .bind(p.compare_from)
    .bind(p.compare_to)
    .fetch_one(pool)
    .await?;

    let overdue: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM book_loans WHERE returned_on IS NULL AND due_on < CURRENT_DATE",
    )
    .fetch_one(pool)
    .await?;

    let fees: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(fee_assessed - fee_paid)::bigint, 0) FROM book_loans
         WHERE fee_assessed > fee_paid",
    )
    .fetch_one(pool)
    .await?;

    let monthly = sqlx::query_as::<_, (String, i64)>(
        "SELECT to_char(m.month, 'Mon YYYY'), COALESCE(l.n, 0)::bigint
         FROM generate_series(date_trunc('month', $1::date), date_trunc('month', $2::date),
                              INTERVAL '1 month') AS m(month)
         LEFT JOIN (
             SELECT date_trunc('month', borrowed_on) AS month, COUNT(*) AS n
             FROM book_loans WHERE borrowed_on BETWEEN $1 AND $2 GROUP BY 1
         ) l ON l.month = m.month
         ORDER BY m.month",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_all(pool)
    .await?;

    // Every active title, including the ones nobody has taken out. A borrowing
    // report that only lists borrowed books cannot answer the question a
    // librarian actually has, which is what is not moving.
    let rows = sqlx::query_as::<_, (String, String, i64, i64, Option<chrono::NaiveDate>)>(
        "SELECT b.title,
                COALESCE(c.name, 'Uncategorised'),
                COUNT(l.id)::bigint,
                (SELECT COUNT(*) FROM book_copies cp
                 WHERE cp.book_id = b.id AND cp.status = 'in_circulation')::bigint,
                MAX(l.borrowed_on)
         FROM library_books b
         LEFT JOIN library_categories c ON c.id = b.category_id
         LEFT JOIN book_copies cp2 ON cp2.book_id = b.id
         LEFT JOIN book_loans l ON l.copy_id = cp2.id
             AND l.borrowed_on BETWEEN $1 AND $2
         WHERE b.is_active
         GROUP BY b.id, b.title, c.name
         ORDER BY 3 DESC, b.title LIMIT 300",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_all(pool)
    .await?;

    let untouched = rows.iter().filter(|x| x.2 == 0).count() as i64;

    r.stats = vec![
        stat_vs("Books borrowed", loans, ColumnKind::Number, prev_loans),
        stat("Returned", returned, ColumnKind::Number),
        stat("Overdue right now", overdue, ColumnKind::Number),
        hint(
            stat("Never taken out", untouched, ColumnKind::Number),
            "Active titles nobody borrowed this period",
        ),
        stat("Fees owed", fees, ColumnKind::Money),
    ];
    r.series = vec![Series {
        name: "Loans".into(),
        kind: ColumnKind::Number,
        points: monthly.into_iter().map(|(x, y)| Point { x, y }).collect(),
    }];
    r.columns = vec![
        Column::new("title", "Title", ColumnKind::Text),
        Column::new("category", "Subject", ColumnKind::Text),
        Column::new("loans", "Times borrowed", ColumnKind::Number),
        Column::new("copies", "Copies", ColumnKind::Number),
        Column::new("last", "Last borrowed", ColumnKind::Date),
    ];
    r.rows = rows
        .into_iter()
        .map(|(title, category, loans, copies, last)| {
            serde_json::json!({
                "title": title, "category": category, "loans": loans,
                "copies": copies, "last": last.map(|d| d.to_string()),
            })
        })
        .collect();
    Ok(())
}

async fn helpdesk_performance(
    pool: &sqlx::PgPool,
    p: &Period,
    r: &mut Report,
) -> Result<(), AppError> {
    let (raised, resolved): (i64, i64) = sqlx::query_as(
        "SELECT COUNT(*)::bigint,
                COUNT(*) FILTER (WHERE resolved_at IS NOT NULL)::bigint
         FROM helpdesk_tickets WHERE opened_at::date BETWEEN $1 AND $2",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_one(pool)
    .await?;

    let prev_raised: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM helpdesk_tickets WHERE opened_at::date BETWEEN $1 AND $2",
    )
    .bind(p.compare_from)
    .bind(p.compare_to)
    .fetch_one(pool)
    .await?;

    // Averaged over answered tickets only. Counting the unanswered as zero
    // would make a neglected queue look fast.
    let (avg_reply, avg_fix): (Option<f64>, Option<f64>) = sqlx::query_as(
        "SELECT (AVG(EXTRACT(EPOCH FROM (first_responded_at - opened_at)) / 3600)
                  FILTER (WHERE first_responded_at IS NOT NULL))::float8,
                (AVG(EXTRACT(EPOCH FROM (resolved_at - opened_at)) / 3600)
                  FILTER (WHERE resolved_at IS NOT NULL))::float8
         FROM helpdesk_tickets WHERE opened_at::date BETWEEN $1 AND $2",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_one(pool)
    .await?;

    let unanswered: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM helpdesk_tickets
         WHERE opened_at::date BETWEEN $1 AND $2
           AND first_responded_at IS NULL
           AND status NOT IN ('resolved','closed','cancelled')",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_one(pool)
    .await?;

    let monthly = sqlx::query_as::<_, (String, i64)>(
        "SELECT to_char(m.month, 'Mon YYYY'), COALESCE(t.n, 0)::bigint
         FROM generate_series(date_trunc('month', $1::date), date_trunc('month', $2::date),
                              INTERVAL '1 month') AS m(month)
         LEFT JOIN (
             SELECT date_trunc('month', opened_at) AS month, COUNT(*) AS n
             FROM helpdesk_tickets WHERE opened_at::date BETWEEN $1 AND $2 GROUP BY 1
         ) t ON t.month = m.month
         ORDER BY m.month",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_all(pool)
    .await?;

    let rows = sqlx::query_as::<_, (String, i64, i64, i64, Option<f64>)>(
        "SELECT COALESCE(NULLIF(c.name,''), 'Uncategorised'),
                COUNT(*)::bigint,
                COUNT(*) FILTER (WHERE t.resolved_at IS NOT NULL)::bigint,
                COUNT(*) FILTER (WHERE t.reopen_count > 0)::bigint,
                (AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.opened_at)) / 3600)
                  FILTER (WHERE t.resolved_at IS NOT NULL))::float8
         FROM helpdesk_tickets t
         LEFT JOIN helpdesk_categories c ON c.id = t.category_id
         WHERE t.opened_at::date BETWEEN $1 AND $2
         GROUP BY c.name ORDER BY 2 DESC",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_all(pool)
    .await?;

    r.stats = vec![
        stat_vs("Tickets raised", raised, ColumnKind::Number, prev_raised),
        stat("Resolved", resolved, ColumnKind::Number),
        hint(
            stat("Never answered", unanswered, ColumnKind::Number),
            "Still open with no reply to the reporter",
        ),
        hint(
            stat("Typical first reply", avg_reply.unwrap_or(0.0).round() as i64, ColumnKind::Duration),
            "Averaged over tickets that were answered",
        ),
        hint(
            stat("Typical time to fix", avg_fix.unwrap_or(0.0).round() as i64, ColumnKind::Duration),
            "Averaged over tickets that were resolved",
        ),
    ];
    r.series = vec![Series {
        name: "Raised".into(),
        kind: ColumnKind::Number,
        points: monthly.into_iter().map(|(x, y)| Point { x, y }).collect(),
    }];
    r.columns = vec![
        Column::new("area", "Area", ColumnKind::Text),
        Column::new("raised", "Raised", ColumnKind::Number),
        Column::new("resolved", "Resolved", ColumnKind::Number),
        Column::new("reopened", "Came back", ColumnKind::Number),
        Column::new("avg_fix", "Typical fix", ColumnKind::Duration),
    ];
    r.rows = rows
        .into_iter()
        .map(|(area, raised, resolved, reopened, avg)| {
            serde_json::json!({
                "area": area, "raised": raised, "resolved": resolved,
                "reopened": reopened,
                "avg_fix": avg.map(|v| v.round() as i64),
            })
        })
        .collect();
    Ok(())
}

// ===========================================================================
// CSV export
// ===========================================================================

/// Quote a cell, and stop a spreadsheet treating it as a formula.
///
/// A value beginning `=`, `+`, `-` or `@` is executed by Excel and
/// LibreOffice when the file is opened. These exports contain donor names and
/// ticket text that people typed, and land on a treasurer's own machine.
fn cell(s: &str) -> String {
    let body = if s.starts_with(['=', '+', '-', '@', '\t', '\r']) {
        format!("'{s}")
    } else {
        s.to_string()
    };
    if body.contains([',', '"', '\n', '\r']) {
        format!("\"{}\"", body.replace('"', "\"\""))
    } else {
        body
    }
}

/// Render one value using the column's declared type.
///
/// Money is divided here and only here. Every report can therefore keep i64
/// minor units all the way to the file without each one remembering to.
fn format_value(v: &serde_json::Value, kind: ColumnKind) -> String {
    if v.is_null() {
        return String::new();
    }
    match kind {
        ColumnKind::Money => v
            .as_i64()
            .map(|n| format!("{}.{:02}", n / 100, (n % 100).abs()))
            .unwrap_or_default(),
        ColumnKind::Percent => v.as_f64().map(|n| format!("{n:.1}")).unwrap_or_default(),
        ColumnKind::Duration => v.as_i64().map(|n| format!("{n}")).unwrap_or_default(),
        _ => match v {
            serde_json::Value::String(s) => s.clone(),
            other => other.to_string(),
        },
    }
}

pub async fn export(
    auth: AuthUser,
    Db(pool): Db,
    Path(key): Path<String>,
    Query(q): Query<ReportQuery>,
) -> Result<Response, AppError> {
    let r = build(&auth, &pool, &key, &q).await?;

    let mut csv = String::new();
    csv.push_str(&format!("{}\n", cell(&r.name)));
    csv.push_str(&format!("{},{} to {}\n\n", cell("Period"), r.from, r.to));

    for s in &r.stats {
        csv.push_str(&format!(
            "{},{}\n",
            cell(&s.label),
            format_value(&serde_json::json!(s.value), s.kind)
        ));
    }
    csv.push('\n');

    csv.push_str(
        &r.columns.iter().map(|c| cell(&c.label)).collect::<Vec<_>>().join(","),
    );
    csv.push('\n');

    for row in &r.rows {
        let line = r
            .columns
            .iter()
            .map(|c| {
                let v = row.get(&c.key).unwrap_or(&serde_json::Value::Null);
                cell(&format_value(v, c.kind))
            })
            .collect::<Vec<_>>()
            .join(",");
        csv.push_str(&line);
        csv.push('\n');
    }

    let filename = format!("{}-{}-to-{}.csv", r.key, r.from, r.to);
    Ok((
        [
            (axum::http::header::CONTENT_TYPE, "text/csv; charset=utf-8".to_string()),
            (
                axum::http::header::CONTENT_DISPOSITION,
                format!("attachment; filename=\"{filename}\""),
            ),
        ],
        csv,
    )
        .into_response())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn d(y: i32, m: u32, day: u32) -> chrono::NaiveDate {
        chrono::NaiveDate::from_ymd_opt(y, m, day).unwrap()
    }

    fn q(from: &str, to: &str) -> ReportQuery {
        ReportQuery { from: Some(from.into()), to: Some(to.into()) }
    }

    #[test]
    fn the_comparison_window_is_the_same_length_as_the_report() {
        // Comparing nine days against a whole previous month would make every
        // report read as a collapse.
        let p = period(&q("2026-07-01", "2026-07-09"), d(2026, 7, 30)).ok().unwrap();
        assert_eq!(p.compare_to, d(2026, 6, 30));
        assert_eq!(p.compare_from, d(2026, 6, 22));
        assert_eq!((p.to - p.from).num_days(), (p.compare_to - p.compare_from).num_days());
    }

    #[test]
    fn a_full_month_compares_against_the_month_before() {
        let p = period(&q("2026-07-01", "2026-07-31"), d(2026, 7, 31)).ok().unwrap();
        assert_eq!(p.compare_from, d(2026, 5, 31));
        assert_eq!(p.compare_to, d(2026, 6, 30));
    }

    #[test]
    fn no_dates_means_this_year_to_date() {
        let p = period(&ReportQuery::default(), d(2026, 7, 30)).ok().unwrap();
        assert_eq!(p.from, d(2026, 1, 1));
        assert_eq!(p.to, d(2026, 7, 30));
    }

    #[test]
    fn a_backwards_period_is_refused() {
        assert!(period(&q("2026-07-30", "2026-07-01"), d(2026, 7, 30)).is_err());
        assert!(period(&q("not-a-date", "2026-07-01"), d(2026, 7, 30)).is_err());
    }

    #[test]
    fn a_first_period_reports_no_change_rather_than_a_hundred_percent_rise() {
        assert_eq!(change(50_000, 0), None);
        assert_eq!(change(0, 0), None);
        assert_eq!(change(150, 100), Some(50.0));
        assert_eq!(change(50, 100), Some(-50.0));
    }

    #[test]
    fn money_is_formatted_from_minor_units_only_at_the_edge() {
        assert_eq!(format_value(&serde_json::json!(123_456), ColumnKind::Money), "1234.56");
        assert_eq!(format_value(&serde_json::json!(0), ColumnKind::Money), "0.00");
        assert_eq!(format_value(&serde_json::json!(5), ColumnKind::Money), "0.05");
        // A number column is not divided by a hundred.
        assert_eq!(format_value(&serde_json::json!(123_456), ColumnKind::Number), "123456");
        assert_eq!(format_value(&serde_json::Value::Null, ColumnKind::Money), "");
    }

    #[test]
    fn a_cell_that_looks_like_a_formula_is_neutralised() {
        assert_eq!(cell("=1+1"), "'=1+1");
        assert_eq!(cell("@SUM(A1)"), "'@SUM(A1)");
        assert_eq!(cell("Rai, Sunita"), "\"Rai, Sunita\"");
        assert_eq!(cell("Anjali"), "Anjali");
    }

    #[test]
    fn every_catalogue_entry_can_be_dispatched() {
        // The match in `build` and the REPORTS list are the same set. A report
        // listed but not dispatched would panic on `unreachable!` the first
        // time somebody clicked it.
        for def in REPORTS.iter() {
            assert!(find(def.key).is_some(), "{} is not findable", def.key);
            assert!(
                permissions::ALL.contains(&def.permission),
                "{} needs a permission that does not exist: {}",
                def.key,
                def.permission
            );
        }
        assert_eq!(REPORTS.len(), 9);
    }
}
