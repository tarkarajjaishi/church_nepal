use axum::extract::{Path, Query, State};
use axum::Json;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::postgres::PgPoolOptions;

use crate::auth::{create_token, SuperAdmin};
use crate::error::AppError;
use crate::provision;
use crate::seed;
use crate::AppState;

#[derive(Deserialize)]
pub struct LoginReq {
    pub email: String,
    pub password: String,
}

pub async fn login(State(st): State<AppState>, Json(req): Json<LoginReq>) -> Result<Json<Value>, AppError> {
    let row: Option<(String, String)> =
        sqlx::query_as("SELECT id::text, password_hash FROM control_admins WHERE email = $1")
            .bind(&req.email)
            .fetch_optional(&st.pool)
            .await?;
    let (id, hash) = row.ok_or_else(|| AppError::unauthorized("Invalid credentials"))?;
    let ok = bcrypt::verify(&req.password, &hash).unwrap_or(false);
    if !ok {
        return Err(AppError::unauthorized("Invalid credentials"));
    }
    let token = create_token(&id, &req.email).map_err(|e| AppError::internal(e.to_string()))?;
    Ok(Json(json!({ "token": token, "email": req.email })))
}

pub async fn me(admin: SuperAdmin) -> Json<Value> {
    Json(json!({ "id": admin.id, "email": admin.email }))
}

#[derive(Serialize, sqlx::FromRow)]
pub struct Church {
    pub id: uuid::Uuid,
    pub name: String,
    pub slug: String,
    pub db_name: String,
    pub storage_path: String,
    pub subdomain: String,
    pub admin_email: String,
    pub status: String,
    pub plan: Option<String>,
    pub custom_domain: Option<String>,
    pub last_active_at: Option<chrono::NaiveDateTime>,
    pub storage_bytes: Option<i64>,
    pub notes: Option<String>,
    pub created_at: Option<chrono::NaiveDateTime>,
}

pub async fn list_churches(_admin: SuperAdmin, State(st): State<AppState>) -> Result<Json<Vec<Value>>, AppError> {
    let churches: Vec<Church> = sqlx::query_as("SELECT * FROM churches ORDER BY created_at DESC")
        .fetch_all(&st.pool)
        .await?;

    let mut result = Vec::with_capacity(churches.len());
    for church in churches {
        // Connect to church DB to get stats
        let pool = PgPoolOptions::new()
            .max_connections(1)
            .connect(&st.cfg.church_db_url(&church.slug))
            .await
            .map_err(|e| AppError::internal(format!("connect church db: {e}")))?;

        let member_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM members")
            .fetch_one(&pool)
            .await
            .unwrap_or((0,));

        let giving_total: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(total_amount), 0) FROM offerings")
            .fetch_one(&pool)
            .await
            .unwrap_or((0,));

        let mut church_json = serde_json::to_value(&church).map_err(|e| AppError::internal(e.to_string()))?;
        church_json["member_count"] = json!(member_count.0);
        church_json["giving_total"] = json!(giving_total.0);
        result.push(church_json);
    }

    Ok(Json(result))
}

#[derive(Deserialize)]
pub struct CreateReq {
    pub name: String,
}

pub async fn create_church(
    _admin: SuperAdmin,
    State(st): State<AppState>,
    Json(req): Json<CreateReq>,
) -> Result<Json<Value>, AppError> {
    let name = req.name.trim();
    if name.is_empty() {
        return Err(AppError::bad_request("Church name is required"));
    }

    let p = provision::provision_church(&st.cfg, name).await?;

    sqlx::query(
        "INSERT INTO churches (name, slug, db_name, storage_path, subdomain, admin_email) \
         VALUES ($1, $2, $3, $4, $5, $6)",
    )
    .bind(name)
    .bind(&p.slug)
    .bind(&p.slug)
    .bind(&p.storage_path)
    .bind(&p.subdomain)
    .bind(&p.admin_email)
    .execute(&st.pool)
    .await?;

    // Password is returned exactly once, here — it is never stored in plaintext.
    Ok(Json(json!({
        "slug": p.slug,
        "subdomain": p.subdomain,
        "url": format!("https://{}", p.subdomain),
        "admin_email": p.admin_email,
        "admin_password": p.admin_password,
        "note": "Save this password now — it is shown only once."
    })))
}

