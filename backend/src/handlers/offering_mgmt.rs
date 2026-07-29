//! Offering Management handlers.
//!
//! Two conventions worth knowing before editing:
//!
//! 1. Every query is parameter-bound. The pre-existing `offerings::list` built
//!    SQL with `format!`, which is injectable through query strings; nothing
//!    here repeats that.
//! 2. Receipt numbers and approvals run inside a transaction. Two counters
//!    submitting at the same moment must not receive the same receipt number,
//!    and `receipt_sequences` is locked with `FOR UPDATE` to guarantee it.

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::offering_mgmt::*;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;

/// Offerings that count toward money actually received. Drafts and rejected
/// rows are excluded from every dashboard figure and report total.
const COUNTED_STATUSES: &str = "('submitted','counted','approved')";

const ONLINE_METHODS: &str =
    "('card','bank_transfer','qr','esewa','khalti','connectips','fonepay','stripe','paypal')";

fn slugify(s: &str) -> String {
    s.trim()
        .to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect::<String>()
        .split('-')
        .filter(|p| !p.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}

// ===========================================================================
// Categories
// ===========================================================================

pub async fn categories_list(
    Db(pool): Db,
) -> Result<Json<Vec<OfferingCategory>>, AppError> {
    let rows = sqlx::query_as::<_, OfferingCategory>(
        "SELECT * FROM offering_categories ORDER BY sort_order ASC, name ASC",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn categories_create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertOfferingCategory>,
) -> Result<Json<OfferingCategory>, AppError> {
    if input.name.trim().is_empty() {
        return Err(AppError::bad_request("Category name is required"));
    }
    let slug = input
        .slug
        .as_deref()
        .map(slugify)
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| slugify(&input.name));

    let row = sqlx::query_as::<_, OfferingCategory>(
        r#"INSERT INTO offering_categories
             (name, slug, description, color, icon, default_fund_id, is_active, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           RETURNING *"#,
    )
    .bind(input.name.trim())
    .bind(&slug)
    .bind(input.description.unwrap_or_default())
    .bind(input.color.unwrap_or_else(|| "#0b3c5d".into()))
    .bind(input.icon.unwrap_or_else(|| "HandCoins".into()))
    .bind(input.default_fund_id)
    .bind(input.is_active.unwrap_or(true))
    .bind(input.sort_order.unwrap_or(0))
    .fetch_one(&pool)
    .await
    .map_err(|e| match e {
        sqlx::Error::Database(ref db) if db.code().as_deref() == Some("23505") => {
            AppError::conflict("A category with that name already exists")
        }
        other => other.into(),
    })?;
    Ok(Json(row))
}

pub async fn categories_update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpsertOfferingCategory>,
) -> Result<Json<OfferingCategory>, AppError> {
    let row = sqlx::query_as::<_, OfferingCategory>(
        r#"UPDATE offering_categories SET
             name = $2,
             description = COALESCE($3, description),
             color = COALESCE($4, color),
             icon = COALESCE($5, icon),
             default_fund_id = $6,
             is_active = COALESCE($7, is_active),
             sort_order = COALESCE($8, sort_order),
             updated_at = NOW()
           WHERE id = $1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.name.trim())
    .bind(input.description)
    .bind(input.color)
    .bind(input.icon)
    .bind(input.default_fund_id)
    .bind(input.is_active)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Category not found"))?;
    Ok(Json(row))
}

pub async fn categories_delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Deactivate instead of deleting when offerings reference the category:
    // removing it would orphan historical receipts.
    let in_use: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM offerings WHERE category_id = $1")
            .bind(id)
            .fetch_one(&pool)
            .await?;

    if in_use > 0 {
        sqlx::query("UPDATE offering_categories SET is_active = false, updated_at = NOW() WHERE id = $1")
            .bind(id)
            .execute(&pool)
            .await?;
        return Ok(Json(serde_json::json!({
            "deactivated": true,
            "reason": format!("{in_use} offering(s) use this category, so it was deactivated rather than deleted")
        })));
    }

    let res = sqlx::query("DELETE FROM offering_categories WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Category not found"));
    }
    Ok(Json(serde_json::json!({ "deleted": true })))
}

// ===========================================================================
// Bank accounts
// ===========================================================================

