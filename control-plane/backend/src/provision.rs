use crate::config::Config;
use crate::error::AppError;
use chrono::NaiveDateTime;
use rand::Rng;
use sqlx::postgres::PgPoolOptions;
use sqlx::Executor;
use std::path::Path;

/// Turn a church name into a Postgres-safe slug used identically for the
/// database name, the storage folder, and the subdomain label.
/// "Grace Church Kathmandu" -> "gracechurchkathmandu".
pub fn slugify(name: &str) -> String {
    let mut s: String = name
        .to_lowercase()
        .chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .collect();
    if s.len() > 63 {
        s.truncate(63);
    }
    s
}

/// A valid slug must be a safe unquoted Postgres identifier: starts with a
/// letter, only [a-z0-9], 3..=63 chars. This is also our injection guard,
/// because database names cannot be bound as query parameters.
pub fn valid_slug(slug: &str) -> bool {
    let bytes = slug.as_bytes();
    if slug.len() < 3 || slug.len() > 63 {
        return false;
    }
    if !bytes[0].is_ascii_lowercase() {
        return false;
    }
    slug.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
}

fn random_password() -> String {
    const CHARS: &[u8] = b"abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let mut rng = rand::thread_rng();
    (0..14).map(|_| CHARS[rng.gen_range(0..CHARS.len())] as char).collect()
}

pub struct Provisioned {
    pub slug: String,
    pub subdomain: String,
    pub admin_email: String,
    pub admin_password: String,
    pub storage_path: String,
}

/// Full provisioning: create DB -> run church migrations -> create storage
/// folder -> seed an auto-generated church admin. Returns the credentials
/// (password is only ever returned here, never stored in plaintext).
pub async fn provision_church(cfg: &Config, name: &str) -> Result<Provisioned, AppError> {
    let slug = slugify(name);
    if !valid_slug(&slug) {
        return Err(AppError::bad_request(
            "Church name must yield at least 3 letters/digits and start with a letter",
        ));
    }

    create_database(cfg, &slug).await?;
    run_church_migrations(cfg, &slug).await?;
    let storage_path = create_storage(cfg, &slug)?;

    let admin_email = format!("admin@{}.{}", slug, cfg.base_domain);
    let admin_password = random_password();
    seed_church_admin(cfg, &slug, &admin_email, &admin_password).await?;

    Ok(Provisioned {
        subdomain: format!("{}.{}", slug, cfg.base_domain),
        slug,
        admin_email,
        admin_password,
        storage_path,
    })
}

async fn create_database(cfg: &Config, slug: &str) -> Result<(), AppError> {
    let admin = PgPoolOptions::new()
        .max_connections(1)
        .connect(&cfg.pg_super_url)
        .await
        .map_err(|e| AppError::internal(format!("connect superuser db: {e}")))?;

    let exists: Option<i32> = sqlx::query_scalar("SELECT 1 FROM pg_database WHERE datname = $1")
        .bind(slug)
        .fetch_optional(&admin)
        .await?;
    if exists.is_some() {
        return Err(AppError::conflict(format!("A church database '{slug}' already exists")));
    }

    // slug is validated to [a-z0-9] so this identifier is injection-safe.
    admin
        .execute(format!("CREATE DATABASE \"{slug}\"").as_str())
        .await
        .map_err(|e| AppError::internal(format!("create database: {e}")))?;
    Ok(())
}

async fn run_church_migrations(cfg: &Config, slug: &str) -> Result<(), AppError> {
    let pool = PgPoolOptions::new()
        .max_connections(2)
        .connect(&cfg.church_db_url(slug))
        .await
        .map_err(|e| AppError::internal(format!("connect new church db: {e}")))?;

    let dir = Path::new(&cfg.church_migrations_dir);
    let mut files: Vec<_> = std::fs::read_dir(dir)
        .map_err(|e| AppError::internal(format!("read migrations dir {}: {e}", dir.display())))?
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| p.extension().map(|x| x == "sql").unwrap_or(false))
        .collect();
    files.sort();

    for path in files {
        let sql = std::fs::read_to_string(&path)
            .map_err(|e| AppError::internal(format!("read {}: {e}", path.display())))?;
        sqlx::raw_sql(&sql)
            .execute(&pool)
            .await
            .map_err(|e| AppError::internal(format!("migration {}: {e}", path.display())))?;
    }
    Ok(())
}

fn create_storage(cfg: &Config, slug: &str) -> Result<String, AppError> {
    let path = Path::new(&cfg.storage_root).join(slug);
    std::fs::create_dir_all(&path)
        .map_err(|e| AppError::internal(format!("create storage {}: {e}", path.display())))?;
    Ok(path.to_string_lossy().to_string())
}

async fn seed_church_admin(cfg: &Config, slug: &str, email: &str, password: &str) -> Result<(), AppError> {
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&cfg.church_db_url(slug))
        .await?;
    let hash = bcrypt::hash(password, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::internal(format!("hash: {e}")))?;
    sqlx::query("INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'admin')")
        .bind(email)
        .bind(&hash)
        .bind("Church Admin")
        .execute(&pool)
        .await
        .map_err(|e| AppError::internal(format!("seed admin: {e}")))?;
    Ok(())
}

/// Tear down a church: drop its database and delete its storage folder.
pub async fn deprovision(cfg: &Config, slug: &str) -> Result<(), AppError> {
    if !valid_slug(slug) {
        return Err(AppError::bad_request("invalid slug"));
    }
    let admin = PgPoolOptions::new().max_connections(1).connect(&cfg.pg_super_url).await?;
    // Terminate open connections so DROP DATABASE can proceed.
    let _ = sqlx::query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()")
        .bind(slug)
        .execute(&admin)
        .await;
    admin
        .execute(format!("DROP DATABASE IF EXISTS \"{slug}\"").as_str())
        .await
        .map_err(|e| AppError::internal(format!("drop database: {e}")))?;
    let path = Path::new(&cfg.storage_root).join(slug);
    let _ = std::fs::remove_dir_all(&path);
    Ok(())
}

/// Insert a notification row into the control database.
pub async fn emit_notification(
    pool: &sqlx::PgPool,
    event_type: &str,
    title: &str,
    body: &str,
    church_id: Option<&uuid::Uuid>,
) -> Result<(), AppError> {
    sqlx::query(
        "INSERT INTO notifications (type, title, body, church_id) VALUES ($1, $2, $3, $4)",
    )
    .bind(event_type)
    .bind(title)
    .bind(body)
    .bind(church_id)
    .execute(pool)
    .await?;

    Ok(())
}

/// Update (or clear) the shared suspension flag in a church's own database.
/// This lets the church backend enforce suspension without reaching back to
/// the control plane on every request.
pub async fn update_church_suspended_flag(
    cfg: &Config,
    slug: &str,
    suspended_at: Option<&chrono::NaiveDateTime>,
) -> Result<(), AppError> {
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&cfg.church_db_url(slug))
        .await?;

    if let Some(ts) = suspended_at {
        sqlx::query(
            "INSERT INTO settings (key, value) VALUES ('suspended_at', $1) \
             ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()",
        )
        .bind(ts.and_utc().to_rfc3339())
        .execute(&pool)
        .await?;
    } else {
        sqlx::query(
            "INSERT INTO settings (key, value) VALUES ('suspended_at', '') \
             ON CONFLICT (key) DO UPDATE SET value = '', updated_at = NOW()",
        )
        .execute(&pool)
        .await?;
    }

    Ok(())
}
