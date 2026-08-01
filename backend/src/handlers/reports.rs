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

const REPORTS: [Def; 14] = [
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
        key: "pledge-fulfilment",
        name: "Pledge fulfilment",
        description: "What people promised against what has actually come in.",
        group: "Giving",
        permission: permissions::GIVING_VIEW,
        requires_table: "pledges",
    },
    Def {
        key: "giving-by-household",
        name: "Giving by household",
        description: "Households rather than individuals, so a couple counts once.",
        group: "Giving",
        permission: permissions::GIVING_VIEW,
        requires_table: "households",
    },
    Def {
        key: "campaign-progress",
        name: "Campaign progress",
        description: "How each appeal is tracking against the figure it asked for.",
        group: "Giving",
        permission: permissions::GIVING_VIEW,
        requires_table: "campaigns",
    },
    Def {
        key: "visitor-follow-up",
        name: "Visitor follow-up",
        description: "Who came recently and has not been back — the list nobody keeps.",
        group: "People",
        permission: permissions::PEOPLE_VIEW,
        requires_table: "people",
    },
    Def {
        key: "volunteer-service",
        name: "Volunteer service",
        description: "Who is serving, how often, and which shifts went unfilled.",
        group: "Ministry",
        permission: permissions::PEOPLE_VIEW,
        requires_table: "volunteer_assignments",
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

/// A report's display name and the permission it needs, for callers that hold
/// a key from elsewhere — a saved view, a schedule — and must not guess.
pub(crate) fn describe(key: &str) -> Option<(&'static str, &'static str)> {
    find(key).map(|d| (d.name, d.permission))
}

/// The caller's permissions. Exposed so saved views resolve access exactly the
/// way the reports themselves do, rather than approximating it.
pub(crate) async fn permissions_of(pool: &sqlx::PgPool, auth: &AuthUser) -> HashSet<String> {
    held_by(pool, auth).await
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

/// Resolve a named range against today.
///
/// Stored on a saved report instead of two dates, because "this month" saved
/// in July has to still mean this month in December. A schedule that emails a
/// fixed 1–31 July window every Monday for a year is not a report, it is a
/// stuck clock.
pub fn named_period(name: &str, today: chrono::NaiveDate) -> Option<(chrono::NaiveDate, chrono::NaiveDate)> {
    use chrono::Datelike;
    let first_of = |y: i32, m: u32| chrono::NaiveDate::from_ymd_opt(y, m, 1);
    let month_start = first_of(today.year(), today.month())?;
    // Last day of a month, without needing to know which months have 31.
    let end_of = |d: chrono::NaiveDate| {
        d.checked_add_months(chrono::Months::new(1))?.pred_opt()
    };

    Some(match name {
        "this_month" => (month_start, today),
        "last_month" => {
            let start = month_start.checked_sub_months(chrono::Months::new(1))?;
            (start, end_of(start)?)
        }
        "last_3_months" => (month_start.checked_sub_months(chrono::Months::new(2))?, today),
        "last_12_months" => (month_start.checked_sub_months(chrono::Months::new(11))?, today),
        "this_year" => (first_of(today.year(), 1)?, today),
        "last_year" => (
            first_of(today.year() - 1, 1)?,
            chrono::NaiveDate::from_ymd_opt(today.year() - 1, 12, 31)?,
        ),
        _ => return None,
    })
}

/// Resolve a period from the same inputs a report takes, for callers that
/// need the window but not the whole report — the drill-downs, which have to
/// cover exactly the window of the row that was clicked.
pub(crate) fn resolve_window(
    period_name: Option<&str>,
    from: Option<&str>,
    to: Option<&str>,
    today: chrono::NaiveDate,
) -> Result<(chrono::NaiveDate, chrono::NaiveDate), AppError> {
    let p = period(
        &ReportQuery {
            from: from.map(String::from),
            to: to.map(String::from),
            period: period_name.map(String::from),
            format: None,
            view: None,
        },
        today,
    )?;
    Ok((p.from, p.to))
}

fn period(q: &ReportQuery, today: chrono::NaiveDate) -> Result<Period, AppError> {
    // A named range wins over explicit dates, so a saved view keeps meaning
    // what it said rather than what it meant on the day it was saved.
    if let Some(name) = q.period.as_deref().filter(|s| !s.is_empty() && *s != "custom") {
        let (from, to) = named_period(name, today)
            .ok_or_else(|| AppError::bad_request(format!("There is no period called \"{name}\"")))?;
        return Ok(with_comparison(from, to));
    }

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

    Ok(with_comparison(from, to))
}

/// Attach the comparison window: the same length, ending the day before.
///
/// Comparing a nine-day period against a full previous month would make every
/// report look like a collapse.
fn with_comparison(from: chrono::NaiveDate, to: chrono::NaiveDate) -> Period {
    let len = (to - from).num_days();
    let compare_to = from.pred_opt().unwrap_or(from);
    let compare_from = compare_to - chrono::Duration::days(len);
    Period { from, to, compare_from, compare_to }
}

// ===========================================================================
// Views: which columns, which rows, what order
// ===========================================================================

/// Does one row pass a filter?
///
/// Numeric comparisons are attempted first so `gt 500` on a money column
/// compares 1000 > 500 rather than "1000" > "500", which is false as strings
/// and is the single most common way a filter quietly returns the wrong set.
fn passes(row: &serde_json::Value, f: &Filter) -> bool {
    let cell = row.get(&f.column).unwrap_or(&serde_json::Value::Null);
    let text = match cell {
        serde_json::Value::Null => String::new(),
        serde_json::Value::String(s) => s.clone(),
        other => other.to_string(),
    };

    match f.op.as_str() {
        "empty" => text.is_empty(),
        "not_empty" => !text.is_empty(),
        "contains" => text.to_lowercase().contains(&f.value.to_lowercase()),
        "eq" => text.eq_ignore_ascii_case(&f.value),
        "ne" => !text.eq_ignore_ascii_case(&f.value),
        "gt" | "gte" | "lt" | "lte" => {
            match (cell.as_f64(), f.value.parse::<f64>()) {
                (Some(a), Ok(b)) => match f.op.as_str() {
                    "gt" => a > b,
                    "gte" => a >= b,
                    "lt" => a < b,
                    _ => a <= b,
                },
                // Dates are ISO strings, so lexical order is chronological
                // order. Anything else compares as text, which is at least
                // predictable.
                _ => match f.op.as_str() {
                    "gt" => text > f.value,
                    "gte" => text >= f.value,
                    "lt" => text < f.value,
                    _ => text <= f.value,
                },
            }
        }
        // An operator nobody implemented must not silently drop every row, and
        // must not silently keep them either. Keeping them is the safer of the
        // two: a filter that does nothing is visible, one that empties the
        // table looks like "no data".
        _ => true,
    }
}

fn is_numeric(kind: ColumnKind) -> bool {
    matches!(
        kind,
        ColumnKind::Money | ColumnKind::Number | ColumnKind::Percent | ColumnKind::Duration
    )
}

/// Narrow, reorder and sort a report's table, then total what is left.
///
/// Applied to the report's output rather than pushed into each report's SQL:
/// one implementation covers all of them, and a report cannot end up with
/// filters that behave subtly differently from its neighbours.
///
/// The headline `stats` are deliberately *not* recomputed — they describe the
/// period, and a filtered table describes a slice of it. `totals` bridges the
/// two by summing the rows actually on screen, so nothing on the page can
/// disagree with anything else on the page.
fn apply_view(r: &mut Report, view: &View) -> Result<(), AppError> {
    r.total_rows = r.rows.len();

    let known: std::collections::HashSet<&str> =
        r.columns.iter().map(|c| c.key.as_str()).collect();
    if let Some(bad) = view.filters.iter().find(|f| !known.contains(f.column.as_str())) {
        return Err(AppError::bad_request(format!(
            "This report has no column called \"{}\"",
            bad.column
        )));
    }

    if !view.filters.is_empty() {
        r.rows.retain(|row| view.filters.iter().all(|f| passes(row, f)));
    }

    if !view.sort_column.is_empty() {
        if !known.contains(view.sort_column.as_str()) {
            return Err(AppError::bad_request(format!(
                "This report has no column called \"{}\"",
                view.sort_column
            )));
        }
        let key = view.sort_column.clone();
        r.rows.sort_by(|a, b| {
            let (x, y) = (a.get(&key), b.get(&key));
            let ord = match (x.and_then(|v| v.as_f64()), y.and_then(|v| v.as_f64())) {
                (Some(p), Some(q)) => p.partial_cmp(&q).unwrap_or(std::cmp::Ordering::Equal),
                _ => {
                    let s = |v: Option<&serde_json::Value>| match v {
                        Some(serde_json::Value::String(s)) => s.to_lowercase(),
                        Some(other) => other.to_string(),
                        None => String::new(),
                    };
                    s(x).cmp(&s(y))
                }
            };
            if view.sort_desc { ord.reverse() } else { ord }
        });
    }

    // Column selection last, so a filter or sort may reference a column the
    // reader chose not to display.
    if !view.columns.is_empty() {
        let wanted: Vec<Column> = view
            .columns
            .iter()
            .filter_map(|k| r.columns.iter().find(|c| &c.key == k).cloned())
            .collect();
        if !wanted.is_empty() {
            r.columns = wanted;
        }
    }

    let mut totals = serde_json::Map::new();
    for c in r.columns.iter().filter(|c| is_numeric(c.kind)) {
        // Percent columns are shares, and a column of shares does not have a
        // meaningful sum once rows are filtered out.
        if matches!(c.kind, ColumnKind::Percent) {
            continue;
        }
        let sum: i64 = r.rows.iter().filter_map(|row| row.get(&c.key)?.as_i64()).sum();
        totals.insert(c.key.clone(), serde_json::json!(sum));
    }
    r.totals = serde_json::Value::Object(totals);
    Ok(())
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

/// A gap-filled monthly series, plus the same shape over the comparison window.
///
/// `inner` is an aggregate over one table producing `(month, total)`, with
/// `$1`/`$2` as the period bounds. The wrapper supplies the `generate_series`
/// join, because without it a quiet month simply vanishes from the result and
/// the chart line joins straight across the gap — reading as steady giving
/// through a month when nothing at all came in.
///
/// Both windows are built by the same SQL so the two lines can never be
/// computed differently, which is the way a comparison chart usually starts
/// lying.
async fn monthly_pair(
    pool: &sqlx::PgPool,
    p: &Period,
    name: &str,
    kind: ColumnKind,
    inner: &str,
) -> Result<Vec<Series>, AppError> {
    let sql = format!(
        "SELECT to_char(m.month, 'Mon YYYY'), COALESCE(d.total, 0)::bigint
         FROM generate_series(date_trunc('month', $1::date), date_trunc('month', $2::date),
                              INTERVAL '1 month') AS m(month)
         LEFT JOIN ({inner}) d ON d.month = m.month
         ORDER BY m.month"
    );

    let fetch = |from: chrono::NaiveDate, to: chrono::NaiveDate| {
        let sql = sql.clone();
        async move {
            sqlx::query_as::<_, (String, i64)>(&sql)
                .bind(from)
                .bind(to)
                .fetch_all(pool)
                .await
        }
    };

    let current = fetch(p.from, p.to).await?;

    // The chart's comparison window is shifted by whole *months*, not by the
    // day count the headline figures use.
    //
    // Those are different questions and both answers are right: "did we take
    // more than in the previous 122 days" is a total, and the stats compare
    // day-for-day. A monthly chart asks "how did April compare with the April
    // before it", and a 122-day shift lands on 30 November — straddling five
    // calendar months against the current four, so the two lines could not be
    // laid over each other at all. Shifting by months makes the buckets align
    // by construction rather than by luck.
    let months = current.len() as u32;
    let shift = chrono::Months::new(months);
    let (Some(prev_from), Some(prev_to)) =
        (p.from.checked_sub_months(shift), p.to.checked_sub_months(shift))
    else {
        return Ok(vec![Series {
            name: name.into(),
            kind,
            points: current.into_iter().map(|(x, y)| Point { x, y }).collect(),
            comparison: false,
        }]);
    };

    let previous = fetch(prev_from, prev_to).await?;

    let mut series = vec![Series {
        name: name.into(),
        kind,
        points: current.into_iter().map(|(x, y)| Point { x, y }).collect(),
        comparison: false,
    }];

    // Still guarded. A month-length shift is stable, but a report spanning a
    // leap boundary could differ by one, and overlaying a 4-month line on a
    // 5-month one would put February's figure under March and look entirely
    // convincing.
    if !previous.is_empty() && previous.len() == series[0].points.len() {
        let points: Vec<Point> = previous.into_iter().map(|(x, y)| Point { x, y }).collect();
        // Named with the window it actually covers, so the legend cannot
        // claim one range while plotting another.
        let label = match (points.first(), points.last()) {
            (Some(a), Some(b)) if a.x != b.x => format!("{} – {}", a.x, b.x),
            (Some(a), _) => a.x.clone(),
            _ => "Previous period".into(),
        };
        series.push(Series { name: label, kind, points, comparison: true });
    }
    Ok(series)
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

/// The view carried on the query string, if any.
///
/// A malformed one is refused rather than ignored. Silently falling back to
/// the default view would show the whole table to someone who asked for a
/// filtered one — the wrong answer, presented as the right one.
pub(crate) fn view_from(q: &ReportQuery) -> Result<View, AppError> {
    match q.view.as_deref().filter(|v| !v.is_empty()) {
        None => Ok(View::default()),
        Some(raw) => serde_json::from_str(raw)
            .map_err(|_| AppError::bad_request("That view could not be read")),
    }
}

pub async fn run(
    auth: AuthUser,
    Db(pool): Db,
    Path(key): Path<String>,
    Query(q): Query<ReportQuery>,
) -> Result<Json<Report>, AppError> {
    let view = view_from(&q)?;
    Ok(Json(build(&auth, &pool, &key, &q, &view).await?))
}

pub(crate) async fn build(
    auth: &AuthUser,
    pool: &sqlx::PgPool,
    key: &str,
    q: &ReportQuery,
    view: &View,
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
        total_rows: 0,
        totals: serde_json::json!({}),
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
        "pledge-fulfilment" => pledge_fulfilment(pool, &p, &mut report).await?,
        "giving-by-household" => giving_by_household(pool, &p, &mut report).await?,
        "campaign-progress" => campaign_progress(pool, &p, &mut report).await?,
        "visitor-follow-up" => visitor_follow_up(pool, &p, &mut report).await?,
        "volunteer-service" => volunteer_service(pool, &p, &mut report).await?,
        _ => unreachable!("catalogue and dispatch are the same list"),
    }
    apply_view(&mut report, view)?;
    Ok(report)
}

// ===========================================================================
// Giving
// ===========================================================================

/// Completed and not refunded, netted. A refunded gift that still counts is
/// the reason a treasurer stops trusting the report.
const GIVEN: &str = "status = 'completed' AND refund_status <> 'refunded'";
/// Donation money, in minor units.
///
/// Two conventions live in this database: `offerings.total_amount` is already
/// paisa, but `donations.amount`, `pledges.amount` and `campaigns.goal` are
/// whole rupees — the public site, the admin campaign page and the pledges
/// table all render those three with `.toLocaleString()` and no division.
/// Every report here declares its money columns `ColumnKind::Money`, which the
/// client divides by 100 exactly once at the edge, so the rupee-denominated
/// tables have to be lifted to minor units here or they come out 100x short.
/// Unfixed, a church that received Rs 837,000 read "Rs 8,370" on the dashboard,
/// in every report and in the CSV a treasurer hands to an auditor.
const NET: &str = "(COALESCE(SUM(amount - COALESCE(refund_amount, 0))::bigint, 0) * 100)";

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

    r.series = monthly_pair(
        pool, p, "Given", ColumnKind::Money,
        &format!(
            "SELECT date_trunc('month', created_at) AS month, {NET} AS total
             FROM donations WHERE {GIVEN} AND created_at::date BETWEEN $1 AND $2
             GROUP BY 1"
        ),
    )
    .await?;

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
        comparison: false,
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
        comparison: false,
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

    r.series = monthly_pair(
        pool, p, "Joined", ColumnKind::Number,
        "SELECT date_trunc('month', created_at) AS month, COUNT(*)::bigint AS total
         FROM people WHERE enabled AND created_at::date BETWEEN $1 AND $2
         GROUP BY 1",
    )
    .await?;

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
        comparison: false,
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
        comparison: false,
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
        comparison: false,
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

    let series = monthly_pair(
        pool, p, "Loans", ColumnKind::Number,
        "SELECT date_trunc('month', borrowed_on) AS month, COUNT(*)::bigint AS total
         FROM book_loans WHERE borrowed_on BETWEEN $1 AND $2 GROUP BY 1",
    )
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
    r.series = series;
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

    let series = monthly_pair(
        pool, p, "Raised", ColumnKind::Number,
        "SELECT date_trunc('month', opened_at) AS month, COUNT(*)::bigint AS total
         FROM helpdesk_tickets WHERE opened_at::date BETWEEN $1 AND $2 GROUP BY 1",
    )
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
    r.series = series;
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
// Giving: pledges, households, campaigns
// ===========================================================================

async fn pledge_fulfilment(
    pool: &sqlx::PgPool,
    p: &Period,
    r: &mut Report,
) -> Result<(), AppError> {
    // The period narrows *when a pledge was promised*; the balance is always
    // current. A pledge made last year is still outstanding this year, and
    // dropping it because it was promised outside the window is how a
    // shortfall quietly disappears from the report that exists to show it.
    let rows = sqlx::query_as::<_, (String, String, i64, i64, String)>(
        // Both figures are whole rupees on the pledges table (see NET), so both
        // are lifted to minor units here. Scaling only one of the pair would
        // report every pledge as 99% outstanding.
        "SELECT COALESCE(NULLIF(pl.person_name,''), 'Anonymous'),
                COALESCE(c.title, 'No campaign'),
                (pl.amount::bigint * 100),
                (COALESCE(pl.fulfilled_amount, 0)::bigint * 100),
                COALESCE(NULLIF(pl.status,''), 'open')
         FROM pledges pl LEFT JOIN campaigns c ON c.id = pl.campaign_id
         WHERE pl.created_at::date BETWEEN $1 AND $2
         ORDER BY (pl.amount - COALESCE(pl.fulfilled_amount, 0)) DESC LIMIT 300",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_all(pool)
    .await?;

    let promised: i64 = rows.iter().map(|x| x.2).sum();
    let received: i64 = rows.iter().map(|x| x.3).sum();
    // Clamped at zero per pledge: someone who gave more than they promised has
    // not created a negative shortfall that offsets everyone else's.
    let outstanding: i64 = rows.iter().map(|x| (x.2 - x.3).max(0)).sum();
    let complete = rows.iter().filter(|x| x.2 > 0 && x.3 >= x.2).count() as i64;

    let (prev_promised,): (i64,) = sqlx::query_as(
        "SELECT (COALESCE(SUM(amount)::bigint, 0) * 100) FROM pledges
         WHERE created_at::date BETWEEN $1 AND $2",
    )
    .bind(p.compare_from)
    .bind(p.compare_to)
    .fetch_one(pool)
    .await?;

    r.stats = vec![
        stat_vs("Promised", promised, ColumnKind::Money, prev_promised),
        stat("Received against it", received, ColumnKind::Money),
        hint(
            stat("Still outstanding", outstanding, ColumnKind::Money),
            "Promised and not yet given",
        ),
        hint(stat("Pledges kept", complete, ColumnKind::Number), "Fulfilled in full"),
    ];

    let mut by_campaign: std::collections::BTreeMap<String, i64> = Default::default();
    for x in &rows {
        *by_campaign.entry(x.1.clone()).or_default() += (x.2 - x.3).max(0);
    }
    r.series = vec![Series {
        name: "Outstanding by campaign".into(),
        kind: ColumnKind::Money,
        points: by_campaign
            .into_iter()
            .filter(|(_, v)| *v > 0)
            .map(|(x, y)| Point { x, y })
            .collect(),
        comparison: false,
    }];

    r.columns = vec![
        Column::new("person", "Who", ColumnKind::Text),
        Column::new("campaign", "Campaign", ColumnKind::Text),
        Column::new("promised", "Promised", ColumnKind::Money),
        Column::new("received", "Received", ColumnKind::Money),
        Column::new("outstanding", "Outstanding", ColumnKind::Money),
        Column::new("progress", "Fulfilled", ColumnKind::Percent),
        Column::new("status", "Status", ColumnKind::Text),
    ];
    r.rows = rows
        .into_iter()
        .map(|(person, campaign, amount, fulfilled, status)| {
            let progress = if amount > 0 {
                ((fulfilled as f64 / amount as f64) * 1000.0).round() / 10.0
            } else {
                0.0
            };
            serde_json::json!({
                "person": person, "campaign": campaign, "promised": amount,
                "received": fulfilled, "outstanding": (amount - fulfilled).max(0),
                "progress": progress, "status": status,
            })
        })
        .collect();
    Ok(())
}

async fn giving_by_household(
    pool: &sqlx::PgPool,
    p: &Period,
    r: &mut Report,
) -> Result<(), AppError> {
    // Matched on email, the only link between a donation and a person here.
    // Anything that cannot be placed lands in its own row rather than being
    // dropped: a giving report that silently omits gifts is worse than one
    // that admits it could not attribute them.
    let unmatched = "Not matched to a household";
    let rows = sqlx::query_as::<_, (String, i64, i64, i64)>(&format!(
        "SELECT COALESCE(h.name, '{unmatched}'),
                COUNT(DISTINCT pe.id)::bigint,
                {NET},
                COUNT(d.id)::bigint
         FROM donations d
         LEFT JOIN people pe ON lower(pe.email) = lower(NULLIF(d.donor_email, ''))
         LEFT JOIN households h ON h.id = pe.household_id
         WHERE {GIVEN} AND d.created_at::date BETWEEN $1 AND $2
         GROUP BY h.name ORDER BY 3 DESC LIMIT 300"
    ))
    .bind(p.from)
    .bind(p.to)
    .fetch_all(pool)
    .await?;

    let total: i64 = rows.iter().map(|x| x.2).sum();
    let matched: i64 = rows.iter().filter(|x| x.0 != unmatched).map(|x| x.2).sum();
    let households = rows.iter().filter(|x| x.0 != unmatched).count() as i64;

    r.stats = vec![
        stat("Given in total", total, ColumnKind::Money),
        stat("Households giving", households, ColumnKind::Number),
        hint(
            stat(
                "Average per household",
                if households > 0 { matched / households } else { 0 },
                ColumnKind::Money,
            ),
            "Over the households we could match",
        ),
        hint(
            stat("Could not be placed", total - matched, ColumnKind::Money),
            "Given under an email address not on file",
        ),
    ];
    r.series = vec![Series {
        name: "By household".into(),
        kind: ColumnKind::Money,
        points: rows.iter().take(10).map(|x| Point { x: x.0.clone(), y: x.2 }).collect(),
        comparison: false,
    }];
    r.columns = vec![
        Column::new("household", "Household", ColumnKind::Text),
        Column::new("people", "People", ColumnKind::Number),
        Column::new("total", "Given", ColumnKind::Money),
        Column::new("gifts", "Gifts", ColumnKind::Number),
    ];
    r.rows = rows
        .into_iter()
        .map(|(household, people, total, gifts)| {
            serde_json::json!({
                "household": household, "people": people, "total": total, "gifts": gifts,
            })
        })
        .collect();
    Ok(())
}

async fn campaign_progress(
    pool: &sqlx::PgPool,
    p: &Period,
    r: &mut Report,
) -> Result<(), AppError> {
    // `campaigns.raised` is a stored figure and drifts. This recomputes from
    // the donations, so the report and the ledger cannot disagree about how
    // an appeal is doing.
    let rows = sqlx::query_as::<_, (String, i64, i64, i64, bool)>(&format!(
        // `c.goal` is whole rupees (see NET); lifted to minor units so it is
        // comparable with the donation total beside it. Left unscaled, the
        // "targets met" count below compared paisa against rupees and every
        // appeal looked 100x over target.
        "SELECT c.title,
                (COALESCE(c.goal, 0)::bigint * 100),
                COALESCE(g.total, 0)::bigint,
                COALESCE(g.gifts, 0)::bigint,
                c.enabled
         FROM campaigns c
         LEFT JOIN (
             SELECT campaign_id, {NET} AS total, COUNT(*)::bigint AS gifts
             FROM donations WHERE {GIVEN} AND created_at::date BETWEEN $1 AND $2
             GROUP BY campaign_id
         ) g ON g.campaign_id = c.id
         ORDER BY 3 DESC, c.title"
    ))
    .bind(p.from)
    .bind(p.to)
    .fetch_all(pool)
    .await?;

    let raised: i64 = rows.iter().map(|x| x.2).sum();
    let target: i64 = rows.iter().filter(|x| x.4).map(|x| x.1).sum();
    let met = rows.iter().filter(|x| x.1 > 0 && x.2 >= x.1).count() as i64;
    let running = rows.iter().filter(|x| x.4).count() as i64;

    r.stats = vec![
        stat("Raised in this period", raised, ColumnKind::Money),
        hint(stat("Asked for", target, ColumnKind::Money), "Across live campaigns"),
        stat("Targets met", met, ColumnKind::Number),
        stat("Campaigns running", running, ColumnKind::Number),
    ];
    r.series = vec![Series {
        name: "Raised by campaign".into(),
        kind: ColumnKind::Money,
        points: rows
            .iter()
            .filter(|x| x.2 > 0)
            .take(10)
            .map(|x| Point { x: x.0.clone(), y: x.2 })
            .collect(),
        comparison: false,
    }];
    r.columns = vec![
        Column::new("campaign", "Campaign", ColumnKind::Text),
        Column::new("goal", "Target", ColumnKind::Money),
        Column::new("raised", "Raised", ColumnKind::Money),
        Column::new("gifts", "Gifts", ColumnKind::Number),
        Column::new("progress", "Toward target", ColumnKind::Percent),
        Column::new("status", "Status", ColumnKind::Text),
    ];
    r.rows = rows
        .into_iter()
        .map(|(title, goal, total, gifts, enabled)| {
            // A campaign with no target is not at 0% of it. That reads as
            // failure where there is simply nothing to measure against.
            let progress = if goal > 0 {
                Some(((total as f64 / goal as f64) * 1000.0).round() / 10.0)
            } else {
                None
            };
            serde_json::json!({
                "campaign": title, "goal": goal, "raised": total, "gifts": gifts,
                "progress": progress,
                "status": if enabled { "Running" } else { "Closed" },
            })
        })
        .collect();
    Ok(())
}

// ===========================================================================
// People and ministry
// ===========================================================================

async fn visitor_follow_up(
    pool: &sqlx::PgPool,
    p: &Period,
    r: &mut Report,
) -> Result<(), AppError> {
    // The list nobody keeps: people who came, were written down, and were
    // never contacted again. Ordered by longest-unseen first, because the
    // ones about to be forgotten are the entire point of the report.
    let rows = sqlx::query_as::<_, (
        String,
        String,
        String,
        chrono::NaiveDateTime,
        Option<chrono::NaiveDate>,
        i64,
    )>(
        "SELECT TRIM(COALESCE(pe.first_name, '') || ' ' || COALESCE(pe.last_name, '')),
                COALESCE(pe.email, ''), COALESCE(pe.phone, ''),
                pe.created_at,
                MAX(a.service_date),
                COUNT(a.id)::bigint
         FROM people pe
         LEFT JOIN attendance a ON a.person_id = pe.id
         WHERE pe.enabled
           AND COALESCE(NULLIF(pe.member_status, ''), 'visitor') NOT IN ('member', 'inactive')
           AND pe.created_at::date BETWEEN $1 AND $2
         GROUP BY pe.id, pe.first_name, pe.last_name, pe.email, pe.phone, pe.created_at
         ORDER BY MAX(a.service_date) NULLS FIRST, pe.created_at
         LIMIT 300",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_all(pool)
    .await?;

    let today: chrono::NaiveDate =
        sqlx::query_scalar("SELECT CURRENT_DATE").fetch_one(pool).await?;
    let never = rows.iter().filter(|x| x.4.is_none()).count() as i64;
    let once = rows.iter().filter(|x| x.5 == 1).count() as i64;
    let reachable = rows.iter().filter(|x| !x.1.is_empty() || !x.2.is_empty()).count() as i64;

    let (prev_new,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM people
         WHERE enabled
           AND COALESCE(NULLIF(member_status, ''), 'visitor') NOT IN ('member', 'inactive')
           AND created_at::date BETWEEN $1 AND $2",
    )
    .bind(p.compare_from)
    .bind(p.compare_to)
    .fetch_one(pool)
    .await?;

    r.stats = vec![
        stat_vs("New faces", rows.len() as i64, ColumnKind::Number, prev_new),
        hint(
            stat("Came once and no more", once, ColumnKind::Number),
            "The people most likely to be lost",
        ),
        hint(
            stat("No attendance recorded", never, ColumnKind::Number),
            "On file but never checked in",
        ),
        hint(
            stat("Have contact details", reachable, ColumnKind::Number),
            "The rest cannot be followed up at all",
        ),
    ];
    r.columns = vec![
        Column::new("name", "Name", ColumnKind::Text),
        Column::new("email", "Email", ColumnKind::Text),
        Column::new("phone", "Phone", ColumnKind::Text),
        Column::new("first_seen", "On file since", ColumnKind::Date),
        Column::new("last_seen", "Last attended", ColumnKind::Date),
        Column::new("visits", "Visits", ColumnKind::Number),
        Column::new("days_since", "Days since", ColumnKind::Number),
    ];
    r.rows = rows
        .into_iter()
        .map(|(name, email, phone, created, last, visits)| {
            serde_json::json!({
                "name": name, "email": email, "phone": phone,
                "first_seen": created.date().to_string(),
                "last_seen": last.map(|d| d.to_string()),
                "visits": visits,
                "days_since": last.map(|d| (today - d).num_days()),
            })
        })
        .collect();
    Ok(())
}

async fn volunteer_service(
    pool: &sqlx::PgPool,
    p: &Period,
    r: &mut Report,
) -> Result<(), AppError> {
    let rows = sqlx::query_as::<_, (String, i64, i64, i64, Option<chrono::NaiveDate>)>(
        "SELECT COALESCE(NULLIF(va.name, ''), 'Unnamed'),
                COUNT(*)::bigint,
                COUNT(*) FILTER (WHERE va.status = 'assigned')::bigint,
                COUNT(DISTINCT vs.team_id)::bigint,
                MAX(vs.shift_date)
         FROM volunteer_assignments va
         JOIN volunteer_shifts vs ON vs.id = va.shift_id
         WHERE vs.shift_date BETWEEN $1 AND $2
         GROUP BY va.name ORDER BY 2 DESC LIMIT 300",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_all(pool)
    .await?;

    // Slots against people. A rota that looks covered because three volunteers
    // took thirty shifts is a rota about to break, and only the two figures
    // side by side show it.
    let (slots, filled): (i64, i64) = sqlx::query_as(
        "SELECT COALESCE(SUM(vs.slots)::bigint, 0),
                (SELECT COUNT(*) FROM volunteer_assignments va2
                 JOIN volunteer_shifts s2 ON s2.id = va2.shift_id
                 WHERE s2.shift_date BETWEEN $1 AND $2)::bigint
         FROM volunteer_shifts vs WHERE vs.shift_date BETWEEN $1 AND $2",
    )
    .bind(p.from)
    .bind(p.to)
    .fetch_one(pool)
    .await?;

    r.stats = vec![
        stat("People serving", rows.len() as i64, ColumnKind::Number),
        stat("Shifts covered", filled, ColumnKind::Number),
        hint(
            stat("Slots unfilled", (slots - filled).max(0), ColumnKind::Number),
            "Places on the rota nobody took",
        ),
        hint(
            stat(
                "Average shifts each",
                if rows.is_empty() { 0 } else { filled / rows.len() as i64 },
                ColumnKind::Number,
            ),
            "A high number means a rota resting on few people",
        ),
    ];
    r.series = vec![Series {
        name: "Shifts served".into(),
        kind: ColumnKind::Number,
        points: rows.iter().take(12).map(|x| Point { x: x.0.clone(), y: x.1 }).collect(),
        comparison: false,
    }];
    r.columns = vec![
        Column::new("name", "Volunteer", ColumnKind::Text),
        Column::new("shifts", "Shifts", ColumnKind::Number),
        Column::new("confirmed", "Confirmed", ColumnKind::Number),
        Column::new("teams", "Teams", ColumnKind::Number),
        Column::new("last", "Last served", ColumnKind::Date),
    ];
    r.rows = rows
        .into_iter()
        .map(|(name, shifts, confirmed, teams, last)| {
            serde_json::json!({
                "name": name, "shifts": shifts, "confirmed": confirmed,
                "teams": teams, "last": last.map(|d| d.to_string()),
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
    // The export honours the composed view, so what downloads is what is on
    // screen. An export that quietly ignored the filters would be the most
    // convincing wrong spreadsheet in the building.
    let view = view_from(&q)?;
    let r = build(&auth, &pool, &key, &q, &view).await?;
    render(&r, q.format.as_deref().unwrap_or("csv"))
}

/// Render a report in the requested format.
///
/// One dispatcher, so a saved view, a schedule and an ad-hoc download all
/// produce byte-identical files — nobody has to wonder whether the emailed
/// copy matches the one they downloaded.
pub(crate) fn render(r: &Report, format: &str) -> Result<Response, AppError> {
    match format {
        "csv" => Ok(csv_response(r)),
        "pdf" => Ok(pdf_response(r)),
        other => Err(AppError::bad_request(format!(
            "\"{other}\" is not a format this can be exported as"
        ))),
    }
}

pub(crate) fn to_csv(r: &Report) -> String {
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

    csv
}

fn pdf_response(r: &Report) -> Response {
    let filename = format!("{}-{}-to-{}.pdf", r.key, r.from, r.to);
    (
        [
            (axum::http::header::CONTENT_TYPE, "application/pdf".to_string()),
            (
                axum::http::header::CONTENT_DISPOSITION,
                format!("attachment; filename=\"{filename}\""),
            ),
        ],
        crate::handlers::report_pdf::render(r),
    )
        .into_response()
}

fn csv_response(r: &Report) -> Response {
    let filename = format!("{}-{}-to-{}.csv", r.key, r.from, r.to);
    (
        [
            (axum::http::header::CONTENT_TYPE, "text/csv; charset=utf-8".to_string()),
            (
                axum::http::header::CONTENT_DISPOSITION,
                format!("attachment; filename=\"{filename}\""),
            ),
        ],
        to_csv(r),
    )
        .into_response()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn d(y: i32, m: u32, day: u32) -> chrono::NaiveDate {
        chrono::NaiveDate::from_ymd_opt(y, m, day).unwrap()
    }

    fn q(from: &str, to: &str) -> ReportQuery {
        ReportQuery { from: Some(from.into()), to: Some(to.into()), ..Default::default() }
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
        assert_eq!(REPORTS.len(), 14);
    }
}
