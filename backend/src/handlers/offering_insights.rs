//! Donors, fund balances, analytics and receipts.
//!
//! Every figure here is derived on read from `offerings` and
//! `offering_allocations`. Nothing is stored: a donor's lifetime total is a
//! `SUM`, a fund's balance is a `SUM`, and both change the moment an offering
//! is approved or rejected. A stored total is wrong from the first correction
//! until something remembers to rewrite it — which is exactly when someone is
//! looking at it.
//!
//! Money is `i64` paisa throughout, divided only at the render edge.

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;

/// Offerings that count toward money actually received. Drafts and rejected
/// rows are excluded from every figure, exactly as on the dashboard — two
/// pages disagreeing about the total is worse than either being slightly off.
const COUNTED: &str = "('submitted','counted','approved')";

/// One clock per request. Reading `NOW()` twice inside one response is how a
/// tile and the list beneath it end up in different months.
async fn db_now(pool: &sqlx::PgPool) -> Result<chrono::NaiveDateTime, AppError> {
    Ok(sqlx::query_scalar::<_, chrono::NaiveDateTime>("SELECT NOW()::timestamp")
        .fetch_one(pool)
        .await?)
}

/// How a donor is identified when there is no person record.
///
/// A linked person is unambiguous. A bare name is not — "Ram Gurung" and
/// "ram gurung" are one donor, but two different Ram Gurungs are not, and
/// nothing in the data can tell them apart. The key says which case it is so
/// the page can too, rather than quietly presenting a guess as a fact.
const DONOR_KEY: &str = r#"
    CASE
        WHEN o.is_anonymous THEN 'anon'
        WHEN o.donor_person_id IS NOT NULL THEN 'person:' || o.donor_person_id::text
        WHEN btrim(o.donor_name) <> '' THEN 'name:' || lower(btrim(o.donor_name))
        ELSE 'anon'
    END"#;

// ===========================================================================
// Donors
// ===========================================================================

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct DonorRow {
    pub donor_key: String,
    pub name: String,
    pub person_id: Option<uuid::Uuid>,
    pub email: String,
    pub phone: String,
    /// True when the giving is tied to a person record rather than to a typed
    /// name, so the page can say which totals are trustworthy.
    pub is_linked: bool,
    pub total_given: i64,
    pub gift_count: i64,
    pub largest_gift: i64,
    pub average_gift: i64,
    pub first_gift_on: Option<chrono::NaiveDate>,
    pub last_gift_on: Option<chrono::NaiveDate>,
    /// Days since the last gift. Derived, so it is right at read time.
    pub days_since_last: Option<i32>,
}

#[derive(Debug, serde::Serialize)]
pub struct DonorPage {
    pub data: Vec<DonorRow>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub total_pages: i64,
    /// Anonymous giving, which belongs to no donor and would otherwise vanish
    /// from a page that adds up everyone's totals.
    pub anonymous_total: i64,
    pub anonymous_count: i64,
}

