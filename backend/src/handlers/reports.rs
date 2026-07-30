//! Reports.
//!
//! These two handlers existed for a long time but were never routed, and the
//! shape they returned shared almost no field names with the page that reads
//! them. `/admin/reports` therefore rendered empty charts and zeroed cards
//! from a 404 its `= {}` defaults swallowed — a page that looked like a report
//! and reported nothing.
//!
//! The keys below are the ones the page actually reads. They are also mounted
//! under the module each summary draws from (`/donations/summary`,
//! `/people/summary`) rather than a shared `/reports` prefix, so the giving
//! half needs `giving.view` and the people half needs `people.view`: a
//! volunteer coordinator gets the people report and no donor figures.
//!
//! Money is i64 minor units throughout, as everywhere else.

use crate::error::AppError;
use crate::tenant::Db;
use axum::Json;

/// Percentage change, guarding the division that makes a first month look
/// infinitely successful.
fn change(now: i64, before: i64) -> f64 {
    if before == 0 {
        // No baseline is not a 100% rise. Zero is the honest answer.
        return if now == 0 { 0.0 } else { 100.0 };
    }
    (((now - before) as f64 / before as f64) * 100.0 * 10.0).round() / 10.0
}

const COMPLETED: &str = "status = 'completed' AND refund_status <> 'refunded'";

pub async fn giving_summary(Db(pool): Db) -> Result<Json<serde_json::Value>, AppError> {
    // Net of refunds everywhere: a refunded gift that still counts is the
    // reason a treasurer stops trusting the report.
    let net = "COALESCE(SUM(amount - COALESCE(refund_amount, 0))::bigint, 0)";

    let (total_giving, total_donors, average_gift): (i64, i64, i64) = sqlx::query_as(&format!(
        "SELECT {net},
                COUNT(DISTINCT COALESCE(NULLIF(donor_email,''), donor_name)),
                COALESCE(AVG(amount - COALESCE(refund_amount, 0))::bigint, 0)
         FROM donations WHERE {COMPLETED}"
    ))
    .fetch_one(&pool)
    .await?;

    let (this_month, month_donors): (i64, i64) = sqlx::query_as(&format!(
        "SELECT {net}, COUNT(DISTINCT COALESCE(NULLIF(donor_email,''), donor_name))
         FROM donations
         WHERE {COMPLETED} AND created_at >= date_trunc('month', CURRENT_DATE)"
    ))
    .fetch_one(&pool)
    .await?;

    let (last_month, last_month_donors): (i64, i64) = sqlx::query_as(&format!(
        "SELECT {net}, COUNT(DISTINCT COALESCE(NULLIF(donor_email,''), donor_name))
         FROM donations
         WHERE {COMPLETED}
           AND created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
           AND created_at <  date_trunc('month', CURRENT_DATE)"
    ))
    .fetch_one(&pool)
    .await?;

    // Twelve months, gap-filled. Without generate_series a quiet month simply
    // vanishes from the chart and the line joins across it, which reads as
    // steady giving through a month when nothing came in.
    let monthly = sqlx::query_as::<_, (String, i64)>(&format!(
        "SELECT to_char(m.month, 'Mon YYYY') AS month,
                COALESCE(d.total, 0)::bigint AS total
         FROM generate_series(
                date_trunc('month', CURRENT_DATE) - INTERVAL '11 months',
                date_trunc('month', CURRENT_DATE),
                INTERVAL '1 month') AS m(month)
         LEFT JOIN (
             SELECT date_trunc('month', created_at) AS month, {net} AS total
             FROM donations WHERE {COMPLETED}
             GROUP BY 1
         ) d ON d.month = m.month
         ORDER BY m.month"
    ))
    .fetch_all(&pool)
    .await?;

    let by_type = sqlx::query_as::<_, (String, i64, i64)>(&format!(
        "SELECT COALESCE(NULLIF(payment_method,''), 'other') AS name,
                {net} AS value, COUNT(*)::bigint AS count
         FROM donations WHERE {COMPLETED}
         GROUP BY 1 ORDER BY value DESC"
    ))
    .fetch_all(&pool)
    .await?;

    let top = sqlx::query_as::<_, (String, String, i64, i64)>(&format!(
        "SELECT COALESCE(NULLIF(donor_name,''), 'Anonymous') AS name,
                COALESCE(donor_email,'') AS email,
                {net} AS total, COUNT(*)::bigint AS count
         FROM donations WHERE {COMPLETED}
         GROUP BY 1, 2 ORDER BY total DESC LIMIT 10"
    ))
    .fetch_all(&pool)
    .await?;

    Ok(Json(serde_json::json!({
        "totalGiving": total_giving,
        "thisMonth": this_month,
        "lastMonth": last_month,
        "averageGift": average_gift,
        "totalDonors": total_donors,
        "givingChange": change(this_month, last_month),
        "donorChange": change(month_donors, last_month_donors),
        "monthlyTrend": monthly.iter()
            .map(|(m, t)| serde_json::json!({ "month": m, "total": t }))
            .collect::<Vec<_>>(),
        "byType": by_type.iter()
            .map(|(n, v, c)| serde_json::json!({ "name": n, "value": v, "count": c }))
            .collect::<Vec<_>>(),
        "topDonors": top.iter()
            .map(|(n, e, t, c)| serde_json::json!({
                "name": n, "email": e, "total": t, "count": c
            }))
            .collect::<Vec<_>>(),
    })))
}

