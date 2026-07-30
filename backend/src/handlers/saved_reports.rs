//! Saved reports.
//!
//! A saved report is a report key plus the period, columns, filters and order
//! someone chose, under a name. It stores the **question**, never the answer:
//! opening "Giving 2026" in December recomputes it from the records as they
//! are then, rather than replaying a snapshot taken in July.
//!
//! The period is a named offset (`this_month`, `last_year`, …) for the same
//! reason — a schedule that emails a fixed 1–31 July window every Monday for a
//! year is not a report, it is a stuck clock.
//!
//! **Sharing a view never shares data.** A saved view is visible to anyone who
//! could already run the report underneath it; running one re-checks that
//! report's own permission, so a librarian handed a link to "Top donors" gets
//! the same 403 they would get from the report itself.

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::report::*;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;

const UNIQUE_VIOLATION: &str = "23505";
const CHECK_VIOLATION: &str = "23514";

const OPS: [&str; 9] = ["eq", "ne", "contains", "gt", "gte", "lt", "lte", "empty", "not_empty"];
const PERIODS: [&str; 7] = [
    "this_month", "last_month", "last_3_months", "this_year",
    "last_year", "last_12_months", "custom",
];

fn map_db_error(e: sqlx::Error) -> AppError {
    match &e {
        sqlx::Error::Database(db) => match db.code().as_deref() {
            Some(UNIQUE_VIOLATION) => AppError::conflict("A saved report already has that name"),
            Some(CHECK_VIOLATION) => {
                let m = db.message();
                if m.contains("custom_has_dates") {
                    AppError::bad_request("A custom period needs both a start and an end date")
                } else if m.contains("custom_ordered") {
                    AppError::bad_request("The start date is after the end date")
                } else {
                    AppError::bad_request("That value is out of range")
                }
            }
            _ => e.into(),
        },
        _ => e.into(),
    }
}

fn parse_date(s: Option<&str>) -> Result<Option<chrono::NaiveDate>, AppError> {
    match s.filter(|v| !v.is_empty()) {
        None => Ok(None),
        Some(v) => chrono::NaiveDate::parse_from_str(v, "%Y-%m-%d")
            .map(Some)
            .map_err(|_| AppError::bad_request("Invalid date, expected YYYY-MM-DD")),
    }
}

/// Reject anything the runner cannot honour.
///
/// A filter with an operator nobody implemented would be stored, displayed in
/// the editor, and quietly do nothing — a control that looks like it works.
fn validate(input: &UpsertSavedReport) -> Result<(), AppError> {
    if input.name.trim().is_empty() {
        return Err(AppError::bad_request("A saved report needs a name"));
    }
    if crate::handlers::reports::describe(&input.report_key).is_none() {
        return Err(AppError::bad_request(format!(
            "There is no report called \"{}\"",
            input.report_key
        )));
    }
    if let Some(p) = input.period.as_deref() {
        if !PERIODS.contains(&p) {
            return Err(AppError::bad_request(format!("There is no period called \"{p}\"")));
        }
    }
    for f in input.filters.as_deref().unwrap_or_default() {
        if !OPS.contains(&f.op.as_str()) {
            return Err(AppError::bad_request(format!(
                "\"{}\" is not something a filter can do",
                f.op
            )));
        }
        if f.column.trim().is_empty() {
            return Err(AppError::bad_request("A filter needs a column"));
        }
    }
    Ok(())
}

const SELECT: &str = r#"
    SELECT s.id, s.name, s.description, s.report_key, s.period,
           s.custom_from, s.custom_to, s.columns, s.filters,
           s.sort_column, s.sort_desc, s.is_shared, s.created_by, s.updated_at,
           '' AS report_name, false AS runnable,
           (SELECT COUNT(*) FROM report_schedules sc
            WHERE sc.saved_report_id = s.id AND sc.is_active)::bigint AS schedule_count
    FROM saved_reports s
"#;

/// Fill the catalogue-derived fields and drop views the caller cannot run.
///
/// Hiding them rather than listing them greyed out: a saved report's *name*
/// leaks what someone is watching ("Anonymous gifts over Rs 50,000"), and a
/// list of things you may not open is an invitation, not information.
async fn decorate(
    pool: &sqlx::PgPool,
    auth: &AuthUser,
    mut rows: Vec<SavedReport>,
) -> Vec<SavedReport> {
    let held = crate::handlers::reports::permissions_of(pool, auth).await;
    for r in rows.iter_mut() {
        match crate::handlers::reports::describe(&r.report_key) {
            Some((name, permission)) => {
                r.report_name = name.into();
                r.runnable = crate::permissions::allows(&held, permission);
            }
            // The report was removed from the binary. Say so rather than show
            // a view that cannot open.
            None => {
                r.report_name = format!("{} (no longer available)", r.report_key);
                r.runnable = false;
            }
        }
    }
    rows.retain(|r| r.runnable);
    rows
}