#[derive(Debug, serde::Deserialize, Default)]
pub struct DonorQuery {
    pub search: Option<String>,
    pub from: Option<String>,
    pub to: Option<String>,
    pub linked: Option<String>,
    pub sort: Option<String>,
    pub dir: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

/// The window and filters, bound rather than interpolated.
///
/// A filter that can widen its own query is a data leak: `?status=x' OR '1'='1`
/// once returned every donation in this codebase.
const DONOR_FILTER: &str = r#"
    WHERE o.status IN ('submitted','counted','approved')
      AND ($1::text IS NULL OR o.service_date >= $1::date)
      AND ($2::text IS NULL OR o.service_date <= $2::date)"#;

pub async fn donors_list(
    _auth: AuthUser,
    Db(pool): Db,
    Query(q): Query<DonorQuery>,
) -> Result<Json<DonorPage>, AppError> {
    let now = db_now(&pool).await?;
    let page = q.page.unwrap_or(1).max(1);
    let per_page = q.per_page.unwrap_or(25).clamp(1, 200);

    let sort = match q.sort.as_deref() {
        Some("name") => "name",
        Some("gifts") => "gift_count",
        Some("last") => "last_gift_on",
        Some("largest") => "largest_gift",
        _ => "total_given",
    };
    let dir = if q.dir.as_deref() == Some("asc") { "ASC" } else { "DESC" };

    // `linked`: only donors tied to a person record, or only the loose names.
    let linked_clause = match q.linked.as_deref() {
        Some("yes") => "AND d.person_id IS NOT NULL",
        Some("no") => "AND d.person_id IS NULL",
        _ => "",
    };

    let base = format!(
        r#"
        WITH gifts AS (
            SELECT {DONOR_KEY} AS donor_key,
                   o.donor_person_id,
                   NULLIF(btrim(o.donor_name), '') AS donor_name,
                   o.total_amount,
                   o.service_date,
                   o.is_anonymous
              FROM offerings o
              {DONOR_FILTER}
        ),
        agg AS (
            SELECT g.donor_key,
                   (ARRAY_AGG(g.donor_person_id) FILTER (WHERE g.donor_person_id IS NOT NULL))[1] AS person_id,
                   -- The most recent spelling wins, so a donor who was once
                   -- entered as "ram gurung" shows as they were last written.
                   (ARRAY_AGG(g.donor_name ORDER BY g.service_date DESC)
                        FILTER (WHERE g.donor_name IS NOT NULL))[1] AS typed_name,
                   SUM(g.total_amount)::bigint AS total_given,
                   COUNT(*)::bigint AS gift_count,
                   MAX(g.total_amount)::bigint AS largest_gift,
                   (SUM(g.total_amount) / COUNT(*))::bigint AS average_gift,
                   MIN(g.service_date) AS first_gift_on,
                   MAX(g.service_date) AS last_gift_on
              FROM gifts g
             WHERE g.donor_key <> 'anon'
             GROUP BY g.donor_key
        ),
        d AS (
            SELECT a.donor_key,
                   COALESCE(NULLIF(btrim(p.first_name || ' ' || p.last_name), ''),
                            a.typed_name, 'Unnamed donor') AS name,
                   a.person_id,
                   COALESCE(p.email, '') AS email,
                   COALESCE(p.phone, '') AS phone,
                   (a.person_id IS NOT NULL) AS is_linked,
                   a.total_given, a.gift_count, a.largest_gift, a.average_gift,
                   a.first_gift_on, a.last_gift_on,
                   ($3::timestamp::date - a.last_gift_on)::int AS days_since_last
              FROM agg a
              LEFT JOIN people p ON p.id = a.person_id
        )
        SELECT * FROM d
         WHERE ($4::text IS NULL OR d.name ILIKE '%' || $4 || '%'
                OR d.email ILIKE '%' || $4 || '%')
           {linked_clause}"#
    );

    let total: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM ({base}) c"))
        .bind(&q.from)
        .bind(&q.to)
        .bind(now)
        .bind(&q.search)
        .fetch_one(&pool)
        .await?;

    let rows = sqlx::query_as::<_, DonorRow>(&format!(
        "{base} ORDER BY {sort} {dir} NULLS LAST, name LIMIT $5 OFFSET $6"
    ))
    .bind(&q.from)
    .bind(&q.to)
    .bind(now)
    .bind(&q.search)
    .bind(per_page)
    .bind((page - 1) * per_page)
    .fetch_all(&pool)
    .await?;

    let (anonymous_total, anonymous_count): (i64, i64) = sqlx::query_as(&format!(
        "SELECT COALESCE(SUM(o.total_amount),0)::bigint, COUNT(*)::bigint
           FROM offerings o {DONOR_FILTER} AND o.is_anonymous"
    ))
    .bind(&q.from)
    .bind(&q.to)
    .fetch_one(&pool)
    .await?;

    Ok(Json(DonorPage {
        data: rows,
        total,
        page,
        per_page,
        total_pages: (total + per_page - 1) / per_page,
        anonymous_total,
        anonymous_count,
    }))
}

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct DonorGift {
    pub id: uuid::Uuid,
    pub receipt_no: String,
    pub service_date: chrono::NaiveDate,
    pub service_name: String,
    pub category_name: Option<String>,
    pub fund_name: Option<String>,
    pub payment_method: String,
    pub total_amount: i64,
    pub status: String,
}

#[derive(Debug, serde::Serialize)]
pub struct DonorDetail {
    pub donor: DonorRow,
    pub gifts: Vec<DonorGift>,
    /// What they gave to, so a conversation can start from something true.
    pub by_fund: Vec<LabelAmount>,
    pub by_year: Vec<LabelAmount>,
}

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct LabelAmount {
    pub label: String,
    pub amount: i64,
    pub count: i64,
}

pub async fn donor_detail(
    _auth: AuthUser,
    Db(pool): Db,
    Path(key): Path<String>,
) -> Result<Json<DonorDetail>, AppError> {
    let now = db_now(&pool).await?;

    let donor = sqlx::query_as::<_, DonorRow>(&format!(
        r#"
        WITH gifts AS (
            SELECT {DONOR_KEY} AS donor_key, o.donor_person_id,
                   NULLIF(btrim(o.donor_name), '') AS donor_name,
                   o.total_amount, o.service_date
              FROM offerings o
             WHERE o.status IN {COUNTED}
        ),
        agg AS (
            SELECT g.donor_key, (ARRAY_AGG(g.donor_person_id) FILTER (WHERE g.donor_person_id IS NOT NULL))[1] AS person_id,
                   (ARRAY_AGG(g.donor_name ORDER BY g.service_date DESC)
                        FILTER (WHERE g.donor_name IS NOT NULL))[1] AS typed_name,
                   SUM(g.total_amount)::bigint AS total_given,
                   COUNT(*)::bigint AS gift_count,
                   MAX(g.total_amount)::bigint AS largest_gift,
                   (SUM(g.total_amount) / COUNT(*))::bigint AS average_gift,
                   MIN(g.service_date) AS first_gift_on,
                   MAX(g.service_date) AS last_gift_on
              FROM gifts g WHERE g.donor_key = $1 GROUP BY g.donor_key
        )
        SELECT a.donor_key,
               COALESCE(NULLIF(btrim(p.first_name || ' ' || p.last_name), ''),
                        a.typed_name, 'Unnamed donor') AS name,
               a.person_id, COALESCE(p.email,'') AS email, COALESCE(p.phone,'') AS phone,
               (a.person_id IS NOT NULL) AS is_linked,
               a.total_given, a.gift_count, a.largest_gift, a.average_gift,
               a.first_gift_on, a.last_gift_on,
               ($2::timestamp::date - a.last_gift_on)::int AS days_since_last
          FROM agg a LEFT JOIN people p ON p.id = a.person_id"#
    ))
    .bind(&key)
    .bind(now)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("No giving recorded for that donor"))?;

