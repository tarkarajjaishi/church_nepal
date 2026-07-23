use crate::tenant::Db;
use crate::auth::{AuthUser, AdminGuard};
use axum::extract::{Path, Query};
use axum::{Json, response::Response};
use axum::http::header;
use chrono::NaiveDateTime;
use crate::error::AppError;
use crate::models::donation::{Donation, InitiateDonation};
use crate::models::fund::{RecurringDonation, CreateRecurringDonation};
use crate::handlers::audit::create_audit_entry;
use std::collections::HashMap;

pub async fn initiate(
    Db(pool): Db,
    Json(input): Json<InitiateDonation>,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut extra_notes = Vec::new();
    if let Some(fund_id) = input.fund_id {
        extra_notes.push(format!("fund={}", fund_id));
    }
    if let Some(freq) = &input.frequency {
        extra_notes.push(format!("frequency={}", freq));
    }
    let base_notes = input.notes.as_deref().unwrap_or("");
    let notes = if extra_notes.is_empty() {
        base_notes.to_string()
    } else {
        format!("{} {}", base_notes, extra_notes.join(" "))
    };

    let row = sqlx::query_as::<_, Donation>(
        r#"INSERT INTO donations (donor_name, donor_email, donor_phone, amount, payment_method, campaign_id, fund_id, notes, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING *"#
    )
    .bind(input.donor_name.as_deref().unwrap_or(""))
    .bind(input.donor_email.as_deref().unwrap_or(""))
    .bind(input.donor_phone.as_deref().unwrap_or(""))
    .bind(input.amount)
    .bind(&input.payment_method)
    .bind(input.campaign_id)
    .bind(input.fund_id)
    .bind(notes)
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
        "stripe" => {
            let client = crate::payment::stripe::StripeClient::from_env();
            let success_url = format!("{}/give/success?donation_id={}", domain, row.id);
            let fail_url = format!("{}/give", domain);
            let donor_email = input.donor_email.as_deref().unwrap_or("");
            match client.create_checkout_session(
                input.amount,
                "usd",
                donor_email,
                &row.id.to_string(),
                &success_url,
                &fail_url,
            ).await {
                Ok(session) => session.url,
                Err(e) => return Err(AppError::internal(format!("Stripe session failed: {}", e))),
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

    let row = sqlx::query_as::<_, Donation>("SELECT * FROM donations WHERE id = $1")
        .bind(donation_id).fetch_optional(&pool).await?
        .ok_or_else(|| AppError::not_found("Donation not found"))?;

    if row.status != "completed" {
        sqlx::query("UPDATE donations SET status = 'completed', updated_at = NOW() WHERE id = $1")
            .bind(donation_id).execute(&pool).await?;

        if let Some(campaign_id) = row.campaign_id {
            let _ = sqlx::query(
                r#"UPDATE campaigns SET raised = COALESCE(raised, 0) + $1 WHERE id = $2"#
            )
            .bind(row.amount)
            .bind(campaign_id)
            .execute(&pool)
            .await;
        }
    }

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
    let row = sqlx::query_as::<_, Donation>("SELECT * FROM donations WHERE id = $1")
        .bind(donation_id).fetch_optional(&pool).await?
        .ok_or_else(|| AppError::not_found("Donation not found"))?;

    if row.status != "completed" {
        sqlx::query("UPDATE donations SET status = 'completed', updated_at = NOW() WHERE id = $1")
            .bind(donation_id).execute(&pool).await?;

        if let Some(campaign_id) = row.campaign_id {
            let _ = sqlx::query(
                r#"UPDATE campaigns SET raised = COALESCE(raised, 0) + $1 WHERE id = $2"#
            )
            .bind(row.amount)
            .bind(campaign_id)
            .execute(&pool)
            .await;
        }
    }

    Ok(Json(serde_json::json!({
        "status": "completed",
        "message": "Payment confirmed",
    })))
}

pub async fn callback_stripe(
    Db(pool): Db,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    let session_id = payload["data"]["object"]["id"]
        .as_str()
        .ok_or_else(|| AppError::bad_request("Missing session id"))?
        .to_string();

    let payment_status = payload["data"]["object"]["payment_status"]
        .as_str()
        .ok_or_else(|| AppError::bad_request("Missing payment status"))?;

    let donation_id_str = payload["data"]["object"]["metadata"]["donation_id"]
        .as_str()
        .ok_or_else(|| AppError::bad_request("Missing donation_id metadata"))?;

    let donation_id: uuid::Uuid = donation_id_str
        .parse()
        .map_err(|_| AppError::bad_request("Invalid donation_id"))?;

    if payment_status == "paid" {
        let row = sqlx::query_as::<_, Donation>("SELECT * FROM donations WHERE id = $1")
            .bind(donation_id).fetch_optional(&pool).await?
            .ok_or_else(|| AppError::not_found("Donation not found"))?;

        sqlx::query("UPDATE donations SET status = 'completed', transaction_id = COALESCE(transaction_id, $2), updated_at = NOW() WHERE id = $1")
            .bind(donation_id)
            .bind(session_id)
            .execute(&pool)
            .await?;

        if row.status != "completed" {
            if let Some(campaign_id) = row.campaign_id {
                let _ = sqlx::query(
                    r#"UPDATE campaigns SET raised = COALESCE(raised, 0) + $1 WHERE id = $2"#
                )
                .bind(row.amount)
                .bind(campaign_id)
                .execute(&pool)
                .await;
            }
        }
    }

    Ok(Json(serde_json::json!({ "received": true })))
}

pub async fn receipt(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let row = sqlx::query_as::<_, Donation>("SELECT * FROM donations WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Donation not found"))?;

    let settings: Vec<(String, String)> = sqlx::query_as(
        "SELECT key, value FROM settings WHERE key IN ('church_name','church_email','church_address','church_phone')"
    )
    .fetch_all(&pool)
    .await?;

    let mut map = HashMap::new();
    for (k, v) in settings {
        map.insert(k, v);
    }

    Ok(Json(serde_json::json!({
        "donation_id": row.id,
        "amount": row.amount,
        "payment_method": row.payment_method,
        "status": row.status,
        "donor_name": row.donor_name,
        "donor_email": row.donor_email,
        "donor_phone": row.donor_phone,
        "created_at": row.created_at.to_string(),
        "transaction_id": row.transaction_id,
        "notes": row.notes,
        "church_name": map.get("church_name").cloned().unwrap_or_else(|| "Grace Church".to_string()),
        "church_email": map.get("church_email").cloned().unwrap_or_else(|| "info@gracenepal.org".to_string()),
        "church_address": map.get("church_address").cloned().unwrap_or_default(),
        "church_phone": map.get("church_phone").cloned().unwrap_or_default(),
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

#[derive(serde::Deserialize)]
pub struct DonationListQuery {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub payment_method: Option<String>,
    pub status: Option<String>,
    pub fund_id: Option<uuid::Uuid>,
    pub donor_email: Option<String>,
    pub transaction_id: Option<String>,
    pub min_amount: Option<i64>,
    pub max_amount: Option<i64>,
}

pub async fn list(
    Db(pool): Db,
    Query(q): Query<DonationListQuery>,
) -> Result<Json<Vec<Donation>>, AppError> {
    let mut sql = String::from("SELECT * FROM donations WHERE 1=1");
    if let Some(ref start) = q.start_date {
        sql.push_str(&format!(" AND created_at::date >= '{}'", start));
    }
    if let Some(ref end) = q.end_date {
        sql.push_str(&format!(" AND created_at::date <= '{}'", end));
    }
    if let Some(ref pm) = q.payment_method {
        sql.push_str(&format!(" AND payment_method = '{}'", pm));
    }
    if let Some(ref status) = q.status {
        sql.push_str(&format!(" AND status = '{}'", status));
    }
    if let Some(fund_id) = q.fund_id {
        sql.push_str(&format!(" AND fund_id = '{}'", fund_id));
    }
    if let Some(ref email) = q.donor_email {
        sql.push_str(&format!(" AND donor_email ILIKE '%{}%'", email));
    }
    if let Some(ref txn) = q.transaction_id {
        sql.push_str(&format!(" AND transaction_id ILIKE '%{}%'", txn));
    }
    if let Some(min) = q.min_amount {
        sql.push_str(&format!(" AND amount >= {}", min));
    }
    if let Some(max) = q.max_amount {
        sql.push_str(&format!(" AND amount <= {}", max));
    }
    sql.push_str(" ORDER BY created_at DESC");
    let rows = sqlx::query_as::<_, Donation>(&sql)
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

pub async fn funds_breakdown(
    Db(pool): Db,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let rows: Vec<(uuid::Uuid, String, String, i64, i64)> = sqlx::query_as(
        r#"SELECT f.id, f.name, f.fund_type,
                  COALESCE(SUM(d.amount - COALESCE(d.refund_amount, 0))::bigint, 0) AS total,
                  COUNT(DISTINCT CASE WHEN d.status = 'completed' AND d.refund_status != 'refunded' THEN d.id END) AS count
           FROM funds f
           LEFT JOIN donations d ON d.fund_id = f.id AND d.status = 'completed'
           GROUP BY f.id, f.name, f.fund_type
           ORDER BY total DESC"#,
    )
    .fetch_all(&pool)
    .await?;

    let result: Vec<serde_json::Value> = rows
        .into_iter()
        .map(|(id, name, fund_type, total, count)| {
            serde_json::json!({
                "id": id,
                "name": name,
                "fund_type": fund_type,
                "total": total,
                "count": count,
            })
        })
        .collect();

    Ok(Json(result))
}

#[derive(serde::Deserialize)]
pub struct ExportCsvQuery {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub payment_method: Option<String>,
    pub status: Option<String>,
    pub fund_id: Option<uuid::Uuid>,
    pub donor_email: Option<String>,
    pub transaction_id: Option<String>,
    pub min_amount: Option<i64>,
    pub max_amount: Option<i64>,
}

pub async fn export_csv(
    Db(pool): Db,
    Query(q): Query<ExportCsvQuery>,
) -> Result<Response, AppError> {
    let mut sql = String::from("SELECT * FROM donations WHERE 1=1");
    if let Some(ref start) = q.start_date {
        sql.push_str(&format!(" AND created_at::date >= '{}'", start));
    }
    if let Some(ref end) = q.end_date {
        sql.push_str(&format!(" AND created_at::date <= '{}'", end));
    }
    if let Some(ref pm) = q.payment_method {
        sql.push_str(&format!(" AND payment_method = '{}'", pm));
    }
    if let Some(ref status) = q.status {
        sql.push_str(&format!(" AND status = '{}'", status));
    }
    if let Some(fund_id) = q.fund_id {
        sql.push_str(&format!(" AND fund_id = '{}'", fund_id));
    }
    if let Some(ref email) = q.donor_email {
        sql.push_str(&format!(" AND donor_email ILIKE '%{}%'", email));
    }
    if let Some(ref txn) = q.transaction_id {
        sql.push_str(&format!(" AND transaction_id ILIKE '%{}%'", txn));
    }
    if let Some(min) = q.min_amount {
        sql.push_str(&format!(" AND amount >= {}", min));
    }
    if let Some(max) = q.max_amount {
        sql.push_str(&format!(" AND amount <= {}", max));
    }
    sql.push_str(" ORDER BY created_at DESC");
    let rows = sqlx::query_as::<_, Donation>(&sql)
        .fetch_all(&pool).await?;

    let mut csv = String::from("ID,Donor Name,Donor Email,Donor Phone,Amount,Payment Method,Status,Refund Status,Refund Amount,Transaction ID,Fund ID,Created At\n");
    for row in rows {
        let fund_id = row.fund_id.map(|id| id.to_string()).unwrap_or_default();
        csv.push_str(&format!(
            "{},{},{},{},{},{},{},{},{},{},{},{}\n",
            row.id,
            escape_csv(&row.donor_name),
            escape_csv(&row.donor_email),
            escape_csv(&row.donor_phone),
            row.amount,
            row.payment_method,
            row.status,
            row.refund_status,
            row.refund_amount,
            row.transaction_id,
            fund_id,
            row.created_at
        ));
    }

    Ok(([(axum::http::header::CONTENT_TYPE, "text/csv")], csv).into_response())
}

fn escape_csv(s: &str) -> String {
    if s.contains(',') || s.contains('"') || s.contains('\n') {
        format!("\"{}\"", s.replace('"', "\"\""))
    } else {
        s.to_string()
    }
}

pub async fn resend_receipt(
    _auth: AdminGuard,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let donation = sqlx::query_as::<_, Donation>("SELECT * FROM donations WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Donation not found"))?;

    if donation.donor_email.is_empty() {
        return Err(AppError::bad_request("No email address for this donation"));
    }

    let settings: Vec<(String, String)> = sqlx::query_as(
        "SELECT key, value FROM settings WHERE key IN ('church_name','church_email','church_address','church_phone')"
    )
    .fetch_all(&pool)
    .await?;

    let mut map = HashMap::new();
    for (k, v) in settings {
        map.insert(k, v);
    }

    let church_name = map.get("church_name").cloned().unwrap_or_else(|| "Grace Church".to_string());
    let church_address = map.get("church_address").cloned().unwrap_or_default();
    let church_phone = map.get("church_phone").cloned().unwrap_or_default();

    let email_body = format!(
        "Dear {},\n\nThank you for your generous donation of Rs {} to {}.\n\nTransaction Details:\n- Donation ID: {}\n- Amount: Rs {}\n- Payment Method: {}\n- Status: {}\n- Transaction ID: {}\n- Date: {}\n{}{}\n\nGod bless!\n{}",
        donation.donor_name,
        donation.amount,
        church_name,
        donation.id,
        donation.amount,
        donation.payment_method,
        donation.status,
        donation.transaction_id,
        donation.created_at,
        if !church_address.is_empty() { format!("Our address: {}\n", church_address) } else { "".to_string() },
        if !church_phone.is_empty() { format!("Phone: {}\n", church_phone) } else { "".to_string() },
        church_name
    );

    let subject = format!("Donation Receipt - {}", church_name);
    let _ = crate::email::send_donation_receipt(&pool, &donation.donor_email, &donation.donor_name, &subject, &email_body).await;

    Ok(Json(serde_json::json!({ "resent": true })))
}

#[derive(serde::Deserialize)]
pub struct RefundDonation {
    pub amount: Option<i64>,
    pub reason: Option<String>,
}

pub async fn refund(
    _auth: AdminGuard,
    Db(pool): Db,
    Path(donation_id): Path<uuid::Uuid>,
    Json(input): Json<RefundDonation>,
) -> Result<Json<serde_json::Value>, AppError> {
    let donation = sqlx::query_as::<_, Donation>("SELECT * FROM donations WHERE id = $1")
        .bind(donation_id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Donation not found"))?;

    if donation.status != "completed" {
        return Err(AppError::bad_request("Only completed donations can be refunded"));
    }

    if donation.refund_status == "refunded" {
        return Err(AppError::bad_request("Donation has already been fully refunded"));
    }

    let refund_amount = input.amount.unwrap_or(donation.amount);

    if refund_amount <= 0 || refund_amount > (donation.amount - donation.refund_amount) {
        return Err(AppError::bad_request("Invalid refund amount"));
    }

    let refund_status = if refund_amount == (donation.amount - donation.refund_amount) {
        "refunded"
    } else {
        "partially_refunded"
    };

    let gateway_refund_id = if donation.payment_method == "stripe" {
        if let Ok(client) = crate::payment::stripe::StripeClient::from_env() {
            if client.enabled() {
                match client.refund_payment(&donation.transaction_id, Some(refund_amount)).await {
                    Ok(stripe_refund) => Some(stripe_refund.id),
                    Err(_) => None,
                }
            } else {
                None
            }
        } else {
            None
        }
    } else {
        None
    };

    sqlx::query(
        r#"UPDATE donations SET refund_amount = refund_amount + $1, refund_status = $2, refunded_at = NOW(), refund_reason = COALESCE($3, refund_reason), gateway_refund_id = COALESCE($4, gateway_refund_id) WHERE id = $5"#,
    )
    .bind(refund_amount)
    .bind(refund_status)
    .bind(input.reason.as_deref())
    .bind(gateway_refund_id)
    .bind(donation_id)
    .execute(&pool)
    .await?;

    if refund_status == "refunded" {
        if let Some(campaign_id) = donation.campaign_id {
            let _ = sqlx::query(
                r#"UPDATE campaigns SET raised = GREATEST(COALESCE(raised, 0) - $1, 0) WHERE id = $2"#
            )
            .bind(donation.amount)
            .bind(campaign_id)
            .execute(&pool)
            .await;
        }
    }

    let _ = create_audit_entry(
        &pool,
        &_auth.0.email,
        "refund_donation",
        &donation_id.to_string(),
        "donation",
        Some(serde_json::json!({
            "donor_email": donation.donor_email,
            "amount": donation.amount,
            "refund_amount": refund_amount,
            "new_refund_total": donation.refund_amount + refund_amount,
            "refund_status": refund_status,
            "payment_method": donation.payment_method,
            "gateway_refund_id": gateway_refund_id,
        })),
    )
    .await;

    let updated = sqlx::query_as::<_, Donation>("SELECT * FROM donations WHERE id = $1")
        .bind(donation_id)
        .fetch_one(&pool)
        .await?;

    Ok(Json(serde_json::to_value(&updated).map_err(|e| AppError::internal(e.to_string()))?))
}

pub async fn stats(
    Db(pool): Db,
) -> Result<Json<serde_json::Value>, AppError> {
    let total: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(amount - COALESCE(refund_amount, 0))::bigint, 0) FROM donations WHERE status = 'completed'")
        .fetch_one(&pool).await?;
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM donations WHERE status = 'completed' AND refund_status != 'refunded'")
        .fetch_one(&pool).await?;
    let today: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(amount - COALESCE(refund_amount, 0))::bigint, 0) FROM donations WHERE status = 'completed' AND created_at >= CURRENT_DATE AND refund_status != 'refunded'")
        .fetch_one(&pool).await?;
    let esewa: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(amount - COALESCE(refund_amount, 0))::bigint, 0) FROM donations WHERE status = 'completed' AND payment_method = 'esewa' AND refund_status != 'refunded'")
        .fetch_one(&pool).await?;
    let khalti: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(amount - COALESCE(refund_amount, 0))::bigint, 0) FROM donations WHERE status = 'completed' AND payment_method = 'khalti' AND refund_status != 'refunded'")
        .fetch_one(&pool).await?;
    let refunded: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(refund_amount)::bigint, 0) FROM donations WHERE refund_status != 'none'")
        .fetch_one(&pool).await?;

    Ok(Json(serde_json::json!({
        "total_raised": total.0,
        "total_donations": count.0,
        "today_raised": today.0,
        "esewa_total": esewa.0,
        "khalti_total": khalti.0,
        "total_refunded": refunded.0,
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
                  COALESCE(SUM(amount - COALESCE(refund_amount, 0))::bigint, 0) AS total_amount,
                  COUNT(CASE WHEN refund_status != 'refunded' THEN 1 END) AS donation_count
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
                  COALESCE(SUM(amount - COALESCE(refund_amount, 0))::bigint, 0) AS total_amount,
                  COUNT(CASE WHEN refund_status != 'refunded' THEN 1 END) AS donation_count,
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
             AND refund_status != 'refunded'
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

// ===== Recurring Donations =====

pub async fn list_recurring(
    Db(pool): Db,
) -> Result<Json<Vec<RecurringDonation>>, AppError> {
    let rows = sqlx::query_as::<_, RecurringDonation>(
        "SELECT * FROM recurring_donations ORDER BY created_at DESC",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn get_recurring(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<RecurringDonation>, AppError> {
    let row = sqlx::query_as::<_, RecurringDonation>("SELECT * FROM recurring_donations WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Recurring donation not found"))?;
    Ok(Json(row))
}

pub async fn create_recurring(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CreateRecurringDonation>,
) -> Result<Json<RecurringDonation>, AppError> {
    let gateway = input.gateway.as_deref().unwrap_or("stripe");
    let interval = input.interval.as_deref().unwrap_or("monthly");

    let row = sqlx::query_as::<_, RecurringDonation>(
        r#"INSERT INTO recurring_donations (member_id, amount, interval, gateway)
            VALUES ($1, $2, $3, $4) RETURNING *"#,
    )
    .bind(input.member_id)
    .bind(input.amount)
    .bind(interval)
    .bind(gateway)
    .fetch_one(&pool)
    .await?;

    if gateway == "stripe" {
        if let Some(customer_id) = input.stripe_customer_id {
            if let Ok(client) = crate::payment::stripe::StripeClient::from_env() {
                if client.enabled() {
                    let _ = client
                        .create_subscription(&customer_id, row.amount, interval)
                        .await;
                }
            }
        }
    }

    if gateway == "khalti" || gateway == "esewa" {
        let next_charge = match interval {
            "weekly" => chrono::NaiveDateTime::new(
                (chrono::Utc::now() + chrono::Duration::weeks(1)).date_naive(),
                chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap(),
            ),
            _ => chrono::NaiveDateTime::new(
                (chrono::Utc::now() + chrono::Duration::days(30)).date_naive(),
                chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap(),
            ),
        };
        sqlx::query("UPDATE recurring_donations SET next_charge_at = $1 WHERE id = $2")
            .bind(next_charge)
            .bind(row.id)
            .execute(&pool)
            .await?;
    }

    let updated = sqlx::query_as::<_, RecurringDonation>("SELECT * FROM recurring_donations WHERE id = $1")
        .bind(row.id)
        .fetch_one(&pool)
        .await?;

    Ok(Json(updated))
}

pub async fn cancel_recurring(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let existing = sqlx::query_as::<_, RecurringDonation>("SELECT * FROM recurring_donations WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Recurring donation not found"))?;

    if existing.gateway == "stripe" {
        if let Some(sub_id) = existing.stripe_subscription_id {
            if let Ok(client) = crate::payment::stripe::StripeClient::from_env() {
                let _ = client.cancel_subscription(&sub_id).await;
            }
        }
    }

    sqlx::query("UPDATE recurring_donations SET active = false, updated_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;

    Ok(Json(serde_json::json!({ "cancelled": true })))
}

pub async fn pause_recurring(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("UPDATE recurring_donations SET active = false, next_charge_at = NULL, updated_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;

    Ok(Json(serde_json::json!({ "paused": true })))
}
