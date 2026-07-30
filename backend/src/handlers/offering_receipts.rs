//! Receipts: what was given, by whom, and proof of it.
//!
//! A receipt number is allocated once and never reused. `receipt_sequences` is
//! locked with `FOR UPDATE` so two people pressing Issue at the same moment
//! cannot both take RCP-00661 — a duplicate receipt number is the kind of
//! error an auditor finds and a church cannot explain.
//!
//! Issuing is idempotent: an offering that already carries a number keeps it.
//! Reprinting is not re-issuing.

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::tenant::{Db, TenantSlug};
use axum::extract::{Path, Query};
use axum::http::header;
use axum::response::IntoResponse;
use axum::Json;

const COUNTED: &str = "('submitted','counted','approved')";

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct ReceiptRow {
    pub id: uuid::Uuid,
    pub receipt_no: String,
    pub service_date: chrono::NaiveDate,
    pub service_name: String,
    pub donor_name: String,
    pub donor_email: String,
    pub is_anonymous: bool,
    pub category_name: Option<String>,
    pub fund_name: Option<String>,
    pub payment_method: String,
    pub reference_no: String,
    pub total_amount: i64,
    pub status: String,
    /// Whether a number has been allocated. Not the same as "sent".
    pub issued: bool,
    pub sent_at: Option<chrono::NaiveDateTime>,
    pub sent_to: String,
}

#[derive(Debug, serde::Serialize)]
pub struct ReceiptPage {
    pub data: Vec<ReceiptRow>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub total_pages: i64,
    pub issued_count: i64,
    pub unissued_count: i64,
    pub sent_count: i64,
    pub total_amount: i64,
}

#[derive(Debug, serde::Deserialize, Default)]
pub struct ReceiptQuery {
    pub search: Option<String>,
    pub from: Option<String>,
    pub to: Option<String>,
    /// `issued`, `unissued`, `sent` or `unsent`.
    pub view: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

/// Bound, never interpolated — a filter must not be able to widen its own query.
const SELECT: &str = r#"
    SELECT o.id, o.receipt_no, o.service_date, o.service_name,
           CASE WHEN o.is_anonymous THEN 'Anonymous'
                ELSE COALESCE(NULLIF(btrim(o.donor_name), ''),
                     NULLIF(btrim(p.first_name || ' ' || p.last_name), ''),
                     'Unnamed donor') END AS donor_name,
           COALESCE(p.email, '') AS donor_email,
           o.is_anonymous,
           c.name AS category_name, f.name AS fund_name,
           o.payment_method, o.reference_no, o.total_amount, o.status,
           (o.receipt_no <> '') AS issued,
           r.sent_at, COALESCE(r.sent_to, '') AS sent_to
      FROM offerings o
      LEFT JOIN people p ON p.id = o.donor_person_id
      LEFT JOIN offering_categories c ON c.id = o.category_id
      LEFT JOIN funds f ON f.id = o.fund_id
      LEFT JOIN offering_receipt_sends r ON r.offering_id = o.id"#;

const FILTER: &str = r#"
    WHERE o.status IN ('submitted','counted','approved')
      AND ($1::text IS NULL OR o.service_date >= $1::date)
      AND ($2::text IS NULL OR o.service_date <= $2::date)
      AND ($3::text IS NULL OR o.receipt_no ILIKE '%' || $3 || '%'
           OR o.donor_name ILIKE '%' || $3 || '%'
           OR o.reference_no ILIKE '%' || $3 || '%')"#;

fn view_clause(view: Option<&str>) -> &'static str {
    match view {
        Some("issued") => " AND o.receipt_no <> ''",
        Some("unissued") => " AND o.receipt_no = ''",
        Some("sent") => " AND r.sent_at IS NOT NULL",
        Some("unsent") => " AND r.sent_at IS NULL",
        _ => "",
    }
}

