use sqlx::postgres::{PgPool, PgPoolOptions};
use crate::config::Config;

pub async fn new_pool(config: &Config) -> PgPool {
    PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await
        .expect("Failed to connect to database")
}
