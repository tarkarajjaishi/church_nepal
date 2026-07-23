use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::broadcast::{Broadcast, BroadcastRecipient, BroadcastStats, CreateBroadcast, UpdateBroadcast};

pub async fn list(
    _auth: AuthUser,
    Db(pool): Db,
) -> Result<Json<Vec<Broadcast>>, AppError> {
    let rows = sqlx::query_as::<_, Broadcast>(
        "SELECT * FROM broadcasts ORDER BY created_at DESC",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn get(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Broadcast>, AppError> {
    let row = sqlx::query_as::<_, Broadcast>(
        "SELECT * FROM broadcasts WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Broadcast not found"))?;
    Ok(Json(row))
}

pub async fn create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CreateBroadcast>,
) -> Result<Json<Broadcast>, AppError> {
    let row = sqlx::query_as::<_, Broadcast>(
        r#"INSERT INTO broadcasts (subject, body, broadcast_type, recipient_group, template_body, scheduled_at)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *"#,
    )
    .bind(&input.subject)
    .bind(&input.body)
    .bind(input.broadcast_type.as_deref().unwrap_or("email"))
    .bind(input.recipient_group.as_deref().unwrap_or("all"))
    .bind(input.template_body.as_deref().unwrap_or(""))
    .bind(input.scheduled_at.as_deref().and_then(|s| chrono::NaiveDateTime::parse_from_str(&s, "%Y-%m-%dT%H:%M:%S").ok()))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdateBroadcast>,
) -> Result<Json<Broadcast>, AppError> {
    let existing = sqlx::query_as::<_, Broadcast>(
        "SELECT * FROM broadcasts WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Broadcast not found"))?;

    let row = sqlx::query_as::<_, Broadcast>(
        r#"UPDATE broadcasts SET
            subject=COALESCE($2,subject),
            body=COALESCE($3,body),
            broadcast_type=COALESCE($4,broadcast_type),
            recipient_group=COALESCE($5,recipient_group),
            template_body=COALESCE($6,template_body),
            scheduled_at=COALESCE($7,scheduled_at),
            updated_at=NOW()
           WHERE id=$1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.subject.as_deref().unwrap_or(&existing.subject))
    .bind(input.body.as_deref().unwrap_or(&existing.body))
    .bind(input.broadcast_type.as_deref().unwrap_or(&existing.broadcast_type))
    .bind(input.recipient_group.as_deref().unwrap_or(&existing.recipient_group))
    .bind(input.template_body.as_deref().unwrap_or(&existing.template_body))
    .bind(input.scheduled_at.as_deref().and_then(|s| chrono::NaiveDateTime::parse_from_str(&s, "%Y-%m-%dT%H:%M:%S").ok()))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM broadcasts WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn schedule(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<serde_json::Value>,
) -> Result<Json<Broadcast>, AppError> {
    let scheduled_at = input
        .get("scheduled_at")
        .and_then(|v| v.as_str())
        .and_then(|s| chrono::NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M:%S").ok());

    let scheduled_at = match scheduled_at {
        Some(t) => t,
        None => return Err(AppError::bad_request("Invalid scheduled_at format, expected YYYY-MM-DDTHH:MM:SS")),
    };

    let row = sqlx::query_as::<_, Broadcast>(
        r#"UPDATE broadcasts SET scheduled_at=$2, status='scheduled', updated_at=NOW() WHERE id=$1 RETURNING *"#,
    )
    .bind(id)
    .bind(scheduled_at)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Broadcast not found"))?;

    Ok(Json(row))
}

pub async fn list_recipients(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Vec<BroadcastRecipient>>, AppError> {
    let rows = sqlx::query_as::<_, BroadcastRecipient>(
        "SELECT * FROM broadcast_recipients WHERE broadcast_id = $1 ORDER BY sent_at DESC NULLS LAST",
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn stats(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<BroadcastStats>, AppError> {
    let row: (i64, i64, i64, i64, i64) = sqlx::query_as(
        r#"SELECT
            COUNT(*),
            COUNT(*) FILTER (WHERE status = 'sent'),
            COUNT(*) FILTER (WHERE status = 'pending'),
            COUNT(*) FILTER (WHERE status = 'failed'),
            COUNT(*) FILTER (WHERE opened_at IS NOT NULL)
           FROM broadcast_recipients WHERE broadcast_id = $1"#,
    )
    .bind(id)
    .fetch_one(&pool)
    .await?;

    Ok(Json(BroadcastStats {
        total: row.0,
        sent: row.1,
        pending: row.2,
        failed: row.3,
        opened: row.4,
    }))
}

pub async fn mark_opened(
    Db(pool): Db,
    Path((broadcast_id, recipient_id)): Path<(uuid::Uuid, uuid::Uuid)>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query(
        "UPDATE broadcast_recipients SET opened_at = NOW() WHERE broadcast_id = $1 AND id = $2",
    )
    .bind(broadcast_id)
    .bind(recipient_id)
    .execute(&pool)
    .await?;
    Ok(Json(serde_json::json!({ "opened": true })))
}

fn build_email_html(broadcast: &Broadcast, recipient_name: &str, broadcast_id: uuid::Uuid, recipient_id: uuid::Uuid, unsubscribe_url: &str) -> String {
    let name_placeholder = if recipient_name.is_empty() { "" } else { recipient_name };
    let greeting = if name_placeholder.is_empty() {
        "Hello".to_string()
    } else {
        format!("Hello {}", name_placeholder)
    };

    let template = if broadcast.template_body.is_empty() {
        broadcast.body.clone()
    } else {
        broadcast.template_body.clone()
            .replace("{{name}}", name_placeholder)
            .replace("{{subject}}", &broadcast.subject)
    };

    let tracking_url = format!("/api/broadcasts/open/{}/{}", broadcast_id, recipient_id);

    format!(
        r#"<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f4;padding:20px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.05);">
        <tr>
          <td style="background-color:#0b3c5d;padding:24px 32px;color:#ffffff;font-size:20px;font-weight:bold;">
            {}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;color:#333333;font-size:15px;line-height:1.6;">
            <p style="margin:0 0 16px 0;">{},</p>
            <div style="margin:0 0 16px 0;">{}</div>
            <p style="margin:24px 0 0 0;font-size:13px;color:#888888;">
              If you no longer wish to receive these emails, you can <a href="{}">unsubscribe here</a>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background-color:#fafafa;border-top:1px solid #eeeeee;color:#888888;font-size:12px;text-align:center;">
            Grace Nepal Church
          </td>
        </tr>
      </table>
      <img src="{}" width="1" height="1" style="display:none;" alt="">
    </td>
  </tr>
</table>
</body>
</html>"#,
        broadcast.subject, greeting, template, unsubscribe_url, tracking_url
    )
}

pub async fn send_broadcast_email(
    pool: &sqlx::PgPool,
    broadcast: &Broadcast,
    recipient_email: &str,
    recipient_name: &str,
    recipient_id: uuid::Uuid,
) -> anyhow::Result<()> {
    let smtp_host = match std::env::var("SMTP_HOST") {
        Ok(h) if !h.is_empty() => h,
        _ => return Ok(()),
    };

    let smtp_username = std::env::var("SMTP_USERNAME").unwrap_or_default();
    let smtp_password = std::env::var("SMTP_PASSWORD").unwrap_or_default();
    let smtp_from = std::env::var("SMTP_FROM").unwrap_or_else(|_| smtp_username.clone());

    let church_email: Option<String> =
        sqlx::query_scalar("SELECT value FROM settings WHERE key = 'church_email'")
            .fetch_optional(pool)
            .await?;

    let from_email = church_email.unwrap_or_else(|| "info@gracenepal.org".to_string());

    let unsubscribe_path = format!("/api/newsletter/unsubscribe/{}", urlencoding::encode(recipient_email));
    let unsubscribe_url = format!("{}{}", std::env::var("API_ORIGIN").unwrap_or_else(|_| "http://localhost:3002".to_string()), unsubscribe_path);

    let html_body = build_email_html(broadcast, recipient_name, broadcast.id, recipient_id, &unsubscribe_url);

    let email = lettre::Message::builder()
        .from(format!("Grace Nepal Church <{}>", from_email).parse()?)
        .to(recipient_email.parse()?)
        .subject(broadcast.subject.clone())
        .header(lettre::message::header::ContentType::TEXT_HTML)
        .body(html_body.clone())?;

    let creds = lettre::transport::smtp::authentication::Credentials::new(
        smtp_username,
        smtp_password,
    );

    let host = smtp_host.clone();
    let result = tokio::task::spawn_blocking(move || {
        if let Ok(mut mailer) = lettre::SmtpTransport::relay(&host) {
            let built = mailer.credentials(creds).build();
            built.send(&email)
        } else {
            Err(lettre::transport::smtp::Error::ClientNotFound)
        }
    })
    .await;

    match result {
        Ok(Ok(_)) => {
            sqlx::query(
                "UPDATE broadcast_recipients SET status = 'sent', sent_at = NOW() WHERE broadcast_id = $1 AND recipient_email = $2",
            )
            .bind(broadcast.id)
            .bind(recipient_email)
            .execute(pool)
            .await?;
            Ok(())
        }
        Ok(Err(_)) | Err(_) => {
            sqlx::query(
                "UPDATE broadcast_recipients SET status = 'failed' WHERE broadcast_id = $1 AND recipient_email = $2",
            )
            .bind(broadcast.id)
            .bind(recipient_email)
            .execute(pool)
            .await?;
            Ok(())
        }
    }
}

pub async fn send(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let broadcast = sqlx::query_as::<_, Broadcast>(
        "SELECT * FROM broadcasts WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Broadcast not found"))?;

    if matches!(broadcast.status.as_str(), "sent" | "sending") {
        return Err(AppError::bad_request("Broadcast already sent or sending"));
    }

    let mut recipients: Vec<(String, String)> = Vec::new();
    let mut recipient_ids: Vec<uuid::Uuid> = Vec::new();

    match broadcast.recipient_group.as_str() {
        "all" | "all_members" => {
            let rows = sqlx::query_as::<_, (String, String)>(
                r#"SELECT email, COALESCE(name, '') as recipient_name FROM newsletter_subscribers WHERE active = true
                   UNION
                   SELECT p.email, COALESCE(p.first_name || ' ' || p.last_name, '') as recipient_name FROM people p WHERE p.enabled = true AND p.email IS NOT NULL AND p.email <> ''
                   ORDER BY email"#,
            )
            .fetch_all(&pool)
            .await?;
            recipients = rows;
        }
        "active_members" => {
            let rows = sqlx::query_as::<_, (String, String)>(
                r#"SELECT email, COALESCE(first_name || ' ' || last_name, '') as recipient_name FROM people WHERE enabled = true AND email IS NOT NULL AND email <> '' AND member_status IN ('member', 'regular')"#,
            )
            .fetch_all(&pool)
            .await?;
            recipients = rows;
        }
        "visitors" => {
            let rows = sqlx::query_as::<_, (String, String)>(
                r#"SELECT email, COALESCE(first_name || ' ' || last_name, '') as recipient_name FROM people WHERE enabled = true AND email IS NOT NULL AND email <> '' AND member_status = 'visitor'"#,
            )
            .fetch_all(&pool)
            .await?;
            recipients = rows;
        }
        "volunteers" => {
            let rows = sqlx::query_as::<_, (String, String)>(
                r#"SELECT DISTINCT p.email, COALESCE(p.first_name || ' ' || p.last_name, '') as recipient_name FROM people p JOIN volunteer_assignments va ON va.person_id = p.id WHERE p.enabled = true AND p.email IS NOT NULL AND p.email <> ''"#,
            )
            .fetch_all(&pool)
            .await?;
            recipients = rows;
        }
        "small_groups" => {
            let rows = sqlx::query_as::<_, (String, String)>(
                r#"SELECT DISTINCT p.email, COALESCE(p.first_name || ' ' || p.last_name, '') as recipient_name FROM people p JOIN group_memberships gm ON gm.person_id = p.id WHERE p.enabled = true AND p.email IS NOT NULL AND p.email <> ''"#,
            )
            .fetch_all(&pool)
            .await?;
            recipients = rows;
        }
        _ => {
            let rows = sqlx::query_as::<_, (String, String)>(
                r#"SELECT email, COALESCE(name, '') as recipient_name FROM newsletter_subscribers WHERE active = true"#,
            )
            .fetch_all(&pool)
            .await?;
            recipients = rows;
        }
    }

    for (email, name) in &recipients {
        let recipient_id: uuid::Uuid = sqlx::query_as(
            "INSERT INTO broadcast_recipients (broadcast_id, recipient_email, recipient_name, status) VALUES ($1, $2, $3, 'pending') RETURNING id",
        )
        .bind(id)
        .bind(email)
        .bind(name)
        .fetch_one(&pool)
        .await?;
        recipient_ids.push(recipient_id);
    }

    let count = recipients.len() as i32;

    sqlx::query(
        "UPDATE broadcasts SET status = 'sending', recipient_count = $2, sent_at = NOW(), updated_at = NOW() WHERE id = $1",
    )
    .bind(id)
    .bind(count)
    .execute(&pool)
    .await?;

    let pool_clone = pool.clone();
    let broadcast_clone = broadcast.clone();
    tokio::spawn(async move {
        for ((email, name), recipient_id) in recipients.into_iter().zip(recipient_ids) {
            let _ = send_broadcast_email(&pool_clone, &broadcast_clone, &email, &name, recipient_id).await;
        }
        let _ = sqlx::query("UPDATE broadcasts SET status = 'sent', updated_at = NOW() WHERE id = $1")
            .bind(broadcast_clone.id)
            .execute(&pool_clone)
            .await;
    });

    Ok(Json(serde_json::json!({
        "sent": true,
        "recipient_count": count,
        "status": "sending",
    })))
}