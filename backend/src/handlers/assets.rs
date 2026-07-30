//! Asset Management handlers.
//!
//! Two things this module does not do, on purpose:
//!
//! 1. It does not store a `current_value`. Depreciation is derived from cost,
//!    date, method and useful life on every read, so it cannot go stale.
//! 2. It does not check reservation overlap in Rust. The database has an
//!    EXCLUDE constraint; a read-then-write check here would let two
//!    concurrent requests both pass before either commits. The 23P01 it raises
//!    is translated into a clear 409 instead.

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::asset::*;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;
use sqlx::PgPool;

/// Postgres SQLSTATE for an exclusion-constraint violation.
const EXCLUSION_VIOLATION: &str = "23P01";
const UNIQUE_VIOLATION: &str = "23505";
const CHECK_VIOLATION: &str = "23514";

fn parse_date(s: &str) -> Result<chrono::NaiveDate, AppError> {
    chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d")
        .map_err(|_| AppError::bad_request("Invalid date, expected YYYY-MM-DD"))
}

fn opt_date(s: Option<&str>) -> Result<Option<chrono::NaiveDate>, AppError> {
    match s {
        Some(v) if !v.is_empty() => Ok(Some(parse_date(v)?)),
        _ => Ok(None),
    }
}

// ===========================================================================
// Depreciation
// ===========================================================================

/// Book value today, in minor units.
///
/// Straight line: the asset loses (cost - salvage) evenly across its useful
/// life and then stops at salvage — it never depreciates below what it could
/// be sold for, and never below zero.
///
/// Declining balance: double-declining, which is the method churches actually
/// see on equipment. Also floored at salvage.
///
/// Integer arithmetic throughout: a float here would drift a few paisa per
/// asset and make a fixed-asset register that does not reconcile.
fn current_value(
    purchase_cost: i64,
    salvage_value: i64,
    method: &str,
    useful_life_years: i32,
    purchase_date: Option<chrono::NaiveDate>,
    today: chrono::NaiveDate,
) -> i64 {
    if method == "none" || purchase_cost <= 0 {
        return purchase_cost;
    }
    let Some(bought) = purchase_date else {
        // Without a purchase date there is nothing to depreciate against, so
        // reporting the cost is the only honest answer.
        return purchase_cost;
    };
    if today <= bought {
        return purchase_cost;
    }

    let life_months = (useful_life_years.max(1) as i64) * 12;
    let months_elapsed = ((today.format("%Y").to_string().parse::<i64>().unwrap_or(0)
        - bought.format("%Y").to_string().parse::<i64>().unwrap_or(0))
        * 12)
        + (today.format("%m").to_string().parse::<i64>().unwrap_or(0)
            - bought.format("%m").to_string().parse::<i64>().unwrap_or(0));
    let months = months_elapsed.clamp(0, life_months);

    let depreciable = (purchase_cost - salvage_value).max(0);

    // Once an asset reaches the end of its useful life it is fully
    // depreciated, whatever the method. Declining balance never actually
    // reaches salvage on its own — 2/5 per year leaves 7.8% of cost after five
    // years — so without this an asset decades past its life would keep
    // reporting a book value above salvage forever.
    if months >= life_months {
        return salvage_value.max(0);
    }

    let value = match method {
        "declining_balance" => {
            // Double-declining applied per whole year, then floored at salvage.
            let years = months / 12;
            let mut v = purchase_cost;
            let rate_num = 2i64;
            let rate_den = useful_life_years.max(1) as i64;
            for _ in 0..years {
                let dep = v * rate_num / rate_den;
                v -= dep;
                if v <= salvage_value {
                    return salvage_value;
                }
            }
            v
        }
        // straight_line and anything unrecognised
        _ => purchase_cost - (depreciable * months / life_months.max(1)),
    };

    value.max(salvage_value).max(0)
}

fn warranty_status(expires: Option<chrono::NaiveDate>, today: chrono::NaiveDate) -> String {
    match expires {
        None => "none".into(),
        Some(d) if d < today => "expired".into(),
        // 60 days is enough notice to renew or budget a replacement.
        Some(d) if (d - today).num_days() <= 60 => "expiring".into(),
        Some(_) => "active".into(),
    }
}

/// Fill the derived fields on a row read from the database.
fn enrich(row: &mut AssetRow, today: chrono::NaiveDate) {
    row.current_value = current_value(
        row.purchase_cost,
        row.salvage_value,
        &row.depreciation_method,
        row.useful_life_years,
        row.purchase_date,
        today,
    );
    row.accumulated_depreciation = (row.purchase_cost - row.current_value).max(0);
    row.warranty_status = warranty_status(row.warranty_expires, today);
}

// ===========================================================================
// Categories
// ===========================================================================