    let gifts = sqlx::query_as::<_, DonorGift>(&format!(
        r#"SELECT o.id, o.receipt_no, o.service_date, o.service_name,
                  c.name AS category_name, f.name AS fund_name,
                  o.payment_method, o.total_amount, o.status
             FROM offerings o
             LEFT JOIN offering_categories c ON c.id = o.category_id
             LEFT JOIN funds f ON f.id = o.fund_id
            WHERE {DONOR_KEY} = $1 AND o.status IN {COUNTED}
            ORDER BY o.service_date DESC, o.created_at DESC
            LIMIT 500"#
    ))
    .bind(&key)
    .fetch_all(&pool)
    .await?;

    // Allocations, not the offering's own fund column: an offering can be
    // split across funds, and summing the header would count it twice.
    let by_fund = sqlx::query_as::<_, LabelAmount>(&format!(
        r#"SELECT COALESCE(f.name, 'Unallocated') AS label,
                  SUM(a.amount)::bigint AS amount, COUNT(*)::bigint AS count
             FROM offerings o
             JOIN offering_allocations a ON a.offering_id = o.id
             LEFT JOIN funds f ON f.id = a.fund_id
            WHERE {DONOR_KEY} = $1 AND o.status IN {COUNTED}
            GROUP BY f.name ORDER BY amount DESC"#
    ))
    .bind(&key)
    .fetch_all(&pool)
    .await?;

    let by_year = sqlx::query_as::<_, LabelAmount>(&format!(
        r#"SELECT to_char(o.service_date, 'YYYY') AS label,
                  SUM(o.total_amount)::bigint AS amount, COUNT(*)::bigint AS count
             FROM offerings o
            WHERE {DONOR_KEY} = $1 AND o.status IN {COUNTED}
            GROUP BY 1 ORDER BY 1"#
    ))
    .bind(&key)
    .fetch_all(&pool)
    .await?;

    Ok(Json(DonorDetail { donor, gifts, by_fund, by_year }))
}

