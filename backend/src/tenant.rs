//! Multi-tenant routing for the church app.
//!
//! One process serves every church. Each request is routed to the church's own
//! database by the request's subdomain: `gracechurchktm.churchnepal.com` -> the
//! `gracechurchktm` database. A church's db name == storage folder == subdomain
//! label, so resolution is a direct mapping (no lookup table needed).

use axum::extract::{FromRequestParts, Request, State};
use axum::http::request::Parts;
use axum::http::StatusCode;
use axum::middleware::Next;
use axum::response::Response;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct TenantRegistry {
    pools: Arc<Mutex<HashMap<String, PgPool>>>,
    /// "postgres://user:pass@host:port" with NO trailing database.
    pg_base: String,
    base_domain: String,
    /// Fallback tenant when there is no subdomain (local dev on localhost:3002).
    default_slug: Option<String>,
}

impl TenantRegistry {
    pub fn from_env() -> Self {
        let pg_base = std::env::var("PG_BASE_URL").unwrap_or_else(|_| {
            // Derive from DATABASE_URL by dropping the trailing /dbname.
            let url = std::env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgres://postgres:password@localhost:5432".into());
            match url.rfind('/') {
                Some(i) => url[..i].to_string(),
                None => url,
            }
        });
        Self {
            pools: Arc::new(Mutex::new(HashMap::new())),
            pg_base,
            base_domain: std::env::var("BASE_DOMAIN").unwrap_or_else(|_| "churchnepal.com".into()),
            default_slug: std::env::var("DEFAULT_TENANT").ok().filter(|s| !s.is_empty()),
        }
    }

    fn church_db_url(&self, slug: &str) -> String {
        format!("{}/{}", self.pg_base, slug)
    }

    /// Get (or lazily open and cache) the connection pool for a church.
    pub async fn pool_for(&self, slug: &str) -> Option<PgPool> {
        if !valid_slug(slug) {
            return None;
        }
        {
            let guard = self.pools.lock().await;
            if let Some(p) = guard.get(slug) {
                return Some(p.clone());
            }
        }
        // Open outside the lock so a slow connect doesn't block other tenants.
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&self.church_db_url(slug))
            .await
            .ok()?;
        let mut guard = self.pools.lock().await;
        let entry = guard.entry(slug.to_string()).or_insert(pool);
        Some(entry.clone())
    }
}

/// A church's db name must be a safe Postgres identifier — this is also the
/// injection guard, since the name is interpolated into the connection URL.
pub fn valid_slug(slug: &str) -> bool {
    let bytes = slug.as_bytes();
    slug.len() >= 3
        && slug.len() <= 63
        && bytes[0].is_ascii_lowercase()
        // underscores are valid, injection-safe Postgres identifier chars
        && slug.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_')
}

/// Extract the church slug from the Host header (first DNS label).
pub fn subdomain_from_host(host: &str, base_domain: &str) -> Option<String> {
    let host = host.split(':').next().unwrap_or(host); // strip port
    if host == base_domain {
        return None; // apex, not a church
    }
    let label = host.split('.').next()?;
    if label == host || label == "www" || label.is_empty() {
        return None;
    }
    Some(label.to_string())
}

/// Per-request middleware: resolve the tenant pool and inject it (+ its slug)
/// into the request so handlers/extractors can use it.
pub async fn tenant_mw(
    State(reg): State<TenantRegistry>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let host = req
        .headers()
        .get("host")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();

    let slug = subdomain_from_host(&host, &reg.base_domain).or_else(|| reg.default_slug.clone());
    let slug = slug.ok_or(StatusCode::NOT_FOUND)?;
    let pool = reg.pool_for(&slug).await.ok_or(StatusCode::NOT_FOUND)?;

    req.extensions_mut().insert(pool);
    req.extensions_mut().insert(TenantSlug(slug));
    Ok(next.run(req).await)
}

/// Extractor: the resolved tenant DB pool. Drop-in replacement for `State<PgPool>`.
pub struct Db(pub PgPool);

impl<S: Send + Sync> FromRequestParts<S> for Db {
    type Rejection = StatusCode;
    async fn from_request_parts(parts: &mut Parts, _s: &S) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<PgPool>()
            .cloned()
            .map(Db)
            .ok_or(StatusCode::INTERNAL_SERVER_ERROR)
    }
}

/// Extractor: the current church's slug (== db name == storage folder).
#[derive(Clone)]
pub struct TenantSlug(pub String);

impl<S: Send + Sync> FromRequestParts<S> for TenantSlug {
    type Rejection = StatusCode;
    async fn from_request_parts(parts: &mut Parts, _s: &S) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<TenantSlug>()
            .cloned()
            .ok_or(StatusCode::INTERNAL_SERVER_ERROR)
    }
}