pub async fn list(auth: AuthUser, Db(pool): Db) -> Result<Json<Vec<SavedReport>>, AppError> {
    let rows = sqlx::query_as::<_, SavedReport>(&format!(
        "{SELECT} WHERE s.is_shared OR s.created_by = $1 ORDER BY s.name"
    ))
    .bind(&auth.email)
    .fetch_all(&pool)
    .await?;
    Ok(Json(decorate(&pool, &auth, rows).await))
}

/// Run the report once so the columns are checked against the real thing.
///
/// Without this a filter on a column that does not exist saves happily and
/// fails later, in front of whoever opened the view — and the person who made
/// the mistake never sees it. Running it here also proves the author can
/// actually run the report they are saving a view of, so nobody can bookmark
/// their way into figures they may not see.
async fn verify_runnable(
    pool: &sqlx::PgPool,
    auth: &AuthUser,
    input: &UpsertSavedReport,
) -> Result<(), AppError> {
    let q = if input.period.as_deref() == Some("custom") {
        ReportQuery {
            from: input.custom_from.clone(),
            to: input.custom_to.clone(),
            ..Default::default()
        }
    } else {
        ReportQuery {
            period: input.period.clone().or_else(|| Some("this_month".into())),
            ..Default::default()
        }
    };
    let view = View {
        columns: input.columns.clone().unwrap_or_default(),
        filters: input.filters.clone().unwrap_or_default(),
        sort_column: input.sort_column.clone().unwrap_or_default(),
        sort_desc: input.sort_desc.unwrap_or(false),
    };
    crate::handlers::reports::build(auth, pool, &input.report_key, &q, &view).await?;
    Ok(())
}

pub async fn create(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertSavedReport>,
) -> Result<Json<serde_json::Value>, AppError> {
    validate(&input)?;
    verify_runnable(&pool, &auth, &input).await?;
    let id: uuid::Uuid = sqlx::query_scalar(
        r#"INSERT INTO saved_reports
             (name, description, report_key, period, custom_from, custom_to,
              columns, filters, sort_column, sort_desc, is_shared, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id"#,
    )
    .bind(input.name.trim())
    .bind(input.description.unwrap_or_default())
    .bind(&input.report_key)
    .bind(input.period.unwrap_or_else(|| "this_month".into()))
    .bind(parse_date(input.custom_from.as_deref())?)
    .bind(parse_date(input.custom_to.as_deref())?)
    .bind(input.columns.unwrap_or_default())
    .bind(serde_json::json!(input.filters.unwrap_or_default()))
    .bind(input.sort_column.unwrap_or_default())
    .bind(input.sort_desc.unwrap_or(false))
    .bind(input.is_shared.unwrap_or(true))
    .bind(&auth.email)
    .fetch_one(&pool)
    .await
    .map_err(map_db_error)?;
    Ok(Json(serde_json::json!({ "id": id })))
}

pub async fn update(
    auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpsertSavedReport>,
) -> Result<Json<serde_json::Value>, AppError> {
    validate(&input)?;
    verify_runnable(&pool, &auth, &input).await?;
    let res = sqlx::query(
        r#"UPDATE saved_reports SET
             name = $2, description = $3, report_key = $4, period = $5,
             custom_from = $6, custom_to = $7, columns = $8, filters = $9,
             sort_column = $10, sort_desc = $11, is_shared = $12, updated_at = NOW()
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(input.name.trim())
    .bind(input.description.unwrap_or_default())
    .bind(&input.report_key)
    .bind(input.period.unwrap_or_else(|| "this_month".into()))
    .bind(parse_date(input.custom_from.as_deref())?)
    .bind(parse_date(input.custom_to.as_deref())?)
    .bind(input.columns.unwrap_or_default())
    .bind(serde_json::json!(input.filters.unwrap_or_default()))
    .bind(input.sort_column.unwrap_or_default())
    .bind(input.sort_desc.unwrap_or(false))
    .bind(input.is_shared.unwrap_or(true))
    .execute(&pool)
    .await
    .map_err(map_db_error)?;

    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Saved report not found"));
    }
    Ok(Json(serde_json::json!({ "updated": true })))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Schedules cascade, so say how many are about to stop. Deleting a view
    // that three people receive every Monday should not be silent.
    let scheduled: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM report_schedules WHERE saved_report_id = $1 AND is_active",
    )
    .bind(id)
    .fetch_one(&pool)
    .await?;

    let res = sqlx::query("DELETE FROM saved_reports WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Saved report not found"));
    }
    Ok(Json(serde_json::json!({ "deleted": true, "schedules_stopped": scheduled })))
}

