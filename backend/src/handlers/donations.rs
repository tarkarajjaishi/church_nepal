use crate::tenant::Db;
use axum::extract::{Path, State, Query};
use axum::Json;
use chrono::NaiveDateTime;
use sqlx::PgPool;
use crate::error::AppError;
use crate::models::donation::{Donation, InitiateDonation};

pub async fn initiate(
    Db(pool): Db,
    Json(input): Json<InitiateDonation>,
) -> Result<Json<serde_json::Value>, AppError> {
    let row = sqlx::query_as::<_, Donation>(
        r#"INSERT INTO donations (donor_name, donor_email, donor_phone, amount, payment_method, campaign_id, notes, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *"#
    )
    .bind(input.donor_name.as_deref().unwrap_or(""))
    .bind(input.donor_email.as_deref().unwrap_or(""))
    .bind(input.donor_phone.as_deref().unwrap_or(""))
    .bind(input.amount)
    .bind(&input.payment_method)
    .bind(input.campaign_id)
    .bind(input.notes.as_deref().unwrap_or(""))
    .fetch_one(&pool).await?;

    let domain = std::env::var("SITE_DOMAIN")
        .unwrap_or_else(|_| "http://localhost:3000".to_string());

    let payment_url = match input.payment_method.as_str() {
        "esewa" => {
            let config = crate::payment::esewa::EsewaConfig::from_env();
            let success_url = format!("{}/give/success?donation_id={}", domain, row.id);
            let fail_url = format!("{}/give", domain);
            format!(
                "{}/epay/main?url={}&amt={}&pid={}&scd={}&su={}&fu={}",
                config.base_url, success_url, input.amount, row.id, config.merchant_id, success_url, fail_url
            )
        }
        "khalti" => {
            let config = crate::payment::khalti::KhaltiConfig::from_env();
            let public_key = crate::payment::khalti::get_public_key();
            let domain_clone = domain.clone();

            // Call Khalti API to initiate payment
            let client = reqwest::Client::new();
            let khalti_resp = client.post(format!("{}/payment/initiate/", config.base_url))
                .header("Authorization", format!("Key {}", config.secret_key))
                .json(&crate::payment::khalti::KhaltiInitiateRequest {
                    public_key,
                    product_identity: row.id.to_string(),
                    product_name: format!("Donation - {}", input.payment_method),
                    product_url: format!("{}/give", domain_clone),
                    amount: input.amount,
                })
                .send().await;

            match khalti_resp {
                Ok(resp) if resp.status().is_success() => {
                    let khalti_data: crate::payment::khalti::KhaltiInitiateResponse = resp.json().await
                        .map_err(|_| AppError::internal("Failed to parse Khalti response"))?;
                    khalti_data.redirect_url
                }
                Ok(resp) => {
                    let status = resp.status();
                    let body = resp.text().await.unwrap_or_default();
                    return Err(AppError::internal(format!("Khalti initiate failed: {} - {}", status, body)));
                }
                Err(e) => {
                    return Err(AppError::internal(format!("Khalti API error: {}", e)));
                }
            }
        }
        _ => format!("{}/give/success?donation_id={}", domain, row.id),
    };

    Ok(Json(serde_json::json!({
        "donation_id": row.id,
        "payment_url": payment_url,
        "amount": row.amount,
        "payment_method": row.payment_method,
    })))
}

pub async fn callback_esewa(
    Db(pool): Db,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let donation_id_str = params.get("donation_id").ok_or_else(|| AppError::bad_request("Missing donation_id"))?;
    let donation_id: uuid::Uuid = donation_id_str.parse().map_err(|_| AppError::bad_request("Invalid donation_id"))?;

    // Verify eSewa signature before accepting the payment.
    // eSewa sends oid, amt, refId (HMAC-SHA256) in the callback query.
    let oid    = params.get("oid").map(String::as_str).unwrap_or("");
    let amt    = params.get("amt").map(String::as_str).unwrap_or("");
    let ref_id = params.get("refId").map(String::as_str).unwrap_or("");

    // If eSewa params are present, verify the signature.
    if !oid.is_empty() && !amt.is_empty() && !ref_id.is_empty() {
        let secret = std::env::var("ESEWA_SECRET_KEY").unwrap_or_default();
        let callback_params = crate::payment::esewa::EsewaCallback {
            oid: oid.to_string(),
            amt: amt.to_string(),
            ref_id: ref_id.to_string(),
            ref_id2: params.get("refId2").cloned(),
        };
        if !crate::payment::esewa::verify_signature(&callback_params, &secret) {
            return Err(AppError::bad_request("eSewa signature verification failed"));
        }
    }

    sqlx::query("UPDATE donations SET status = 'completed', updated_at = NOW() WHERE id = $1")
        .bind(donation_id).execute(&pool).await?;

    let domain = std::env::var("SITE_DOMAIN")
        .unwrap_or_else(|_| "http://localhost:3000".to_string());

    Ok(Json(serde_json::json!({
        "status": "completed",
        "message": "Payment confirmed",
        "redirect_url": format!("{}/give/success?donation_id={}", domain, donation_id),
    })))
}