// ===========================================================================
// Fund balances
// ===========================================================================

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct FundBalance {
    pub id: uuid::Uuid,
    pub name: String,
    pub fund_type: String,
    pub description: String,
    pub is_active: bool,
    /// Everything ever allocated to this fund from counted offerings.
    pub allocated: i64,
    pub offering_count: i64,
    pub this_month: i64,
    pub this_year: i64,
    pub last_movement_on: Option<chrono::NaiveDate>,
    /// Share of all allocated giving, to one decimal place.
    pub share_percent: f64,
}

#[derive(Debug, serde::Serialize)]
pub struct FundBalances {
    pub funds: Vec<FundBalance>,
    pub total_allocated: i64,
    /// Counted giving that reached no fund. A number that should be zero and
    /// is worth seeing when it is not, rather than being quietly dropped.
    pub unallocated: i64,
    pub movement: Vec<FundMovement>,
}

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct FundMovement {
    pub month: String,
    pub fund_name: String,
    pub amount: i64,
}

pub async fn fund_balances(
    _auth: AuthUser,
    Db(pool): Db,
) -> Result<Json<FundBalances>, AppError> {
    let now = db_now(&pool).await?;

    let funds = sqlx::query_as::<_, FundBalance>(&format!(
        r#"
        WITH alloc AS (
            SELECT a.fund_id,
                   SUM(a.amount)::bigint AS allocated,
                   COUNT(DISTINCT a.offering_id)::bigint AS offering_count,
                   SUM(a.amount) FILTER (
                       WHERE o.service_date >= date_trunc('month', $1::timestamp)::date
                   )::bigint AS this_month,
                   SUM(a.amount) FILTER (
                       WHERE o.service_date >= date_trunc('year', $1::timestamp)::date
                   )::bigint AS this_year,
                   MAX(o.service_date) AS last_movement_on
              FROM offering_allocations a
              JOIN offerings o ON o.id = a.offering_id
             WHERE o.status IN {COUNTED}
             GROUP BY a.fund_id
        ),
        grand AS (SELECT COALESCE(SUM(allocated), 0)::bigint AS total FROM alloc)
        SELECT f.id, f.name, f.fund_type, COALESCE(f.description,'') AS description,
               f.is_active,
               COALESCE(al.allocated, 0)::bigint AS allocated,
               COALESCE(al.offering_count, 0)::bigint AS offering_count,
               COALESCE(al.this_month, 0)::bigint AS this_month,
               COALESCE(al.this_year, 0)::bigint AS this_year,
               al.last_movement_on,
               CASE WHEN g.total > 0
                    THEN round(COALESCE(al.allocated,0)::numeric * 100 / g.total, 1)::float8
                    ELSE 0::float8 END AS share_percent
          FROM funds f
          LEFT JOIN alloc al ON al.fund_id = f.id
          CROSS JOIN grand g
         ORDER BY allocated DESC, f.sort_order, f.name"#
    ))
    .bind(now)
    .fetch_all(&pool)
    .await?;

    let total_allocated: i64 = sqlx::query_scalar(&format!(
        "SELECT COALESCE(SUM(a.amount),0)::bigint FROM offering_allocations a
           JOIN offerings o ON o.id = a.offering_id WHERE o.status IN {COUNTED}"
    ))
    .fetch_one(&pool)
    .await?;

    // Counted money with no allocation row at all.
    let unallocated: i64 = sqlx::query_scalar(&format!(
        "SELECT COALESCE(SUM(o.total_amount),0)::bigint FROM offerings o
          WHERE o.status IN {COUNTED}
            AND NOT EXISTS (SELECT 1 FROM offering_allocations a WHERE a.offering_id = o.id)"
    ))
    .fetch_one(&pool)
    .await?;

    let movement = sqlx::query_as::<_, FundMovement>(&format!(
        r#"SELECT to_char(o.service_date, 'YYYY-MM') AS month,
                  COALESCE(f.name, 'Unallocated') AS fund_name,
                  SUM(a.amount)::bigint AS amount
             FROM offering_allocations a
             JOIN offerings o ON o.id = a.offering_id
             LEFT JOIN funds f ON f.id = a.fund_id
            WHERE o.status IN {COUNTED}
              AND o.service_date >= (date_trunc('month', $1::timestamp) - interval '11 months')::date
            GROUP BY 1, 2 ORDER BY 1, 2"#
    ))
    .bind(now)
    .fetch_all(&pool)
    .await?;

    Ok(Json(FundBalances { funds, total_allocated, unallocated, movement }))
}

// ===========================================================================
// Analytics
// ===========================================================================

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct MonthPoint {
    pub month: String,
    pub amount: i64,
    pub gifts: i64,
    pub donors: i64,
}