pub async fn bank_accounts_list(Db(pool): Db) -> Result<Json<Vec<BankAccount>>, AppError> {
    let rows = sqlx::query_as::<_, BankAccount>(
        "SELECT * FROM bank_accounts ORDER BY is_active DESC, bank_name ASC",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn bank_accounts_create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertBankAccount>,
) -> Result<Json<BankAccount>, AppError> {
    if input.bank_name.trim().is_empty() || input.account_number.trim().is_empty() {
        return Err(AppError::bad_request(
            "Bank name and account number are required",
        ));
    }
    let opening = input.opening_balance.unwrap_or(0);
    let row = sqlx::query_as::<_, BankAccount>(
        r#"INSERT INTO bank_accounts
             (bank_name, account_name, account_number, branch, swift_code, currency,
              opening_balance, current_balance, is_active, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9) RETURNING *"#,
    )
    .bind(input.bank_name.trim())
    .bind(input.account_name.unwrap_or_default())
    .bind(input.account_number.trim())
    .bind(input.branch.unwrap_or_default())
    .bind(input.swift_code.unwrap_or_default())
    .bind(input.currency.unwrap_or_else(|| "NPR".into()))
    .bind(opening)
    .bind(input.is_active.unwrap_or(true))
    .bind(input.notes.unwrap_or_default())
    .fetch_one(&pool)
    .await
    .map_err(|e| match e {
        sqlx::Error::Database(ref db) if db.code().as_deref() == Some("23505") => {
            AppError::conflict("That bank account number already exists")
        }
        other => other.into(),
    })?;
    Ok(Json(row))
}

pub async fn bank_accounts_update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpsertBankAccount>,
) -> Result<Json<BankAccount>, AppError> {
    let row = sqlx::query_as::<_, BankAccount>(
        r#"UPDATE bank_accounts SET
             bank_name = $2, account_name = COALESCE($3, account_name),
             account_number = $4, branch = COALESCE($5, branch),
             swift_code = COALESCE($6, swift_code), currency = COALESCE($7, currency),
             opening_balance = COALESCE($8, opening_balance),
             is_active = COALESCE($9, is_active), notes = COALESCE($10, notes),
             updated_at = NOW()
           WHERE id = $1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.bank_name.trim())
    .bind(input.account_name)
    .bind(input.account_number.trim())
    .bind(input.branch)
    .bind(input.swift_code)
    .bind(input.currency)
    .bind(input.opening_balance)
    .bind(input.is_active)
    .bind(input.notes)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Bank account not found"))?;
    Ok(Json(row))
}

// ===========================================================================
// Offerings — filtered, paginated table
// ===========================================================================

/// Column allowlist for sorting. User input never reaches the ORDER BY clause
/// directly; anything unrecognised falls back to the default.
fn sort_column(sort: Option<&str>) -> &'static str {
    match sort {
        Some("amount") => "o.total_amount",
        Some("receipt") => "o.receipt_no",
        Some("status") => "o.status",
        Some("donor") => "donor_display",
        Some("category") => "c.name",
        Some("created") => "o.created_at",
        _ => "o.service_date",
    }
}

