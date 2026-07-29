use crate::models::contact_message::ContactMessage;
use sqlx::PgPool;
use std::collections::HashMap;
use uuid;

pub async fn notify_admin(pool: &PgPool, message: &ContactMessage) -> anyhow::Result<()> {
    let smtp_host = match std::env::var("SMTP_HOST") {
        Ok(h) if !h.is_empty() => h,
        _ => return Ok(()),
    };

    let church_email: Option<String> =
        sqlx::query_scalar("SELECT value FROM settings WHERE key = 'church_email'")
            .fetch_optional(pool)
            .await?;

    let admin_email = church_email.unwrap_or_else(|| "info@gracenepal.org".to_string());

    let smtp_username = std::env::var("SMTP_USERNAME").unwrap_or_default();
    let smtp_password = std::env::var("SMTP_PASSWORD").unwrap_or_default();
    let smtp_from = std::env::var("SMTP_FROM").unwrap_or_else(|_| smtp_username.clone());

    let email_body = format!(
        "You have a new contact message:\n\nFrom: {}\nEmail: {}\nPhone: {}\nMessage Type: {}\nCategory: {}\n\nMessage:\n{}",
        message.name, message.email, message.phone, message.message_type, message.category, message.message
    );

    let email = lettre::Message::builder()
        .from(format!("Church Website <{}>", smtp_from).parse()?)
        .to(admin_email.parse()?)
        .subject(format!("New Contact Message from {}", message.name))
        .body(email_body)?;

    let creds = lettre::transport::smtp::authentication::Credentials::new(
        smtp_username,
        smtp_password,
    );

    let host = smtp_host.clone();
    tokio::task::spawn_blocking(move || {
        if let Ok(mut mailer) = lettre::SmtpTransport::relay(&host) {
            let built = mailer.credentials(creds).build();
            let _ = built.send(&email);
        }
    })
    .await?;

    Ok(())
}

pub async fn notify_admin_new_testimony(pool: &PgPool, name: &str, testimony_id: &uuid::Uuid) -> anyhow::Result<()> {
    let smtp_host = match std::env::var("SMTP_HOST") {
        Ok(h) if !h.is_empty() => h,
        _ => return Ok(()),
    };

    let church_email: Option<String> =
        sqlx::query_scalar("SELECT value FROM settings WHERE key = 'church_email'")
            .fetch_optional(pool)
            .await?;

    let admin_email = church_email.unwrap_or_else(|| "info@gracenepal.org".to_string());

    let smtp_username = std::env::var("SMTP_USERNAME").unwrap_or_default();
    let smtp_password = std::env::var("SMTP_PASSWORD").unwrap_or_default();
    let smtp_from = std::env::var("SMTP_FROM").unwrap_or_else(|_| smtp_username.clone());

    let email_body = format!(
        "A new testimony has been submitted and is waiting for approval.\n\nName: {}\nTestimony ID: {}\n\nPlease review and approve it in the admin panel.",
        name, testimony_id
    );

    let email = lettre::Message::builder()
        .from(format!("Church Website <{}>", smtp_from).parse()?)
        .to(admin_email.parse()?)
        .subject(format!("New Testimony Submission from {}", name))
        .body(email_body)?;

    let creds = lettre::transport::smtp::authentication::Credentials::new(
        smtp_username,
        smtp_password,
    );

    let host = smtp_host.clone();
    tokio::task::spawn_blocking(move || {
        if let Ok(mut mailer) = lettre::SmtpTransport::relay(&host) {
            let built = mailer.credentials(creds).build();
            let _ = built.send(&email);
        }
    })
    .await?;

    Ok(())
}