#[derive(Debug, serde::Serialize)]
pub struct Analytics {
    pub months: Vec<MonthPoint>,
    pub by_method: Vec<LabelAmount>,
    pub by_category: Vec<LabelAmount>,
    pub by_giver_type: Vec<LabelAmount>,
    pub by_weekday: Vec<LabelAmount>,
    /// Giving this year against the same span last year.
    pub year_to_date: i64,
    pub same_span_last_year: i64,
    pub growth_percent: Option<f64>,
    pub average_gift: i64,
    pub median_gift: i64,
    /// Donors who gave this year and also last year, against those who did not.
    pub returning_donors: i64,
    pub new_donors: i64,
    pub lapsed_donors: i64,
    pub top_donor_share_percent: f64,
}

pub async fn analytics(
    _auth: AuthUser,
    Db(pool): Db,
) -> Result<Json<Analytics>, AppError> {
    let now = db_now(&pool).await?;

    let months = sqlx::query_as::<_, MonthPoint>(&format!(
        r#"SELECT to_char(m.month, 'YYYY-MM') AS month,
                  COALESCE(SUM(o.total_amount), 0)::bigint AS amount,
                  COUNT(o.id)::bigint AS gifts,
                  COUNT(DISTINCT CASE WHEN NOT o.is_anonymous THEN {DONOR_KEY} END)::bigint AS donors
             FROM generate_series(
                    date_trunc('month', $1::timestamp) - interval '11 months',
                    date_trunc('month', $1::timestamp), interval '1 month') AS m(month)
             LEFT JOIN offerings o
                    ON date_trunc('month', o.service_date) = m.month
                   AND o.status IN {COUNTED}
            GROUP BY m.month ORDER BY m.month"#
    ))
    .bind(now)
    .fetch_all(&pool)
    .await?;

    let by_method = sqlx::query_as::<_, LabelAmount>(&format!(
        r#"SELECT COALESCE(NULLIF(o.payment_method,''), 'unrecorded') AS label,
                  SUM(o.total_amount)::bigint AS amount, COUNT(*)::bigint AS count
             FROM offerings o WHERE o.status IN {COUNTED}
            GROUP BY 1 ORDER BY amount DESC"#
    ))
    .fetch_all(&pool)
    .await?;

    let by_category = sqlx::query_as::<_, LabelAmount>(&format!(
        r#"SELECT COALESCE(c.name, 'Uncategorised') AS label,
                  SUM(o.total_amount)::bigint AS amount, COUNT(*)::bigint AS count
             FROM offerings o LEFT JOIN offering_categories c ON c.id = o.category_id
            WHERE o.status IN {COUNTED}
            GROUP BY c.name ORDER BY amount DESC LIMIT 12"#
    ))
    .fetch_all(&pool)
    .await?;

    let by_giver_type = sqlx::query_as::<_, LabelAmount>(&format!(
        r#"SELECT COALESCE(NULLIF(o.giver_type,''), 'unspecified') AS label,
                  SUM(o.total_amount)::bigint AS amount, COUNT(*)::bigint AS count
             FROM offerings o WHERE o.status IN {COUNTED}
            GROUP BY 1 ORDER BY amount DESC"#
    ))
    .fetch_all(&pool)
    .await?;

    // Which service day actually brings the giving in.
    let by_weekday = sqlx::query_as::<_, LabelAmount>(&format!(
        r#"SELECT trim(to_char(o.service_date, 'Day')) AS label,
                  SUM(o.total_amount)::bigint AS amount, COUNT(*)::bigint AS count
             FROM offerings o WHERE o.status IN {COUNTED}
            GROUP BY 1, EXTRACT(DOW FROM o.service_date)
            ORDER BY EXTRACT(DOW FROM o.service_date)"#
    ))
    .fetch_all(&pool)
    .await?;

    // Year to date against the *same span* last year, not the whole of last
    // year — comparing eight months with twelve invents a collapse in giving.
    let (year_to_date, same_span_last_year): (i64, i64) = sqlx::query_as(&format!(
        r#"SELECT
             COALESCE(SUM(total_amount) FILTER (
               WHERE service_date >= date_trunc('year', $1::timestamp)::date
                 AND service_date <= $1::timestamp::date), 0)::bigint,
             COALESCE(SUM(total_amount) FILTER (
               WHERE service_date >= (date_trunc('year', $1::timestamp) - interval '1 year')::date
                 AND service_date <= ($1::timestamp - interval '1 year')::date), 0)::bigint
           FROM offerings WHERE status IN {COUNTED}"#
    ))
    .bind(now)
    .fetch_one(&pool)
    .await?;

    let growth_percent = if same_span_last_year > 0 {
        Some(
            (((year_to_date - same_span_last_year) as f64 / same_span_last_year as f64) * 1000.0)
                .round()
                / 10.0,
        )
    } else {
        None
    };

    // The median matters more than the mean here: one large gift drags an
    // average somewhere no actual gift sits.
    let (average_gift, median_gift): (i64, i64) = sqlx::query_as(&format!(
        r#"SELECT COALESCE(AVG(total_amount), 0)::bigint,
                  COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY total_amount), 0)::bigint
             FROM offerings WHERE status IN {COUNTED}"#
    ))
    .fetch_one(&pool)
    .await?;

    let (returning_donors, new_donors, lapsed_donors): (i64, i64, i64) = sqlx::query_as(&format!(
        r#"
        WITH keyed AS (
            SELECT {DONOR_KEY} AS k, o.service_date FROM offerings o
             WHERE o.status IN {COUNTED} AND NOT o.is_anonymous
        ),
        this_year AS (
            SELECT DISTINCT k FROM keyed
             WHERE service_date >= date_trunc('year', $1::timestamp)::date
        ),
        last_year AS (
            SELECT DISTINCT k FROM keyed
             WHERE service_date >= (date_trunc('year', $1::timestamp) - interval '1 year')::date
               AND service_date <  date_trunc('year', $1::timestamp)::date
        )
        SELECT (SELECT COUNT(*) FROM this_year t WHERE EXISTS (SELECT 1 FROM last_year l WHERE l.k = t.k))::bigint,
               (SELECT COUNT(*) FROM this_year t WHERE NOT EXISTS (SELECT 1 FROM last_year l WHERE l.k = t.k))::bigint,
               (SELECT COUNT(*) FROM last_year l WHERE NOT EXISTS (SELECT 1 FROM this_year t WHERE t.k = l.k))::bigint"#
    ))
    .bind(now)
    .fetch_one(&pool)
    .await?;

    // How much of the church's income rests on its ten largest givers. A
    // number worth knowing before one of them moves away.
    let top_donor_share_percent: f64 = sqlx::query_scalar(&format!(
        r#"
        WITH per_donor AS (
            SELECT {DONOR_KEY} AS k, SUM(o.total_amount)::bigint AS given
              FROM offerings o WHERE o.status IN {COUNTED} AND NOT o.is_anonymous
             GROUP BY 1
        ),
        top10 AS (SELECT given FROM per_donor ORDER BY given DESC LIMIT 10)
        SELECT CASE WHEN (SELECT COALESCE(SUM(given),0) FROM per_donor) > 0
                    THEN round((SELECT SUM(given) FROM top10)::numeric * 100
                               / (SELECT SUM(given) FROM per_donor), 1)::float8
                    ELSE 0::float8 END"#
    ))
    .fetch_one(&pool)
    .await?;

    Ok(Json(Analytics {
        months,
        by_method,
        by_category,
        by_giver_type,
        by_weekday,
        year_to_date,
        same_span_last_year,
        growth_percent,
        average_gift,
        median_gift,
        returning_donors,
        new_donors,
        lapsed_donors,
        top_donor_share_percent,
    }))
}

