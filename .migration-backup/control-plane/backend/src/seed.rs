use crate::config::Config;
use crate::error::AppError;
use crate::provision::{provision_church, Provisioned};
use bcrypt;
use sqlx::postgres::PgPoolOptions;

/// Dummy church data for seeding.
pub struct DummyChurch {
    pub name: &'static str,
    pub plan: &'static str,
}

/// The dummy churches to provision. Idempotent - will skip if already exists.
const DUMMY_CHURCHES: &[DummyChurch] = &[
    DummyChurch { name: "Grace Church Kathmandu", plan: "Pro" },
    DummyChurch { name: "Hillside Church Pokhara", plan: "Standard" },
    DummyChurch { name: "Riverside Church Lalitpur", plan: "Standard" },
    DummyChurch { name: "Cornerstone Church Biratnagar", plan: "Free" },
    DummyChurch { name: "New Life Church Dharan", plan: "Pro" },
];

/// Seed super admin into the admins table if empty (idempotent).
pub async fn seed_admins(cfg: &Config, pool: &sqlx::PgPool) -> Result<(), AppError> {
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM admins")
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::internal(format!("count admins: {e}")))?;

    if count.0 > 0 {
        return Ok(());
    }

    let hash = bcrypt::hash(&cfg.super_admin_password, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::internal(format!("hash super admin password: {e}")))?;

    sqlx::query("INSERT INTO admins (email, password_hash, role) VALUES ($1, $2, 'super_admin')")
        .bind(&cfg.super_admin_email)
        .bind(&hash)
        .execute(pool)
        .await
        .map_err(|e| AppError::internal(format!("insert super admin: {e}")))?;

    println!("Seeded super-admin into admins table: {}", cfg.super_admin_email);
    Ok(())
}

/// Seed a dedicated test admin for E2E/QA (idempotent).
pub async fn seed_test_admin(_cfg: &Config, pool: &sqlx::PgPool) -> Result<(), AppError> {
    let exists: Option<i32> = sqlx::query_scalar("SELECT 1 FROM admins WHERE email = $1")
        .bind("test@churchnepal.com")
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::internal(format!("check test admin: {e}")))?;

    if exists.is_some() {
        return Ok(());
    }

    let password_hash = bcrypt::hash("testpass123", bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::internal(format!("hash test admin password: {e}")))?;

    sqlx::query(
        "INSERT INTO admins (email, password_hash, role, status, twofa_enabled, totp_secret) \
         VALUES ($1, $2, 'admin', 'active', true, $3)",
    )
    .bind("test@churchnepal.com")
    .bind(&password_hash)
    .bind("JBSWY3DPEHPK3PXP")
    .execute(pool)
    .await
    .map_err(|e| AppError::internal(format!("insert test admin: {e}")))?;

    println!("Seeded test admin with 2FA: test@churchnepal.com");
    Ok(())
}

/// Seed 5 dummy churches on startup (dev only). Idempotent - checks if slug exists first.
pub async fn seed_dummy_churches(cfg: &Config, control_pool: &sqlx::PgPool) -> Result<Vec<Provisioned>, AppError> {
    let mut seeded = Vec::new();

    println!("Checking for dummy churches to seed...");

    for church in DUMMY_CHURCHES {
        // Check if slug already exists (idempotent)
        let slug = crate::provision::slugify(church.name);
        let exists: Option<i32> = sqlx::query_scalar("SELECT 1 FROM churches WHERE slug = $1")
            .bind(&slug)
            .fetch_optional(control_pool)
            .await
            .map_err(|e| AppError::internal(format!("check existing church: {e}")))?;

        if exists.is_some() {
            println!("  '{}' already exists (slug: {}), skipping", church.name, slug);
            continue;
        }

        // Provision the church
        match provision_church(cfg, church.name).await {
            Ok(provisioned) => {
                // Insert into control DB with plan
                let church_id: uuid::Uuid = sqlx::query_scalar(
                    "INSERT INTO churches (name, slug, db_name, storage_path, subdomain, admin_email, plan, status) \
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active') \
                     RETURNING id",
                )
                .bind(church.name)
                .bind(&provisioned.slug)
                .bind(&provisioned.slug)
                .bind(&provisioned.storage_path)
                .bind(&provisioned.subdomain)
                .bind(&provisioned.admin_email)
                .bind(church.plan)
                .fetch_one(control_pool)
                .await
                .map_err(|e| AppError::internal(format!("insert church {}: {e}", church.name)))?;

                let _ = crate::provision::emit_notification(
                    control_pool,
                    "church_provisioned",
                    "Church provisioned",
                    &format!("'{}' has been provisioned", church.name),
                    Some(&church_id),
                )
                .await;

                // Seed additional demo data in the church's database
                seed_church_demo_data(cfg, &provisioned.slug).await?;

                println!("  ✓ Seeded '{}': {} (admin: {})", church.name, provisioned.subdomain, provisioned.admin_email);
                seeded.push(provisioned);
            }
            Err(_) => {
                eprintln!("  ✗ Failed to seed '{}'", church.name);
            }
        }
    }

    // Update last_active_at for demo purposes on all churches
    sqlx::query("UPDATE churches SET last_active_at = NOW() - (RANDOM() * INTERVAL '7 days')")
        .execute(control_pool)
        .await
        .ok();

    println!("Dummy seed complete. {} churches created.", seeded.len());
    Ok(seeded)
}