pub async fn offerings_page(
    Db(pool): Db,
    Query(f): Query<OfferingFilter>,
) -> Result<Json<OfferingPage>, AppError> {
    let page = f.page.unwrap_or(1).max(1);
    let per_page = f.per_page.unwrap_or(25).clamp(1, 200);
    let offset = (page - 1) * per_page;

    // One WHERE clause shared by the count, the sum and the page query, so the
    // three can never disagree about what "filtered" means.
    let where_sql = r#"
        WHERE ($1::date IS NULL OR o.service_date >= $1)
          AND ($2::date IS NULL OR o.service_date <= $2)
          AND ($3::uuid IS NULL OR o.category_id = $3)
          AND ($4::uuid IS NULL OR o.fund_id = $4)
          AND ($5::text IS NULL OR o.service_name = $5)
          AND ($6::text IS NULL OR o.payment_method = $6)
          AND ($7::text IS NULL OR o.status = $7)
          AND ($8::bigint IS NULL OR o.total_amount >= $8)
          AND ($9::bigint IS NULL OR o.total_amount <= $9)
          AND ($10::text IS NULL OR (
                COALESCE(NULLIF(o.donor_name,''), TRIM(p.first_name || ' ' || p.last_name)) ILIKE '%' || $10 || '%'))
          AND ($11::text IS NULL OR (
                o.receipt_no ILIKE '%' || $11 || '%'
             OR o.reference_no ILIKE '%' || $11 || '%'
             OR o.service_name ILIKE '%' || $11 || '%'
             OR o.notes ILIKE '%' || $11 || '%'
             OR COALESCE(NULLIF(o.donor_name,''), TRIM(p.first_name || ' ' || p.last_name)) ILIKE '%' || $11 || '%'))
    "#;

    let from_sql = r#"
        FROM offerings o
        LEFT JOIN offering_categories c ON c.id = o.category_id
        LEFT JOIN funds fu ON fu.id = o.fund_id
        LEFT JOIN people p ON p.id = o.donor_person_id
    "#;

    let from_date = f
        .from_date
        .as_deref()
        .and_then(|s| chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d").ok());
    let to_date = f
        .to_date
        .as_deref()
        .and_then(|s| chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d").ok());

    macro_rules! bind_filters {
        ($q:expr) => {
            $q.bind(from_date)
                .bind(to_date)
                .bind(f.category_id)
                .bind(f.fund_id)
                .bind(f.service_name.as_deref())
                .bind(f.payment_method.as_deref())
                .bind(f.status.as_deref())
                .bind(f.min_amount)
                .bind(f.max_amount)
                .bind(f.donor.as_deref())
                .bind(f.search.as_deref())
        };
    }

    let (total, filtered_total): (i64, i64) = bind_filters!(sqlx::query_as::<_, (i64, i64)>(
        &format!("SELECT COUNT(*), COALESCE(SUM(o.total_amount),0)::bigint {from_sql} {where_sql}")
    ))
    .fetch_one(&pool)
    .await?;

    let dir = if f.dir.as_deref() == Some("asc") { "ASC" } else { "DESC" };
    let order = sort_column(f.sort.as_deref());

    let sql = format!(
        r#"SELECT o.id, o.receipt_no, o.service_date, o.service_time, o.service_name,
                  o.offering_type, o.category_id, c.name AS category_name,
                  c.color AS category_color, o.fund_id, fu.name AS fund_name,
                  o.donor_person_id,
                  COALESCE(NULLIF(o.donor_name,''), TRIM(COALESCE(p.first_name,'') || ' ' || COALESCE(p.last_name,'')), '') AS donor_display,
                  COALESCE(NULLIF(o.donor_name,''), TRIM(COALESCE(p.first_name,'') || ' ' || COALESCE(p.last_name,'')), '') AS donor_name,
                  o.is_anonymous, o.giver_type, o.total_amount, o.currency,
                  o.payment_method, o.reference_no, o.bank_account_id, o.status,
                  o.entered_by, o.approved_by, o.approved_at, o.notes, o.created_at
           {from_sql} {where_sql}
           ORDER BY {order} {dir}, o.created_at DESC
           LIMIT $12 OFFSET $13"#
    );

    let data = bind_filters!(sqlx::query_as::<_, OfferingRow>(&sql))
        .bind(per_page)
        .bind(offset)
        .fetch_all(&pool)
        .await?;

    Ok(Json(OfferingPage {
        data,
        total,
        page,
        per_page,
        total_pages: (total + per_page - 1) / per_page,
        filtered_total,
    }))
}

/// Claim the next receipt number. Must be called inside a transaction; the row
/// lock is what makes concurrent submissions safe.
async fn next_receipt_no(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
) -> Result<String, AppError> {
    let row: Option<(String, i64, i32)> = sqlx::query_as(
        "SELECT prefix, next_value, padding FROM receipt_sequences WHERE scope = 'offering' FOR UPDATE",
    )
    .fetch_optional(&mut **tx)
    .await?;

    let (prefix, value, padding) = row.ok_or_else(|| {
        AppError::internal("Receipt sequence 'offering' is missing — run migration 061")
    })?;

    sqlx::query("UPDATE receipt_sequences SET next_value = next_value + 1, updated_at = NOW() WHERE scope = 'offering'")
        .execute(&mut **tx)
        .await?;

    let year = chrono::Utc::now().format("%Y");
    Ok(format!(
        "{prefix}-{year}-{:0width$}",
        value,
        width = padding as usize
    ))
}

/// Apply the category's allocation rules to an offering.
///
/// Percentages are basis points, and the last fund absorbs any rounding
/// remainder so the allocations always sum to the offering exactly — a split
/// that loses a paisa would make the fund ledger disagree with the offering.
async fn allocate(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    offering_id: uuid::Uuid,
    category_id: Option<uuid::Uuid>,
    fund_id: Option<uuid::Uuid>,
    amount: i64,
) -> Result<(), AppError> {
    sqlx::query("DELETE FROM offering_allocations WHERE offering_id = $1 AND is_manual = false")
        .bind(offering_id)
        .execute(&mut **tx)
        .await?;

    let rules: Vec<(uuid::Uuid, i32)> = match category_id {
        Some(cid) => sqlx::query_as(
            "SELECT fund_id, percentage_bps FROM fund_allocation_rules
             WHERE category_id = $1 ORDER BY sort_order ASC, fund_id ASC",
        )
        .bind(cid)
        .fetch_all(&mut **tx)
        .await?,
        None => vec![],
    };

    if rules.is_empty() {
        // No rules: the whole amount lands in the offering's fund, if any.
        if let Some(fid) = fund_id {
            sqlx::query(
                "INSERT INTO offering_allocations (offering_id, fund_id, amount) VALUES ($1,$2,$3)",
            )
            .bind(offering_id)
            .bind(fid)
            .bind(amount)
            .execute(&mut **tx)
            .await?;
        }
        return Ok(());
    }

    let mut remaining = amount;
    for (i, (fid, bps)) in rules.iter().enumerate() {
        let share = if i == rules.len() - 1 {
            remaining
        } else {
            let s = amount * i64::from(*bps) / 10_000;
            remaining -= s;
            s
        };
        sqlx::query(
            "INSERT INTO offering_allocations (offering_id, fund_id, amount) VALUES ($1,$2,$3)",
        )
        .bind(offering_id)
        .bind(fid)
        .bind(share)
        .execute(&mut **tx)
        .await?;
    }
    Ok(())
}

pub async fn offerings_create(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertOffering>,
) -> Result<Json<serde_json::Value>, AppError> {
    let date = chrono::NaiveDate::parse_from_str(&input.service_date, "%Y-%m-%d")
        .map_err(|_| AppError::bad_request("Invalid service_date, expected YYYY-MM-DD"))?;
    if input.total_amount <= 0 {
        return Err(AppError::bad_request("Amount must be greater than zero"));
    }
    let time = match input.service_time.as_deref() {
        Some(t) if !t.is_empty() => Some(
            chrono::NaiveTime::parse_from_str(t, "%H:%M")
                .or_else(|_| chrono::NaiveTime::parse_from_str(t, "%H:%M:%S"))
                .map_err(|_| AppError::bad_request("Invalid service_time, expected HH:MM"))?,
        ),
        _ => None,
    };

    let submit = input.submit.unwrap_or(false);
    let mut tx = pool.begin().await?;

    let receipt_no = if submit {
        Some(next_receipt_no(&mut tx).await?)
    } else {
        None
    };

    // Fall back to the category's default fund so allocation still works when
    // the form does not set one explicitly.
    let fund_id = match (input.fund_id, input.category_id) {
        (Some(f), _) => Some(f),
        (None, Some(cid)) => {
            sqlx::query_scalar::<_, Option<uuid::Uuid>>(
                "SELECT default_fund_id FROM offering_categories WHERE id = $1",
            )
            .bind(cid)
            .fetch_optional(&mut *tx)
            .await?
            .flatten()
        }
        _ => None,
    };

    let is_anon = input.is_anonymous.unwrap_or(false);
    let row = sqlx::query_as::<_, OfferingRow>(
        r#"INSERT INTO offerings
             (service_date, service_time, service_name, offering_type, category_id, fund_id,
              donor_person_id, donor_name, is_anonymous, giver_type, total_amount, currency,
              payment_method, reference_no, bank_account_id, status, entered_by, notes,
              attachments, recorded_by)
           VALUES ($1,$2,$3,'general',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$16)
           RETURNING id, $19::text AS receipt_no, service_date, service_time, service_name,
                     offering_type, category_id, NULL::text AS category_name,
                     NULL::text AS category_color, fund_id, NULL::text AS fund_name,
                     donor_person_id, donor_name, is_anonymous, giver_type, total_amount,
                     currency, payment_method, reference_no, bank_account_id, status,
                     entered_by, approved_by, approved_at, notes, created_at"#,
    )
    .bind(date)
    .bind(time)
    .bind(input.service_name.as_deref().unwrap_or("Sunday Service"))
    .bind(input.category_id)
    .bind(fund_id)
    .bind(if is_anon { None } else { input.donor_person_id })
    .bind(if is_anon {
        String::new()
    } else {
        input.donor_name.clone().unwrap_or_default()
    })
    .bind(is_anon)
    .bind(input.giver_type.as_deref().unwrap_or("member"))
    .bind(input.total_amount)
    .bind(input.currency.as_deref().unwrap_or("NPR"))
    .bind(input.payment_method.as_deref().unwrap_or("cash"))
    .bind(input.reference_no.as_deref().unwrap_or(""))
    .bind(input.bank_account_id)
    .bind(if submit { "submitted" } else { "draft" })
    .bind(&auth.email)
    .bind(input.notes.as_deref().unwrap_or(""))
    .bind(input.attachments.unwrap_or_else(|| serde_json::json!([])))
    .bind(receipt_no.as_deref())
    .fetch_one(&mut *tx)
    .await?;

    if let Some(ref rno) = receipt_no {
        sqlx::query("UPDATE offerings SET receipt_no = $2 WHERE id = $1")
            .bind(row.id)
            .bind(rno)
            .execute(&mut *tx)
            .await?;
    }

    allocate(&mut tx, row.id, input.category_id, fund_id, input.total_amount).await?;
    tx.commit().await?;

    Ok(Json(serde_json::json!({
        "id": row.id,
        "receipt_no": receipt_no,
        "status": if submit { "submitted" } else { "draft" },
    })))
}

/// Move an offering through the approval workflow.
///
/// Only `submitted`/`counted` rows may be approved, and an already-approved row
/// cannot be approved twice — otherwise `approved_by` would silently change
/// after the fact, which is exactly what an audit trail must prevent.
pub async fn offerings_approve(
    auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let status: Option<String> =
        sqlx::query_scalar("SELECT status FROM offerings WHERE id = $1")
            .bind(id)
            .fetch_optional(&pool)
            .await?;
    let status = status.ok_or_else(|| AppError::not_found("Offering not found"))?;

    match status.as_str() {
        "approved" => return Err(AppError::conflict("Offering is already approved")),
        "draft" => {
            return Err(AppError::bad_request(
                "Submit the offering before approving it",
            ))
        }
        "rejected" => {
            return Err(AppError::bad_request(
                "Rejected offerings cannot be approved; reopen it first",
            ))
        }
        _ => {}
    }

    sqlx::query(
        "UPDATE offerings SET status='approved', approved_by=$2, approved_at=NOW(),
                rejected_reason=NULL, updated_at=NOW() WHERE id=$1",
    )
    .bind(id)
    .bind(&auth.email)
    .execute(&pool)
    .await?;

    Ok(Json(serde_json::json!({ "id": id, "status": "approved" })))
}

pub async fn offerings_reject(
    auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<ApprovalInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    let reason = input.reason.unwrap_or_default();
    if reason.trim().is_empty() {
        return Err(AppError::bad_request("A rejection reason is required"));
    }
    let res = sqlx::query(
        "UPDATE offerings SET status='rejected', rejected_reason=$2, approved_by=$3,
                approved_at=NOW(), updated_at=NOW() WHERE id=$1 AND status <> 'approved'",
    )
    .bind(id)
    .bind(reason.trim())
    .bind(&auth.email)
    .execute(&pool)
    .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::conflict(
            "Offering not found, or already approved",
        ));
    }
    Ok(Json(serde_json::json!({ "id": id, "status": "rejected" })))
}

