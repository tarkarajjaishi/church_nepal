//! Photographs of the thing that is broken.
//!
//! A picture of the fault says more than three paragraphs describing it, and
//! the person who can take one is the person standing in front of it — who
//! usually has no login. So there are two ways in:
//!
//! - **Token-gated**, for whoever reported it. Not an open upload endpoint:
//!   you must already hold a ticket's token, which means you already reported
//!   something through the rate-limited form.
//! - **Staff**, which links a file already put through the normal upload
//!   route.
//!
//! Both are capped. An unbounded attachment list on a public endpoint is disk
//! somebody else owns.

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::tenant::{Db, TenantSlug};
use axum::extract::{Multipart, Path};
use axum::Json;

/// Ten per ticket. Enough for "here it is from four angles", far short of a
/// way to fill a disk one report at a time.
const MAX_PER_TICKET: i64 = 10;
const MAX_BYTES: usize = 8 * 1024 * 1024;

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct Attachment {
    pub id: uuid::Uuid,
    pub url: String,
    pub filename: String,
    pub content_type: String,
    pub size_bytes: i64,
    pub uploaded_by: String,
    pub created_at: chrono::NaiveDateTime,
}

/// Images only, and decided by what the bytes *are* rather than what the
/// upload claims.
///
/// A `Content-Type: image/png` header on a file whose first bytes are `MZ`
/// tells you only that the sender is willing to lie. Reading the magic number
/// is the difference between an attachment list and a file drop.
fn sniff(data: &[u8]) -> Option<(&'static str, &'static str)> {
    match data {
        [0xFF, 0xD8, 0xFF, ..] => Some(("image/jpeg", "jpg")),
        [0x89, b'P', b'N', b'G', 0x0D, 0x0A, 0x1A, 0x0A, ..] => Some(("image/png", "png")),
        [b'G', b'I', b'F', b'8', ..] => Some(("image/gif", "gif")),
        // RIFF....WEBP
        [b'R', b'I', b'F', b'F', _, _, _, _, b'W', b'E', b'B', b'P', ..] => {
            Some(("image/webp", "webp"))
        }
        // Deliberately not SVG: it is a document that can carry script, and it
        // would be served from the church's own origin.
        _ => None,
    }
}

async fn count_for(pool: &sqlx::PgPool, ticket_id: uuid::Uuid) -> i64 {
    sqlx::query_scalar("SELECT COUNT(*) FROM helpdesk_attachments WHERE ticket_id = $1")
        .bind(ticket_id)
        .fetch_one(pool)
        .await
        .unwrap_or(MAX_PER_TICKET)
}

async fn store(
    slug: &str,
    data: &[u8],
    ext: &str,
) -> Result<(String, String), AppError> {
    let dir = crate::handlers::upload::storage_dir(slug);
    std::fs::create_dir_all(&dir)
        .map_err(|e| AppError::internal(format!("Could not create the upload folder: {e}")))?;

    // The name is ours, never the sender's. A filename from a form is the
    // classic way a path ends up somewhere it should not.
    let filename = format!("{}.{ext}", uuid::Uuid::new_v4());
    tokio::fs::write(dir.join(&filename), data)
        .await
        .map_err(|e| AppError::internal(format!("Could not save the file: {e}")))?;
    Ok((format!("/uploads/{filename}"), filename))
}

