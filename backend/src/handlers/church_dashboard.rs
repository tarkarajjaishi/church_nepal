//! Executive church dashboard.
//!
//! One endpoint returning everything the overview needs. A card-per-request
//! design would fire ~20 requests on every load, and the page would render in
//! visible stages; a single aggregate keeps it one round trip.
//!
//! Honesty rule: this only reports on data that exists. Help desk, assets,
//! library and expenses have no tables in this system, so their figures are
//! reported as *absent* via `modules`, never as zero. A finance or care
//! dashboard showing a confident "0 open tickets" when no ticketing system is
//! installed is worse than showing nothing — it invites a decision based on a
//! number that means nothing.

use crate::error::AppError;
use crate::tenant::Db;
use axum::Json;
use serde::Serialize;
use sqlx::PgPool;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct TrendPoint {
    pub label: String,
    pub value: i64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Breakdown {
    pub label: String,
    pub value: i64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct PersonBrief {
    pub id: uuid::Uuid,
    pub name: String,
    pub detail: Option<String>,
    pub photo: Option<String>,
}

/// `events.date` is a VARCHAR holding an ISO-8601 string, not a timestamp, so
/// it is carried as text. That is also why the queries below sort on it
/// directly: ISO-8601 sorts lexicographically in chronological order, and
/// casting every row to compare would defeat any index on the column.
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct EventBrief {
    pub id: uuid::Uuid,
    pub title: String,
    pub date: String,
    pub display_date: Option<String>,
    pub time: Option<String>,
    pub location: Option<String>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct TaskBrief {
    pub id: uuid::Uuid,
    pub title: String,
    pub priority: String,
    pub status: String,
    pub due_date: Option<chrono::NaiveDate>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ActivityItem {
    pub kind: String,
    pub title: String,
    pub detail: Option<String>,
    pub at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize)]
pub struct AttendanceSummary {
    pub today: i64,
    pub this_week: i64,
    pub this_month: i64,
    pub average: i64,
    pub highest: i64,
    pub lowest: i64,
    pub growth_pct: f64,
    pub weekly_trend: Vec<TrendPoint>,
    pub by_service: Vec<Breakdown>,
}

#[derive(Debug, Serialize)]
pub struct PeopleSummary {
    pub total: i64,
    pub active_members: i64,
    pub visitors: i64,
    pub new_this_month: i64,
    pub inactive: i64,
    pub pending_applications: i64,
    pub households: i64,
    pub groups: i64,
}

#[derive(Debug, Serialize)]
pub struct FinanceSummary {
    pub offering_today: i64,
    pub offering_this_month: i64,
    pub offering_this_year: i64,
    pub pending_approval: i64,
    pub pending_deposits: i64,
    pub active_campaigns: i64,
    pub currency: String,
}

#[derive(Debug, Serialize)]
pub struct CareSummary {
    pub prayer_pending: i64,
    pub prayer_answered: i64,
    pub prayer_recent: Vec<ActivityItem>,
    pub unread_notifications: i64,
    pub unread_messages: i64,
}

#[derive(Debug, Serialize)]
pub struct TaskSummary {
    pub open: i64,
    pub overdue: i64,
    pub due_today: i64,
    pub completed_this_week: i64,
    pub items: Vec<TaskBrief>,
}

/// Which optional modules actually exist in this database.
///
/// The UI uses this to render "not installed" instead of a zero for anything
/// the system cannot truthfully report on.
#[derive(Debug, Serialize)]
pub struct ModuleAvailability {
    pub help_desk: bool,
    pub assets: bool,
    pub library: bool,
    pub expenses: bool,
    pub offerings: bool,
    pub presentation: bool,
}

#[derive(Debug, Serialize)]
pub struct ChurchDashboard {
    pub generated_at: chrono::NaiveDateTime,
    pub attendance: AttendanceSummary,
    pub people: PeopleSummary,
    pub finance: FinanceSummary,
    pub care: CareSummary,
    pub tasks: TaskSummary,
    pub birthdays_today: Vec<PersonBrief>,
    pub anniversaries_today: Vec<PersonBrief>,
    pub newest_people: Vec<PersonBrief>,
    pub events_today: Vec<EventBrief>,
    pub events_upcoming: Vec<EventBrief>,
    pub volunteer_upcoming: Vec<ActivityItem>,
    pub activity: Vec<ActivityItem>,
    pub modules: ModuleAvailability,
}

/// Does a table exist in this database?
///
/// Cheaper than catching a failed query, and lets the response distinguish
/// "no rows" from "no such module" — which is the whole point of `modules`.
async fn table_exists(pool: &PgPool, name: &str) -> bool {
    sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = $1)",
    )
    .bind(name)
    .fetch_one(pool)
    .await
    .unwrap_or(false)
}

pub async fn overview(Db(pool): Db) -> Result<Json<ChurchDashboard>, AppError> {
    // ---- attendance -------------------------------------------------------
    let (today, week, month): (i64, i64, i64) = sqlx::query_as(
        r#"SELECT
             COUNT(*) FILTER (WHERE service_date = CURRENT_DATE),
             COUNT(*) FILTER (WHERE service_date >= date_trunc('week', CURRENT_DATE)::date),
             COUNT(*) FILTER (WHERE service_date >= date_trunc('month', CURRENT_DATE)::date)
           FROM attendance"#,
    )
    .fetch_one(&pool)
    .await?;

    // Per-service-date totals over the last 12 weeks, so average/high/low
    // describe a *service*, not a row count.
    let per_service: Vec<(chrono::NaiveDate, i64)> = sqlx::query_as(
        r#"SELECT service_date, COUNT(*)::bigint
           FROM attendance
           WHERE service_date >= CURRENT_DATE - INTERVAL '84 days'
           GROUP BY service_date ORDER BY service_date"#,
    )
    .fetch_all(&pool)
    .await?;

    let counts: Vec<i64> = per_service.iter().map(|(_, c)| *c).collect();
    let average = if counts.is_empty() { 0 } else { counts.iter().sum::<i64>() / counts.len() as i64 };
    let highest = counts.iter().copied().max().unwrap_or(0);
    let lowest = counts.iter().copied().min().unwrap_or(0);

    // Growth compares the last 4 services with the 4 before them. Comparing
    // single services would swing wildly on weather alone.
    let growth_pct = {
        let n = counts.len();
        if n >= 8 {
            let recent: i64 = counts[n - 4..].iter().sum();
            let prior: i64 = counts[n - 8..n - 4].iter().sum();
            if prior > 0 { ((recent - prior) as f64 / prior as f64) * 100.0 } else { 0.0 }
        } else {
            0.0
        }
    };

    let weekly_trend = sqlx::query_as::<_, TrendPoint>(
        r#"SELECT to_char(date_trunc('week', service_date), 'DD Mon') AS label,
                  COUNT(*)::bigint AS value
           FROM attendance
           WHERE service_date >= CURRENT_DATE - INTERVAL '84 days'
           GROUP BY date_trunc('week', service_date)
           ORDER BY date_trunc('week', service_date)"#,
    )
    .fetch_all(&pool)
    .await?;

    let by_service = sqlx::query_as::<_, Breakdown>(
        r#"SELECT COALESCE(NULLIF(service_name, ''), 'Unspecified') AS label,
                  COUNT(*)::bigint AS value
           FROM attendance
           WHERE service_date >= CURRENT_DATE - INTERVAL '84 days'
           GROUP BY 1 ORDER BY value DESC LIMIT 8"#,
    )
    .fetch_all(&pool)
    .await?;

    // ---- people -----------------------------------------------------------
    let (total, active_members, visitors, new_this_month, inactive): (i64, i64, i64, i64, i64) =
        sqlx::query_as(
            r#"SELECT
                 COUNT(*) FILTER (WHERE enabled),
                 COUNT(*) FILTER (WHERE enabled AND member_status = 'member'),
                 COUNT(*) FILTER (WHERE enabled AND member_status = 'visitor'),
                 COUNT(*) FILTER (WHERE enabled AND joined_date >= date_trunc('month', CURRENT_DATE)::date),
                 COUNT(*) FILTER (WHERE member_status = 'inactive' OR NOT enabled)
               FROM people"#,
        )
        .fetch_one(&pool)
        .await?;

    let pending_applications: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM member_applications WHERE status = 'pending'")
            .fetch_one(&pool)
            .await
            .unwrap_or(0);
    let households: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM households")
        .fetch_one(&pool)
        .await
        .unwrap_or(0);
    let groups: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM groups WHERE enabled")
        .fetch_one(&pool)
        .await
        .unwrap_or(0);

    // ---- birthdays & anniversaries ---------------------------------------
    // EXTRACT matches the functional index from migration 064; to_char would
    // not use it and is not immutable anyway.
    let birthdays_today = sqlx::query_as::<_, PersonBrief>(
        r#"SELECT id,
                  TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) AS name,
                  CASE WHEN date_of_birth IS NOT NULL
                       THEN (EXTRACT(YEAR FROM AGE(date_of_birth))::int)::text || ' today'
                  END AS detail,
                  photo
           FROM people
           WHERE enabled AND date_of_birth IS NOT NULL
             AND EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
             AND EXTRACT(DAY   FROM date_of_birth) = EXTRACT(DAY   FROM CURRENT_DATE)
           ORDER BY name LIMIT 20"#,
    )
    .fetch_all(&pool)
    .await?;

    let anniversaries_today = sqlx::query_as::<_, PersonBrief>(
        r#"SELECT id,
                  TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) AS name,
                  (EXTRACT(YEAR FROM AGE(anniversary))::int)::text || ' years' AS detail,
                  photo
           FROM people
           WHERE enabled AND anniversary IS NOT NULL
             AND EXTRACT(MONTH FROM anniversary) = EXTRACT(MONTH FROM CURRENT_DATE)
             AND EXTRACT(DAY   FROM anniversary) = EXTRACT(DAY   FROM CURRENT_DATE)
           ORDER BY name LIMIT 20"#,
    )
    .fetch_all(&pool)
    .await?;

    let newest_people = sqlx::query_as::<_, PersonBrief>(
        r#"SELECT id,
                  TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) AS name,
                  member_status AS detail,
                  photo
           FROM people
           WHERE enabled
           ORDER BY COALESCE(joined_date, created_at::date) DESC NULLS LAST, created_at DESC
           LIMIT 8"#,
    )
    .fetch_all(&pool)
    .await?;

    // ---- events -----------------------------------------------------------
    let events_today = sqlx::query_as::<_, EventBrief>(
        r#"SELECT id, title, date, display_date, time, location
           FROM events
           WHERE enabled AND date::date = CURRENT_DATE
           ORDER BY date LIMIT 10"#,
    )
    .fetch_all(&pool)
    .await?;

    let events_upcoming = sqlx::query_as::<_, EventBrief>(
        r#"SELECT id, title, date, display_date, time, location
           FROM events
           WHERE enabled AND date::date > CURRENT_DATE
           ORDER BY date LIMIT 8"#,
    )
    .fetch_all(&pool)
    .await?;

    // ---- finance ----------------------------------------------------------
    // Mirrors the Offering module's definition of "counted" so the two pages
    // cannot disagree about the same day's total.
    let (offering_today, offering_month, offering_year, pending_approval): (i64, i64, i64, i64) =
        sqlx::query_as(
            r#"SELECT
                 COALESCE(SUM(total_amount) FILTER (WHERE service_date = CURRENT_DATE), 0)::bigint,
                 COALESCE(SUM(total_amount) FILTER (WHERE service_date >= date_trunc('month', CURRENT_DATE)::date), 0)::bigint,
                 COALESCE(SUM(total_amount) FILTER (WHERE service_date >= date_trunc('year', CURRENT_DATE)::date), 0)::bigint,
                 COUNT(*) FILTER (WHERE status IN ('submitted','counted'))
               FROM offerings
               WHERE status IN ('submitted','counted','approved')"#,
        )
        .fetch_one(&pool)
        .await
        .unwrap_or((0, 0, 0, 0));

    let pending_deposits: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(amount),0)::bigint FROM deposits WHERE status IN ('pending','deposited')",
    )
    .fetch_one(&pool)
    .await
    .unwrap_or(0);

    let active_campaigns: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM campaigns WHERE is_active = true")
            .fetch_one(&pool)
            .await
            .unwrap_or(0);

    let currency: String =
        sqlx::query_scalar("SELECT currency FROM offerings ORDER BY created_at DESC LIMIT 1")
            .fetch_optional(&pool)
            .await
            .ok()
            .flatten()
            .unwrap_or_else(|| "NPR".into());

    // ---- care -------------------------------------------------------------
    let (prayer_pending, prayer_answered): (i64, i64) = sqlx::query_as(
        "SELECT COUNT(*) FILTER (WHERE status = 'pending'),
                COUNT(*) FILTER (WHERE status = 'answered')
         FROM prayer_requests",
    )
    .fetch_one(&pool)
    .await
    .unwrap_or((0, 0));

    let prayer_recent = sqlx::query_as::<_, ActivityItem>(
        r#"SELECT 'prayer' AS kind,
                  CASE WHEN anonymous THEN 'Anonymous' ELSE COALESCE(NULLIF(name,''), 'Anonymous') END AS title,
                  LEFT(message, 120) AS detail,
                  created_at AS at
           FROM prayer_requests ORDER BY created_at DESC LIMIT 6"#,
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    let unread_notifications: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM notifications WHERE NOT read")
            .fetch_one(&pool)
            .await
            .unwrap_or(0);

    let unread_messages: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM contact_messages WHERE status = 'new'")
            .fetch_one(&pool)
            .await
            .unwrap_or(0);

    // ---- tasks ------------------------------------------------------------
    //
    // `todos.due_date` is VARCHAR holding either '' or an ISO date, not a DATE
    // column, so it needs NULLIF + cast before any comparison. Comparing it to
    // CURRENT_DATE directly raises "invalid input syntax for type date" on the
    // empty string — and because this used to be wrapped in unwrap_or, that
    // error surfaced as a confident 0 open tasks rather than as a failure.
    // No unwrap_or here now: a broken aggregate must fail loudly, since a
    // wrong number on a dashboard is worse than a missing one.
    let (open, overdue, due_today, completed_week): (i64, i64, i64, i64) = sqlx::query_as(
        r#"SELECT
             COUNT(*) FILTER (WHERE status <> 'done'),
             COUNT(*) FILTER (WHERE status <> 'done' AND NULLIF(due_date,'')::date < CURRENT_DATE),
             COUNT(*) FILTER (WHERE status <> 'done' AND NULLIF(due_date,'')::date = CURRENT_DATE),
             COUNT(*) FILTER (WHERE status = 'done' AND updated_at >= date_trunc('week', CURRENT_DATE))
           FROM todos"#,
    )
    .fetch_one(&pool)
    .await?;

    // Overdue first, then soonest due; undated tasks last rather than first.
    let task_items = sqlx::query_as::<_, TaskBrief>(
        r#"SELECT id, title, priority, status, NULLIF(due_date,'')::date AS due_date
           FROM todos WHERE status <> 'done'
           ORDER BY (NULLIF(due_date,'')::date IS NULL), NULLIF(due_date,'')::date ASC,
                    CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END
           LIMIT 8"#,
    )
    .fetch_all(&pool)
    .await?;

    // ---- volunteers -------------------------------------------------------
    let volunteer_upcoming = sqlx::query_as::<_, ActivityItem>(
        r#"SELECT 'volunteer' AS kind, s.title AS title,
                  (COUNT(a.id)::text || ' of ' || s.slots::text || ' filled') AS detail,
                  (s.shift_date + COALESCE(s.start_time, TIME '00:00'))::timestamp AS at
           FROM volunteer_shifts s
           LEFT JOIN volunteer_assignments a ON a.shift_id = s.id AND a.status <> 'declined'
           WHERE s.shift_date >= CURRENT_DATE
           GROUP BY s.id, s.title, s.slots, s.shift_date, s.start_time
           ORDER BY s.shift_date, s.start_time LIMIT 6"#,
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    // ---- activity feed ----------------------------------------------------
    // UNION ALL across sources, newest first. Each arm is individually cheap
    // and bounded, so the union stays small regardless of table size.
    let activity = sqlx::query_as::<_, ActivityItem>(
        r#"(SELECT 'person' AS kind,
                   TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) AS title,
                   member_status AS detail, created_at AS at
            FROM people WHERE enabled ORDER BY created_at DESC LIMIT 5)
           UNION ALL
           (SELECT 'attendance', service_name, name, checked_in_at
            FROM attendance ORDER BY checked_in_at DESC LIMIT 5)
           UNION ALL
           (SELECT 'offering', COALESCE(receipt_no, 'Offering'),
                   service_name, created_at
            FROM offerings WHERE status <> 'draft' ORDER BY created_at DESC LIMIT 5)
           UNION ALL
           (SELECT 'donation', COALESCE(NULLIF(donor_name,''), 'Anonymous'),
                   payment_method, created_at
            FROM donations ORDER BY created_at DESC LIMIT 5)
           UNION ALL
           (SELECT 'prayer',
                   CASE WHEN anonymous THEN 'Anonymous' ELSE COALESCE(NULLIF(name,''), 'Anonymous') END,
                   LEFT(message, 80), created_at
            FROM prayer_requests ORDER BY created_at DESC LIMIT 5)
           ORDER BY at DESC LIMIT 20"#,
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    // ---- module availability ---------------------------------------------
    let modules = ModuleAvailability {
        help_desk: table_exists(&pool, "helpdesk_tickets").await,
        assets: table_exists(&pool, "assets").await,
        library: table_exists(&pool, "library_books").await,
        expenses: table_exists(&pool, "expenses").await,
        offerings: table_exists(&pool, "offering_categories").await,
        presentation: table_exists(&pool, "presentations").await,
    };

    Ok(Json(ChurchDashboard {
        generated_at: chrono::Utc::now().naive_utc(),
        attendance: AttendanceSummary {
            today,
            this_week: week,
            this_month: month,
            average,
            highest,
            lowest,
            growth_pct: (growth_pct * 10.0).round() / 10.0,
            weekly_trend,
            by_service,
        },
        people: PeopleSummary {
            total,
            active_members,
            visitors,
            new_this_month,
            inactive,
            pending_applications,
            households,
            groups,
        },
        finance: FinanceSummary {
            offering_today,
            offering_this_month: offering_month,
            offering_this_year: offering_year,
            pending_approval,
            pending_deposits,
            active_campaigns,
            currency,
        },
        care: CareSummary {
            prayer_pending,
            prayer_answered,
            prayer_recent,
            unread_notifications,
            unread_messages,
        },
        tasks: TaskSummary {
            open,
            overdue,
            due_today,
            completed_this_week: completed_week,
            items: task_items,
        },
        birthdays_today,
        anniversaries_today,
        newest_people,
        events_today,
        events_upcoming,
        volunteer_upcoming,
        activity,
        modules,
    }))
}
