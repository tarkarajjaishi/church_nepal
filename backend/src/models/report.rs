//! Reporting models.
//!
//! Every report returns the **same envelope**: a period, some headline
//! figures, typed columns, rows, and optionally a series to chart. That is the
//! whole design. Nine bespoke response shapes would mean nine bespoke React
//! components, nine CSV exporters and nine chances for one of them to format
//! money as a float — which is how a giving report ends up off by a paisa and
//! nobody trusts any of them again.
//!
//! Because the columns are typed, the UI knows a `Money` column is i64 minor
//! units and the CSV exporter knows to write it as rupees. Neither has to be
//! told per report.

use serde::{Deserialize, Serialize};

/// What a column holds. Drives both the alignment in the table and the
/// formatting in the export.
#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ColumnKind {
    Text,
    /// i64 minor units. Never a float, anywhere, ever.
    Money,
    Number,
    Date,
    /// Already a percentage, one decimal place.
    Percent,
    /// Whole hours, rendered as "3d 4h".
    Duration,
}

#[derive(Debug, Clone, Serialize)]
pub struct Column {
    pub key: String,
    pub label: String,
    pub kind: ColumnKind,
}

impl Column {
    pub fn new(key: &str, label: &str, kind: ColumnKind) -> Self {
        Self { key: key.into(), label: label.into(), kind }
    }
}

/// A headline figure above the table.
///
/// `change` is the movement against the comparison period, as a percentage.
/// It is `None` when there is nothing to compare against — a first month is
/// not a hundred percent rise, and saying so is how a report starts lying.
#[derive(Debug, Clone, Serialize)]
pub struct Stat {
    pub label: String,
    pub value: i64,
    pub kind: ColumnKind,
    pub hint: Option<String>,
    pub change: Option<f64>,
}

/// A named series for the chart, x/y pairs already ordered.
#[derive(Debug, Clone, Serialize)]
pub struct Series {
    pub name: String,
    pub kind: ColumnKind,
    pub points: Vec<Point>,
    /// True for the equal window before the report's own period, plotted
    /// behind it. A percentage tells you giving fell; the shape tells you
    /// which month it fell in, which is the question people actually ask.
    ///
    /// Aligned to the current series by index, so the two are only comparable
    /// when both cover the same number of buckets — which is why only the
    /// month-bucketed reports carry one. A per-service-date series cannot be
    /// aligned, because last quarter's Sundays are different days.
    pub comparison: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct Point {
    pub x: String,
    pub y: i64,
}

/// What a report is, before it is run. The catalogue is filtered to the
/// reports the caller may actually run, so nobody is offered one that will
/// refuse them.
#[derive(Debug, Clone, Serialize)]
pub struct ReportInfo {
    pub key: String,
    pub name: String,
    pub description: String,
    pub group: String,
    /// The permission needed to run it. Sent so the UI can explain a refusal
    /// rather than merely hiding the row.
    pub permission: String,
    /// False when the module this report reads has no tables in this database.
    /// Reported rather than silently returning zeroes — see the church
    /// dashboard, where an absent module reporting 0 was the original bug.
    pub available: bool,
}

#[derive(Debug, Serialize)]
pub struct Report {
    pub key: String,
    pub name: String,
    pub description: String,
    pub from: chrono::NaiveDate,
    pub to: chrono::NaiveDate,
    /// The period the `change` figures compare against: the same length,
    /// immediately before `from`.
    pub compare_from: chrono::NaiveDate,
    pub compare_to: chrono::NaiveDate,
    pub stats: Vec<Stat>,
    pub columns: Vec<Column>,
    pub rows: Vec<serde_json::Value>,
    pub series: Vec<Series>,
    /// Set when the report ran but the module it reads is not installed, so
    /// the empty table means "nothing here to report on", not "nothing
    /// happened".
    pub unavailable: Option<String>,
    /// How many rows the report produced before filters. `rows.len()` is what
    /// survived them — shown as "12 of 340" so a filter never looks like a
    /// small dataset.
    pub total_rows: usize,
    /// Column-key → sum, over the rows actually shown, for numeric columns.
    ///
    /// Computed from the visible rows rather than from the period, so it
    /// cannot disagree with the table above it. The headline `stats` describe
    /// the whole period; this describes what you are looking at.
    pub totals: serde_json::Value,
}

#[derive(Debug, Deserialize, Default)]
pub struct ReportQuery {
    /// YYYY-MM-DD. Defaults to the start of the current year.
    pub from: Option<String>,
    pub to: Option<String>,
    /// A named range (`this_month`, `last_year`, …) resolved against today.
    /// Takes precedence over `from`/`to` when present.
    pub period: Option<String>,
    /// `csv` or `pdf`. Only read by the export routes.
    pub format: Option<String>,
}

/// One row filter. Applied to the report's own output, so the same nine
/// operators work on every report rather than each one growing its own
/// filter clauses.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Filter {
    pub column: String,
    /// `eq`, `ne`, `contains`, `gt`, `gte`, `lt`, `lte`, `empty`, `not_empty`.
    pub op: String,
    #[serde(default)]
    pub value: String,
}