/// Seed demo data in a church's database (members, events, sermons, etc).
async fn seed_church_demo_data(cfg: &Config, slug: &str) -> Result<(), AppError> {
    let pool = PgPoolOptions::new()
        .max_connections(2)
        .connect(&cfg.church_db_url(slug))
        .await
        .map_err(|e| AppError::internal(format!("connect church db {}: {e}", slug)))?;

    // Seed demo members
    for i in 1..=20 {
        let member_name = format!("Member {}", i);
        let role = if i % 5 == 0 { "Elder" } else if i % 3 == 0 { "Deacon" } else { "Member" };
        let since = format!("202{}", (i % 4) + 1);
        sqlx::query(
            "INSERT INTO members (name, role, since, image) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING"
        )
        .bind(&member_name)
        .bind(role)
        .bind(&since)
        .bind("https://i.pravatar.cc/150")
        .execute(&pool)
        .await
        .ok();
    }

    // Seed demo sermons
    for i in 1..=5 {
        let date = format!("2024-01-{:02}", i * 7);
        let image = format!("https://picsum.photos/seed/sermon{}/400/300", i);
        sqlx::query(
            "INSERT INTO sermons (title, speaker, date, duration, series, topic, image, description) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING"
        )
        .bind(format!("Sermon {}", i))
        .bind("Pastor Name")
        .bind(&date)
        .bind("45 min")
        .bind("Sunday Service")
        .bind("Faith")
        .bind(&image)
        .bind("A message about faith and hope.")
        .execute(&pool)
        .await
        .ok();
    }

    // Seed demo events
    for i in 1..=3 {
        let date = format!("2024-02-{:02}", i * 10);
        let display_date = format!("Feb {} 2024", i * 10);
        let image = format!("https://picsum.photos/seed/event{}/400/300", i);
        sqlx::query(
            "INSERT INTO events (title, date, display_date, time, location, image, description) \
             VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING"
        )
        .bind(format!("Event {}", i))
        .bind(&date)
        .bind(&display_date)
        .bind("10:00 AM")
        .bind("Church Campus")
        .bind(&image)
        .bind("Join us for this special event.")
        .execute(&pool)
        .await
        .ok();
    }

    // Seed demo offerings/giving
    for i in 1..=10 {
        let total_amount = ((i * 1000) % 50000) + 1000;
        sqlx::query(
            "INSERT INTO offerings (total_amount, notes) VALUES ($1, $2) ON CONFLICT DO NOTHING"
        )
        .bind(total_amount)
        .bind("Weekly tithe")
        .execute(&pool)
        .await
        .ok();
    }

    // Seed demo groups
    for i in 1..=5 {
        sqlx::query(
            "INSERT INTO groups (name, description, leader, meeting_time, location) \
             VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING"
        )
        .bind(format!("Group {}", i))
        .bind("Community group for fellowship")
        .bind(format!("Leader {}", i))
        .bind("Friday 7 PM")
        .bind("Church Hall")
        .execute(&pool)
        .await
        .ok();
    }

    // Seed demo todos
    for i in 1..=8 {
        sqlx::query(
            "INSERT INTO todos (title, done) VALUES ($1, $2) ON CONFLICT DO NOTHING"
        )
        .bind(format!("Task {}", i))
        .bind(i % 3 == 0)
        .execute(&pool)
        .await
        .ok();
    }

    Ok(())
}