pub async fn list(
    _auth: AuthUser,
    Db(pool): Db,
    Query(q): Query<ReceiptQuery>,
) -> Result<Json<ReceiptPage>, AppError> {
    let page = q.page.unwrap_or(1).max(1);
    let per_page = q.per_page.unwrap_or(25).clamp(1, 200);
    let view = view_clause(q.view.as_deref());

    let rows = sqlx::query_as::<_, ReceiptRow>(&format!(
        "{SELECT} {FILTER} {view} ORDER BY o.service_date DESC, o.receipt_no DESC LIMIT $4 OFFSET $5"
    ))
    .bind(&q.from)
    .bind(&q.to)
    .bind(&q.search)
    .bind(per_page)
    .bind((page - 1) * per_page)
    .fetch_all(&pool)
    .await?;

    let total: i64 = sqlx::query_scalar(&format!(
        "SELECT COUNT(*) FROM offerings o
           LEFT JOIN offering_receipt_sends r ON r.offering_id = o.id {FILTER} {view}"
    ))
    .bind(&q.from)
    .bind(&q.to)
    .bind(&q.search)
    .fetch_one(&pool)
    .await?;

    // Summary over the same window but ignoring the view, so switching to
    // "unissued" does not make the counts describe only unissued receipts.
    let (issued_count, unissued_count, sent_count, total_amount): (i64, i64, i64, i64) =
        sqlx::query_as(&format!(
            "SELECT COUNT(*) FILTER (WHERE o.receipt_no <> '')::bigint,
                    COUNT(*) FILTER (WHERE o.receipt_no = '')::bigint,
                    COUNT(*) FILTER (WHERE r.sent_at IS NOT NULL)::bigint,
                    COALESCE(SUM(o.total_amount),0)::bigint
               FROM offerings o
               LEFT JOIN offering_receipt_sends r ON r.offering_id = o.id {FILTER}"
        ))
        .bind(&q.from)
        .bind(&q.to)
        .bind(&q.search)
        .fetch_one(&pool)
        .await?;

    Ok(Json(ReceiptPage {
        data: rows,
        total,
        page,
        per_page,
        total_pages: (total + per_page - 1) / per_page,
        issued_count,
        unissued_count,
        sent_count,
        total_amount,
    }))
}

/// Allocate a receipt number, once.
///
/// `FOR UPDATE` on the sequence row is the whole guarantee: without it two
/// simultaneous requests both read 661 and both write 662, and two different
/// gifts carry the same receipt.
pub async fn issue(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut tx = pool.begin().await?;

    let existing: Option<(String, String)> =
        sqlx::query_as("SELECT receipt_no, status FROM offerings WHERE id = $1 FOR UPDATE")
            .bind(id)
            .fetch_optional(&mut *tx)
            .await?;
    let Some((receipt_no, status)) = existing else {
        return Err(AppError::not_found("Offering not found"));
    };
    if !matches!(status.as_str(), "submitted" | "counted" | "approved") {
        return Err(AppError::bad_request(
            "A receipt can only be issued for an offering that has been submitted",
        ));
    }
    if !receipt_no.is_empty() {
        // Already has one. Reprinting is not re-issuing.
        return Ok(Json(serde_json::json!({ "receipt_no": receipt_no, "issued": false })));
    }

    let (prefix, next, padding): (String, i64, i32) = sqlx::query_as(
        "SELECT prefix, next_value, padding FROM receipt_sequences
          WHERE scope = 'offering' FOR UPDATE",
    )
    .fetch_one(&mut *tx)
    .await?;

    let number = format!("{prefix}-{:0width$}", next, width = padding as usize);
    sqlx::query(
        "UPDATE receipt_sequences SET next_value = next_value + 1, updated_at = NOW()
          WHERE scope = 'offering'",
    )
    .execute(&mut *tx)
    .await?;

    sqlx::query("UPDATE offerings SET receipt_no = $2, updated_at = NOW() WHERE id = $1")
        .bind(id)
        .bind(&number)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(Json(serde_json::json!({ "receipt_no": number, "issued": true })))
}

/// Issue for everything in the window that has no number yet.
#[derive(Debug, serde::Deserialize)]
pub struct BulkIssue {
    pub ids: Vec<uuid::Uuid>,
}

