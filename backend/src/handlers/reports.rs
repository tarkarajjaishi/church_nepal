use crate::tenant::Db;
use axum::Json;
use crate::error::AppError;

pub async fn giving_summary(
    Db(pool): Db,
) -> Result<Json<serde_json::Value>, AppError> {
    let total_raised: (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(amount)::bigint, 0) FROM donations WHERE status = 'completed'",
    )
    .fetch_one(&pool)
    .await?;

    let total_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM donations WHERE status = 'completed'",
    )
    .fetch_one(&pool)
    .await?;

    let month_raised: (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(amount)::bigint, 0) FROM donations WHERE status = 'completed' AND created_at >= date_trunc('month', CURRENT_DATE)",
    )
    .fetch_one(&pool)
    .await?;

    let year_raised: (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(amount)::bigint, 0) FROM donations WHERE status = 'completed' AND created_at >= date_trunc('year', CURRENT_DATE)",
    )
    .fetch_one(&pool)
    .await?;

    let month_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM donations WHERE status = 'completed' AND created_at >= date_trunc('month', CURRENT_DATE)",
    )
    .fetch_one(&pool)
    .await?;

    let avg_donation: (i64,) = sqlx::query_as(
        "SELECT COALESCE(AVG(amount)::bigint, 0) FROM donations WHERE status = 'completed' AND created_at >= date_trunc('year', CURRENT_DATE)",
    )
    .fetch_one(&pool)
    .await?;

    let top_donors = sqlx::query_as::<_, (Option<String>, Option<String>, i64, i64)>(
        r#"SELECT donor_email, donor_name, COALESCE(SUM(amount), 0)::bigint AS total, COUNT(*) AS count
           FROM donations WHERE status = 'completed'
           GROUP BY donor_email, donor_name
           ORDER BY total DESC LIMIT 10"#,
    )
    .fetch_all(&pool)
    .await?;

    let top_list: Vec<serde_json::Value> = top_donors
        .into_iter()
        .map(|(email, name, total, count)| {
            serde_json::json!({
                "donor_email": email.as_deref().unwrap_or(""),
                "donor_name": name.as_deref().unwrap_or("Anonymous"),
                "total": total,
                "count": count,
            })
        })
        .collect();

    Ok(Json(serde_json::json!({
        "total_raised": total_raised.0,
        "total_donations": total_count.0,
        "month_raised": month_raised.0,
        "year_raised": year_raised.0,
        "month_donations": month_count.0,
        "avg_donation": avg_donation.0,
        "top_donors": top_list,
    })))
}

pub async fn people_summary(
    Db(pool): Db,
) -> Result<Json<serde_json::Value>, AppError> {
    let total_people: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM people",
    )
    .fetch_one(&pool)
    .await?;

    let total_members: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM members",
    )
    .fetch_one(&pool)
    .await?;

    let total_groups: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM groups",
    )
    .fetch_one(&pool)
    .await?;

    let total_volunteers: (i64,) = sqlx::query_as(
        "SELECT COUNT(DISTINCT name) FROM volunteer_assignments WHERE status = 'assigned'",
    )
    .fetch_one(&pool)
    .await?;

    let total_subscribers: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM newsletter_subscribers WHERE active = true",
    )
    .fetch_one(&pool)
    .await?;

    let total_rsvps: (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(guests), 0) FROM event_rsvps",
    )
    .fetch_one(&pool)
    .await?;

    Ok(Json(serde_json::json!({
        "total_people": total_people.0,
        "total_members": total_members.0,
        "total_groups": total_groups.0,
        "total_volunteers": total_volunteers.0,
        "total_subscribers": total_subscribers.0,
        "total_rsvps": total_rsvps.0,
    })))
}
