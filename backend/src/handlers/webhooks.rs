use axum::Json;
use reqwest::Client;
use sqlx::PgPool;

use crate::tenant::Db;
use crate::auth::AdminGuard;
use crate::error::AppError;
use crate::models::webhook::{CreateWebhookEndpoint, UpdateWebhookEndpoint, WebhookDelivery, WebhookEndpoint};

use axum::extract::{Path, Query};
use uuid::Uuid;

type HmacSha256 = hmac::Hmac<sha2::Sha256>;

fn sign_payload(secret: &str, payload: &str) -> String {
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .expect("HMAC-SHA256 can accept any key length");
    mac.update(payload.as_bytes());
    let result = mac.finalize();
    base64::encode(&*result.into_bytes())
}

pub async fn list_endpoints(
    _auth: AdminGuard,
    Db(pool): Db,
) -> Result<Json<Vec<WebhookEndpoint>>, AppError> {
    let rows = sqlx::query_as::<_, WebhookEndpoint>(
        "SELECT * FROM webhook_endpoints ORDER BY created_at DESC",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn get_endpoint(
    _auth: AdminGuard,
    Db(pool): Db,
    Path(id): Path<Uuid>,
) -> Result<Json<WebhookEndpoint>, AppError> {
    let row = sqlx::query_as::<_, WebhookEndpoint>(
        "SELECT * FROM webhook_endpoints WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Webhook endpoint not found"))?;
    Ok(Json(row))
}

pub async fn create_endpoint(
    _auth: AdminGuard,
    Db(pool): Db,
    Json(input): Json<CreateWebhookEndpoint>,
) -> Result<Json<WebhookEndpoint>, AppError> {
    let row = sqlx::query_as::<_, WebhookEndpoint>(
        r#"INSERT INTO webhook_endpoints (name, url, secret, events)
           VALUES ($1, $2, $3, $4) RETURNING *"#,
    )
    .bind(&input.name)
    .bind(&input.url)
    .bind(&input.secret)
    .bind(&input.events)
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn update_endpoint(
    _auth: AdminGuard,
    Db(pool): Db,
    Path(id): Path<Uuid>,
    Json(input): Json<UpdateWebhookEndpoint>,
) -> Result<Json<WebhookEndpoint>, AppError> {
    let existing = sqlx::query_as::<_, WebhookEndpoint>("SELECT * FROM webhook_endpoints WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Webhook endpoint not found"))?;

    let row = sqlx::query_as::<_, WebhookEndpoint>(
        r#"UPDATE webhook_endpoints SET
            name = COALESCE($2, name),
            url = COALESCE($3, url),
            secret = COALESCE($4, secret),
            events = COALESCE($5, events),
            active = COALESCE($6, active),
            updated_at = NOW()
           WHERE id = $1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.name.as_deref().unwrap_or(&existing.name))
    .bind(input.url.as_deref().unwrap_or(&existing.url))
    .bind(input.secret.as_deref().unwrap_or(&existing.secret))
    .bind(input.events.as_ref().unwrap_or(&existing.events))
    .bind(input.active.unwrap_or(existing.active))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn delete_endpoint(
    _auth: AdminGuard,
    Db(pool): Db,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM webhook_endpoints WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn list_deliveries(
    _auth: AdminGuard,
    Db(pool): Db,
    Query(params): Query<ListDeliveriesQuery>,
) -> Result<Json<Vec<WebhookDelivery>>, AppError> {
    let limit = params.limit.unwrap_or(50).min(200);
    let offset = params.offset.unwrap_or(0);

    let rows = sqlx::query_as::<_, WebhookDelivery>(
        r#"SELECT * FROM webhook_deliveries
           WHERE ($1::uuid IS NULL OR endpoint_id = $1)
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3"#,
    )
    .bind(params.endpoint_id)
    .bind(limit as i64)
    .bind(offset as i64)
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

#[derive(Debug, Deserialize)]
pub struct ListDeliveriesQuery {
    pub endpoint_id: Option<Uuid>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

pub async fn retry_delivery(
    _auth: AdminGuard,
    Db(pool): Db,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query(
        r#"UPDATE webhook_deliveries
           SET status = 'retrying', attempt_count = attempt_count + 1, last_error = NULL, scheduled_at = NOW()
           WHERE id = $1"#,
    )
    .bind(id)
    .execute(&pool)
    .await?;

    Ok(Json(serde_json::json!({ "retrying": true })))
}

pub fn enqueue_webhook_delivery(pool: &PgPool, event_type: &str, payload: serde_json::Value) {
    let endpoints = match sqlx::query_as::<_, WebhookEndpoint>(
        r#"SELECT * FROM webhook_endpoints WHERE active = true AND $1 = ANY(events)"#,
    )
    .bind(event_type)
    .fetch_all(pool)
    {
        Ok(eps) => eps,
        Err(_) => return,
    };

    if endpoints.is_empty() {
        return;
    }

    let payload_str = serde_json::to_string(&payload).unwrap_or_default();

    for endpoint in &endpoints {
        let endpoint_id = endpoint.id;
        let payload_str = payload_str.clone();
        let event_type = event_type.to_string();
        let pool = pool.clone();

        tokio::spawn(async move {
            let _ = sqlx::query(
                r#"INSERT INTO webhook_deliveries (endpoint_id, event_type, payload, scheduled_at)
                   VALUES ($1, $2, $3::jsonb, NOW())"#,
            )
            .bind(endpoint_id)
            .bind(&event_type)
            .bind(&payload_str)
            .execute(&pool)
            .await;
        });
    }
}

pub async fn process_webhook_deliveries(pool: PgPool) {
    let pending: Vec<WebhookDelivery> = match sqlx::query_as::<_, WebhookDelivery>(
        r#"SELECT * FROM webhook_deliveries
           WHERE status IN ('pending', 'retrying')
             AND attempt_count < 5
             AND scheduled_at <= NOW()
           ORDER BY scheduled_at ASC
           LIMIT 50"#,
    )
    .fetch_all(&pool)
    .await
    {
        Ok(rows) => rows,
        Err(_) => return,
    };

    let client = match Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
    {
        Ok(c) => c,
        Err(_) => return,
    };

    for mut delivery in pending {
        let endpoint: Option<WebhookEndpoint> = sqlx::query_as::<_, WebhookEndpoint>(
            "SELECT * FROM webhook_endpoints WHERE id = $1",
        )
        .bind(delivery.endpoint_id)
        .fetch_optional(&pool)
        .await
        .ok()
        .flatten();

        let Some(endpoint) = endpoint else {
            let _ = sqlx::query(
                "UPDATE webhook_deliveries SET status = 'failed', last_error = 'endpoint deleted', attempt_count = attempt_count + 1 WHERE id = $1",
            )
            .bind(delivery.id)
            .execute(&pool)
            .await;
            continue;
        };

        if !endpoint.active {
            let _ = sqlx::query(
                "UPDATE webhook_deliveries SET status = 'failed', last_error = 'endpoint disabled', attempt_count = attempt_count + 1 WHERE id = $1",
            )
            .bind(delivery.id)
            .execute(&pool)
            .await;
            continue;
        }

        let payload_str = serde_json::to_string(&delivery.payload).unwrap_or_default();
        let signing_input = format!("{}.{}", chrono::Utc::now().timestamp(), payload_str);
        let hmac_signature = sign_payload(&endpoint.secret, &signing_input);

        let response = client
            .post(&endpoint.url)
            .header("Content-Type", "application/json")
            .header("X-Webhook-Signature", hmac_signature.clone())
            .header("X-Webhook-Event", &delivery.event_type)
            .body(payload_str.clone())
            .send()
            .await;

        match response {
            Ok(resp) => {
                let status = resp.status().as_u16() as i32;
                let body = resp.text().await.unwrap_or_default();
                let success = resp.status().is_success();

                let new_status = if success { "delivered" } else { "retrying" };

                let _ = sqlx::query(
                    r#"UPDATE webhook_deliveries
                       SET status = $1,
                           http_status = $2,
                           response_body = $3,
                           attempt_count = attempt_count + 1,
                           last_error = CASE WHEN $4 = true THEN NULL ELSE $5 END,
                           delivered_at = CASE WHEN $4 = true THEN NOW() ELSE delivered_at END,
                           scheduled_at = CASE WHEN $4 = false THEN scheduled_at + INTERVAL '1 minute' ELSE scheduled_at END
                       WHERE id = $6"#,
                )
                .bind(new_status)
                .bind(status)
                .bind(body)
                .bind(success)
                .bind(if success { None::<String>() } else { Some(format!("HTTP {}", status)) })
                .bind(delivery.id)
                .execute(&pool)
                .await;
            }
            Err(err) => {
                let delay = chrono::Utc::now().naive_utc()
                    + chrono::Duration::minutes(if delivery.attempt_count >= 3 { 10 } else { 1 });

                let _ = sqlx::query(
                    r#"UPDATE webhook_deliveries
                       SET status = 'retrying',
                           attempt_count = attempt_count + 1,
                           last_error = $1,
                           scheduled_at = $2
                       WHERE id = $3"#,
                )
                .bind(err.to_string())
                .bind(delay)
                .bind(delivery.id)
                .execute(&pool)
                .await;
            }
        }
    }
}