/// Attach a photo to a ticket you reported.
pub async fn public_attach(
    Db(pool): Db,
    TenantSlug(slug): TenantSlug,
    Path(token): Path<String>,
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, AppError> {
    let row: Option<(uuid::Uuid, String)> = sqlx::query_as(
        "SELECT id, reporter_name FROM helpdesk_tickets WHERE public_token = $1",
    )
    .bind(&token)
    .fetch_optional(&pool)
    .await?;
    let (ticket_id, reporter) =
        row.ok_or_else(|| AppError::not_found("No ticket found with that link"))?;

    if count_for(&pool, ticket_id).await >= MAX_PER_TICKET {
        return Err(AppError::bad_request(format!(
            "A ticket can carry {MAX_PER_TICKET} photos. Reply and describe the rest."
        )));
    }

    let field = multipart
        .next_field()
        .await
        .map_err(|e| AppError::bad_request(format!("Could not read the upload: {e}")))?
        .ok_or_else(|| AppError::bad_request("No file was sent"))?;

    let mut data = Vec::new();
    let mut field = field;
    while let Some(chunk) = field
        .chunk()
        .await
        .map_err(|e| AppError::bad_request(format!("Could not read the upload: {e}")))?
    {
        if data.len() + chunk.len() > MAX_BYTES {
            return Err(AppError::bad_request("That photo is too large (8MB maximum)"));
        }
        data.extend_from_slice(&chunk);
    }

    let (content_type, ext) = sniff(&data)
        .ok_or_else(|| AppError::bad_request("Please send a photo (JPEG, PNG, GIF or WebP)"))?;

    let (url, filename) = store(&slug, &data, ext).await?;

    sqlx::query(
        "INSERT INTO helpdesk_attachments
           (ticket_id, url, filename, content_type, size_bytes, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6)",
    )
    .bind(ticket_id)
    .bind(&url)
    .bind(&filename)
    .bind(content_type)
    .bind(data.len() as i64)
    .bind(&reporter)
    .execute(&pool)
    .await?;

    Ok(Json(serde_json::json!({ "url": url, "filename": filename })))
}

#[derive(Debug, serde::Deserialize)]
pub struct LinkAttachment {
    pub url: String,
    pub filename: Option<String>,
    pub comment_id: Option<uuid::Uuid>,
}

/// Staff: link a file already uploaded through the normal route.
pub async fn attach(
    auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<LinkAttachment>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Only our own uploads. A ticket is not a way to have an arbitrary remote
    // URL rendered inside the admin panel.
    if !input.url.starts_with("/uploads/") && !input.url.starts_with("/api/uploads/") {
        return Err(AppError::bad_request(
            "Upload the file first — only files stored here can be attached",
        ));
    }
    if count_for(&pool, id).await >= MAX_PER_TICKET {
        return Err(AppError::bad_request(format!(
            "A ticket can carry {MAX_PER_TICKET} attachments"
        )));
    }

    let filename = input
        .filename
        .unwrap_or_else(|| input.url.rsplit('/').next().unwrap_or("attachment").to_string());

    let res = sqlx::query(
        "INSERT INTO helpdesk_attachments (ticket_id, comment_id, url, filename, uploaded_by)
         SELECT $1, $2, $3, $4, $5
         WHERE EXISTS (SELECT 1 FROM helpdesk_tickets WHERE id = $1)",
    )
    .bind(id)
    .bind(input.comment_id)
    .bind(&input.url)
    .bind(&filename)
    .bind(&auth.email)
    .execute(&pool)
    .await?;

    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Ticket not found"));
    }
    Ok(Json(serde_json::json!({ "attached": true })))
}

pub async fn list(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Vec<Attachment>>, AppError> {
    let rows = sqlx::query_as::<_, Attachment>(
        "SELECT id, url, filename, content_type, size_bytes, uploaded_by, created_at
         FROM helpdesk_attachments WHERE ticket_id = $1 ORDER BY created_at",
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn detach(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    // The row goes; the file stays. Deleting the bytes would break any other
    // ticket or comment that linked the same upload, and disk is cheaper than
    // a broken image in a record of what was wrong.
    let res = sqlx::query("DELETE FROM helpdesk_attachments WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Attachment not found"));
    }
    Ok(Json(serde_json::json!({ "removed": true })))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_bytes_decide_what_a_file_is_not_the_header() {
        // `Content-Type: image/png` on a Windows executable tells you only
        // that the sender is willing to lie.
        assert_eq!(sniff(&[0xFF, 0xD8, 0xFF, 0xE0, 0, 0]), Some(("image/jpeg", "jpg")));
        assert_eq!(
            sniff(&[0x89, b'P', b'N', b'G', 0x0D, 0x0A, 0x1A, 0x0A, 0]),
            Some(("image/png", "png"))
        );
        assert_eq!(sniff(b"GIF89a....."), Some(("image/gif", "gif")));
        assert_eq!(sniff(b"RIFF\0\0\0\0WEBPVP8 "), Some(("image/webp", "webp")));

        assert_eq!(sniff(b"MZ\x90\x00"), None, "an executable is not a photo");
        assert_eq!(sniff(b"%PDF-1.4"), None);
        assert_eq!(sniff(b""), None);
        assert_eq!(sniff(b"#!/bin/sh\n"), None);
    }

    #[test]
    fn svg_is_refused_however_well_formed() {
        // SVG is a document that can carry script, and it would be served
        // from the church's own origin.
        assert_eq!(sniff(b"<svg xmlns=\"http://www.w3.org/2000/svg\">"), None);
        assert_eq!(sniff(b"<?xml version=\"1.0\"?><svg>"), None);
    }
}
