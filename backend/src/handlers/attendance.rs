use crate::tenant::Db;
use axum::extract::Query;
use axum::Json;
use chrono::{Duration, NaiveDate};
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::attendance::{Attendance, CreateAttendance};
use crate::handlers::audit::create_audit_entry;

#[derive(serde::Deserialize, Default)]
pub struct ListQuery {
    pub date: Option<String>,
}

#[derive(serde::Deserialize, Default)]
pub struct TrendsQuery {
    pub start: Option<String>,
    pub end: Option<String>,
    pub range: Option<String>,
}

#[derive(serde::Deserialize, Default)]
pub struct ByServiceQuery {
    pub date: Option<String>,
    pub start: Option<String>,
    pub end: Option<String>,
}

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct ServiceCountRow {
    pub service_name: String,
    pub count: i64,
}

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct TrendRow {
    pub service_date: chrono::NaiveDate,
    pub count: i64,
}

pub async fn list(
    Db(pool): Db,
    Query(q): Query<ListQuery>,
) -> Result<Json<Vec<Attendance>>, AppError> {
    if let Some(ref d) = q.date {
        let date = NaiveDate::parse_from_str(d, "%Y-%m-%d")
            .map_err(|_| AppError::bad_request("Invalid date format, use YYYY-MM-DD"))?;
        let rows = sqlx::query_as::<_, Attendance>(
            "SELECT * FROM attendance WHERE service_date = $1 ORDER BY checked_in_at DESC",
        )
        .bind(date)
        .fetch_all(&pool)
        .await?;
        Ok(Json(rows))
    } else {
        let rows = sqlx::query_as::<_, Attendance>(
            "SELECT * FROM attendance ORDER BY checked_in_at DESC LIMIT 200",
        )
        .fetch_all(&pool)
        .await?;
        Ok(Json(rows))
    }
}

pub async fn check_in(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CreateAttendance>,
) -> Result<Json<Attendance>, AppError> {
    let date = NaiveDate::parse_from_str(&input.service_date, "%Y-%m-%d")
        .map_err(|_| AppError::bad_request("Invalid date format, use YYYY-MM-DD"))?;
    let row = sqlx::query_as::<_, Attendance>(
        r#"INSERT INTO attendance (event_id, person_id, name, service_date, service_name)
            VALUES ($1, $2, $3, $4, $5) RETURNING *"#,
    )
    .bind(input.event_id)
    .bind(input.person_id)
    .bind(&input.name)
    .bind(date)
    .bind(&input.service_name)
    .fetch_one(&pool)
    .await?;

    let _ = create_audit_entry(
        &pool,
        &_auth.email,
        "check_in",
        "attendance",
        &row.id.to_string(),
        Some(serde_json::json!({
            "event_id": input.event_id,
            "person_id": input.person_id,
            "name": input.name,
            "service_date": input.service_date,
            "service_name": input.service_name
        }))
    )
    .await;

    Ok(Json(row))
}

pub async fn stats(
    Db(pool): Db,
) -> Result<Json<serde_json::Value>, AppError> {
    let today_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM attendance WHERE service_date = CURRENT_DATE",
    )
    .fetch_one(&pool)
    .await?;

    let total_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM attendance",
    )
    .fetch_one(&pool)
    .await?;

    let week_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM attendance WHERE service_date >= CURRENT_DATE - INTERVAL '7 days'",
    )
    .fetch_one(&pool)
    .await?;

    Ok(Json(serde_json::json!({
        "today": today_count.0,
        "this_week": week_count.0,
        "total": total_count.0,
    })))
}

pub async fn trends(
    Db(pool): Db,
    Query(q): Query<TrendsQuery>,
) -> Result<Json<Vec<TrendRow>>, AppError> {
    let (start, end) = match (q.start.as_deref(), q.end.as_deref(), q.range.as_deref()) {
        (Some(s), Some(e), _) => {
            let start = NaiveDate::parse_from_str(s, "%Y-%m-%d")
                .map_err(|_| AppError::bad_request("Invalid start format, use YYYY-MM-DD"))?;
            let end = NaiveDate::parse_from_str(e, "%Y-%m-%d")
                .map_err(|_| AppError::bad_request("Invalid end format, use YYYY-MM-DD"))?;
            (start, end)
        }
        (_, _, Some("7d")) => {
            let end = chrono::Local::now().date_naive();
            let start = end - Duration::days(6);
            (start, end)
        }
        (_, _, Some("30d")) => {
            let end = chrono::Local::now().date_naive();
            let start = end - Duration::days(29);
            (start, end)
        }
        (_, _, Some("all")) => {
            let end = chrono::Local::now().date_naive();
            let start = NaiveDate::from_ymd_opt(2000, 1, 1).unwrap();
            (start, end)
        }
        _ => {
            let end = chrono::Local::now().date_naive();
            let start = end - Duration::days(29);
            (start, end)
        }
    };

    let rows = sqlx::query_as::<_, TrendRow>(
        r#"SELECT service_date, COUNT(*) as count
           FROM attendance
           WHERE service_date >= $1 AND service_date <= $2
           GROUP BY service_date
           ORDER BY service_date ASC"#,
    )
    .bind(start)
    .bind(end)
    .fetch_all(&pool)
    .await?;

    Ok(Json(rows))
}

pub async fn by_service(
    Db(pool): Db,
    Query(q): Query<ByServiceQuery>,
) -> Result<Json<Vec<ServiceCountRow>>, AppError> {
    let target_date = match (q.date.as_deref(), q.start.as_deref(), q.end.as_deref()) {
        (Some(d), _, _) => NaiveDate::parse_from_str(d, "%Y-%m-%d")
            .map_err(|_| AppError::bad_request("Invalid date format, use YYYY-MM-DD"))?,
        (_, Some(s), Some(e)) => {
            let start = NaiveDate::parse_from_str(s, "%Y-%m-%d")
                .map_err(|_| AppError::bad_request("Invalid start format, use YYYY-MM-DD"))?;
            let end = NaiveDate::parse_from_str(e, "%Y-%m-%d")
                .map_err(|_| AppError::bad_request("Invalid end format, use YYYY-MM-DD"))?;
            let rows = sqlx::query_as::<_, ServiceCountRow>(
                r#"SELECT service_name, COUNT(*) as count
                   FROM attendance
                   WHERE service_date >= $1 AND service_date <= $2
                   GROUP BY service_name ORDER BY count DESC"#,
            )
            .bind(start)
            .bind(end)
            .fetch_all(&pool)
            .await?;
            return Ok(Json(rows));
        }
        _ => chrono::Local::now().date_naive(),
    };

    let rows = sqlx::query_as::<_, ServiceCountRow>(
        r#"SELECT service_name, COUNT(*) as count
           FROM attendance
           WHERE service_date = $1
           GROUP BY service_name ORDER BY count DESC"#,
    )
    .bind(target_date)
    .fetch_all(&pool)
    .await?;

    Ok(Json(rows))
}