// ===========================================================================
// Recurring giving
// ===========================================================================

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct StandingOrder {
    pub id: uuid::Uuid,
    pub donor_name: String,
    pub donor_contact: String,
    pub member_id: Option<uuid::Uuid>,
    pub amount: i64,
    pub interval: String,
    pub gateway: String,
    pub fund_id: Option<uuid::Uuid>,
    pub fund_name: Option<String>,
    pub next_charge_at: Option<chrono::NaiveDateTime>,
    pub active: bool,
    pub paused_at: Option<chrono::NaiveDateTime>,
    pub cancelled_at: Option<chrono::NaiveDateTime>,
    pub started_on: chrono::NaiveDate,
    pub charge_count: i32,
    pub last_charged_at: Option<chrono::NaiveDateTime>,
    pub notes: String,
    /// Days until the next collection; negative means overdue. Derived, so it
    /// is right at read time rather than whenever a job last ran.
    pub days_until_due: Option<i32>,
    /// What this order is worth in a year, so weekly and monthly gifts in one
    /// list can be compared at all.
    pub annualised: i64,
}

#[derive(Debug, serde::Serialize)]
pub struct RecurringPage {
    pub data: Vec<StandingOrder>,
    pub active_count: i64,
    pub paused_count: i64,
    pub cancelled_count: i64,
    pub overdue_count: i64,
    pub annualised_total: i64,
    pub monthly_equivalent: i64,
}