pub async fn send_donation_receipt(
    pool: &PgPool,
    recipient_email: &str,
    recipient_name: &str,
    subject: &str,
    body: &str,
) -> anyhow::Result<()> {
    let smtp_host = match std::env::var("SMTP_HOST") {
        Ok(h) if !h.is_empty() => h,
        _ => return Ok(()),
    };

    let church_email: Option<String> =
        sqlx::query_scalar("SELECT value FROM settings WHERE key = 'church_email'")
            .fetch_optional(pool)
            .await?;

    let from_email = church_email.unwrap_or_else(|| "info@gracenepal.org".to_string());

    let smtp_username = std::env::var("SMTP_USERNAME").unwrap_or_default();
    let smtp_password = std::env::var("SMTP_PASSWORD").unwrap_or_default();
    let smtp_from = std::env::var("SMTP_FROM").unwrap_or(|_| smtp_username.clone());

    let email = lettre::Message::builder()
        .from(format!("Grace Nepal Church <{}>", from_email).parse()?)
        .to(recipient_email.parse()?)
        .subject(subject)
        .body(body)?;

    let creds = lettre::transport::smtp::authentication::Credentials::new(
        smtp_username,
        smtp_password,
    );

    let host = smtp_host.clone();
    tokio::task::spawn_blocking(move || {
        if let Ok(mut mailer) = lettre::SmtpTransport::relay(&host) {
            let built = mailer.credentials(creds).build();
            let _ = built.send(&email);
        }
    })
    .await?;

    Ok(())
}

pub async fn notify_member_application_decision(
    pool: &PgPool,
    applicant_name: &str,
    recipient_email: &str,
    approved: bool,
    reason: Option<&str>,
) -> anyhow::Result<()> {
    let smtp_host = match std::env::var("SMTP_HOST") {
        Ok(h) if !h.is_empty() => h,
        _ => return Ok(()),
    };

    let church_email: Option<String> =
        sqlx::query_scalar("SELECT value FROM settings WHERE key = 'church_email'")
            .fetch_optional(pool)
            .await?;

    let from_email = church_email.unwrap_or_else(|| "info@gracenepal.org".to_string());

    let smtp_username = std::env::var("SMTP_USERNAME").unwrap_or_default();
    let smtp_password = std::env::var("SMTP_PASSWORD").unwrap_or_default();
    let smtp_from = std::env::var("SMTP_FROM").unwrap_or(|_| smtp_username.clone());

    let (subject, body) = if approved {
        (
            "Your Membership Application has been Approved".to_string(),
            format!(
                "Dear {},\n\nWe are pleased to inform you that your membership application has been approved. Welcome to Grace Nepal Church!\n\n{}",
                applicant_name,
                reason.map(|r| format!("Note from our team: {}", r)).unwrap_or_default()
            ),
        )
    } else {
        (
            "Update on your Membership Application".to_string(),
            format!(
                "Dear {},\n\nThank you for your interest in joining Grace Nepal Church. After careful review, we are unable to approve your application at this time.\n\n{}",
                applicant_name,
                reason.map(|r| format!("Reason: {}", r)).unwrap_or_default()
            ),
        )
    };

    let email = lettre::Message::builder()
        .from(format!("Grace Nepal Church <{}>", from_email).parse()?)
        .to(recipient_email.parse()?)
        .subject(subject)
        .body(body)?;

    let creds = lettre::transport::smtp::authentication::Credentials::new(
        smtp_username,
        smtp_password,
    );

    let host = smtp_host.clone();
    tokio::task::spawn_blocking(move || {
        if let Ok(mut mailer) = lettre::SmtpTransport::relay(&host) {
            let built = mailer.credentials(creds).build();
            let _ = built.send(&email);
        }
    })
    .await?;

    Ok(())
}