pub async fn people_summary(Db(pool): Db) -> Result<Json<serde_json::Value>, AppError> {
    // All four counts read `member_status`, so the "Inactive" card means the
    // same thing as the "inactive" slice of the chart beside it. Counting
    // disabled records there instead put a 0 next to a chart showing 1, which
    // is the kind of small contradiction that costs a report its credibility.
    // Archived (records switched off entirely) is reported separately.
    let (total_people, active_members, visitors, inactive, archived): (i64, i64, i64, i64, i64) =
        sqlx::query_as(
            "SELECT COUNT(*) FILTER (WHERE enabled),
                    COUNT(*) FILTER (WHERE enabled AND member_status = 'member'),
                    COUNT(*) FILTER (WHERE enabled AND member_status = 'visitor'),
                    COUNT(*) FILTER (WHERE enabled AND member_status = 'inactive'),
                    COUNT(*) FILTER (WHERE NOT enabled)
             FROM people",
        )
        .fetch_one(&pool)
        .await?;

    // Every distinct status, not a fixed list: a church that invents
    // "regular attender" should see it in the chart, not have it silently
    // folded into an "other" bucket that hides a quarter of the roll.
    let distribution = sqlx::query_as::<_, (String, i64)>(
        "SELECT COALESCE(NULLIF(member_status,''), 'unrecorded') AS name, COUNT(*)::bigint AS value
         FROM people WHERE enabled
         GROUP BY 1 ORDER BY value DESC",
    )
    .fetch_all(&pool)
    .await?;

    let (groups, volunteers, subscribers, rsvps): (i64, i64, i64, i64) = sqlx::query_as(
        "SELECT (SELECT COUNT(*) FROM groups),
                (SELECT COUNT(DISTINCT name) FROM volunteer_assignments WHERE status = 'assigned'),
                (SELECT COUNT(*) FROM newsletter_subscribers WHERE active),
                (SELECT COALESCE(SUM(guests), 0)::bigint FROM event_rsvps)",
    )
    .fetch_one(&pool)
    .await?;

    let joined_this_year: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM people
         WHERE enabled AND created_at >= date_trunc('year', CURRENT_DATE)",
    )
    .fetch_one(&pool)
    .await?;

    Ok(Json(serde_json::json!({
        "totalPeople": total_people,
        "activeMembers": active_members,
        "visitors": visitors,
        "inactive": inactive,
        "statusDistribution": distribution.iter()
            .map(|(n, v)| serde_json::json!({ "name": n, "value": v }))
            .collect::<Vec<_>>(),
        "archived": archived,
        "membership": {
            "total": total_people,
            "members": active_members,
            "visitors": visitors,
            "inactive": inactive,
            "archived": archived,
            "joinedThisYear": joined_this_year,
            "groups": groups,
            "volunteers": volunteers,
            "subscribers": subscribers,
            "rsvps": rsvps,
        },
    })))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_first_month_is_not_an_infinite_rise() {
        // Dividing by a zero baseline is how a report announces "+Infinity%".
        assert_eq!(change(50_000, 0), 100.0);
        assert_eq!(change(0, 0), 0.0);
    }

    #[test]
    fn change_is_signed_and_rounded() {
        assert_eq!(change(150, 100), 50.0);
        assert_eq!(change(50, 100), -50.0);
        assert_eq!(change(100, 100), 0.0);
        assert_eq!(change(103, 300), -65.7);
    }
}