/// A year's worth, whatever the rhythm.
const ANNUALISED: &str = r#"
    (r.amount * CASE r.interval
        WHEN 'weekly' THEN 52
        WHEN 'fortnightly' THEN 26
        WHEN 'monthly' THEN 12
        WHEN 'quarterly' THEN 4
        WHEN 'yearly' THEN 1
        ELSE 12 END)::bigint"#;

#[derive(Debug, serde::Deserialize, Default)]
pub struct RecurringQuery {
    /// `active`, `paused`, `cancelled` or `overdue`.
    pub view: Option<String>,
}

pub async fn recurring_list(
    _auth: AuthUser,
    Db(pool): Db,
    Query(q): Query<RecurringQuery>,
) -> Result<Json<RecurringPage>, AppError> {
    let now = db_now(&pool).await?;

    // Chosen from a fixed set, never built from the input.
    let view = match q.view.as_deref() {
        Some("active") => "AND r.active AND r.cancelled_at IS NULL",
        Some("paused") => "AND NOT r.active AND r.cancelled_at IS NULL",
        Some("cancelled") => "AND r.cancelled_at IS NOT NULL",
        Some("overdue") => {
            "AND r.active AND r.cancelled_at IS NULL AND r.next_charge_at < $1::timestamp"
        }
        _ => "",
    };

    let data = sqlx::query_as::<_, StandingOrder>(&format!(
        r#"SELECT r.id,
                  COALESCE(NULLIF(btrim(r.donor_name), ''),
                           NULLIF(btrim(p.first_name || ' ' || p.last_name), ''),
                           'Unnamed donor') AS donor_name,
                  COALESCE(NULLIF(r.donor_contact, ''), COALESCE(p.email, '')) AS donor_contact,
                  r.member_id, r.amount, r.interval, r.gateway,
                  r.fund_id, f.name AS fund_name,
                  r.next_charge_at, r.active, r.paused_at, r.cancelled_at,
                  r.started_on, r.charge_count, r.last_charged_at, r.notes,
                  (r.next_charge_at::date - $1::timestamp::date)::int AS days_until_due,
                  {ANNUALISED} AS annualised
             FROM recurring_donations r
             LEFT JOIN people p ON p.id = r.member_id
             LEFT JOIN funds f ON f.id = r.fund_id
            WHERE TRUE {view}
            ORDER BY r.cancelled_at NULLS FIRST, r.active DESC, r.next_charge_at NULLS LAST"#
    ))
    .bind(now)
    .fetch_all(&pool)
    .await?;

    let (active_count, paused_count, cancelled_count, overdue_count, annualised_total): (
        i64,
        i64,
        i64,
        i64,
        i64,
    ) = sqlx::query_as(&format!(
        r#"SELECT COUNT(*) FILTER (WHERE r.active AND r.cancelled_at IS NULL)::bigint,
                  COUNT(*) FILTER (WHERE NOT r.active AND r.cancelled_at IS NULL)::bigint,
                  COUNT(*) FILTER (WHERE r.cancelled_at IS NOT NULL)::bigint,
                  COUNT(*) FILTER (WHERE r.active AND r.cancelled_at IS NULL
                                     AND r.next_charge_at < $1::timestamp)::bigint,
                  COALESCE(SUM({ANNUALISED}) FILTER (
                      WHERE r.active AND r.cancelled_at IS NULL), 0)::bigint
             FROM recurring_donations r"#
    ))
    .bind(now)
    .fetch_one(&pool)
    .await?;

    Ok(Json(RecurringPage {
        data,
        active_count,
        paused_count,
        cancelled_count,
        overdue_count,
        annualised_total,
        monthly_equivalent: annualised_total / 12,
    }))
}