pub async fn delete_church(
    _admin: SuperAdmin,
    State(st): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Value>, AppError> {
    let slug: Option<String> = sqlx::query_scalar("SELECT slug FROM churches WHERE id = $1")
        .bind(id)
        .fetch_optional(&st.pool)
        .await?;
    let slug = slug.ok_or_else(|| AppError::not_found("Church not found"))?;

    provision::deprovision(&st.cfg, &slug).await?;
    sqlx::query("DELETE FROM churches WHERE id = $1").bind(id).execute(&st.pool).await?;

    Ok(Json(json!({ "deleted": slug })))
}

/// Seed dummy churches endpoint (owner only)
pub async fn seed_dummy(_admin: SuperAdmin, State(st): State<AppState>) -> Result<Json<Value>, AppError> {
    let seeded = seed::seed_dummy_churches(&st.cfg, &st.pool).await?;
    Ok(Json(json!({ "seeded": seeded.len(), "message": "Dummy churches seeded" })))
}

// =============================================================================
// Plans handlers
// =============================================================================

#[derive(Serialize, sqlx::FromRow)]
pub struct Plan {
    pub id: uuid::Uuid,
    pub name: String,
    pub price_monthly: i64,
    pub price_annual: i64,
    pub max_members: i64,
    pub max_storage_mb: i64,
    pub max_emails: i64,
    pub max_churches: i64,
    pub features: Value,
    pub created_at: Option<chrono::NaiveDateTime>,
}

pub async fn list_plans(State(st): State<AppState>) -> Result<Json<Vec<Plan>>, AppError> {
    let plans = sqlx::query_as("SELECT * FROM plans ORDER BY price_monthly ASC")
        .fetch_all(&st.pool)
        .await?;
    Ok(Json(plans))
}

pub async fn get_plan(Path(id): Path<uuid::Uuid>, State(st): State<AppState>) -> Result<Json<Plan>, AppError> {
    let plan = sqlx::query_as("SELECT * FROM plans WHERE id = $1")
        .bind(id)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(|| AppError::not_found("Plan not found"))?;
    Ok(Json(plan))
}

#[derive(Deserialize)]
pub struct CreatePlanReq {
    pub name: String,
    pub price_monthly: i64,
    pub price_annual: Option<i64>,
    pub max_members: i64,
    pub max_storage_mb: i64,
    pub max_emails: i64,
    pub max_churches: i64,
    pub features: Option<Value>,
}

pub async fn create_plan(
    _admin: SuperAdmin,
    State(st): State<AppState>,
    Json(req): Json<CreatePlanReq>,
) -> Result<Json<Value>, AppError> {
    let price_annual = req.price_annual.unwrap_or(req.price_monthly * 10);
    
    let plan = sqlx::query_as::<_, Plan>(
        "INSERT INTO plans (name, price_monthly, price_annual, max_members, max_storage_mb, max_emails, max_churches, features) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) \
         RETURNING *"
    )
    .bind(&req.name)
    .bind(req.price_monthly)
    .bind(price_annual)
    .bind(req.max_members)
    .bind(req.max_storage_mb)
    .bind(req.max_emails)
    .bind(req.max_churches)
    .bind(req.features.unwrap_or(json!({})))
    .fetch_one(&st.pool)
    .await?;

    Ok(Json(serde_json::to_value(&plan).map_err(|e| AppError::internal(e.to_string()))?))
}

pub async fn update_plan(
    _admin: SuperAdmin,
    Path(id): Path<uuid::Uuid>,
    State(st): State<AppState>,
    Json(req): Json<CreatePlanReq>,
) -> Result<Json<Value>, AppError> {
    let plan = sqlx::query_as::<_, Plan>(
        "UPDATE plans SET name = $1, price_monthly = $2, price_annual = $3, max_members = $4, \
         max_storage_mb = $5, max_emails = $6, max_churches = $7, features = $8 \
         WHERE id = $9 \
         RETURNING *"
    )
    .bind(&req.name)
    .bind(req.price_monthly)
    .bind(req.price_annual.unwrap_or(req.price_monthly * 10))
    .bind(req.max_members)
    .bind(req.max_storage_mb)
    .bind(req.max_emails)
    .bind(req.max_churches)
    .bind(req.features.unwrap_or(json!({})))
    .bind(id)
    .fetch_optional(&st.pool)
    .await?
    .ok_or_else(|| AppError::not_found("Plan not found"))?;

    Ok(Json(serde_json::to_value(&plan).map_err(|e| AppError::internal(e.to_string()))?))
}

pub async fn delete_plan(
    _admin: SuperAdmin,
    Path(id): Path<uuid::Uuid>,
    State(st): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let result = sqlx::query("DELETE FROM plans WHERE id = $1")
        .bind(id)
        .execute(&st.pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::not_found("Plan not found"));
    }

    Ok(Json(json!({ "deleted": id.to_string() })))
}

// =============================================================================
// Billing handlers
// =============================================================================

