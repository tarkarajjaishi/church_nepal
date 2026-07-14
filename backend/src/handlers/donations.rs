use axum::extract::{Path, State, Query};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::donation::{Donation, InitiateDonation};

pub async fn initiate(
    State(pool): State<PgPool>,
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
        .unwrap_or_else(|_| "http://104.248.63.47".to_string());

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
            let donation_id_clone = row.id.to_string();

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
                    eprintln!("Khalti initiate failed: {} - {}", status, body);
                    format!("{}/give/success?donation_id={}", domain_clone, donation_id_clone)
                }
                Err(e) => {
                    eprintln!("Khalti API error: {}", e);
                    format!("{}/give/success?donation_id={}", domain_clone, donation_id_clone)
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
    State(pool): State<PgPool>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let donation_id_str = params.get("donation_id").ok_or_else(|| AppError::bad_request("Missing donation_id"))?;
    let donation_id: uuid::Uuid = donation_id_str.parse().map_err(|_| AppError::bad_request("Invalid donation_id"))?;

    sqlx::query("UPDATE donations SET status = 'completed', updated_at = NOW() WHERE id = $1")
        .bind(donation_id).execute(&pool).await?;

    let domain = std::env::var("SITE_DOMAIN")
        .unwrap_or_else(|_| "http://104.248.63.47".to_string());

    Ok(Json(serde_json::json!({
        "status": "completed",
        "message": "Payment confirmed",
        "redirect_url": format!("{}/give/success?donation_id={}", domain, donation_id),
    })))
}

pub async fn callback_khalti(
    State(pool): State<PgPool>,
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
    State(pool): State<PgPool>,
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
    State(pool): State<PgPool>,
) -> Result<Json<Vec<Donation>>, AppError> {
    let rows = sqlx::query_as::<_, Donation>("SELECT * FROM donations ORDER BY created_at DESC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(
    State(pool): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Donation>, AppError> {
    let row = sqlx::query_as::<_, Donation>("SELECT * FROM donations WHERE id = $1")
        .bind(id).fetch_optional(&pool).await?
        .ok_or_else(|| AppError::not_found("Donation not found"))?;
    Ok(Json(row))
}

pub async fn stats(
    State(pool): State<PgPool>,
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