pub async fn issue_bulk(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<BulkIssue>,
) -> Result<Json<serde_json::Value>, AppError> {
    if input.ids.is_empty() {
        return Err(AppError::bad_request("Nothing was selected"));
    }
    if input.ids.len() > 500 {
        return Err(AppError::bad_request("Too many at once — select 500 or fewer"));
    }

    // One at a time, through the same locked path. Slower than a single
    // UPDATE, and the only way each row gets its own number.
    let mut issued = 0;
    for id in &input.ids {
        if let Ok(Json(v)) = issue(auth.clone(), Db(pool.clone()), Path(*id)).await {
            if v.get("issued").and_then(|b| b.as_bool()) == Some(true) {
                issued += 1;
            }
        }
    }

    Ok(Json(serde_json::json!({
        "issued": issued,
        "requested": input.ids.len(),
        "skipped": input.ids.len() - issued,
    })))
}

// ---------------------------------------------------------------------------
// Printing
// ---------------------------------------------------------------------------

#[derive(Debug, sqlx::FromRow)]
struct ReceiptDetail {
    receipt_no: String,
    service_date: chrono::NaiveDate,
    service_name: String,
    donor_name: String,
    donor_email: String,
    category_name: Option<String>,
    fund_name: Option<String>,
    payment_method: String,
    reference_no: String,
    total_amount: i64,
}

