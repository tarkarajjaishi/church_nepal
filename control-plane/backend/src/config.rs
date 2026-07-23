use std::env;

/// Configuration for the master control plane.
///
/// Multi-tenancy model: ONE PostgreSQL instance, one DATABASE per church.
/// A church's database name == its storage folder name == its subdomain label
/// (e.g. "gracechurchktm"), so everything for a church is trivial to locate.
#[derive(Clone)]
pub struct Config {
    /// Connection to the control database (registry of churches + super-admins).
    pub control_database_url: String,
    /// Superuser connection to the maintenance DB (e.g. .../postgres) — used to
    /// CREATE DATABASE for each new church. Must have CREATEDB privilege.
    pub pg_super_url: String,
    pub jwt_secret: String,
    pub port: u16,
    /// Directory holding the church app's *.sql migrations, run into each new church DB.
    pub church_migrations_dir: String,
    /// Root under which each church gets its own folder: <storage_root>/<slug>/.
    pub storage_root: String,
    /// Apex domain; a church's site is <slug>.<base_domain>.
    pub base_domain: String,
    /// Bootstrap super-admin (seeded on first startup if missing).
    pub super_admin_email: String,
    pub super_admin_password: String,
    pub stripe_secret_key: String,
    pub stripe_webhook_secret: String,
    pub stripe_price_basic_id: String,
    pub stripe_price_pro_id: String,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();
        Self {
            control_database_url: env::var("CONTROL_DATABASE_URL")
                .unwrap_or_else(|_| "postgres://postgres:password@localhost:5432/churchnepal_control".into()),
            pg_super_url: env::var("PG_SUPER_URL")
                .unwrap_or_else(|_| "postgres://postgres:password@localhost:5432/postgres".into()),
            jwt_secret: env::var("JWT_SECRET").unwrap_or_else(|_| "change_me_control_secret".into()),
            port: env::var("PORT").unwrap_or_else(|_| "3100".into()).parse().expect("PORT must be a number"),
            church_migrations_dir: env::var("CHURCH_MIGRATIONS_DIR")
                .unwrap_or_else(|_| "../../backend/migrations".into()),
            storage_root: env::var("STORAGE_ROOT").unwrap_or_else(|_| "../../storage".into()),
            base_domain: env::var("BASE_DOMAIN").unwrap_or_else(|_| "churchnepal.com".into()),
            super_admin_email: env::var("SUPER_ADMIN_EMAIL").unwrap_or_else(|_| "owner@churchnepal.com".into()),
            super_admin_password: env::var("SUPER_ADMIN_PASSWORD").unwrap_or_else(|_| "changeme123".into()),
            stripe_secret_key: env::var("STRIPE_SECRET_KEY").unwrap_or_else(|_| String::new()),
            stripe_webhook_secret: env::var("STRIPE_WEBHOOK_SECRET").unwrap_or_else(|_| String::new()),
            stripe_price_basic_id: env::var("STRIPE_PRICE_BASIC").unwrap_or_else(|_| String::new()),
            stripe_price_pro_id: env::var("STRIPE_PRICE_PRO").unwrap_or_else(|_| String::new()),
        }
    }

    /// Build the connection URL for a specific church database by swapping the
    /// trailing maintenance db name in pg_super_url with the church slug.
    pub fn church_db_url(&self, slug: &str) -> String {
        match self.pg_super_url.rfind('/') {
            Some(i) => format!("{}/{}", &self.pg_super_url[..i], slug),
            None => format!("{}/{}", self.pg_super_url, slug),
        }
    }
}