#[derive(Serialize, sqlx::FromRow)]
pub struct Invoice {
    pub id: uuid::Uuid,
    pub church_id: uuid::Uuid,
    pub amount: i64,
    pub status: String,
    pub period_start: chrono::NaiveDateTime,
    pub period_end: chrono::NaiveDateTime,
    pub due_date: chrono::NaiveDateTime,
    pub paid_at: Option<chrono::NaiveDateTime>,
    pub created_at: Option<chrono::NaiveDateTime>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct BillingInfo {
    pub id: uuid::Uuid,
    pub church_id: uuid::Uuid,
    pub church_name: String,
    pub plan: String,
    pub status: String,
    pub trial_ends_at: Option<chrono::NaiveDateTime>,
    pub current_period_end: Option<chrono::NaiveDateTime>,
    pub mrr: i64,
}

pub async fn list_billing(State(st): State<AppState>) -> Result<Json<Vec<BillingInfo>>, AppError> {
    // Query each church and build billing info manually to avoid FromRow issues
    let churches = sqlx::query_as::<_, crate::handlers::Church>("SELECT * FROM churches ORDER BY created_at DESC")
        .fetch_all(&st.pool)
        .await?;

    let mut billing = Vec::new();
    for c in churches {
        billing.push(BillingInfo {
            id: c.id,
            church_id: c.id,
            church_name: c.name,
            plan: c.plan.unwrap_or_else(|| "Free".to_string()),
            status: c.status,
            trial_ends_at: None,
            current_period_end: None,
            mrr: 0,
        });
    }
    Ok(Json(billing))
}

pub async fn get_billing_for_church(
    Path(church_id): Path<uuid::Uuid>,
    State(st): State<AppState>,
) -> Result<Json<BillingInfo>, AppError> {
    let church = sqlx::query_as::<_, crate::handlers::Church>("SELECT * FROM churches WHERE id = $1")
        .bind(church_id)
        .fetch_optional(&st.pool)
        .await?
        .ok_or_else(|| AppError::not_found("Church not found"))?;
    
    let billing = BillingInfo {
        id: church.id,
        church_id: church.id,
        church_name: church.name,
        plan: church.plan.unwrap_or_else(|| "Free".to_string()),
        status: church.status,
        trial_ends_at: None,
        current_period_end: None,
        mrr: 0,
    };
    Ok(Json(billing))
}

pub async fn list_invoices(
    Query(params): Query<InvoiceParams>,
    State(st): State<AppState>,
) -> Result<Json<Vec<Invoice>>, AppError> {
    if let Some(church_id) = params.church_id {
        let invoices = sqlx::query_as("SELECT * FROM invoices WHERE church_id = $1 ORDER BY created_at DESC")
            .bind(church_id)
            .fetch_all(&st.pool)
            .await?;
        return Ok(Json(invoices));
    }
    
    let invoices = sqlx::query_as("SELECT * FROM invoices ORDER BY created_at DESC")
        .fetch_all(&st.pool)
        .await?;
    Ok(Json(invoices))
}

#[derive(Deserialize)]
pub struct InvoiceParams {
    pub church_id: Option<uuid::Uuid>,
}

pub async fn create_invoice(
    _admin: SuperAdmin,
    State(st): State<AppState>,
    Json(req): Json<CreateInvoiceReq>,
) -> Result<Json<Value>, AppError> {
    let invoice = sqlx::query_as::<_, Invoice>(
        "INSERT INTO invoices (church_id, amount, status, period_start, period_end, due_date) \
         VALUES ($1, $2, 'unpaid', $3, $4, $5) \
         RETURNING *"
    )
    .bind(req.church_id)
    .bind(req.amount)
    .bind(req.period_start)
    .bind(req.period_end)
    .bind(req.due_date)
    .fetch_one(&st.pool)
    .await?;

    Ok(Json(serde_json::to_value(&invoice).map_err(|e| AppError::internal(e.to_string()))?))
}

#[derive(Deserialize)]
pub struct CreateInvoiceReq {
    pub church_id: uuid::Uuid,
    pub amount: i64,
    pub period_start: chrono::NaiveDateTime,
    pub period_end: chrono::NaiveDateTime,
    pub due_date: chrono::NaiveDateTime,
}

pub async fn mark_invoice_paid(
    _admin: SuperAdmin,
    Path(id): Path<uuid::Uuid>,
    State(st): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let invoice = sqlx::query_as::<_, Invoice>(
        "UPDATE invoices SET status = 'paid', paid_at = NOW() WHERE id = $1 RETURNING *"
    )
    .bind(id)
    .fetch_optional(&st.pool)
    .await?
    .ok_or_else(|| AppError::not_found("Invoice not found"))?;

    Ok(Json(serde_json::to_value(&invoice).map_err(|e| AppError::internal(e.to_string()))?))
}

// =============================================================================
// Analytics handlers
// =============================================================================

#[derive(Serialize)]
pub struct Analytics {
    pub total_churches: i64,
    pub active_churches: i64,
    pub suspended_churches: i64,
    pub total_members: i64,
    pub total_giving: i64,
    pub mrr: i64,
    pub churches_this_month: i64,
}

pub async fn get_analytics(State(st): State<AppState>) -> Result<Json<Analytics>, AppError> {
    let total_churches: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM churches")
        .fetch_one(&st.pool)
        .await
        .map_err(|e| AppError::internal(e.to_string()))?;

    let active_churches: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM churches WHERE status = 'active'")
        .fetch_one(&st.pool)
        .await
        .map_err(|e| AppError::internal(e.to_string()))?;

    let suspended_churches: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM churches WHERE status = 'suspended'")
        .fetch_one(&st.pool)
        .await
        .map_err(|e| AppError::internal(e.to_string()))?;

    let churches_this_month: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM churches WHERE created_at >= DATE_TRUNC('month', NOW())"
    )
    .fetch_one(&st.pool)
    .await
    .map_err(|e| AppError::internal(e.to_string()))?;

