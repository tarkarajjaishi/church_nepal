use sqlx::postgres::{PgPool, PgPoolOptions};
use crate::config::Config;

pub async fn new_pool(config: &Config) -> PgPool {
    let pool = new_pool_with_retry(config).await;
    if config.db_migrate_on_startup {
        let _ = run_migrations(&pool, &config.migrations_dir).await;
    }
    pool
}

pub async fn new_pool_with_retry(config: &Config) -> PgPool {
    let timeout = Duration::from_secs(config.db_connect_timeout_secs);
    let max_retries = config.db_connect_max_retries;
    let mut attempt: u32 = 0;

    loop {
        match PgPoolOptions::new()
            .min_connections(config.db_min_connections)
            .max_connections(config.db_max_connections)
            .idle_timeout(Some(Duration::from_secs(config.db_idle_timeout_secs)))
            .max_lifetime(Some(Duration::from_secs(config.db_max_lifetime_secs)))
            .acquire_timeout(timeout)
            .connect(&config.database_url)
            .await
        {
            Ok(pool) => return pool,
            Err(e) => {
                attempt += 1;
                if attempt >= max_retries {
                    panic!(
                        "Failed to connect to database after {} attempts: {}",
                        max_retries, e
                    );
                }
                let backoff = Duration::from_millis(200 * u64::from(attempt));
                eprintln!(
                    "DB connect attempt {}/{} failed: {} — retrying in {:?}",
                    attempt, max_retries, e, backoff
                );
                tokio::time::sleep(backoff).await;
            }
        }
    }
}

async fn run_migrations(pool: &PgPool, dir: &str) {
    let runner = sqlx::migrate::Migrator::new(std::path::Path::new(dir))
        .await
        .expect("valid migrations");
    if let Err(e) = runner.run(pool).await {
        eprintln!("migrations failed: {}", e);
    }
}
