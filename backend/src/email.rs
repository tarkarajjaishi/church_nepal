use lettre::Transport;
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
    let smtp_from = std::env::var("SMTP_FROM").unwrap_or_else(|_| smtp_username.clone());

    let email = lettre::Message::builder()
        .from(format!("Grace Nepal Church <{}>", from_email).parse()?)
        .to(recipient_email.parse()?)
        .subject(subject.to_string())
        .body(body.to_string())?;

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
    let smtp_from = std::env::var("SMTP_FROM").unwrap_or_else(|_| smtp_username.clone());

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
        .subject(subject.to_string())
        .body(body.to_string())?;

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
    let smtp_from = std::env::var("SMTP_FROM").unwrap_or_else(|_| smtp_username.clone());

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
        .subject(subject.to_string())
        .body(body.to_string())?;

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
    let smtp_from = std::env::var("SMTP_FROM").unwrap_or_else(|_| smtp_username.clone());

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
        .subject(subject.to_string())
        .body(body.to_string())?;

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
/// Email a report with its PDF attached.
///
/// Unlike the notification helpers above, this **fails loudly when SMTP is not
/// configured**. Returning `Ok(())` is right for a receipt nobody is waiting
/// on; here it would record a delivery that never happened, and a treasurer
/// who is told the report was sent stops checking whether it arrived.
///
/// It also fails when the transport rejects the message, rather than firing
/// and forgetting on a background task — the caller writes the outcome to
/// `report_deliveries`, and a delivery log that only ever says "sent" is not a
/// log.
pub async fn send_report(
    pool: &PgPool,
    to: &[String],
    subject: &str,
    body: &str,
    pdf: &[u8],
    report_name: &str,
) -> anyhow::Result<()> {
    let smtp_host = match std::env::var("SMTP_HOST") {
        Ok(h) if !h.is_empty() => h,
        _ => anyhow::bail!(
            "no SMTP server is configured, so the report could not be sent (set SMTP_HOST)"
        ),
    };

    let church_email: Option<String> =
        sqlx::query_scalar("SELECT value FROM settings WHERE key = 'church_email'")
            .fetch_optional(pool)
            .await?;
    let from_email = church_email.unwrap_or_else(|| "info@gracenepal.org".to_string());

    let smtp_username = std::env::var("SMTP_USERNAME").unwrap_or_default();
    let smtp_password = std::env::var("SMTP_PASSWORD").unwrap_or_default();

    let email = build_report_email(&from_email, to, subject, body, pdf, report_name)?;

    let creds = lettre::transport::smtp::authentication::Credentials::new(
        smtp_username,
        smtp_password,
    );

    // Awaited, not spawned. The caller records whether it worked, and it
    // cannot record what it did not wait for.
    let host = smtp_host.clone();
    let sent = tokio::task::spawn_blocking(move || -> anyhow::Result<()> {
        let mailer = lettre::SmtpTransport::relay(&host)?.credentials(creds).build();
        lettre::Transport::send(&mailer, &email)?;
        Ok(())
    })
    .await?;

    sent
}

/// Turn a report into a message with its PDF attached.
///
/// Separated from the sending so the assembly — which is where the bugs live —
/// can be tested without an SMTP server. A missing attachment is invisible
/// until a treasurer opens an email with nothing in it.
pub fn build_report_email(
    from_email: &str,
    to: &[String],
    subject: &str,
    body: &str,
    pdf: &[u8],
    report_name: &str,
) -> anyhow::Result<lettre::Message> {
    // A filename built from a name someone typed. Anything that could steer a
    // path or break the header comes out — `../../etc/passwd.pdf` and a
    // newline are the two that matter.
    let safe: String = report_name
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == ' ' { c } else { '-' })
        .collect();
    let trimmed = safe.trim().replace(' ', "-");
    let filename = format!(
        "{}.pdf",
        if trimmed.is_empty() { "report".into() } else { trimmed }
    );

    let mut builder = lettre::Message::builder()
        .from(format!("Grace Nepal Church <{from_email}>").parse()?)
        .subject(subject.to_string());
    for addr in to {
        builder = builder.to(addr.parse()?);
    }

    Ok(builder.multipart(
        lettre::message::MultiPart::mixed()
            .singlepart(
                lettre::message::SinglePart::builder()
                    .header(lettre::message::header::ContentType::TEXT_PLAIN)
                    .body(body.to_string()),
            )
            .singlepart(
                lettre::message::Attachment::new(filename).body(
                    pdf.to_vec(),
                    "application/pdf".parse::<lettre::message::header::ContentType>()?,
                ),
            ),
    )?)
}