pub async fn notify_prayer_request_decision(
    pool: &PgPool,
    requester_name: &str,
    recipient_email: &str,
    approved: bool,
    reason: Option<&str>,
) -> anyhow::Result<()> {
    let smtp_host = match std::env::var("SMTP_HOST") {
        Ok(h) if !h.is_empty() => h,
        _ => return Ok(()),
    };

    let church_email: Option<String> =
        sqlx::query_scalar("SELECT value FROM settings WHERE key = 'church_email'")
            .fetch_optional(pool)
            .await?;

    let from_email = church_email.unwrap_or_else(|| "info@gracenepal.org".to_string());

    let smtp_username = std::env::var("SMTP_USERNAME").unwrap_or_default();
    let smtp_password = std::env::var("SMTP_PASSWORD").unwrap_or_default();
    let smtp_from = std::env::var("SMTP_FROM").unwrap_or(|_| smtp_username.clone());

    let (subject, body) = if approved {
        (
            "Your Prayer Request has been Approved".to_string(),
            format!(
                "Dear {},\n\nThank you for your prayer request. It has been approved and is now visible to our community. We will be praying for you.\n\n{}",
                requester_name,
                reason.map(|r| format!("Note: {}", r)).unwrap_or_default()
            ),
        )
    } else {
        (
            "Update on your Prayer Request".to_string(),
            format!(
                "Dear {},\n\nThank you for sharing your prayer request with us. After review, we are unable to publish it at this time.\n\n{}",
                requester_name,
                reason.map(|r| format!("Reason: {}", r)).unwrap_or_default()
            ),
        )
    };

    let email = lettre::Message::builder()
        .from(format!("Grace Nepal Church <{}>", from_email).parse()?)
        .to(recipient_email.parse()?)
        .subject(subject)
        .body(body)?;

    let creds = lettre::transport::smtp::authentication::Credentials::new(
        smtp_username,
        smtp_password,
    );

    let host = smtp_host.clone();
    tokio::task::spawn_blocking(move || {
        if let Ok(mut mailer) = lettre::SmtpTransport::relay(&host) {
            let built = mailer.credentials(creds).build();
            let _ = built.send(&email);
        }
    })
    .await?;

    Ok(())
}

pub async fn volunteer_confirmation(
    pool: &PgPool,
    visitor_name: &str,
    visitor_email: &str,
    visitor_phone: Option<String>,
    interests: Option<String>,
    availability: Option<String>,
    message: Option<String>,
) -> anyhow::Result<()> {
    let smtp_host = match std::env::var("SMTP_HOST") {
        Ok(h) if !h.is_empty() => h,
        _ => return Ok(()),
    };

    let church_email: Option<String> =
        sqlx::query_scalar("SELECT value FROM settings WHERE key = 'church_email'")
            .fetch_optional(pool)
            .await?;

    let from_email = church_email.unwrap_or_else(|| "info@gracenepal.org".to_string());

    let smtp_username = std::env::var("SMTP_USERNAME").unwrap_or_default();
    let smtp_password = std::env::var("SMTP_PASSWORD").unwrap_or_default();
    let smtp_from = std::env::var("SMTP_FROM").unwrap_or(|_| smtp_username.clone());

    let subject = "Thank you for volunteering with Grace Nepal Church";
    let mut body = format!(
        "Dear {},\n\nThank you for your interest in volunteering with Grace Nepal Church. We have received your volunteer application.\n\n",
        visitor_name
    );
    if let Some(ref interests) = interests {
        body.push_str(&format!("Areas of interest: {}\n", interests));
    }
    if let Some(ref availability) = availability {
        body.push_str(&format!("Availability: {}\n", availability));
    }
    if let Some(ref message) = message {
        if !message.trim().is_empty() {
            body.push_str(&format!("Additional message:\n{}\n", message));
        }
    }
    body.push_str("\nWe will review your application and get back to you soon.\n\nBlessings,\nThe Grace Nepal Church Team");

    let email = lettre::Message::builder()
        .from(format!("Grace Nepal Church <{}>", from_email).parse()?)
        .to(visitor_email.parse()?)
        .subject(subject)
        .body(body)?;

    let creds = lettre::transport::smtp::authentication::Credentials::new(
        smtp_username,
        smtp_password,
    );

    let host = smtp_host.clone();
    tokio::task::spawn_blocking(move || {
        if let Ok(mut mailer) = lettre::SmtpTransport::relay(&host) {
            let built = mailer.credentials(creds).build();
            let _ = built.send(&email);
        }
    })
    .await?;

    Ok(())
}