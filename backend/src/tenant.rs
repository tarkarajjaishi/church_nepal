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
use std::time::{Duration, Instant};
use tokio::sync::Mutex;

/// How long an unknown slug is remembered as missing before we probe Postgres
/// again. Long enough that a subdomain scan costs nothing, short enough that a
/// church provisioned by the control plane starts serving without a restart.
const MISSING_TENANT_TTL: Duration = Duration::from_secs(30);

/// Postgres SQLSTATE 3D000 — the database named in the connection URL does not
/// exist. This is permanent for the request: retrying cannot make it true.
const INVALID_CATALOG_NAME: &str = "3D000";

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
    /// Slugs recently confirmed absent, with the time they were recorded.
    /// Without this, every request to an unknown subdomain re-ran the full
    /// connect-and-retry cycle against Postgres.
    missing: Arc<Mutex<HashMap<String, Instant>>>,
    pg_base: String,
    base_domain: String,
    pub default_slug: Option<String>,
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
            missing: Arc::new(Mutex::new(HashMap::new())),
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

        // Known-missing tenants short-circuit here. Any request naming an
        // unprovisioned subdomain used to re-enter connect_with_retry and sit
        // there for ~9s while holding Postgres connection slots, which starved
        // the pools of healthy tenants — one bogus subdomain could 500 the
        // whole API. `*.churchnepal.com` is a public wildcard, so this path is
        // reachable by anyone.
        if self.is_known_missing(slug).await {
            return None;
        }

        let pool = match self.connect_with_retry(slug).await {
            Some(pool) => pool,
            None => {
                self.mark_missing(slug).await;
                return None;
            }
        };
        let mut guard = self.pools.lock().await;
        let entry = guard.entry(slug.to_string()).or_insert(pool);
        Some(entry.clone())
    }

    async fn is_known_missing(&self, slug: &str) -> bool {
        let mut guard = self.missing.lock().await;
        match guard.get(slug) {
            Some(seen) if seen.elapsed() < MISSING_TENANT_TTL => true,
            Some(_) => {
                // Expired — drop it and let this request re-probe, so a newly
                // provisioned church starts serving on its own.
                guard.remove(slug);
                false
            }
            None => false,
        }
    }

    async fn mark_missing(&self, slug: &str) {
        self.missing.lock().await.insert(slug.to_string(), Instant::now());
    }

    /// Forget a cached "missing" entry — call after provisioning a church so it
    /// serves immediately instead of waiting out the TTL.
    pub async fn forget_missing(&self, slug: &str) {
        self.missing.lock().await.remove(slug);
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
                    // "database does not exist" is permanent — retrying it just
                    // burns time and connection slots. Give up immediately.
                    if is_missing_database(&e) {
                        eprintln!("Church db '{}' does not exist", slug);
                        return None;
                    }
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

/// True when the connection failed because the target database is absent
/// (SQLSTATE 3D000), as opposed to a transient failure worth retrying.
fn is_missing_database(err: &sqlx::Error) -> bool {
    matches!(
        err.as_database_error().and_then(|e| e.code()).as_deref(),
        Some(INVALID_CATALOG_NAME)
    )
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

#[cfg(test)]
mod tests {
    use super::*;

    fn registry() -> TenantRegistry {
        TenantRegistry::from_config(TenantRegistryConfig {
            pg_base: "postgres://postgres:password@localhost:5432".into(),
            base_domain: "churchnepal.com".into(),
            default_slug: None,
            min_connections: 1,
            max_connections: 5,
            idle_timeout_secs: 600,
            max_lifetime_secs: 1800,
            connect_timeout_secs: 5,
            connect_max_retries: 10,
        })
    }

    /// The negative cache is what stops one unprovisioned subdomain from
    /// re-entering the connect-and-retry path on every request.
    #[tokio::test]
    async fn missing_tenants_are_cached_and_can_be_forgotten() {
        let reg = registry();

        assert!(!reg.is_known_missing("nosuchchurch").await);

        reg.mark_missing("nosuchchurch").await;
        assert!(reg.is_known_missing("nosuchchurch").await);

        // Other tenants are unaffected.
        assert!(!reg.is_known_missing("gracechurch").await);

        // Provisioning clears the entry so the church serves immediately.
        reg.forget_missing("nosuchchurch").await;
        assert!(!reg.is_known_missing("nosuchchurch").await);
    }

    #[test]
    fn slug_validation_rejects_injection_and_malformed_names() {
        assert!(valid_slug("gracechurch"));
        assert!(valid_slug("church_2"));
        assert!(!valid_slug("ab")); // too short
        assert!(!valid_slug("2church")); // must start with a letter
        assert!(!valid_slug("Grace")); // uppercase
        assert!(!valid_slug("a b")); // whitespace
        assert!(!valid_slug("x\"; DROP DATABASE postgres; --"));
    }

    #[test]
    fn subdomain_resolution() {
        assert_eq!(
            subdomain_from_host("gracechurch.churchnepal.com", "churchnepal.com"),
            Some("gracechurch".into())
        );
        // Apex and www are not tenants.
        assert_eq!(subdomain_from_host("churchnepal.com", "churchnepal.com"), None);
        assert_eq!(subdomain_from_host("www.churchnepal.com", "churchnepal.com"), None);
        // Port is ignored.
        assert_eq!(
            subdomain_from_host("gracechurch.localhost:3002", "churchnepal.com"),
            Some("gracechurch".into())
        );
    }
}