#[derive(Debug, serde::Deserialize)]
pub struct NewStandingOrder {
    pub donor_name: Option<String>,
    pub donor_contact: Option<String>,
    pub member_id: Option<uuid::Uuid>,
    pub amount: i64,
    pub interval: String,
    pub gateway: Option<String>,
    pub fund_id: Option<uuid::Uuid>,
    pub next_charge_at: Option<String>,
    pub notes: Option<String>,
}

pub async fn recurring_create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<NewStandingOrder>,
) -> Result<Json<serde_json::Value>, AppError> {
    let name = input.donor_name.unwrap_or_default().trim().to_string();
    // The database enforces this too; saying it here means a person gets a
    // sentence instead of a constraint violation.
    if input.member_id.is_none() && name.is_empty() {
        return Err(AppError::bad_request(
            "A standing order needs a donor — choose a person or type a name",
        ));
    }
    if input.amount <= 0 {
        return Err(AppError::bad_request("The amount must be more than zero"));
    }
    if !matches!(
        input.interval.as_str(),
        "weekly" | "fortnightly" | "monthly" | "quarterly" | "yearly"
    ) {
        return Err(AppError::bad_request(
            "Choose weekly, fortnightly, monthly, quarterly or yearly",
        ));
    }

    let id: uuid::Uuid = sqlx::query_scalar(
        r#"INSERT INTO recurring_donations
             (member_id, donor_name, donor_contact, amount, interval, gateway,
              fund_id, next_charge_at, notes, active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,
                   COALESCE($8::timestamp, NOW() + interval '1 month'), $9, TRUE)
           RETURNING id"#,
    )
    .bind(input.member_id)
    .bind(&name)
    .bind(input.donor_contact.unwrap_or_default().trim())
    .bind(input.amount)
    .bind(&input.interval)
    .bind(input.gateway.unwrap_or_else(|| "manual".into()))
    .bind(input.fund_id)
    .bind(&input.next_charge_at)
    .bind(input.notes.unwrap_or_default())
    .fetch_one(&pool)
    .await?;

    Ok(Json(serde_json::json!({ "id": id })))
}

/// Pause, resume or cancel.
///
/// Cancelling keeps the row. A standing order that stopped is history worth
/// having, and deleting it loses both when it stopped and that it existed.
pub async fn recurring_status(
    _auth: AuthUser,
    Db(pool): Db,
    Path((id, action)): Path<(uuid::Uuid, String)>,
) -> Result<Json<serde_json::Value>, AppError> {
    let sql = match action.as_str() {
        "pause" => {
            "UPDATE recurring_donations SET active = FALSE, paused_at = NOW(), updated_at = NOW()
              WHERE id = $1 AND cancelled_at IS NULL"
        }
        "resume" => {
            "UPDATE recurring_donations SET active = TRUE, paused_at = NULL, updated_at = NOW()
              WHERE id = $1 AND cancelled_at IS NULL"
        }
        "cancel" => {
            "UPDATE recurring_donations SET active = FALSE, cancelled_at = NOW(), updated_at = NOW()
              WHERE id = $1"
        }
        _ => return Err(AppError::bad_request("Unknown action")),
    };

    let res = sqlx::query(sql).bind(id).execute(&pool).await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found(
            "No standing order to change — it may already be cancelled",
        ));
    }
    Ok(Json(serde_json::json!({ "action": action })))
}

/// Record that a due order was collected, and move the schedule forward.
///
/// The next date is computed from the one that was due rather than from today,
/// so a collection entered three days late does not push every future date
/// three days out.
pub async fn recurring_collect(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let res = sqlx::query(
        r#"UPDATE recurring_donations
              SET charge_count = charge_count + 1,
                  last_charged_at = NOW(),
                  next_charge_at = COALESCE(next_charge_at, NOW()) + CASE interval
                      WHEN 'weekly' THEN interval '7 days'
                      WHEN 'fortnightly' THEN interval '14 days'
                      WHEN 'monthly' THEN interval '1 month'
                      WHEN 'quarterly' THEN interval '3 months'
                      WHEN 'yearly' THEN interval '1 year'
                      ELSE interval '1 month' END,
                  updated_at = NOW()
            WHERE id = $1 AND active AND cancelled_at IS NULL"#,
    )
    .bind(id)
    .execute(&pool)
    .await?;

    if res.rows_affected() == 0 {
        return Err(AppError::bad_request(
            "That standing order is not running, so nothing was collected",
        ));
    }
    Ok(Json(serde_json::json!({ "collected": true })))
}