async fn load(pool: &sqlx::PgPool, id: uuid::Uuid) -> Result<ReceiptDetail, AppError> {
    sqlx::query_as::<_, ReceiptDetail>(
        r#"SELECT o.receipt_no, o.service_date, o.service_name,
                  CASE WHEN o.is_anonymous THEN 'Anonymous'
                       ELSE COALESCE(NULLIF(btrim(o.donor_name),''),
                            NULLIF(btrim(p.first_name || ' ' || p.last_name), ''),
                            'Unnamed donor') END AS donor_name,
                  COALESCE(p.email,'') AS donor_email,
                  c.name AS category_name, f.name AS fund_name,
                  o.payment_method, o.reference_no, o.total_amount
             FROM offerings o
             LEFT JOIN people p ON p.id = o.donor_person_id
             LEFT JOIN offering_categories c ON c.id = o.category_id
             LEFT JOIN funds f ON f.id = o.fund_id
            WHERE o.id = $1"#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::not_found("Offering not found"))
}

fn rupees(paisa: i64) -> String {
    format!("Rs {}.{:02}", paisa / 100, (paisa % 100).abs())
}

/// The receipt, as a one-page PDF built with the report writer.
pub async fn pdf(
    _auth: AuthUser,
    Db(pool): Db,
    TenantSlug(slug): TenantSlug,
    Path(id): Path<uuid::Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let r = load(&pool, id).await?;
    if r.receipt_no.is_empty() {
        return Err(AppError::bad_request(
            "This offering has no receipt number yet — issue one first",
        ));
    }

    let church: String = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'church_name'")
        .fetch_optional(&pool)
        .await?
        .unwrap_or_else(|| slug.replace('_', " "));

    // A receipt is not a report, but it is a one-page table of labelled values,
    // and the report writer already produces correct PDFs with real font
    // metrics and a valid xref table. Reusing it beats a second PDF path that
    // would have to be kept honest separately.
    use crate::models::report::{Column, ColumnKind, Report, Stat};

    let dash = "—";
    let report = Report {
        key: "receipt".into(),
        name: format!("Receipt {}", r.receipt_no),
        description: format!("{church} — received with thanks"),
        from: r.service_date,
        to: r.service_date,
        compare_from: r.service_date,
        compare_to: r.service_date,
        stats: vec![Stat {
            label: "Amount received".into(),
            value: r.total_amount,
            kind: ColumnKind::Money,
            hint: Some(format!("On {}", r.service_date)),
            // Nothing to compare a single receipt against.
            change: None,
        }],
        columns: vec![
            Column::new("field", "Detail", ColumnKind::Text),
            Column::new("value", "", ColumnKind::Text),
        ],
        rows: vec![
            row("Receipt number", &r.receipt_no),
            row("Received from", &r.donor_name),
            row("Date", &r.service_date.to_string()),
            row("Service", &r.service_name),
            row("Category", r.category_name.as_deref().unwrap_or(dash)),
            row("Fund", r.fund_name.as_deref().unwrap_or(dash)),
            row("Method", &r.payment_method),
            row("Reference", if r.reference_no.is_empty() { dash } else { &r.reference_no }),
            row("Amount", &rupees(r.total_amount)),
        ],
        series: vec![],
        unavailable: None,
        total_rows: 9,
        totals: serde_json::json!({}),
    };

    let bytes = crate::handlers::report_pdf::render(&report);
    let filename = format!("receipt-{}.pdf", r.receipt_no.replace(['/', '\\', ' '], "-"));

    Ok((
        [
            (header::CONTENT_TYPE, "application/pdf".to_string()),
            (
                header::CONTENT_DISPOSITION,
                format!("inline; filename=\"{filename}\""),
            ),
        ],
        bytes,
    ))
}

fn row(field: &str, value: &str) -> serde_json::Value {
    serde_json::json!({ "field": field, "value": value })
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

#[derive(Debug, serde::Deserialize)]
pub struct SendInput {
    /// Overrides the donor's stored address, for the common case where the
    /// person record has none.
    pub email: Option<String>,
}

/// Email the receipt, and record that it went.
///
/// Unlike the older helpers this fails loudly when SMTP is not configured. A
/// silent no-op beside a "sent" column is a lie that only surfaces when
/// somebody asks why they never received anything.
pub async fn send(
    auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<SendInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    let r = load(&pool, id).await?;
    if r.receipt_no.is_empty() {
        return Err(AppError::bad_request(
            "This offering has no receipt number yet — issue one first",
        ));
    }

    let to = input
        .email
        .map(|e| e.trim().to_string())
        .filter(|e| !e.is_empty())
        .or_else(|| Some(r.donor_email.clone()).filter(|e| !e.is_empty()))
        .ok_or_else(|| {
            AppError::bad_request("No email address for this donor — add one, or type one here")
        })?;
    if !to.contains('@') {
        return Err(AppError::bad_request("That does not look like an email address"));
    }

    let body = format!(
        "Dear {},\n\n\
         Thank you for your gift of {} received on {}.\n\n\
         Receipt number: {}\n\
         Service: {}\n\
         Fund: {}\n\
         Method: {}\n\n\
         With gratitude,\n\
         Grace Nepal Church",
        r.donor_name,
        rupees(r.total_amount),
        r.service_date,
        r.receipt_no,
        r.service_name,
        r.fund_name.as_deref().unwrap_or("General"),
        r.payment_method,
    );

    crate::email::send_plain(&pool, std::slice::from_ref(&to), &format!("Receipt {}", r.receipt_no), &body)
        .await
        .map_err(|e| AppError::internal(format!("Could not send the receipt: {e}")))?;

    sqlx::query(
        "INSERT INTO offering_receipt_sends (offering_id, sent_to, sent_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (offering_id) DO UPDATE
            SET sent_to = EXCLUDED.sent_to, sent_by = EXCLUDED.sent_by, sent_at = NOW()",
    )
    .bind(id)
    .bind(&to)
    .bind(&auth.email)
    .execute(&pool)
    .await?;

    Ok(Json(serde_json::json!({ "sent_to": to })))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn paisa_render_as_rupees_and_paise() {
        // Money is i64 paisa everywhere and divided only here.
        assert_eq!(rupees(0), "Rs 0.00");
        assert_eq!(rupees(5), "Rs 0.05");
        assert_eq!(rupees(100), "Rs 1.00");
        assert_eq!(rupees(123_45), "Rs 123.45");
        assert_eq!(rupees(1_000_000_00), "Rs 100000000.00");
    }

    #[test]
    fn a_view_filter_cannot_carry_sql() {
        // The view is chosen from a fixed set, never built from the input.
        assert_eq!(view_clause(Some("issued")), " AND o.receipt_no <> ''");
        assert_eq!(view_clause(Some("' OR '1'='1")), "");
        assert_eq!(view_clause(None), "");
    }
}