pub async fn offerings_bulk_approve(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<BulkStatusInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    if input.ids.is_empty() {
        return Err(AppError::bad_request("No offerings selected"));
    }
    if input.ids.len() > 500 {
        return Err(AppError::bad_request("Select at most 500 offerings at once"));
    }
    let res = sqlx::query(
        "UPDATE offerings SET status='approved', approved_by=$2, approved_at=NOW(), updated_at=NOW()
         WHERE id = ANY($1) AND status IN ('submitted','counted')",
    )
    .bind(&input.ids)
    .bind(&auth.email)
    .execute(&pool)
    .await?;
    Ok(Json(serde_json::json!({
        "requested": input.ids.len(),
        "approved": res.rows_affected(),
        "skipped": input.ids.len() as u64 - res.rows_affected(),
    })))
}

// ===========================================================================
// Dashboard
// ===========================================================================

pub async fn dashboard(Db(pool): Db) -> Result<Json<OfferingDashboard>, AppError> {
    let counted = COUNTED_STATUSES;

    let sums: (i64, i64, i64, i64, i64, i64) = sqlx::query_as(&format!(
        r#"SELECT
             COALESCE(SUM(CASE WHEN service_date = CURRENT_DATE THEN total_amount END),0)::bigint,
             COALESCE(SUM(CASE WHEN service_date >= date_trunc('week', CURRENT_DATE)::date THEN total_amount END),0)::bigint,
             COALESCE(SUM(CASE WHEN service_date >= date_trunc('month', CURRENT_DATE)::date THEN total_amount END),0)::bigint,
             COALESCE(SUM(CASE WHEN service_date >= date_trunc('year', CURRENT_DATE)::date THEN total_amount END),0)::bigint,
             -- Year-to-date, matching the period cards above. Summing these
             -- over all time made cash + online exceed the yearly total, so
             -- two cards sitting side by side meant different periods.
             COALESCE(SUM(CASE WHEN payment_method IN {ONLINE_METHODS}
                          AND service_date >= date_trunc('year', CURRENT_DATE)::date
                          THEN total_amount END),0)::bigint,
             COALESCE(SUM(CASE WHEN payment_method = 'cash'
                          AND service_date >= date_trunc('year', CURRENT_DATE)::date
                          THEN total_amount END),0)::bigint
           FROM offerings WHERE status IN {counted}"#
    ))
    .fetch_one(&pool)
    .await?;

    let pending_approval: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM offerings WHERE status IN ('submitted','counted')",
    )
    .fetch_one(&pool)
    .await?;

    let (pending_deposits, pending_deposit_count): (i64, i64) = sqlx::query_as(
        "SELECT COALESCE(SUM(amount),0)::bigint, COUNT(*) FROM deposits WHERE status IN ('pending','deposited')",
    )
    .fetch_one(&pool)
    .await?;

    let total_donations: i64 =
        sqlx::query_scalar("SELECT COALESCE(SUM(amount),0)::bigint FROM donations WHERE status = 'completed'")
            .fetch_one(&pool)
            .await
            .unwrap_or(0);

    let active_campaigns: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM campaigns WHERE is_active = true")
            .fetch_one(&pool)
            .await
            .unwrap_or(0);

    let total_donors: i64 = sqlx::query_scalar(&format!(
        "SELECT COUNT(DISTINCT COALESCE(donor_person_id::text, NULLIF(donor_name,'')))
         FROM offerings WHERE status IN {counted} AND is_anonymous = false"
    ))
    .fetch_one(&pool)
    .await?;

    let monthly_trend = sqlx::query_as::<_, TrendPoint>(&format!(
        r#"SELECT to_char(date_trunc('month', service_date), 'Mon YYYY') AS label,
                  COALESCE(SUM(total_amount),0)::bigint AS amount, COUNT(*)::bigint AS count
           FROM offerings WHERE status IN {counted}
             AND service_date >= (date_trunc('month', CURRENT_DATE) - INTERVAL '11 months')::date
           GROUP BY date_trunc('month', service_date)
           ORDER BY date_trunc('month', service_date)"#
    ))
    .fetch_all(&pool)
    .await?;

    let daily_trend = sqlx::query_as::<_, TrendPoint>(&format!(
        r#"SELECT to_char(service_date, 'DD Mon') AS label,
                  COALESCE(SUM(total_amount),0)::bigint AS amount, COUNT(*)::bigint AS count
           FROM offerings WHERE status IN {counted}
             AND service_date >= CURRENT_DATE - INTERVAL '29 days'
           GROUP BY service_date ORDER BY service_date"#
    ))
    .fetch_all(&pool)
    .await?;

    let by_category = sqlx::query_as::<_, Breakdown>(&format!(
        r#"SELECT COALESCE(c.name, 'Uncategorised') AS label, c.color,
                  COALESCE(SUM(o.total_amount),0)::bigint AS amount, COUNT(*)::bigint AS count
           FROM offerings o LEFT JOIN offering_categories c ON c.id = o.category_id
           WHERE o.status IN {counted}
             AND o.service_date >= (date_trunc('year', CURRENT_DATE))::date
           GROUP BY c.name, c.color ORDER BY amount DESC"#
    ))
    .fetch_all(&pool)
    .await?;

    let by_payment_method = sqlx::query_as::<_, Breakdown>(&format!(
        r#"SELECT payment_method AS label, NULL::varchar AS color,
                  COALESCE(SUM(total_amount),0)::bigint AS amount, COUNT(*)::bigint AS count
           FROM offerings WHERE status IN {counted}
             AND service_date >= (date_trunc('year', CURRENT_DATE))::date
           GROUP BY payment_method ORDER BY amount DESC"#
    ))
    .fetch_all(&pool)
    .await?;

    let weekly_comparison = sqlx::query_as::<_, TrendPoint>(&format!(
        r#"SELECT 'W' || to_char(date_trunc('week', service_date), 'IW') AS label,
                  COALESCE(SUM(total_amount),0)::bigint AS amount, COUNT(*)::bigint AS count
           FROM offerings WHERE status IN {counted}
             AND service_date >= CURRENT_DATE - INTERVAL '8 weeks'
           GROUP BY date_trunc('week', service_date)
           ORDER BY date_trunc('week', service_date)"#
    ))
    .fetch_all(&pool)
    .await?;

    let currency: String =
        sqlx::query_scalar("SELECT currency FROM offerings ORDER BY created_at DESC LIMIT 1")
            .fetch_optional(&pool)
            .await?
            .unwrap_or_else(|| "NPR".into());

    Ok(Json(OfferingDashboard {
        today: sums.0,
        this_week: sums.1,
        this_month: sums.2,
        this_year: sums.3,
        online_giving: sums.4,
        cash_giving: sums.5,
        total_donations,
        pending_deposits,
        pending_deposit_count,
        pending_approval_count: pending_approval,
        active_campaigns,
        total_donors,
        currency,
        monthly_trend,
        daily_trend,
        by_category,
        by_payment_method,
        weekly_comparison,
    }))
}

