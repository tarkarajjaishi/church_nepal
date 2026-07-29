use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::offering::*;

pub async fn list(
    Db(pool): Db,
    Query(q): Query<ListQuery>,
) -> Result<Json<Vec<Offering>>, AppError> {
    let mut sql = String::from("SELECT * FROM offerings WHERE 1=1");
    if let Some(ref otype) = q.offering_type {
        sql.push_str(&format!(" AND offering_type = '{}'", otype));
    }
    if let Some(ref from) = q.from_date {
        sql.push_str(&format!(" AND service_date >= '{}'", from));
    }
    if let Some(ref to) = q.to_date {
        sql.push_str(&format!(" AND service_date <= '{}'", to));
    }
    sql.push_str(" ORDER BY service_date DESC, created_at DESC");
    let rows = sqlx::query_as::<_, Offering>(&sql).fetch_all(&pool).await?;
    Ok(Json(rows))
}

#[derive(serde::Deserialize, Default)]
pub struct ListQuery {
    pub offering_type: Option<String>,
    pub from_date: Option<String>,
    pub to_date: Option<String>,
}

pub async fn get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<OfferingWithItems>, AppError> {
    let offering = sqlx::query_as::<_, Offering>("SELECT * FROM offerings WHERE id = $1")
        .bind(id).fetch_optional(&pool).await?
        .ok_or_else(|| AppError::not_found("Offering not found"))?;
    let items = sqlx::query_as::<_, OfferingItem>(
        "SELECT * FROM offering_items WHERE offering_id = $1 ORDER BY created_at ASC"
    ).bind(id).fetch_all(&pool).await?;
    Ok(Json(OfferingWithItems { offering, items }))
}

pub async fn create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CreateOffering>,
) -> Result<Json<OfferingWithItems>, AppError> {
    let date = chrono::NaiveDate::parse_from_str(&input.service_date, "%Y-%m-%d")
        .map_err(|_| AppError::bad_request("Invalid date format, use YYYY-MM-DD"))?;

    let offering = sqlx::query_as::<_, Offering>(
        r#"INSERT INTO offerings (service_date, service_name, offering_type, total_amount, currency, recorded_by, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *"#
    )
    .bind(date)
    .bind(input.service_name.as_deref().unwrap_or("Sunday Service"))
    .bind(input.offering_type.as_deref().unwrap_or("general"))
    .bind(input.total_amount.unwrap_or(0))
    .bind(input.currency.as_deref().unwrap_or("NPR"))
    .bind(input.recorded_by.as_deref().unwrap_or(""))
    .bind(&input.notes)
    .fetch_one(&pool).await?;

    let mut items = Vec::new();
    if let Some(ref item_list) = input.items {
        for item in item_list {
            let oi = sqlx::query_as::<_, OfferingItem>(
                "INSERT INTO offering_items (offering_id, denomination, count, amount) VALUES ($1,$2,$3,$4) RETURNING *"
            )
            .bind(offering.id).bind(&item.denomination).bind(item.count).bind(item.amount)
            .fetch_one(&pool).await?;
            items.push(oi);
        }
    }

    Ok(Json(OfferingWithItems { offering, items }))
}

pub async fn update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdateOffering>,
) -> Result<Json<OfferingWithItems>, AppError> {
    let existing = sqlx::query_as::<_, Offering>("SELECT * FROM offerings WHERE id = $1")
        .bind(id).fetch_optional(&pool).await?
        .ok_or_else(|| AppError::not_found("Offering not found"))?;

    let date = input.service_date.as_deref()
        .and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok())
        .unwrap_or(existing.service_date);

    let offering = sqlx::query_as::<_, Offering>(
        r#"UPDATE offerings SET
            service_date=$2, service_name=COALESCE($3,service_name),
            offering_type=COALESCE($4,offering_type), total_amount=COALESCE($5,total_amount),
            currency=COALESCE($6,currency), recorded_by=COALESCE($7,recorded_by),
            notes=COALESCE($8,notes), updated_at=NOW()
         WHERE id=$1 RETURNING *"#
    )
    .bind(id).bind(date)
    .bind(input.service_name.as_deref().unwrap_or(&existing.service_name))
    .bind(input.offering_type.as_deref().unwrap_or(&existing.offering_type))
    .bind(input.total_amount.unwrap_or(existing.total_amount))
    .bind(input.currency.as_deref().unwrap_or(&existing.currency))
    .bind(input.recorded_by.as_deref().unwrap_or(&existing.recorded_by))
    .bind(input.notes.as_deref().or(existing.notes.as_deref()))
    .fetch_one(&pool).await?;

    // Replace items if provided
    if let Some(ref item_list) = input.items {
        sqlx::query("DELETE FROM offering_items WHERE offering_id = $1")
            .bind(id).execute(&pool).await?;
        for item in item_list {
            sqlx::query("INSERT INTO offering_items (offering_id, denomination, count, amount) VALUES ($1,$2,$3,$4)")
                .bind(id).bind(&item.denomination).bind(item.count).bind(item.amount)
                .execute(&pool).await?;
        }
    }

    let items = sqlx::query_as::<_, OfferingItem>(
        "SELECT * FROM offering_items WHERE offering_id = $1 ORDER BY created_at ASC"
    ).bind(id).fetch_all(&pool).await?;

    Ok(Json(OfferingWithItems { offering, items }))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM offering_items WHERE offering_id = $1").bind(id).execute(&pool).await?;
    sqlx::query("DELETE FROM offerings WHERE id = $1").bind(id).execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn stats(Db(pool): Db) -> Result<Json<OfferingStats>, AppError> {
    let this_month: (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(total_amount), 0)::bigint FROM offerings WHERE service_date >= date_trunc('month', CURRENT_DATE)"
    ).fetch_one(&pool).await?;

    let this_year: (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(total_amount), 0)::bigint FROM offerings WHERE service_date >= date_trunc('year', CURRENT_DATE)"
    ).fetch_one(&pool).await?;

    let all_time: (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(total_amount), 0)::bigint FROM offerings"
    ).fetch_one(&pool).await?;

    let count_month: (i64,) = sqlx::query_as(
        "SELECT COUNT(*)::bigint FROM offerings WHERE service_date >= date_trunc('month', CURRENT_DATE)"
    ).fetch_one(&pool).await?;

    let avg_per: (i64,) = sqlx::query_as(
        "SELECT COALESCE(AVG(total_amount), 0)::bigint FROM offerings WHERE service_date >= date_trunc('year', CURRENT_DATE)"
    ).fetch_one(&pool).await?;

    let by_type = sqlx::query_as::<_, TypeStat>(
        "SELECT offering_type, COALESCE(SUM(total_amount), 0)::bigint as total, COUNT(*)::bigint as count FROM offerings GROUP BY offering_type ORDER BY total DESC"
    ).fetch_all(&pool).await?;

    let monthly_trend = sqlx::query_as::<_, MonthlyStat>(
        "SELECT to_char(service_date, 'YYYY-MM') as month, COALESCE(SUM(total_amount), 0)::bigint as total, COUNT(*)::bigint as count FROM offerings WHERE service_date >= (CURRENT_DATE - INTERVAL '12 months') GROUP BY to_char(service_date, 'YYYY-MM') ORDER BY month DESC"
    ).fetch_all(&pool).await?;

    Ok(Json(OfferingStats {
        total_this_month: this_month.0,
        total_this_year: this_year.0,
        total_all_time: all_time.0,
        count_this_month: count_month.0,
        avg_per_service: avg_per.0,
        by_type,
        monthly_trend,
    }))
}
