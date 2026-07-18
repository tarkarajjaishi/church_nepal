use crate::tenant::Db;
use axum::extract::{State, Query};
use axum::Json;
use chrono::NaiveDate;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::attendance::{Attendance, CreateAttendance};

#[derive(serde::Deserialize, Default)]
pub struct ListQuery {
    pub date: Option<String>,
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
        r#"INSERT INTO attendance (event_id, name, service_date, service_name)
           VALUES ($1, $2, $3, $4) RETURNING *"#,
    )
    .bind(input.event_id)
    .bind(&input.name)
    .bind(date)
    .bind(&input.service_name)
    .fetch_one(&pool)
    .await?;
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