/// Load a saved report and turn it into the query and view the runner wants.
pub(crate) async fn resolve(
    pool: &sqlx::PgPool,
    id: uuid::Uuid,
) -> Result<(SavedReport, ReportQuery, View), AppError> {
    let saved = sqlx::query_as::<_, SavedReport>(&format!("{SELECT} WHERE s.id = $1"))
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::not_found("Saved report not found"))?;

    let q = if saved.period == "custom" {
        ReportQuery {
            from: saved.custom_from.map(|d| d.to_string()),
            to: saved.custom_to.map(|d| d.to_string()),
            ..Default::default()
        }
    } else {
        ReportQuery { period: Some(saved.period.clone()), ..Default::default() }
    };

    let filters: Vec<Filter> = serde_json::from_value(saved.filters.clone()).unwrap_or_default();
    let view = View {
        columns: saved.columns.clone(),
        filters,
        sort_column: saved.sort_column.clone(),
        sort_desc: saved.sort_desc,
    };
    Ok((saved, q, view))
}

pub async fn run(
    auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Report>, AppError> {
    let (saved, q, view) = resolve(&pool, id).await?;
    // Runs through the same builder as an ad-hoc report, so the saved path
    // cannot drift from the live one — including the permission check, which
    // is why sharing a view can never share data.
    let mut report =
        crate::handlers::reports::build(&auth, &pool, &saved.report_key, &q, &view).await?;
    report.name = saved.name;
    if !saved.description.is_empty() {
        report.description = saved.description;
    }
    Ok(Json(report))
}

pub async fn export(
    auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Query(fmt): Query<ExportQuery>,
) -> Result<axum::response::Response, AppError> {
    let (saved, q, view) = resolve(&pool, id).await?;
    let mut report =
        crate::handlers::reports::build(&auth, &pool, &saved.report_key, &q, &view).await?;
    report.name = saved.name;
    crate::handlers::reports::render(&report, fmt.format.as_deref().unwrap_or("csv"))
}

#[derive(serde::Deserialize, Default)]
pub struct ExportQuery {
    pub format: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn base() -> UpsertSavedReport {
        UpsertSavedReport {
            name: "Monthly giving".into(),
            description: None,
            report_key: "giving-summary".into(),
            period: Some("this_month".into()),
            custom_from: None,
            custom_to: None,
            columns: None,
            filters: None,
            sort_column: None,
            sort_desc: None,
            is_shared: None,
        }
    }

    #[test]
    fn a_view_of_a_report_that_does_not_exist_is_refused() {
        let mut v = base();
        v.report_key = "giving-everything".into();
        assert!(validate(&v).is_err());
        assert!(validate(&base()).is_ok());
    }

    #[test]
    fn a_filter_operator_nobody_implemented_is_refused() {
        // Storing it would put a control in the editor that quietly does
        // nothing, which is worse than refusing to save it.
        let mut v = base();
        v.filters = Some(vec![Filter {
            column: "total".into(),
            op: "roughly".into(),
            value: "500".into(),
        }]);
        assert!(validate(&v).is_err());

        for op in OPS {
            let mut ok = base();
            ok.filters = Some(vec![Filter {
                column: "total".into(),
                op: op.into(),
                value: "1".into(),
            }]);
            assert!(validate(&ok).is_ok(), "{op} should be accepted");
        }
    }

    #[test]
    fn an_invented_period_is_refused() {
        let mut v = base();
        v.period = Some("since_the_flood".into());
        assert!(validate(&v).is_err());
        for p in PERIODS {
            let mut ok = base();
            ok.period = Some(p.into());
            assert!(validate(&ok).is_ok(), "{p} should be accepted");
        }
    }

    #[test]
    fn a_view_needs_a_name() {
        let mut v = base();
        v.name = "   ".into();
        assert!(validate(&v).is_err());
    }
}
