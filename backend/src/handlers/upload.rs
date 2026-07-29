use axum::extract::{Multipart, Path as AxPath};
use axum::http::header;
use axum::response::{IntoResponse, Response};
use axum::Json;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::tenant::TenantSlug;
use serde::{Deserialize, Serialize};
use std::io::Cursor;

const MAX_FILE_SIZE: usize = 10 * 1024 * 1024; // 10MB
const IMAGE_WIDTHS: [u32; 3] = [300, 800, 1600];

/// Per-church storage root: <STORAGE_ROOT>/<slug>/ (db name == slug == folder).
fn storage_root() -> String {
    std::env::var("STORAGE_ROOT").unwrap_or_else(|_| "../storage".into())
}
fn storage_dir(slug: &str) -> std::path::PathBuf {
    std::path::Path::new(&storage_root()).join(slug)
}

fn content_type_for(filename: &str) -> &'static str {
    match filename.rsplit('.').next().unwrap_or("") {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        _ => "application/octet-stream",
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImageVariant {
    pub width: u32,
    pub url: String,
    pub size: u64,
}

#[derive(Serialize, Deserialize)]
pub struct UploadInfo {
    pub filename: String,
    pub url: String,
    pub original_name: String,
    pub content_type: String,
    pub size: u64,
    pub created_at: String,
    pub variants: Vec<ImageVariant>,
}

fn generate_variants(slug: String, filename: String, stem: String, ext: &'static str) {
    tokio::task::spawn_blocking(move || {
        let dir = storage_dir(&slug);
        let original_path = dir.join(&filename);

        let img = match image::ImageReader::open(&original_path) {
            Ok(reader) => match reader.decode() {
                Ok(img) => img,
                Err(_) => return,
            },
            Err(_) => return,
        };

        let original_w = img.width();

        for &target_w in &IMAGE_WIDTHS {
            if target_w >= original_w {
                continue;
            }

            let target_h = (target_w as f64 / original_w as f64 * img.height() as f64) as u32;
            let resized = img.resize(target_w, target_h, image::imageops::FilterType::Lanczos3);

            let variant_name = format!("{}_{}.webp", stem, target_w);
            let variant_path = dir.join(&variant_name);

            let mut buf = Cursor::new(Vec::new());
            if resized.write_to(&mut buf, image::ImageFormat::WebP).is_ok() {
                let _ = std::fs::write(&variant_path, buf.get_ref());
            }
        }
    });
}

pub async fn upload(
    _auth: AuthUser,
    TenantSlug(slug): TenantSlug,
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, AppError> {
    let dir = storage_dir(&slug);
    std::fs::create_dir_all(&dir).map_err(|e| AppError::internal(&format!("Failed to create upload dir: {}", e)))?;

    while let Some(mut field) = multipart.next_field().await.map_err(|e| AppError::bad_request(&format!("Multipart error: {}", e)))? {
        let name = field.file_name().unwrap_or("upload").to_string();
        let content_type = field.content_type().unwrap_or("application/octet-stream").to_string();

        if !content_type.starts_with("image/") {
            return Err(AppError::bad_request("Only image files are allowed"));
        }

        let ext = match content_type.as_str() {
            "image/jpeg" => "jpg",
            "image/png" => "png",
            "image/gif" => "gif",
            "image/webp" => "webp",
            "image/svg+xml" => "svg",
            _ => "bin",
        };

        let stem = uuid::Uuid::new_v4().to_string();
        let filename = format!("{}.{}", stem, ext);
        let filepath = dir.join(&filename);

        let mut data = Vec::new();
        let mut total_size = 0;
        while let Some(chunk) = field.chunk().await.map_err(|e| AppError::bad_request(&format!("Read error: {}", e)))? {
            total_size += chunk.len();
            if total_size > MAX_FILE_SIZE {
                return Err(AppError::bad_request("File too large (max 10MB)"));
            }
            data.extend_from_slice(&chunk);
        }

        tokio::fs::write(&filepath, &data).await.map_err(|e| AppError::internal(&format!("Write error: {}", e)))?;

        if ext != "svg" && ext != "bin" {
            generate_variants(slug.clone(), filename.clone(), stem.clone(), ext);
        }

        let url = format!("/uploads/{}", filename);
        return Ok(Json(serde_json::json!({
            "url": url,
            "filename": filename,
            "original_name": name,
            "content_type": content_type,
            "size": data.len(),
        })));
    }

    Err(AppError::bad_request("No file uploaded"))
}

/// Serve an uploaded file from the current church's storage folder.
pub async fn serve_upload(
    TenantSlug(slug): TenantSlug,
    AxPath(filename): AxPath<String>,
) -> Result<Response, AppError> {
    if filename.contains("..") || filename.contains('/') || filename.contains('\\') {
        return Err(AppError::bad_request("Invalid filename"));
    }
    let path = storage_dir(&slug).join(&filename);
    let data = tokio::fs::read(&path).await.map_err(|_| AppError::not_found("File not found"))?;
    Ok(([(header::CONTENT_TYPE, content_type_for(&filename))], data).into_response())
}

pub async fn list_uploads(
    _auth: AuthUser,
    TenantSlug(slug): TenantSlug,
) -> Result<Json<Vec<UploadInfo>>, AppError> {
    let dir = storage_dir(&slug);
    if !dir.exists() {
        return Ok(Json(vec![]));
    }

    let mut entries: Vec<UploadInfo> = Vec::new();
    let read_dir = std::fs::read_dir(&dir).map_err(|e| AppError::internal(&format!("Failed to read uploads dir: {}", e)))?;

    for entry in read_dir {
        let entry = entry.map_err(|e| AppError::internal(&format!("Failed to read entry: {}", e)))?;
        let metadata = entry.metadata().map_err(|e| AppError::internal(&format!("Failed to read metadata: {}", e)))?;
        if !metadata.is_file() {
            continue;
        }
        let filename = entry.file_name().to_string_lossy().to_string();

        if filename.contains('_') && filename.ends_with(".webp") {
            continue;
        }

        let content_type = match filename.rsplit('.').next().unwrap_or("") {
            "jpg" | "jpeg" => "image/jpeg",
            "png" => "image/png",
            "gif" => "image/gif",
            "webp" => "image/webp",
            "svg" => "image/svg+xml",
            _ => continue,
        };
        let created_at = metadata
            .modified()
            .map(|t| {
                let dt: chrono::DateTime<chrono::Utc> = t.into();
                dt.to_rfc3339()
            })
            .unwrap_or_default();

        let stem = std::path::Path::new(&filename)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or(&filename);

        let mut variants = Vec::new();
        for &w in &IMAGE_WIDTHS {
            let variant_name = format!("{}_{}.webp", stem, w);
            let variant_path = dir.join(&variant_name);
            if let Ok(meta) = std::fs::metadata(&variant_path) {
                variants.push(ImageVariant {
                    width: w,
                    url: format!("/uploads/{}", variant_name),
                    size: meta.len(),
                });
            }
        }

        entries.push(UploadInfo {
            filename: filename.clone(),
            url: format!("/uploads/{}", filename),
            original_name: filename.clone(),
            content_type: content_type.to_string(),
            size: metadata.len(),
            created_at,
            variants,
        });
    }

    entries.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(Json(entries))
}