/// A saved way of looking at a report: which columns, which rows, what order.
///
/// Never a stored copy of the figures. A view saves the *question*; the answer
/// is computed from the records as they are when it is opened. Storing the
/// numbers is how a treasurer opens "Giving 2026" in December and reads July's
/// total because that is when the snapshot was taken.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct View {
    /// Column keys to show, in order. Empty means the report's own set, so a
    /// saved view does not freeze the column list against a report that later
    /// gains one.
    #[serde(default)]
    pub columns: Vec<String>,
    #[serde(default)]
    pub filters: Vec<Filter>,
    #[serde(default)]
    pub sort_column: String,
    #[serde(default)]
    pub sort_desc: bool,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct SavedReport {
    pub id: uuid::Uuid,
    pub name: String,
    pub description: String,
    pub report_key: String,
    pub period: String,
    pub custom_from: Option<chrono::NaiveDate>,
    pub custom_to: Option<chrono::NaiveDate>,
    pub columns: Vec<String>,
    pub filters: serde_json::Value,
    pub sort_column: String,
    pub sort_desc: bool,
    pub is_shared: bool,
    pub created_by: String,
    pub updated_at: chrono::NaiveDateTime,
    /// Filled from the catalogue: the report this view is of may have been
    /// removed, or may need a permission the reader does not hold.
    #[sqlx(default)]
    pub report_name: String,
    #[sqlx(default)]
    pub runnable: bool,
    #[sqlx(default)]
    pub schedule_count: i64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ReportSchedule {
    pub id: uuid::Uuid,
    pub saved_report_id: uuid::Uuid,
    pub frequency: String,
    /// 0 = Sunday. Read for weekly only.
    pub day_of_week: i32,
    /// 1..28, so February always has one. Read for monthly only.
    pub day_of_month: i32,
    pub hour: i32,
    pub recipients: String,
    pub is_active: bool,
    pub next_run_at: chrono::NaiveDateTime,
    pub last_run_at: Option<chrono::NaiveDateTime>,
    pub last_status: String,
    pub last_error: String,
    pub run_count: i32,
    pub created_by: String,
    /// From the saved report, so a list of schedules reads as sentences
    /// rather than as a column of UUIDs.
    #[sqlx(default)]
    pub report_name: String,
}

#[derive(Debug, Deserialize)]
pub struct UpsertSchedule {
    pub saved_report_id: uuid::Uuid,
    pub frequency: Option<String>,
    pub day_of_week: Option<i32>,
    pub day_of_month: Option<i32>,
    pub hour: Option<i32>,
    /// Comma or newline separated.
    pub recipients: String,
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ReportDelivery {
    pub id: uuid::Uuid,
    pub report_name: String,
    pub recipients: String,
    pub status: String,
    pub error: String,
    pub period_from: Option<chrono::NaiveDate>,
    pub period_to: Option<chrono::NaiveDate>,
    pub row_count: i32,
    pub sent_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct UpsertSavedReport {
    pub name: String,
    pub description: Option<String>,
    pub report_key: String,
    pub period: Option<String>,
    pub custom_from: Option<String>,
    pub custom_to: Option<String>,
    pub columns: Option<Vec<String>>,
    pub filters: Option<Vec<Filter>>,
    pub sort_column: Option<String>,
    pub sort_desc: Option<bool>,
    pub is_shared: Option<bool>,
}
