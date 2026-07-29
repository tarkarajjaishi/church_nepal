use crate::config::Config;
use crate::error::AppError;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};

pub async fn send_admin_notification(
    cfg: &Config,
    recipient: &str,
    subject: &str,
    body: &str,
) -> Result<(), AppError> {
    if cfg.smtp_host.is_empty() {
        return Ok(());
    }

    let email = Message::builder()
        .from(
            format!("ChurchNepal Control <{}>", cfg.smtp_from)
                .parse()
                .map_err(|e| AppError::internal(e.to_string()))?,
        )
        .to(
            recipient
                .parse()
                .map_err(|e| AppError::internal(e.to_string()))?,
        )
        .subject(subject)
        .body(body)
        .map_err(|e| AppError::internal(e.to_string()))?;

    let creds = Credentials::new(cfg.smtp_username.clone(), cfg.smtp_password.clone());

    let host = cfg.smtp_host.clone();
    tokio::task::spawn_blocking(move || {
        if let Ok(mut mailer) = SmtpTransport::relay(&host) {
            let built = mailer.credentials(creds).build();
            let _ = built.send(&email);
        }
    })
    .await
    .map_err(|e| AppError::internal(e.to_string()))?;

    Ok(())
}