// ===========================================================================
// Cash counting
// ===========================================================================

pub async fn cash_counts_list(Db(pool): Db) -> Result<Json<Vec<CashCount>>, AppError> {
    let rows = sqlx::query_as::<_, CashCount>(
        "SELECT * FROM cash_counts ORDER BY count_date DESC, created_at DESC LIMIT 200",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn cash_counts_get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<CashCountWithLines>, AppError> {
    let count = sqlx::query_as::<_, CashCount>("SELECT * FROM cash_counts WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Cash count not found"))?;
    let lines = sqlx::query_as::<_, CashCountLine>(
        "SELECT * FROM cash_count_lines WHERE cash_count_id = $1
         ORDER BY denomination DESC, counted_by ASC",
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;
    Ok(Json(CashCountWithLines { count, lines }))
}

/// Create or replace a counting session.
///
/// Totals and variance are computed server-side from the denomination lines.
/// A client-supplied total would be trusting the browser with the number the
/// whole reconciliation depends on.
pub async fn cash_counts_save(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertCashCount>,
) -> Result<Json<CashCountWithLines>, AppError> {
    let date = match input.count_date.as_deref() {
        Some(d) if !d.is_empty() => chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d")
            .map_err(|_| AppError::bad_request("Invalid count_date, expected YYYY-MM-DD"))?,
        _ => chrono::Utc::now().date_naive(),
    };

    let lines = input.lines.unwrap_or_default();
    for l in &lines {
        if l.quantity < 0 {
            return Err(AppError::bad_request("Quantity cannot be negative"));
        }
        if l.denomination < 0 {
            return Err(AppError::bad_request("Denomination cannot be negative"));
        }
    }
    let counted_total: i64 = lines
        .iter()
        .map(|l| l.denomination.saturating_mul(i64::from(l.quantity)))
        .sum();

    let expected = input.expected_total.unwrap_or(0);
    let variance = counted_total - expected;

    let mut tx = pool.begin().await?;

    let count = sqlx::query_as::<_, CashCount>(
        r#"INSERT INTO cash_counts
             (offering_id, count_date, service_name, counter_one, counter_two, supervisor,
              expected_total, counted_total, variance, variance_reason, notes, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'open') RETURNING *"#,
    )
    .bind(input.offering_id)
    .bind(date)
    .bind(input.service_name.unwrap_or_default())
    .bind(input.counter_one.unwrap_or_else(|| auth.email.clone()))
    .bind(input.counter_two.unwrap_or_default())
    .bind(input.supervisor.unwrap_or_default())
    .bind(expected)
    .bind(counted_total)
    .bind(variance)
    .bind(input.variance_reason.unwrap_or_default())
    .bind(input.notes.unwrap_or_default())
    .fetch_one(&mut *tx)
    .await?;

    for l in &lines {
        let subtotal = l.denomination.saturating_mul(i64::from(l.quantity));
        sqlx::query(
            r#"INSERT INTO cash_count_lines
                 (cash_count_id, denomination, label, quantity, subtotal, counted_by)
               VALUES ($1,$2,$3,$4,$5,$6)
               ON CONFLICT (cash_count_id, denomination, counted_by)
               DO UPDATE SET quantity = EXCLUDED.quantity, subtotal = EXCLUDED.subtotal"#,
        )
        .bind(count.id)
        .bind(l.denomination)
        .bind(l.label.clone().unwrap_or_default())
        .bind(l.quantity)
        .bind(subtotal)
        .bind(l.counted_by.as_deref().unwrap_or("one"))
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;

    let lines_out = sqlx::query_as::<_, CashCountLine>(
        "SELECT * FROM cash_count_lines WHERE cash_count_id = $1 ORDER BY denomination DESC",
    )
    .bind(count.id)
    .fetch_all(&pool)
    .await?;

    Ok(Json(CashCountWithLines {
        count,
        lines: lines_out,
    }))
}

/// Approve and lock a counting session.
///
/// Locking is the point of the whole screen: once a supervisor signs off, the
/// tallies must stop moving. A variance requires a written reason first.
pub async fn cash_counts_approve(
    auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<CashCount>, AppError> {
    let existing = sqlx::query_as::<_, CashCount>("SELECT * FROM cash_counts WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Cash count not found"))?;

    if existing.is_locked {
        return Err(AppError::conflict("This count is already locked"));
    }
    if existing.variance != 0 && existing.variance_reason.trim().is_empty() {
        return Err(AppError::bad_request(
            "Explain the variance before approving this count",
        ));
    }

    let row = sqlx::query_as::<_, CashCount>(
        "UPDATE cash_counts SET status='approved', is_locked=true, approved_by=$2,
                approved_at=NOW(), updated_at=NOW() WHERE id=$1 RETURNING *",
    )
    .bind(id)
    .bind(&auth.email)
    .fetch_one(&pool)
    .await?;

    // Promote the linked offering so the counted cash is reflected there too.
    if let Some(oid) = row.offering_id {
        sqlx::query(
            "UPDATE offerings SET status='counted', total_amount=$2, updated_at=NOW()
             WHERE id=$1 AND status IN ('draft','submitted')",
        )
        .bind(oid)
        .bind(row.counted_total)
        .execute(&pool)
        .await?;
    }

    Ok(Json(row))
}

// ===========================================================================
// Deposits
// ===========================================================================

pub async fn deposits_list(Db(pool): Db) -> Result<Json<Vec<Deposit>>, AppError> {
    let rows = sqlx::query_as::<_, Deposit>(
        "SELECT * FROM deposits ORDER BY deposit_date DESC, created_at DESC LIMIT 300",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn deposits_create(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertDeposit>,
) -> Result<Json<Deposit>, AppError> {
    let date = match input.deposit_date.as_deref() {
        Some(d) if !d.is_empty() => chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d")
            .map_err(|_| AppError::bad_request("Invalid deposit_date, expected YYYY-MM-DD"))?,
        _ => chrono::Utc::now().date_naive(),
    };
    let offering_ids = input.offering_ids.unwrap_or_default();

    let mut tx = pool.begin().await?;

    // When offerings are attached, the deposit amount is their sum rather than
    // whatever the form posted — the slip must match what is being banked.
    let amount = if offering_ids.is_empty() {
        input.amount.unwrap_or(0)
    } else {
        sqlx::query_scalar::<_, i64>(
            "SELECT COALESCE(SUM(total_amount),0)::bigint FROM offerings WHERE id = ANY($1)",
        )
        .bind(&offering_ids)
        .fetch_one(&mut *tx)
        .await?
    };
    if amount <= 0 {
        return Err(AppError::bad_request("Deposit amount must be greater than zero"));
    }

    let dep = sqlx::query_as::<_, Deposit>(
        r#"INSERT INTO deposits
             (deposit_date, bank_account_id, reference_no, amount, slip_url, deposited_by, notes, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING *"#,
    )
    .bind(date)
    .bind(input.bank_account_id)
    .bind(input.reference_no.unwrap_or_default())
    .bind(amount)
    .bind(input.slip_url.unwrap_or_default())
    .bind(input.deposited_by.unwrap_or_else(|| auth.email.clone()))
    .bind(input.notes.unwrap_or_default())
    .fetch_one(&mut *tx)
    .await?;

    for oid in &offering_ids {
        let amt: i64 =
            sqlx::query_scalar("SELECT total_amount FROM offerings WHERE id = $1")
                .bind(oid)
                .fetch_optional(&mut *tx)
                .await?
                .unwrap_or(0);
        sqlx::query(
            "INSERT INTO deposit_offerings (deposit_id, offering_id, amount) VALUES ($1,$2,$3)
             ON CONFLICT (deposit_id, offering_id) DO UPDATE SET amount = EXCLUDED.amount",
        )
        .bind(dep.id)
        .bind(oid)
        .bind(amt)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(Json(dep))
}

/// Verify a deposit and credit the bank account.
///
/// The balance is only moved on verification, and only once — crediting on
/// creation would inflate the account for deposits that are later rejected.
pub async fn deposits_verify(
    auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Deposit>, AppError> {
    let mut tx = pool.begin().await?;

    let dep = sqlx::query_as::<_, Deposit>("SELECT * FROM deposits WHERE id = $1 FOR UPDATE")
        .bind(id)
        .fetch_optional(&mut *tx)
        .await?
        .ok_or_else(|| AppError::not_found("Deposit not found"))?;

    if dep.status == "verified" {
        return Err(AppError::conflict("Deposit is already verified"));
    }
    if dep.status == "rejected" || dep.status == "cancelled" {
        return Err(AppError::bad_request(format!(
            "A {} deposit cannot be verified",
            dep.status
        )));
    }

    let row = sqlx::query_as::<_, Deposit>(
        "UPDATE deposits SET status='verified', verified_by=$2, verified_at=NOW(),
                updated_at=NOW() WHERE id=$1 RETURNING *",
    )
    .bind(id)
    .bind(&auth.email)
    .fetch_one(&mut *tx)
    .await?;

    if let Some(acct) = row.bank_account_id {
        sqlx::query(
            "UPDATE bank_accounts SET current_balance = current_balance + $2, updated_at = NOW()
             WHERE id = $1",
        )
        .bind(acct)
        .bind(row.amount)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(Json(row))
}

pub async fn deposits_set_status(
    auth: AuthUser,
    Db(pool): Db,
    Path((id, status)): Path<(uuid::Uuid, String)>,
    Json(input): Json<ApprovalInput>,
) -> Result<Json<Deposit>, AppError> {
    const ALLOWED: [&str; 3] = ["deposited", "rejected", "cancelled"];
    if !ALLOWED.contains(&status.as_str()) {
        return Err(AppError::bad_request(format!(
            "Status must be one of {}",
            ALLOWED.join(", ")
        )));
    }
    if status == "rejected" && input.reason.as_deref().unwrap_or("").trim().is_empty() {
        return Err(AppError::bad_request("A rejection reason is required"));
    }

    let row = sqlx::query_as::<_, Deposit>(
        "UPDATE deposits SET status=$2, notes = CASE WHEN $3 <> '' THEN $3 ELSE notes END,
                verified_by=$4, updated_at=NOW()
         WHERE id=$1 AND status <> 'verified' RETURNING *",
    )
    .bind(id)
    .bind(&status)
    .bind(input.reason.unwrap_or_default().trim())
    .bind(&auth.email)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::conflict("Deposit not found, or already verified"))?;

    Ok(Json(row))
}

// ===========================================================================
// Fund allocation rules
// ===========================================================================

pub async fn allocation_rules_get(
    Db(pool): Db,
    Path(category_id): Path<uuid::Uuid>,
) -> Result<Json<Vec<FundAllocationRule>>, AppError> {
    let rows = sqlx::query_as::<_, FundAllocationRule>(
        r#"SELECT r.id, r.category_id, r.fund_id, f.name AS fund_name,
                  r.percentage_bps, r.sort_order
           FROM fund_allocation_rules r
           LEFT JOIN funds f ON f.id = r.fund_id
           WHERE r.category_id = $1 ORDER BY r.sort_order ASC"#,
    )
    .bind(category_id)
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

/// Replace the allocation rules for a category.
///
/// The percentages must total exactly 100%. Accepting anything else would
/// silently route the shortfall nowhere, so it is rejected rather than
/// normalised — a finance rule should not be quietly rewritten.
pub async fn allocation_rules_set(
    _auth: AuthUser,
    Db(pool): Db,
    Path(category_id): Path<uuid::Uuid>,
    Json(input): Json<SetAllocationRules>,
) -> Result<Json<Vec<FundAllocationRule>>, AppError> {
    if !input.rules.is_empty() {
        let total: i32 = input.rules.iter().map(|r| r.percentage_bps).sum();
        if total != 10_000 {
            return Err(AppError::bad_request(format!(
                "Allocations must total 100% (got {:.2}%)",
                f64::from(total) / 100.0
            )));
        }
        if input.rules.iter().any(|r| r.percentage_bps <= 0) {
            return Err(AppError::bad_request(
                "Each allocation must be greater than zero",
            ));
        }
    }

    let mut tx = pool.begin().await?;
    sqlx::query("DELETE FROM fund_allocation_rules WHERE category_id = $1")
        .bind(category_id)
        .execute(&mut *tx)
        .await?;
    for (i, r) in input.rules.iter().enumerate() {
        sqlx::query(
            "INSERT INTO fund_allocation_rules (category_id, fund_id, percentage_bps, sort_order)
             VALUES ($1,$2,$3,$4)",
        )
        .bind(category_id)
        .bind(r.fund_id)
        .bind(r.percentage_bps)
        .bind(i as i32)
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;

    allocation_rules_get(Db(pool), Path(category_id)).await
}