pub async fn callback_khalti(
    Db(pool): Db,
    Path(donation_id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("UPDATE donations SET status = 'completed', updated_at = NOW() WHERE id = $1")
        .bind(donation_id).execute(&pool).await?;

    Ok(Json(serde_json::json!({
        "status": "completed",
        "message": "Payment confirmed",
    })))
}

#[derive(serde::Deserialize)]
pub struct StatusQuery {
    pub donation_id: uuid::Uuid,
}

pub async fn status(
    Db(pool): Db,
    Query(q): Query<StatusQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let row = sqlx::query_as::<_, Donation>("SELECT * FROM donations WHERE id = $1")
        .bind(q.donation_id).fetch_optional(&pool).await?
        .ok_or_else(|| AppError::not_found("Donation not found"))?;
    Ok(Json(serde_json::json!({
        "status": row.status,
        "amount": row.amount,
        "payment_method": row.payment_method,
    })))
}

pub async fn list(
    Db(pool): Db,
) -> Result<Json<Vec<Donation>>, AppError> {
    let rows = sqlx::query_as::<_, Donation>("SELECT * FROM donations ORDER BY created_at DESC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Donation>, AppError> {
    let row = sqlx::query_as::<_, Donation>("SELECT * FROM donations WHERE id = $1")
        .bind(id).fetch_optional(&pool).await?
        .ok_or_else(|| AppError::not_found("Donation not found"))?;
    Ok(Json(row))
}

pub async fn stats(
    Db(pool): Db,
) -> Result<Json<serde_json::Value>, AppError> {
    let total: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(amount)::bigint, 0) FROM donations WHERE status = 'completed'")
        .fetch_one(&pool).await?;
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM donations WHERE status = 'completed'")
        .fetch_one(&pool).await?;
    let today: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(amount)::bigint, 0) FROM donations WHERE status = 'completed' AND created_at >= CURRENT_DATE")
        .fetch_one(&pool).await?;
    let esewa: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(amount)::bigint, 0) FROM donations WHERE status = 'completed' AND payment_method = 'esewa'")
        .fetch_one(&pool).await?;
    let khalti: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(amount)::bigint, 0) FROM donations WHERE status = 'completed' AND payment_method = 'khalti'")
        .fetch_one(&pool).await?;

    Ok(Json(serde_json::json!({
        "total_raised": total.0,
        "total_donations": count.0,
        "today_raised": today.0,
        "esewa_total": esewa.0,
        "khalti_total": khalti.0,
    })))
}

#[derive(serde::Deserialize)]
pub struct DateRangeQuery {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

pub async fn statements(
    Db(pool): Db,
    Query(q): Query<DateRangeQuery>,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let start = q.start_date.unwrap_or_else(|| "1970-01-01".to_string());
    let end = q.end_date.unwrap_or_else(|| "2099-12-31".to_string());

    let rows: Vec<(Option<String>, Option<String>, Option<String>, i64, i64)> = sqlx::query_as(
        r#"SELECT donor_email, donor_name, donor_phone,
                  COALESCE(SUM(amount), 0)::bigint AS total_amount,
                  COUNT(*) AS donation_count
           FROM donations
           WHERE status = 'completed'
             AND created_at::date >= $1::date
             AND created_at::date <= $2::date
           GROUP BY donor_email, donor_name, donor_phone
           ORDER BY total_amount DESC"#,
    )
    .bind(&start)
    .bind(&end)
    .fetch_all(&pool)
    .await?;

    let result: Vec<serde_json::Value> = rows
        .into_iter()
        .map(|(email, name, phone, total, count)| {
            serde_json::json!({
                "donor_email": email.as_deref().unwrap_or(""),
                "donor_name": name.as_deref().unwrap_or("Anonymous"),
                "donor_phone": phone.as_deref().unwrap_or(""),
                "total_amount": total,
                "donation_count": count,
                "start_date": start,
                "end_date": end,
            })
        })
        .collect();

    Ok(Json(result))
}

pub async fn by_donor(
    Db(pool): Db,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let rows: Vec<(
        Option<String>, Option<String>, Option<String>,
        i64, i64, Option<NaiveDateTime>, Option<NaiveDateTime>,
    )> = sqlx::query_as(
        r#"SELECT donor_email, donor_name, donor_phone,
                  COALESCE(SUM(amount), 0)::bigint AS total_amount,
                  COUNT(*) AS donation_count,
                  MIN(created_at) AS first_donation,
                  MAX(created_at) AS last_donation
           FROM donations
           WHERE status = 'completed'
           GROUP BY donor_email, donor_name, donor_phone
           ORDER BY total_amount DESC"#,
    )
    .fetch_all(&pool)
    .await?;

    let result: Vec<serde_json::Value> = rows
        .into_iter()
        .map(|(email, name, phone, total, count, first, last)| {
            serde_json::json!({
                "donor_email": email.as_deref().unwrap_or(""),
                "donor_name": name.as_deref().unwrap_or("Anonymous"),
                "donor_phone": phone.as_deref().unwrap_or(""),
                "total_amount": total,
                "donation_count": count,
                "first_donation": first.map(|d| d.to_string()),
                "last_donation": last.map(|d| d.to_string()),
            })
        })
        .collect();

    Ok(Json(result))
}

#[derive(serde::Deserialize)]
pub struct DonorHistoryQuery {
    pub email: String,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

pub async fn donor_history(
    Db(pool): Db,
    Query(q): Query<DonorHistoryQuery>,
) -> Result<Json<Vec<Donation>>, AppError> {
    let start = q.start_date.unwrap_or_else(|| "1970-01-01".to_string());
    let end = q.end_date.unwrap_or_else(|| "2099-12-31".to_string());

    let rows = sqlx::query_as::<_, Donation>(
        r#"SELECT * FROM donations
           WHERE donor_email = $1
             AND status = 'completed'
             AND created_at::date >= $2::date
             AND created_at::date <= $3::date
           ORDER BY created_at DESC"#,
    )
    .bind(&q.email)
    .bind(&start)
    .bind(&end)
    .fetch_all(&pool)
    .await?;

    Ok(Json(rows))
}
