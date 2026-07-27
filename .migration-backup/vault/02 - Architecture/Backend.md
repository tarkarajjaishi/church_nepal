# Backend Architecture

**Stack**: Rust + Axum + SQLx + PostgreSQL
**Port**: 3002 (changed from 3001 due to port conflict with nepsetrading)

## Overview

REST API serving the Church Nepal website. JWT authentication, full CRUD for 12 entity types.

## Directory Structure

```
backend/src/
├── main.rs           # Entry point, server setup
├── config.rs         # Configuration
├── db.rs             # Database connection pool
├── auth.rs           # JWT auth middleware
├── error.rs          # AppError type
├── routes.rs         # Route definitions
├── handlers/         # Route handlers
│   ├── auth.rs       # Login/register
│   ├── sermons.rs    # CRUD
│   ├── events.rs     # CRUD
│   ├── ministries.rs # CRUD
│   ├── leaders.rs    # CRUD
│   ├── gallery.rs    # CRUD
│   ├── testimonies.rs
│   ├── notices.rs
│   ├── members.rs
│   ├── service_times.rs
│   ├── verses.rs
│   ├── campaigns.rs
│   └── settings.rs
└── models/           # Data models
```

## Key Patterns

### AppError
```rust
pub struct AppError {
    status: StatusCode,
    message: String,
}

impl AppError {
    pub fn not_found() -> Self { ... }
    pub fn unauthorized() -> Self { ... }
    pub fn bad_request() -> Self { ... }
}
```

### Handler Pattern
```rust
pub async fn get_sermon(
    Path(id): Path<uuid::Uuid>,
    State(state): State<AppState>,
) -> Result<Json<Sermon>, AppError> {
    let sermon = sqlx::query_as!(Sermon, "SELECT * FROM sermons WHERE id = $1", id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(AppError::not_found)?;
    
    Ok(Json(sermon))
}
```

## Database

**Connection**: `postgres://postgres:church@localhost:5432/grace_church`
**Tables**: 13 tables, ~80 rows seed data

## Related
- [[03 - Knowledge/Rust-Patterns|Rust Patterns]]
- [[03 - Knowledge/Windows-Gotchas|Windows Gotchas]]