pub async fn categories_list(Db(pool): Db) -> Result<Json<Vec<AssetCategory>>, AppError> {
    let rows = sqlx::query_as::<_, AssetCategory>(
        r#"SELECT c.*,
                  (SELECT COUNT(*) FROM assets a
                   WHERE a.category_id = c.id AND a.status <> 'disposed')::bigint AS asset_count
           FROM asset_categories c
           ORDER BY c.sort_order, c.name"#,
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn categories_create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertCategory>,
) -> Result<Json<serde_json::Value>, AppError> {
    if input.name.trim().is_empty() {
        return Err(AppError::bad_request("Category name is required"));
    }
    let slug = slugify(&input.name);
    sqlx::query(
        r#"INSERT INTO asset_categories
             (name, slug, description, icon, color, default_useful_life_years, is_reservable, sort_order, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)"#,
    )
    .bind(input.name.trim())
    .bind(&slug)
    .bind(input.description.unwrap_or_default())
    .bind(input.icon.unwrap_or_else(|| "Package".into()))
    .bind(input.color.unwrap_or_else(|| "#0b3c5d".into()))
    .bind(input.default_useful_life_years.unwrap_or(5).max(1))
    .bind(input.is_reservable.unwrap_or(false))
    .bind(input.sort_order.unwrap_or(999))
    .bind(input.is_active.unwrap_or(true))
    .execute(&pool)
    .await
    .map_err(map_db_error)?;
    Ok(Json(serde_json::json!({ "created": true })))
}

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

/// Turn constraint violations into messages a person can act on.
fn map_db_error(e: sqlx::Error) -> AppError {
    match &e {
        sqlx::Error::Database(db) => match db.code().as_deref() {
            Some(EXCLUSION_VIOLATION) => AppError::conflict(
                "That asset is already reserved for part of those dates",
            ),
            Some(UNIQUE_VIOLATION) => {
                let msg = db.message();
                if msg.contains("serial") {
                    AppError::conflict("Another asset already has that serial number")
                } else if msg.contains("open_assignment") {
                    AppError::conflict("That asset is already checked out to someone")
                } else if msg.contains("suppliers") {
                    AppError::conflict("A supplier with that name already exists")
                } else {
                    AppError::conflict("That value is already in use")
                }
            }
            Some(CHECK_VIOLATION) => {
                let msg = db.message();
                if msg.contains("salvage_not_above_cost") {
                    AppError::bad_request("Salvage value cannot exceed the purchase cost")
                } else if msg.contains("useful_life_positive") {
                    AppError::bad_request("Useful life must be at least one year")
                } else if msg.contains("dates_ordered") {
                    AppError::bad_request("The end date must not be before the start date")
                } else {
                    AppError::bad_request("That value is out of range")
                }
            }
            _ => e.into(),
        },
        _ => e.into(),
    }
}

// ===========================================================================
// Suppliers
// ===========================================================================

pub async fn suppliers_list(Db(pool): Db) -> Result<Json<Vec<Supplier>>, AppError> {
    let rows = sqlx::query_as::<_, Supplier>(
        r#"SELECT s.*,
                  (SELECT COUNT(*) FROM assets a WHERE a.supplier_id = s.id)::bigint AS asset_count
           FROM suppliers s ORDER BY s.is_active DESC, s.name"#,
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn suppliers_create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertSupplier>,
) -> Result<Json<serde_json::Value>, AppError> {
    if input.name.trim().is_empty() {
        return Err(AppError::bad_request("Supplier name is required"));
    }
    sqlx::query(
        r#"INSERT INTO suppliers (name, contact_person, phone, email, address, website, notes, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)"#,
    )
    .bind(input.name.trim())
    .bind(input.contact_person.unwrap_or_default())
    .bind(input.phone.unwrap_or_default())
    .bind(input.email.unwrap_or_default())
    .bind(input.address.unwrap_or_default())
    .bind(input.website.unwrap_or_default())
    .bind(input.notes.unwrap_or_default())
    .bind(input.is_active.unwrap_or(true))
    .execute(&pool)
    .await
    .map_err(map_db_error)?;
    Ok(Json(serde_json::json!({ "created": true })))
}

// ===========================================================================
// Assets
// ===========================================================================

const ASSET_SELECT: &str = r#"
    SELECT a.id, a.asset_code, a.name, a.category_id, c.name AS category_name,
           c.color AS category_color, a.serial_number, a.manufacturer, a.model,
           a.purchase_date, a.purchase_cost, a.salvage_value, a.depreciation_method,
           a.useful_life_years, a.supplier_id, s.name AS supplier_name,
           a.warranty_expires, a.building, a.room, a.department, a.condition,
           a.status, a.photo, a.is_reservable, a.notes,
           (SELECT NULLIF(asg.assigned_to, '') FROM asset_assignments asg
            WHERE asg.asset_id = a.id AND asg.returned_at IS NULL
            ORDER BY asg.assigned_at DESC LIMIT 1) AS assigned_to,
           a.updated_at,
           0::bigint AS current_value,
           0::bigint AS accumulated_depreciation,
           ''::text AS warranty_status
    FROM assets a
    LEFT JOIN asset_categories c ON c.id = a.category_id
    LEFT JOIN suppliers s ON s.id = a.supplier_id
"#;

fn sort_column(sort: Option<&str>) -> &'static str {
    match sort {
        Some("name") => "a.name",
        Some("code") => "a.asset_code",
        Some("cost") => "a.purchase_cost",
        Some("status") => "a.status",
        Some("category") => "c.name",
        Some("purchased") => "a.purchase_date",
        _ => "a.updated_at",
    }
}

pub async fn assets_list(
    Db(pool): Db,
    Query(f): Query<AssetFilter>,
) -> Result<Json<AssetPage>, AppError> {
    let page = f.page.unwrap_or(1).max(1);
    let per_page = f.per_page.unwrap_or(25).clamp(1, 200);
    let offset = (page - 1) * per_page;
    let today = chrono::Utc::now().date_naive();

    let where_sql = r#"
        WHERE ($1::text IS NULL OR (
                a.name ILIKE '%' || $1 || '%' OR a.asset_code ILIKE '%' || $1 || '%'
             OR a.serial_number ILIKE '%' || $1 || '%' OR a.manufacturer ILIKE '%' || $1 || '%'
             OR a.model ILIKE '%' || $1 || '%' OR a.room ILIKE '%' || $1 || '%'))
          AND ($2::uuid IS NULL OR a.category_id = $2)
          AND ($3::text IS NULL OR a.status = $3)
          AND ($4::text IS NULL OR a.condition = $4)
          AND ($5::text IS NULL OR a.building = $5)
          AND ($6::uuid IS NULL OR a.supplier_id = $6)
          AND ($7::boolean IS NULL OR a.is_reservable = $7)
          AND ($8::text IS NULL OR (
                CASE $8
                  WHEN 'expired'  THEN a.warranty_expires IS NOT NULL AND a.warranty_expires < CURRENT_DATE
                  WHEN 'expiring' THEN a.warranty_expires IS NOT NULL
                                       AND a.warranty_expires >= CURRENT_DATE
                                       AND a.warranty_expires <= CURRENT_DATE + INTERVAL '60 days'
                  WHEN 'active'   THEN a.warranty_expires IS NOT NULL AND a.warranty_expires > CURRENT_DATE + INTERVAL '60 days'
                  WHEN 'none'     THEN a.warranty_expires IS NULL
                  ELSE TRUE
                END))
    "#;

    macro_rules! bind_filters {
        ($q:expr) => {
            $q.bind(f.search.as_deref())
                .bind(f.category_id)
                .bind(f.status.as_deref())
                .bind(f.condition.as_deref())
                .bind(f.building.as_deref())
                .bind(f.supplier_id)
                .bind(f.reservable)
                .bind(f.warranty.as_deref())
        };
    }

    let count_sql = format!(
        r#"SELECT COUNT(*), COALESCE(SUM(a.purchase_cost),0)::bigint
           FROM assets a
           LEFT JOIN asset_categories c ON c.id = a.category_id
           {where_sql}"#
    );
    let (total, filtered_cost): (i64, i64) =
        bind_filters!(sqlx::query_as::<_, (i64, i64)>(&count_sql))
            .fetch_one(&pool)
            .await?;

    let dir = if f.dir.as_deref() == Some("asc") { "ASC" } else { "DESC" };
    let order = sort_column(f.sort.as_deref());
    let sql = format!("{ASSET_SELECT} {where_sql} ORDER BY {order} {dir}, a.asset_code LIMIT $9 OFFSET $10");

    let mut data = bind_filters!(sqlx::query_as::<_, AssetRow>(&sql))
        .bind(per_page)
        .bind(offset)
        .fetch_all(&pool)
        .await?;
    for row in &mut data {
        enrich(row, today);
    }

    // The filtered current value has to be computed over every matching row,
    // not just this page, so it is derived from a lightweight second read
    // rather than from `data`.
    let value_sql = format!(
        r#"SELECT a.purchase_cost, a.salvage_value, a.depreciation_method,
                  a.useful_life_years, a.purchase_date
           FROM assets a LEFT JOIN asset_categories c ON c.id = a.category_id
           {where_sql}"#
    );
    let all: Vec<(i64, i64, String, i32, Option<chrono::NaiveDate>)> =
        bind_filters!(sqlx::query_as(&value_sql)).fetch_all(&pool).await?;
    let filtered_current_value: i64 = all
        .iter()
        .map(|(cost, salvage, method, life, date)| {
            current_value(*cost, *salvage, method, *life, *date, today)
        })
        .sum();

    Ok(Json(AssetPage {
        data,
        total,
        page,
        per_page,
        total_pages: (total + per_page - 1) / per_page,
        filtered_cost,
        filtered_current_value,
    }))
}

async fn next_asset_code(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>) -> Result<String, AppError> {
    let row: Option<(String, i64, i32)> = sqlx::query_as(
        "SELECT prefix, next_value, padding FROM receipt_sequences WHERE scope = 'asset' FOR UPDATE",
    )
    .fetch_optional(&mut **tx)
    .await?;
    let (prefix, value, padding) = row.ok_or_else(|| {
        AppError::internal("Asset code sequence missing — run migration 066")
    })?;
    sqlx::query(
        "UPDATE receipt_sequences SET next_value = next_value + 1, updated_at = NOW() WHERE scope = 'asset'",
    )
    .execute(&mut **tx)
    .await?;
    Ok(format!("{prefix}-{:0width$}", value, width = padding as usize))
}

pub async fn assets_create(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertAsset>,
) -> Result<Json<serde_json::Value>, AppError> {
    if input.name.trim().is_empty() {
        return Err(AppError::bad_request("Asset name is required"));
    }
    let cost = input.purchase_cost.unwrap_or(0);
    let salvage = input.salvage_value.unwrap_or(0);
    if cost < 0 || salvage < 0 {
        return Err(AppError::bad_request("Amounts cannot be negative"));
    }
    if salvage > cost {
        return Err(AppError::bad_request("Salvage value cannot exceed the purchase cost"));
    }
    let purchase_date = opt_date(input.purchase_date.as_deref())?;
    let warranty = opt_date(input.warranty_expires.as_deref())?;
    if let (Some(p), Some(w)) = (purchase_date, warranty) {
        if w < p {
            return Err(AppError::bad_request("Warranty cannot expire before the purchase date"));
        }
    }

    let mut tx = pool.begin().await?;
    let code = next_asset_code(&mut tx).await?;

    // Fall back to the category's default life so a projector does not need to
    // be told it lasts 5 years on every single create.
    let life = match (input.useful_life_years, input.category_id) {
        (Some(y), _) => y.max(1),
        (None, Some(cid)) => sqlx::query_scalar::<_, i32>(
            "SELECT default_useful_life_years FROM asset_categories WHERE id = $1",
        )
        .bind(cid)
        .fetch_optional(&mut *tx)
        .await?
        .unwrap_or(5),
        _ => 5,
    };

    let id: uuid::Uuid = sqlx::query_scalar(
        r#"INSERT INTO assets
             (asset_code, name, category_id, description, serial_number, barcode,
              manufacturer, model, purchase_date, purchase_cost, salvage_value,
              depreciation_method, useful_life_years, supplier_id, warranty_expires,
              building, room, department, condition, status, photo, notes,
              is_reservable, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
           RETURNING id"#,
    )
    .bind(&code)
    .bind(input.name.trim())
    .bind(input.category_id)
    .bind(input.description.unwrap_or_default())
    .bind(input.serial_number.unwrap_or_default().trim())
    .bind(input.barcode.unwrap_or_default())
    .bind(input.manufacturer.unwrap_or_default())
    .bind(input.model.unwrap_or_default())
    .bind(purchase_date)
    .bind(cost)
    .bind(salvage)
    .bind(input.depreciation_method.unwrap_or_else(|| "straight_line".into()))
    .bind(life)
    .bind(input.supplier_id)
    .bind(warranty)
    .bind(input.building.unwrap_or_default())
    .bind(input.room.unwrap_or_default())
    .bind(input.department.unwrap_or_default())
    .bind(input.condition.unwrap_or_else(|| "good".into()))
    .bind(input.status.unwrap_or_else(|| "available".into()))
    .bind(input.photo.unwrap_or_default())
    .bind(input.notes.unwrap_or_default())
    .bind(input.is_reservable.unwrap_or(false))
    .bind(&auth.email)
    .fetch_one(&mut *tx)
    .await
    .map_err(map_db_error)?;

    tx.commit().await?;
    Ok(Json(serde_json::json!({ "id": id, "asset_code": code })))
}

pub async fn assets_get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<AssetDetail>, AppError> {
    let today = chrono::Utc::now().date_naive();
    let sql = format!("{ASSET_SELECT} WHERE a.id = $1");
    let mut asset = sqlx::query_as::<_, AssetRow>(&sql)
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Asset not found"))?;
    enrich(&mut asset, today);

    let assignments = sqlx::query_as::<_, AssetAssignment>(
        r#"SELECT g.id, g.asset_id, a.name AS asset_name, a.asset_code, g.person_id,
                  g.assigned_to, g.department, g.assigned_at, g.due_back, g.returned_at,
                  g.condition_out, g.condition_in, g.notes
           FROM asset_assignments g JOIN assets a ON a.id = g.asset_id
           WHERE g.asset_id = $1 ORDER BY g.assigned_at DESC LIMIT 50"#,
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    let reservations = sqlx::query_as::<_, AssetReservation>(
        r#"SELECT r.id, r.asset_id, a.name AS asset_name, a.asset_code, r.requested_by,
                  r.person_id, r.purpose, r.starts_on, r.ends_on, r.status,
                  r.approved_by, r.approved_at, r.reject_reason, r.notes, r.created_at
           FROM asset_reservations r JOIN assets a ON a.id = r.asset_id
           WHERE r.asset_id = $1 ORDER BY r.starts_on DESC LIMIT 50"#,
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    let maintenance = sqlx::query_as::<_, Maintenance>(
        r#"SELECT m.id, m.asset_id, a.name AS asset_name, a.asset_code, m.maintenance_kind,
                  m.title, m.description, m.scheduled_for, m.performed_on, m.next_due,
                  m.technician, m.supplier_id, s.name AS supplier_name, m.cost, m.status,
                  m.condition_after, m.notes
           FROM asset_maintenance m
           JOIN assets a ON a.id = m.asset_id
           LEFT JOIN suppliers s ON s.id = m.supplier_id
           WHERE m.asset_id = $1
           ORDER BY COALESCE(m.performed_on, m.scheduled_for) DESC NULLS LAST LIMIT 50"#,
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    let maintenance_cost_total: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(cost),0)::bigint FROM asset_maintenance WHERE asset_id = $1",
    )
    .bind(id)
    .fetch_one(&pool)
    .await?;

    Ok(Json(AssetDetail {
        asset,
        assignments,
        reservations,
        maintenance,
        maintenance_cost_total,
    }))
}

pub async fn assets_update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpsertAsset>,
) -> Result<Json<serde_json::Value>, AppError> {
    let purchase_date = opt_date(input.purchase_date.as_deref())?;
    let warranty = opt_date(input.warranty_expires.as_deref())?;
    let res = sqlx::query(
        r#"UPDATE assets SET
             name=$2, category_id=$3,
             description=COALESCE($4,description), serial_number=COALESCE($5,serial_number),
             barcode=COALESCE($6,barcode), manufacturer=COALESCE($7,manufacturer),
             model=COALESCE($8,model), purchase_date=$9,
             purchase_cost=COALESCE($10,purchase_cost), salvage_value=COALESCE($11,salvage_value),
             depreciation_method=COALESCE($12,depreciation_method),
             useful_life_years=COALESCE($13,useful_life_years),
             supplier_id=$14, warranty_expires=$15,
             building=COALESCE($16,building), room=COALESCE($17,room),
             department=COALESCE($18,department), condition=COALESCE($19,condition),
             photo=COALESCE($20,photo), notes=COALESCE($21,notes),
             is_reservable=COALESCE($22,is_reservable), updated_at=NOW()
           WHERE id=$1"#,
    )
    .bind(id)
    .bind(input.name.trim())
    .bind(input.category_id)
    .bind(input.description)
    .bind(input.serial_number)
    .bind(input.barcode)
    .bind(input.manufacturer)
    .bind(input.model)
    .bind(purchase_date)
    .bind(input.purchase_cost)
    .bind(input.salvage_value)
    .bind(input.depreciation_method)
    .bind(input.useful_life_years)
    .bind(input.supplier_id)
    .bind(warranty)
    .bind(input.building)
    .bind(input.room)
    .bind(input.department)
    .bind(input.condition)
    .bind(input.photo)
    .bind(input.notes)
    .bind(input.is_reservable)
    .execute(&pool)
    .await
    .map_err(map_db_error)?;

    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Asset not found"));
    }
    Ok(Json(serde_json::json!({ "updated": true })))
}

/// Retire or dispose of an asset.
///
/// Never a hard delete: an asset carries purchase history, maintenance spend
/// and assignment records that a fixed-asset register has to keep.
pub async fn assets_dispose(
    _auth: AuthUser,
    Db(pool): Db,
    Path((id, status)): Path<(uuid::Uuid, String)>,
    Json(input): Json<DecisionInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    const ALLOWED: [&str; 3] = ["disposed", "lost", "retired"];
    if !ALLOWED.contains(&status.as_str()) {
        return Err(AppError::bad_request(format!(
            "Status must be one of {}",
            ALLOWED.join(", ")
        )));
    }
    let open: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM asset_assignments WHERE asset_id = $1 AND returned_at IS NULL",
    )
    .bind(id)
    .fetch_one(&pool)
    .await?;
    if open > 0 {
        return Err(AppError::conflict(
            "That asset is still checked out — record its return first",
        ));
    }

    let res = sqlx::query(
        "UPDATE assets SET status=$2, disposed_at=CURRENT_DATE,
                disposal_reason=COALESCE($3,''), updated_at=NOW() WHERE id=$1",
    )
    .bind(id)
    .bind(&status)
    .bind(input.reason)
    .execute(&pool)
    .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Asset not found"));
    }
    Ok(Json(serde_json::json!({ "status": status })))
}

