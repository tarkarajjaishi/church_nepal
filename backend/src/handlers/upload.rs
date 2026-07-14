use axum::extract::Multipart;
use axum::Json;
use crate::error::AppError;
use crate::auth::AuthUser;

const UPLOAD_DIR: &str = "uploads";
const MAX_FILE_SIZE: usize = 10 * 1024 * 1024; // 10MB

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
