use axum::extract::Multipart;
use axum::Json;
use crate::error::AppError;
use crate::auth::AuthUser;
use serde::Serialize;

const UPLOAD_DIR: &str = "uploads";
const MAX_FILE_SIZE: usize = 10 * 1024 * 1024; // 10MB

#[derive(Serialize)]
pub struct UploadInfo {
    pub filename: String,
    pub url: String,
    pub original_name: String,
    pub content_type: String,
    pub size: u64,
    pub created_at: String,
}

pub async fn upload(
    _auth: AuthUser,
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, AppError> {
    std::fs::create_dir_all(UPLOAD_DIR).map_err(|e| AppError::internal(&format!("Failed to create upload dir: {}", e)))?;

    while let Some(mut field) = multipart.next_field().await.map_err(|e| AppError::bad_request(&format!("Multipart error: {}", e)))? {
        let name = field.file_name().unwrap_or("upload").to_string();
        let content_type = field.content_type().unwrap_or("application/octet-stream").to_string();

        // Validate content type
        if !content_type.starts_with("image/") {
            return Err(AppError::bad_request("Only image files are allowed"));
        }

        // Determine extension from content type
        let ext = match content_type.as_str() {
            "image/jpeg" => "jpg",
            "image/png" => "png",
            "image/gif" => "gif",
            "image/webp" => "webp",
            "image/svg+xml" => "svg",
            _ => "bin",
        };

        // Generate unique filename
        let filename = format!("{}.{}", uuid::Uuid::new_v4(), ext);
        let filepath = format!("{}/{}", UPLOAD_DIR, filename);

        // Read and write file
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

        let url = format!("/api/uploads/{}", filename);
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

pub async fn list_uploads(
    _auth: AuthUser,
) -> Result<Json<Vec<UploadInfo>>, AppError> {
    let dir = std::path::Path::new(UPLOAD_DIR);
    if !dir.exists() {
        return Ok(Json(vec![]));
    }

    let mut entries: Vec<UploadInfo> = Vec::new();

    let read_dir = std::fs::read_dir(dir).map_err(|e| AppError::internal(&format!("Failed to read uploads dir: {}", e)))?;

    for entry in read_dir {
        let entry = entry.map_err(|e| AppError::internal(&format!("Failed to read entry: {}", e)))?;
        let metadata = entry.metadata().map_err(|e| AppError::internal(&format!("Failed to read metadata: {}", e)))?;

        if !metadata.is_file() {
            continue;
        }

        let filename = entry.file_name().to_string_lossy().to_string();

        // Infer content type from extension
        let content_type = match filename.rsplit('.').next().unwrap_or("") {
            "jpg" | "jpeg" => "image/jpeg",
            "png" => "image/png",
            "gif" => "image/gif",
            "webp" => "image/webp",
            "svg" => "image/svg+xml",
            _ => continue, // skip non-image files
        };

        // Derive original name: strip UUID prefix (UUID.ext → ext)
        let original_name = filename
            .split_once('.')
            .map(|(uuid_part, ext)| {
                let parts: Vec<&str> = uuid_part.split('-').collect();
                if parts.len() == 5 && parts.iter().all(|p| p.len() >= 1 && p.len() <= 4) && uuid_part.len() == 36 {
                    format!("{}.{}", uuid_part, ext)
                } else {
                    filename.clone()
                }
            })
            .unwrap_or_else(|| filename.clone());

        let created_at = metadata
            .modified()
            .map(|t| {
                let dt: chrono::DateTime<chrono::Utc> = t.into();
                dt.to_rfc3339()
            })
            .unwrap_or_default();

        entries.push(UploadInfo {
            filename: filename.clone(),
            url: format!("/api/uploads/{}", filename),
            original_name,
            content_type: content_type.to_string(),
            size: metadata.len(),
            created_at,
        });
    }

    // Sort newest first
    entries.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(Json(entries))
}
