# Rust/Axum Patterns

## Axum 0.8 Path Params

**Syntax**: Uses `/{id}` (not `/:id`).

```rust
// Route definition
.route("/sermons/{id}", get(get_sermon))

// Handler
pub async fn get_sermon(
    Path(id): Path<uuid::Uuid>,
    State(state): State<AppState>,
) -> Result<Json<Sermon>, AppError> {
    // ...
}
```

## Axum 0.8 Extractor Pattern

**Must import separately**:
```rust
use axum::extract::Path;
```

Fully qualified `axum::extract::Path` in signature doesn't work.

## AppError Pattern

```rust
pub struct AppError {
    status: StatusCode,
    message: String,
}

impl AppError {
    pub fn not_found() -> Self {
        Self {
            status: StatusCode::NOT_FOUND,
            message: "Resource not found".to_string(),
        }
    }
    
    pub fn unauthorized() -> Self {
        Self {
            status: StatusCode::UNAUTHORIZED,
            message: "Unauthorized".to_string(),
        }
    }
    
    pub fn bad_request() -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            message: "Bad request".to_string(),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        (self.status, self.message).into_response()
    }
}
```

## Generic Error Handling

The blanket `From<E: Into<anyhow::Error>>` defaults to 500, which is correct for unexpected errors but wrong for expected failures. Use explicit constructors for expected error paths.

## Auth Error Messages

Login returns generic "Invalid email or password" (not "user not found" or "wrong password") to prevent user enumeration attacks.

## Related
- [[02 - Architecture/Backend|Backend Architecture]]
- [[03 - Knowledge/Windows-Gotchas|Windows Gotchas]]
