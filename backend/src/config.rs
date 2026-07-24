use std::env;
use std::time::Duration;

#[derive(Clone)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub port: u16,
    pub db_min_connections: u32,
    pub db_max_connections: u32,
    pub db_idle_timeout_secs: u64,
    pub db_max_lifetime_secs: u64,
    pub db_connect_timeout_secs: u64,
    pub db_connect_max_retries: u32,
    pub db_migrate_on_startup: bool,
    pub migrations_dir: String,
    pub session_cookie_name: String,
    pub session_cookie_max_age: u64,
    pub session_cookie_secure: bool,
    pub session_idle_timeout_secs: u64,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();
        Self {
            database_url: env::var("DATABASE_URL").expect("DATABASE_URL must be set"),
            jwt_secret: env::var("JWT_SECRET").expect("JWT_SECRET must be set"),
            port: env::var("PORT")
                .unwrap_or_else(|_| "3001".into())
                .parse()
                .expect("PORT must be a number"),
            db_min_connections: env::var("DB_MIN_CONNECTIONS")
                .unwrap_or_else(|_| "5".into())
                .parse()
                .expect("DB_MIN_CONNECTIONS must be a number"),
            db_max_connections: env::var("DB_MAX_CONNECTIONS")
                .unwrap_or_else(|_| "20".into())
                .parse()
                .expect("DB_MAX_CONNECTIONS must be a number"),
            db_idle_timeout_secs: env::var("DB_IDLE_TIMEOUT_SECS")
                .unwrap_or_else(|_| "600".into())
                .parse()
                .expect("DB_IDLE_TIMEOUT_SECS must be a number"),
            db_max_lifetime_secs: env::var("DB_MAX_LIFETIME_SECS")
                .unwrap_or_else(|_| "1800".into())
                .parse()
                .expect("DB_MAX_LIFETIME_SECS must be a number"),
            db_connect_timeout_secs: env::var("DB_CONNECT_TIMEOUT_SECS")
                .unwrap_or_else(|_| "5".into())
                .parse()
                .expect("DB_CONNECT_TIMEOUT_SECS must be a number"),
            db_connect_max_retries: env::var("DB_CONNECT_MAX_RETRIES")
                .unwrap_or_else(|_| "10".into())
                .parse()
                .expect("DB_CONNECT_MAX_RETRIES must be a number"),
            db_migrate_on_startup: env::var("DB_MIGRATE_ON_STARTUP")
                .unwrap_or_else(|_| "true".into())
                .parse()
                .expect("DB_MIGRATE_ON_STARTUP must be true or false"),
            migrations_dir: env::var("MIGRATIONS_DIR")
                .unwrap_or_else(|_| "./migrations".into()),
            session_cookie_name: env::var("SESSION_COOKIE_NAME")
                .unwrap_or_else(|_| "auth_token".into()),
            session_cookie_max_age: env::var("SESSION_COOKIE_MAX_AGE")
                .unwrap_or_else(|_| "86400".into())
                .parse()
                .expect("SESSION_COOKIE_MAX_AGE must be a number"),
            session_cookie_secure: env::var("SESSION_COOKIE_SECURE")
                .unwrap_or_else(|_| "false".into())
                .parse()
                .expect("SESSION_COOKIE_SECURE must be true or false"),
            session_idle_timeout_secs: env::var("SESSION_IDLE_TIMEOUT_SECS")
                .unwrap_or_else(|_| "900".into())
                .parse()
                .expect("SESSION_IDLE_TIMEOUT_SECS must be a number"),
        }
    }
}