// ===========================================================================
// Assignments
// ===========================================================================

pub async fn assign(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<AssignInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    if input.assigned_to.trim().is_empty() && input.person_id.is_none() {
        return Err(AppError::bad_request("Say who the asset is going to"));
    }
    let status: Option<String> = sqlx::query_scalar("SELECT status FROM assets WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?;
    let status = status.ok_or_else(|| AppError::not_found("Asset not found"))?;
    if matches!(status.as_str(), "disposed" | "lost" | "retired") {
        return Err(AppError::bad_request(format!(
            "A {status} asset cannot be checked out"
        )));
    }

    let mut tx = pool.begin().await?;
    // The partial unique index on (asset_id) WHERE returned_at IS NULL is what
    // actually prevents a double check-out; this insert simply surfaces it.
    sqlx::query(
        r#"INSERT INTO asset_assignments
             (asset_id, person_id, assigned_to, department, due_back, condition_out, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7)"#,
    )
    .bind(id)
    .bind(input.person_id)
    .bind(input.assigned_to.trim())
    .bind(input.department.unwrap_or_default())
    .bind(opt_date(input.due_back.as_deref())?)
    .bind(input.condition_out.unwrap_or_else(|| "good".into()))
    .bind(input.notes.unwrap_or_default())
    .execute(&mut *tx)
    .await
    .map_err(map_db_error)?;

    sqlx::query("UPDATE assets SET status='assigned', updated_at=NOW() WHERE id=$1")
        .bind(id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;
    Ok(Json(serde_json::json!({ "assigned": true })))
}

pub async fn assignment_return(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<ReturnInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut tx = pool.begin().await?;
    let asset_id: Option<uuid::Uuid> = sqlx::query_scalar(
        r#"UPDATE asset_assignments
           SET returned_at = CURRENT_DATE,
               condition_in = COALESCE($2, condition_out),
               notes = CASE WHEN $3 <> '' THEN $3 ELSE notes END
           WHERE id = $1 AND returned_at IS NULL
           RETURNING asset_id"#,
    )
    .bind(id)
    .bind(input.condition_in.as_deref())
    .bind(input.notes.unwrap_or_default())
    .fetch_optional(&mut *tx)
    .await?;

    let asset_id = asset_id.ok_or_else(|| {
        AppError::conflict("That assignment does not exist, or was already returned")
    })?;

    // The returned condition becomes the asset's condition — that is the whole
    // point of recording it on the way back in.
    sqlx::query(
        "UPDATE assets SET status='available',
                condition = COALESCE($2, condition), updated_at=NOW() WHERE id=$1",
    )
    .bind(asset_id)
    .bind(input.condition_in.as_deref())
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(Json(serde_json::json!({ "returned": true })))
}

pub async fn assignments_list(Db(pool): Db) -> Result<Json<Vec<AssetAssignment>>, AppError> {
    let rows = sqlx::query_as::<_, AssetAssignment>(
        r#"SELECT g.id, g.asset_id, a.name AS asset_name, a.asset_code, g.person_id,
                  g.assigned_to, g.department, g.assigned_at, g.due_back, g.returned_at,
                  g.condition_out, g.condition_in, g.notes
           FROM asset_assignments g JOIN assets a ON a.id = g.asset_id
           ORDER BY (g.returned_at IS NOT NULL), g.due_back NULLS LAST, g.assigned_at DESC
           LIMIT 200"#,
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

// ===========================================================================
// Reservations
// ===========================================================================

pub async fn reservations_list(Db(pool): Db) -> Result<Json<Vec<AssetReservation>>, AppError> {
    let rows = sqlx::query_as::<_, AssetReservation>(
        r#"SELECT r.id, r.asset_id, a.name AS asset_name, a.asset_code, r.requested_by,
                  r.person_id, r.purpose, r.starts_on, r.ends_on, r.status,
                  r.approved_by, r.approved_at, r.reject_reason, r.notes, r.created_at
           FROM asset_reservations r JOIN assets a ON a.id = r.asset_id
           ORDER BY (r.status <> 'pending'), r.starts_on LIMIT 200"#,
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn reserve(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<ReserveInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    let starts = parse_date(&input.starts_on)?;
    let ends = parse_date(&input.ends_on)?;
    if ends < starts {
        return Err(AppError::bad_request("The end date must not be before the start date"));
    }

    let asset: Option<(String, bool)> =
        sqlx::query_as("SELECT status, is_reservable FROM assets WHERE id = $1")
            .bind(id)
            .fetch_optional(&pool)
            .await?;
    let (status, reservable) = asset.ok_or_else(|| AppError::not_found("Asset not found"))?;
    if !reservable {
        return Err(AppError::bad_request("That asset is not marked as reservable"));
    }
    if matches!(status.as_str(), "disposed" | "lost" | "retired") {
        return Err(AppError::bad_request(format!(
            "A {status} asset cannot be reserved"
        )));
    }

    // No overlap check here on purpose — the EXCLUDE constraint does it
    // atomically, so two simultaneous requests cannot both succeed.
    sqlx::query(
        r#"INSERT INTO asset_reservations
             (asset_id, requested_by, person_id, purpose, starts_on, ends_on, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7)"#,
    )
    .bind(id)
    .bind(input.requested_by.trim())
    .bind(input.person_id)
    .bind(input.purpose.unwrap_or_default())
    .bind(starts)
    .bind(ends)
    .bind(input.notes.unwrap_or_default())
    .execute(&pool)
    .await
    .map_err(map_db_error)?;

    Ok(Json(serde_json::json!({ "reserved": true, "status": "pending" })))
}

pub async fn reservation_decide(
    auth: AuthUser,
    Db(pool): Db,
    Path((id, decision)): Path<(uuid::Uuid, String)>,
    Json(input): Json<DecisionInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    const ALLOWED: [&str; 5] = ["approved", "rejected", "cancelled", "collected", "returned"];
    if !ALLOWED.contains(&decision.as_str()) {
        return Err(AppError::bad_request(format!(
            "Decision must be one of {}",
            ALLOWED.join(", ")
        )));
    }
    if decision == "rejected" && input.reason.as_deref().unwrap_or("").trim().is_empty() {
        return Err(AppError::bad_request("A rejection reason is required"));
    }

    // Approving cannot resurrect a cancelled or rejected request into a slot
    // someone else has since taken, so those are terminal.
    let res = sqlx::query(
        r#"UPDATE asset_reservations
           SET status=$2,
               approved_by=$3,
               approved_at=NOW(),
               reject_reason=COALESCE($4, reject_reason)
           WHERE id=$1 AND status NOT IN ('rejected','cancelled','returned')"#,
    )
    .bind(id)
    .bind(&decision)
    .bind(&auth.email)
    .bind(input.reason.as_deref())
    .execute(&pool)
    .await
    .map_err(map_db_error)?;

    if res.rows_affected() == 0 {
        return Err(AppError::conflict(
            "That reservation was not found, or has already been closed",
        ));
    }
    Ok(Json(serde_json::json!({ "status": decision })))
}

// ===========================================================================
// Maintenance
// ===========================================================================

pub async fn maintenance_list(Db(pool): Db) -> Result<Json<Vec<Maintenance>>, AppError> {
    let rows = sqlx::query_as::<_, Maintenance>(
        r#"SELECT m.id, m.asset_id, a.name AS asset_name, a.asset_code, m.maintenance_kind,
                  m.title, m.description, m.scheduled_for, m.performed_on, m.next_due,
                  m.technician, m.supplier_id, s.name AS supplier_name, m.cost, m.status,
                  m.condition_after, m.notes
           FROM asset_maintenance m
           JOIN assets a ON a.id = m.asset_id
           LEFT JOIN suppliers s ON s.id = m.supplier_id
           ORDER BY (m.status = 'completed'),
                    COALESCE(m.scheduled_for, m.performed_on) ASC NULLS LAST
           LIMIT 200"#,
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn maintenance_create(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpsertMaintenance>,
) -> Result<Json<serde_json::Value>, AppError> {
    let cost = input.cost.unwrap_or(0);
    if cost < 0 {
        return Err(AppError::bad_request("Cost cannot be negative"));
    }
    let scheduled = opt_date(input.scheduled_for.as_deref())?;
    let performed = opt_date(input.performed_on.as_deref())?;
    let next_due = opt_date(input.next_due.as_deref())?;

    let mut tx = pool.begin().await?;
    let status = input.status.unwrap_or_else(|| {
        // A record with a performed date is history, not a plan.
        if performed.is_some() { "completed".into() } else { "scheduled".into() }
    });

    sqlx::query(
        r#"INSERT INTO asset_maintenance
             (asset_id, maintenance_kind, title, description, scheduled_for, performed_on,
              next_due, technician, supplier_id, cost, status, condition_after, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)"#,
    )
    .bind(id)
    .bind(input.maintenance_kind.unwrap_or_else(|| "preventive".into()))
    .bind(input.title.unwrap_or_default())
    .bind(input.description.unwrap_or_default())
    .bind(scheduled)
    .bind(performed)
    .bind(next_due)
    .bind(input.technician.unwrap_or_default())
    .bind(input.supplier_id)
    .bind(cost)
    .bind(&status)
    .bind(input.condition_after.as_deref())
    .bind(input.notes.unwrap_or_default())
    .execute(&mut *tx)
    .await
    .map_err(map_db_error)?;

    // An asset actively in for work is not available to lend, and the
    // condition recorded afterwards becomes its current condition.
    if status == "in_progress" {
        sqlx::query("UPDATE assets SET status='maintenance', updated_at=NOW() WHERE id=$1 AND status='available'")
            .bind(id)
            .execute(&mut *tx)
            .await?;
    } else if status == "completed" {
        sqlx::query(
            "UPDATE assets SET status = CASE WHEN status='maintenance' THEN 'available' ELSE status END,
                    condition = COALESCE($2, condition), updated_at=NOW() WHERE id=$1",
        )
        .bind(id)
        .bind(input.condition_after.as_deref())
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(Json(serde_json::json!({ "created": true, "status": status })))
}

pub async fn maintenance_complete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpsertMaintenance>,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut tx = pool.begin().await?;
    let asset_id: Option<uuid::Uuid> = sqlx::query_scalar(
        r#"UPDATE asset_maintenance
           SET status='completed',
               performed_on = COALESCE(performed_on, CURRENT_DATE),
               cost = COALESCE($2, cost),
               technician = COALESCE($3, technician),
               condition_after = COALESCE($4, condition_after),
               next_due = COALESCE($5, next_due),
               notes = COALESCE($6, notes),
               updated_at = NOW()
           WHERE id=$1 AND status <> 'completed'
           RETURNING asset_id"#,
    )
    .bind(id)
    .bind(input.cost)
    .bind(input.technician.as_deref())
    .bind(input.condition_after.as_deref())
    .bind(opt_date(input.next_due.as_deref())?)
    .bind(input.notes.as_deref())
    .fetch_optional(&mut *tx)
    .await?;

    let asset_id = asset_id
        .ok_or_else(|| AppError::conflict("That job was not found, or is already completed"))?;

    sqlx::query(
        "UPDATE assets SET status = CASE WHEN status='maintenance' THEN 'available' ELSE status END,
                condition = COALESCE($2, condition), updated_at=NOW() WHERE id=$1",
    )
    .bind(asset_id)
    .bind(input.condition_after.as_deref())
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(Json(serde_json::json!({ "completed": true })))
}

// ===========================================================================
// Dashboard
// ===========================================================================

pub async fn dashboard(Db(pool): Db) -> Result<Json<AssetDashboard>, AppError> {
    let today = chrono::Utc::now().date_naive();

    let (total_assets, total_cost, available, assigned, in_maintenance): (i64, i64, i64, i64, i64) =
        sqlx::query_as(
            r#"SELECT COUNT(*) FILTER (WHERE status <> 'disposed'),
                      COALESCE(SUM(purchase_cost) FILTER (WHERE status <> 'disposed'),0)::bigint,
                      COUNT(*) FILTER (WHERE status = 'available'),
                      COUNT(*) FILTER (WHERE status = 'assigned'),
                      COUNT(*) FILTER (WHERE status IN ('maintenance','repair'))
               FROM assets"#,
        )
        .fetch_one(&pool)
        .await?;

    // Depreciation is computed, so the portfolio value is summed in Rust from
    // the inputs rather than read from a column that could be stale.
    let inputs: Vec<(i64, i64, String, i32, Option<chrono::NaiveDate>)> = sqlx::query_as(
        "SELECT purchase_cost, salvage_value, depreciation_method, useful_life_years, purchase_date
         FROM assets WHERE status <> 'disposed'",
    )
    .fetch_all(&pool)
    .await?;
    let total_current_value: i64 = inputs
        .iter()
        .map(|(c, s, m, l, d)| current_value(*c, *s, m, *l, *d, today))
        .sum();

    let overdue_returns: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM asset_assignments
         WHERE returned_at IS NULL AND due_back IS NOT NULL AND due_back < CURRENT_DATE",
    )
    .fetch_one(&pool)
    .await?;

    let maintenance_due: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM asset_maintenance
         WHERE status <> 'completed' AND status <> 'cancelled'
           AND COALESCE(scheduled_for, next_due) IS NOT NULL
           AND COALESCE(scheduled_for, next_due) <= CURRENT_DATE + INTERVAL '30 days'",
    )
    .fetch_one(&pool)
    .await?;

    let warranty_expiring: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM assets
         WHERE status <> 'disposed' AND warranty_expires IS NOT NULL
           AND warranty_expires >= CURRENT_DATE
           AND warranty_expires <= CURRENT_DATE + INTERVAL '60 days'",
    )
    .fetch_one(&pool)
    .await?;

    let pending_reservations: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM asset_reservations WHERE status = 'pending'")
            .fetch_one(&pool)
            .await?;

    let maintenance_spend_year: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(cost),0)::bigint FROM asset_maintenance
         WHERE performed_on >= date_trunc('year', CURRENT_DATE)::date",
    )
    .fetch_one(&pool)
    .await?;

    let by_category = sqlx::query_as::<_, CategoryValue>(
        r#"SELECT COALESCE(c.name, 'Uncategorised') AS label, c.color,
                  COUNT(a.id)::bigint AS count,
                  COALESCE(SUM(a.purchase_cost),0)::bigint AS cost
           FROM assets a LEFT JOIN asset_categories c ON c.id = a.category_id
           WHERE a.status <> 'disposed'
           GROUP BY c.name, c.color ORDER BY cost DESC LIMIT 12"#,
    )
    .fetch_all(&pool)
    .await?;

    let by_status = sqlx::query_as::<_, StatusCount>(
        "SELECT status AS label, COUNT(*)::bigint AS count FROM assets
         GROUP BY status ORDER BY count DESC",
    )
    .fetch_all(&pool)
    .await?;

    let upcoming_maintenance = sqlx::query_as::<_, Maintenance>(
        r#"SELECT m.id, m.asset_id, a.name AS asset_name, a.asset_code, m.maintenance_kind,
                  m.title, m.description, m.scheduled_for, m.performed_on, m.next_due,
                  m.technician, m.supplier_id, s.name AS supplier_name, m.cost, m.status,
                  m.condition_after, m.notes
           FROM asset_maintenance m
           JOIN assets a ON a.id = m.asset_id
           LEFT JOIN suppliers s ON s.id = m.supplier_id
           WHERE m.status NOT IN ('completed','cancelled')
           ORDER BY COALESCE(m.scheduled_for, m.next_due) ASC NULLS LAST LIMIT 8"#,
    )
    .fetch_all(&pool)
    .await?;

    let sql = format!(
        "{ASSET_SELECT} WHERE a.status <> 'disposed' AND a.warranty_expires IS NOT NULL
           AND a.warranty_expires <= CURRENT_DATE + INTERVAL '60 days'
         ORDER BY a.warranty_expires LIMIT 8"
    );
    let mut expiring_warranties = sqlx::query_as::<_, AssetRow>(&sql).fetch_all(&pool).await?;
    for row in &mut expiring_warranties {
        enrich(row, today);
    }

    Ok(Json(AssetDashboard {
        total_assets,
        total_cost,
        total_current_value,
        total_depreciation: (total_cost - total_current_value).max(0),
        available,
        assigned,
        in_maintenance,
        overdue_returns,
        maintenance_due,
        warranty_expiring,
        pending_reservations,
        maintenance_spend_year,
        by_category,
        by_status,
        upcoming_maintenance,
        expiring_warranties,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn d(y: i32, m: u32, day: u32) -> chrono::NaiveDate {
        chrono::NaiveDate::from_ymd_opt(y, m, day).unwrap()
    }

    #[test]
    fn straight_line_depreciates_evenly_and_floors_at_salvage() {
        let cost = 100_000_00; // Rs 100,000
        let salvage = 10_000_00;
        let bought = d(2020, 1, 1);

        // Brand new: full cost.
        assert_eq!(
            current_value(cost, salvage, "straight_line", 5, Some(bought), bought),
            cost
        );
        // Halfway through a 5-year life: half the depreciable amount is gone.
        let mid = current_value(cost, salvage, "straight_line", 5, Some(bought), d(2022, 7, 1));
        assert_eq!(mid, cost - (cost - salvage) / 2);
        // Past end of life: never below salvage.
        assert_eq!(
            current_value(cost, salvage, "straight_line", 5, Some(bought), d(2040, 1, 1)),
            salvage
        );
    }

    #[test]
    fn never_returns_a_negative_value() {
        // Zero salvage, absurdly old: floors at zero rather than going negative.
        let v = current_value(50_000_00, 0, "straight_line", 1, Some(d(2000, 1, 1)), d(2026, 1, 1));
        assert_eq!(v, 0);
    }

    #[test]
    fn no_purchase_date_reports_cost_rather_than_guessing() {
        assert_eq!(current_value(80_000_00, 0, "straight_line", 5, None, d(2026, 1, 1)), 80_000_00);
    }

    #[test]
    fn method_none_does_not_depreciate() {
        let cost = 5_000_000_00; // a building
        assert_eq!(
            current_value(cost, 0, "none", 40, Some(d(1990, 1, 1)), d(2026, 1, 1)),
            cost
        );
    }

    #[test]
    fn declining_balance_falls_faster_early_and_floors_at_salvage() {
        let cost = 100_000_00;
        let salvage = 5_000_00;
        let bought = d(2023, 1, 1);
        let after_one = current_value(cost, salvage, "declining_balance", 5, Some(bought), d(2024, 1, 1));
        let straight = current_value(cost, salvage, "straight_line", 5, Some(bought), d(2024, 1, 1));
        assert!(after_one < straight, "declining balance should drop faster in year one");
        assert!(after_one >= salvage);
        assert_eq!(
            current_value(cost, salvage, "declining_balance", 5, Some(bought), d(2060, 1, 1)),
            salvage
        );
    }

    #[test]
    fn warranty_status_buckets() {
        let today = d(2026, 7, 30);
        assert_eq!(warranty_status(None, today), "none");
        assert_eq!(warranty_status(Some(d(2026, 1, 1)), today), "expired");
        assert_eq!(warranty_status(Some(d(2026, 8, 15)), today), "expiring");
        assert_eq!(warranty_status(Some(d(2028, 1, 1)), today), "active");
    }
}