    // Get aggregate stats from all church databases
    let churches = sqlx::query_as::<_, Church>("SELECT * FROM churches ORDER BY created_at DESC")
        .fetch_all(&st.pool)
        .await?;

    let mut total_members = 0i64;
    let mut total_giving = 0i64;

    for church in churches {
        if let Ok(pool) = PgPoolOptions::new()
            .max_connections(1)
            .connect(&st.cfg.church_db_url(&church.slug))
            .await
        {
            let members: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM members")
                .fetch_one(&pool)
                .await
                .unwrap_or((0,));
            total_members += members.0;

            let giving: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(total_amount), 0) FROM offerings")
                .fetch_one(&pool)
                .await
                .unwrap_or((0,));
            total_giving += giving.0;
        }
    }

    let analytics = Analytics {
        total_churches: total_churches.0,
        active_churches: active_churches.0,
        suspended_churches: suspended_churches.0,
        total_members,
        total_giving,
        mrr: 0, // Will be calculated when billing is implemented
        churches_this_month: churches_this_month.0,
    };

    Ok(Json(analytics))
}

#[derive(Serialize)]
pub struct ChurchStats {
    pub members: i64,
    pub giving: i64,
    pub events: i64,
    pub sermons: i64,
    pub groups: i64,
}

pub async fn get_church_stats(
    Path(slug): Path<String>,
    State(st): State<AppState>,
) -> Result<Json<ChurchStats>, AppError> {
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&st.cfg.church_db_url(&slug))
        .await
        .map_err(|e| AppError::internal(format!("connect church db: {e}")))?;

    let members: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM members")
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    let giving: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(total_amount), 0) FROM offerings")
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    let events: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM events")
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    let sermons: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM sermons")
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    let groups: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM groups")
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    let stats = ChurchStats {
        members: members.0,
        giving: giving.0,
        events: events.0,
        sermons: sermons.0,
        groups: groups.0,
    };

    Ok(Json(stats))
}

pub async fn get_growth_analytics(
    State(st): State<AppState>,
) -> Result<Json<Vec<Value>>, AppError> {
    // Use raw query with tuple results and manual mapping
    let rows: Vec<(String, i64, i64, i64)> = sqlx::query_as(
        "SELECT 
            TO_CHAR(created_at, 'YYYY-MM') as month,
            COUNT(*) as churches_created,
            0 as churches_churned,
            COUNT(*) as net_growth
         FROM churches 
         GROUP BY TO_CHAR(created_at, 'YYYY-MM') 
         ORDER BY month DESC 
         LIMIT 12"
    )
    .fetch_all(&st.pool)
    .await?;

    let growth: Vec<Value> = rows.into_iter().map(|(month, churches_created, churches_churned, _)| {
        json!({
            "month": month,
            "churches_created": churches_created,
            "churches_churned": churches_churned,
            "net_growth": churches_created - churches_churned
        })
    }).collect();

    Ok(Json(growth))
}

pub async fn get_top_churches(
    State(st): State<AppState>,
) -> Result<Json<Vec<Church>>, AppError> {
    let churches = sqlx::query_as("SELECT * FROM churches WHERE status = 'active' ORDER BY created_at DESC LIMIT 10")
        .fetch_all(&st.pool)
        .await?;
    Ok(Json(churches))
}