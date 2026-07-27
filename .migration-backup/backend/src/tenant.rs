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
use std::time::Duration;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct TenantRegistryConfig {
    pub pg_base: String,
    pub base_domain: String,
    pub default_slug: Option<String>,
    pub min_connections: u32,
    pub max_connections: u32,
    pub idle_timeout_secs: u64,
    pub max_lifetime_secs: u64,
    pub connect_timeout_secs: u64,
    pub connect_max_retries: u32,
}

#[derive(Clone)]
pub struct TenantRegistry {
    pools: Arc<Mutex<HashMap<String, PgPool>>>,
    pg_base: String,
    base_domain: String,
    default_slug: Option<String>,
    min_connections: u32,
    max_connections: u32,
    idle_timeout_secs: u64,
    max_lifetime_secs: u64,
    connect_timeout_secs: u64,
    connect_max_retries: u32,
}

impl TenantRegistry {
    pub fn from_config(cfg: TenantRegistryConfig) -> Self {
        Self {
            pools: Arc::new(Mutex::new(HashMap::new())),
            pg_base: cfg.pg_base,
            base_domain: cfg.base_domain,
            default_slug: cfg.default_slug,
            min_connections: cfg.min_connections,
            max_connections: cfg.max_connections,
            idle_timeout_secs: cfg.idle_timeout_secs,
            max_lifetime_secs: cfg.max_lifetime_secs,
            connect_timeout_secs: cfg.connect_timeout_secs,
            connect_max_retries: cfg.connect_max_retries,
        }
    }

    pub fn from_env() -> Self {
        let cfg = TenantRegistryConfig {
            pg_base: std::env::var("PG_BASE_URL").unwrap_or_else(|_| {
                let url = std::env::var("DATABASE_URL")
                    .unwrap_or_else(|_| "postgres://postgres:password@localhost:5432".into());
                match url.rfind('/') {
                    Some(i) => url[..i].to_string(),
                    None => url,
                }
            }),
            base_domain: std::env::var("BASE_DOMAIN").unwrap_or_else(|_| "churchnepal.com".into()),
            default_slug: std::env::var("DEFAULT_TENANT").ok().filter(|s| !s.is_empty()),
            min_connections: std::env::var("DB_MIN_CONNECTIONS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(1),
            max_connections: std::env::var("DB_MAX_CONNECTIONS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(5),
            idle_timeout_secs: std::env::var("DB_IDLE_TIMEOUT_SECS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(600),
            max_lifetime_secs: std::env::var("DB_MAX_LIFETIME_SECS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(1800),
            connect_timeout_secs: std::env::var("DB_CONNECT_TIMEOUT_SECS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(5),
            connect_max_retries: std::env::var("DB_CONNECT_MAX_RETRIES")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(10),
        };
        Self::from_config(cfg)
    }

    fn church_db_url(&self, slug: &str) -> String {
        format!("{}/{}", self.pg_base, slug)
    }

    fn build_pool_options(&self) -> PgPoolOptions {
        let timeout = Duration::from_secs(self.connect_timeout_secs);
        PgPoolOptions::new()
            .min_connections(self.min_connections)
            .max_connections(self.max_connections)
            .idle_timeout(Some(Duration::from_secs(self.idle_timeout_secs)))
            .max_lifetime(Some(Duration::from_secs(self.max_lifetime_secs)))
            .acquire_timeout(timeout)
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
        let pool = self.connect_with_retry(slug).await?;
        let mut guard = self.pools.lock().await;
        let entry = guard.entry(slug.to_string()).or_insert(pool);
        Some(entry.clone())
    }

    async fn connect_with_retry(&self, slug: &str) -> Option<PgPool> {
        let url = self.church_db_url(slug);
        let max_retries = self.connect_max_retries;
        let timeout = Duration::from_secs(self.connect_timeout_secs);
        let mut attempt: u32 = 0;

        loop {
            match self
                .build_pool_options()
                .connect(&url)
                .await
            {
                Ok(pool) => return Some(pool),
                Err(e) => {
                    attempt += 1;
                    if attempt >= max_retries {
                        eprintln!(
                            "Failed to connect to church db '{}' after {} attempts: {}",
                            slug, max_retries, e
                        );
                        return None;
                    }
                    let backoff = Duration::from_millis(200 * u64::from(attempt));
                    eprintln!(
                        "Church db '{}' connect attempt {}/{} failed: {} — retrying in {:?}",
                        slug, attempt, max_retries, e, backoff
                    );
                    tokio::time::sleep(backoff).await;
                }
            }
        }
    }

    pub async fn all_pools(&self) -> Vec<PgPool> {
        let guard = self.pools.lock().await;
        guard.values().cloned().collect()
    }
}

/// A church's db name must be a safe Postgres identifier — this is also the
/// injection guard, since the name is interpolated into the connection URL.
pub fn valid_slug(slug: &str) -> bool {
    let bytes = slug.as_bytes();
    slug.len() >= 3
        && slug.len() <= 63
        && bytes[0].is_ascii_lowercase()
        && slug.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_')
}

/// Extract the church slug from the Host header (first DNS label).
pub fn subdomain_from_host(host: &str, base_domain: &str) -> Option<String> {
    let host = host.split(':').next().unwrap_or(host);
    if host == base_domain {
        return None;
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
