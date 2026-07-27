use axum::extract::{Multipart, Path, State, Query};
use axum::http::{HeaderMap, StatusCode, header};
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;
use chrono::{Utc, Duration};
use ring::{hmac, digest};
use base64::{engine::general_purpose, Engine as _};

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::tenant::TenantSlug;

/// State for the storage handler, shared across requests.
#[derive(Clone)]
struct StorageState {
    signing_key: String,
    storage_root: String,
}

/// Input for upload.
#[derive(Debug, Deserialize)]
struct UploadParams {
    /// Optional category (e.g., "media", "receipts", "exports")
    category: Option<String>,
    /// Whether the file should be publicly accessible (default: false)
    public: Option<bool>,
}

/// Metadata about an uploaded file.
#[derive(Serialize, Debug)]
struct FileInfo {
    id: Uuid,
    filename: String,
    original_name: String,
    content_type: String,
    size: u64,
    uploaded_at: String,
    /// Signed URL for downloading the file (if private) or direct URL (if public)
    url: String,
    /// Whether the file is public (directly accessible without signature)
    is_public: bool,
}

/// List query parameters.
#[derive(Debug, Deserialize)]
struct ListParams {
    /// Optional prefix to filter files (relative to storage root)
    prefix: Option<String>,
    /// Limit number of results
    limit: Option<usize>,
    /// Offset for pagination
    offset: Option<usize>,
}

/// Response for list endpoint.
#[derive(Serialize, Debug)]
struct ListResponse {
    files: Vec<FileInfo>,
    total: usize,
}

/// Delete request.
#[derive(Debug, Deserialize)]
struct DeleteRequest {
    /// Relative path from storage root (including tenant slug)
    path: String,
}

/// Generate a signed URL for a file.
fn generate_signed_url(state: &StorageState, tenant_slug: &str, relative_path: &str, expires_in_seconds: i64) -> String {
    let expires = Utc::now().timestamp() + expires_in_seconds;
    let msg = format!("{}\t{}\t{}", tenant_slug, relative_path, expires);
    let key = state.signing_key.as_bytes();
    let tag = hmac::sign(&hmac::Key::new(hmac::HMAC_SHA256, key), msg.as_bytes());
    let signature = general_purpose::URL_SAFE_NO_PAD.encode(tag.as_ref());
    format!(
        "/storage/{}/{}/{}?expires={}&signature={}",
        tenant_slug,
        urlencoding::encode(&relative_path),
        urlencoding::encode(&signature),
        expires,
        urlencoding::encode(&signature)
    )
}

/// Verify a signed URL and return the tuple (tenant_slug, relative_path) if valid.
fn verify_signed_url(state: &StorageState, path: &str, expires: i64, signature: &str) -> Option<(String, String)> {
    // Check expiration
    if expires < Utc::now().timestamp() {
        return None;
    }
    // Reconstruct the message
    let msg = format!("{}\t{}\t{}", path, "", expires); // We need to extract tenant_slug and relative_path from path? Actually the path in the URL includes tenant_slug and relative_path.
    // The format is: /storage/{tenant_slug}/{encoded_relative_path}?expires={}&signature={}
    // We'll parse the path separately.
    // For simplicity, we expect the path to be "/storage/{tenant_slug}/{relative_path}"
    // We'll split the path by '/' and skip the first two empty parts.
    let parts: Vec<&str> = path.split('/').filter(|s| !s.is_empty()).collect();
    if parts.len() < 3 || parts[0] != "storage" {
        return None;
    }
    let tenant_slug = parts[1];
    let relative_path = parts[2..].join("/");
    let msg = format!("{}\t{}\t{}", tenant_slug, relative_path, expires);
    let key = state.signing_key.as_bytes();
    let expected = hmac::sign(&hmac::Key::new(hmac::HMAC_SHA256, key), msg.as_bytes());
    let provided = match general_purpose::URL_SAFE_NO_PAD.decode(signature) {
        Ok(bytes) => bytes,
        Err(_) => return None,
    };
    if constant_time_eq::is_eq(&expected, &provided.as_ref()) {
        Some((tenant_slug.to_string(), relative_path))
    } else {
        None
    }
}

impl StorageState {
    fn new() -> Self {
        let signing_key = env::var("STORAGE_SIGNING_KEY")
            .expect("STORAGE_SIGNING_KEY must be set");
        let storage_root = env::var("STORAGE_ROOT")
            .unwrap_or_else(|_| "../storage".into());
        Self {
            signing_key,
            storage_root,
        }
    }

    fn tenant_dir(&self, tenant_slug: &str) -> PathBuf {
        Path::new(&self.storage_root).join(tenant_slug)
    }

    /// Ensure the tenant directory exists.
    fn ensure_tenant_dir(&self, tenant_slug: &str) -> Result<(), std::io::Error> {
        let dir = self.tenant_dir(tenant_slug);
        fs::create_dir_all(&dir)?;
        Ok(())
    }

    /// Generate a unique filename with the given extension.
    fn generate_filename(&self, extension: Option<&str>) -> String {
        let uuid = Uuid::new_v4();
        if let Some(ext) = extension {
            if ext.is_empty() {
                uuid.to_string()
            } else {
                format!("{}.{}", uuid, ext)
            }
        } else {
            uuid.to_string()
        }
    }

    /// Validate MIME type and size.
    fn validate_file(
        &self,
        content_type: &str,
        size: usize,
        category: Option<&str>,
    ) -> Result<(), AppError> {
        // Define allowed MIME types and max sizes per category
        let limits = match category {
            Some("media") => {
                // Images only
                let allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
                let max_size = 10 * 1024 * 1024; // 10 MB
                (allowed, max_size)
            }
            Some("receipts") => {
                // PDFs, maybe images
                let allowed = ["application/pdf", "image/jpeg", "image/png"];
                let max_size = 5 * 1024 * 1024; // 5 MB
                (allowed, max_size)
            }
            Some("exports") => {
                // CSV, JSON, etc.
                let allowed = ["text/csv", "application/json", "text/plain"];
                let max_size = 10 * 1024 * 1024; // 10 MB
                (allowed, max_size)
            }
            None => {
                // Default: allow common file types, limit 20 MB
                let allowed = [
                    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
                    "application/pdf", "text/csv", "application/json", "text/plain",
                    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ];
                let max_size = 20 * 1024 * 1024; // 20 MB
                (allowed, max_size)
            }
        };

        let (allowed, max_size) = limits;
        if !allowed.contains(&content_type) {
            return Err(AppError::bad_request(&format!(
                "File type not allowed for category {:?}. Allowed types: {:?}",
                category, allowed
            )));
        }
        if size > max_size {
            return Err(AppError::bad_request(&format!(
                "File too large. Maximum size for category {:?} is {} MB",
                category,
                max_size / (1024 * 1024)
            )));
        }
        Ok(())
    }
}

/// Upload a file.
/// Requires authentication (admin or any logged-in user? We'll use AuthUser for now).
pub async fn upload(
    State(state): State<Arc<StorageState>>,
    TenantSlug(slug): TenantSlug,
    AuthUser(_auth): AuthUser, // Require authentication
    Query(params): Query<UploadParams>,
    mut multipart: Multipart,
) -> Result<Json<FileInfo>, AppError> {
    // Ensure tenant directory exists
    state.ensure_tenant_dir(&slug)?;

    // Process multipart fields
    while let Some(mut field) = multipart.next_field().await.map_err(|e| AppError::bad_request(&format!("Multipart error: {}", 