#[cfg(test)]
mod report_email_tests {
    use super::build_report_email;

    fn built(name: &str) -> String {
        let msg = build_report_email(
            "info@gracenepal.org",
            &["treasurer@gracenepal.org".into(), "pastor@gracenepal.org".into()],
            "Giving summary",
            "Total given: 837000",
            b"%PDF-1.4 fake",
            name,
        )
        .unwrap();
        String::from_utf8_lossy(&msg.formatted()).to_string()
    }

    #[test]
    fn the_pdf_is_actually_attached() {
        // The failure this catches is silent: an email that arrives with the
        // summary text and no report, which nobody reports as a bug because it
        // looks like the report is simply empty.
        let raw = built("Giving summary");
        assert!(raw.contains("multipart/mixed"));
        assert!(raw.contains("application/pdf"));
        assert!(raw.contains("Giving-summary.pdf"));
        assert!(raw.contains("Content-Disposition: attachment"));
        assert!(raw.contains("Total given: 837000"));
    }

    #[test]
    fn every_recipient_is_on_the_message() {
        let raw = built("X");
        assert!(raw.contains("treasurer@gracenepal.org"));
        assert!(raw.contains("pastor@gracenepal.org"));
    }

    #[test]
    fn a_report_name_cannot_steer_the_filename_or_break_the_header() {
        let raw = built("../../etc/passwd");
        assert!(!raw.contains("../"));
        assert!(raw.contains("------etc-passwd.pdf"));

        // A newline in a header value is header injection.
        let raw = built("Report
Bcc: attacker@evil.test");
        assert!(!raw.contains("Bcc: attacker@evil.test"));
    }

    #[test]
    fn a_nameless_report_still_gets_a_filename() {
        // "" produces ".pdf", which some clients refuse to save.
        let raw = built("   ");
        assert!(raw.contains("report.pdf"));
    }
}

/// Send a plain-text message to one or more people.
///
/// Fails loudly when SMTP is unconfigured, like `send_report` and unlike the
/// older notification helpers: the help desk records every attempt, and a log
/// that only ever says "sent" is not a log.
pub async fn send_plain(
    pool: &PgPool,
    to: &[String],
    subject: &str,
    body: &str,
) -> anyhow::Result<()> {
    let smtp_host = match std::env::var("SMTP_HOST") {
        Ok(h) if !h.is_empty() => h,
        _ => anyhow::bail!("no SMTP server is configured (set SMTP_HOST)"),
    };
    if to.is_empty() {
        anyhow::bail!("nobody to send to");
    }

    let church_email: Option<String> =
        sqlx::query_scalar("SELECT value FROM settings WHERE key = 'church_email'")
            .fetch_optional(pool)
            .await?;
    let from_email = church_email.unwrap_or_else(|| "info@gracenepal.org".to_string());

    let mut builder = lettre::Message::builder()
        .from(format!("Grace Nepal Church <{from_email}>").parse()?)
        .subject(subject.to_string());
    for addr in to {
        builder = builder.to(addr.parse()?);
    }
    let email = builder.body(body.to_string())?;

    let creds = lettre::transport::smtp::authentication::Credentials::new(
        std::env::var("SMTP_USERNAME").unwrap_or_default(),
        std::env::var("SMTP_PASSWORD").unwrap_or_default(),
    );
    tokio::task::spawn_blocking(move || -> anyhow::Result<()> {
        let mailer = lettre::SmtpTransport::relay(&smtp_host)?.credentials(creds).build();
        lettre::Transport::send(&mailer, &email)?;
        Ok(())
    })
    .await?
}
