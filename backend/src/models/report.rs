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
}

#[derive(Debug, Deserialize, Default)]
pub struct ReportQuery {
    /// YYYY-MM-DD. Defaults to the start of the current year.
    pub from: Option<String>,
    pub to: Option<String>,
}
