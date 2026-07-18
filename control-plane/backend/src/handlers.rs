use axum::extract::{Path, State};
use axum::Json;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::auth::{create_token, SuperAdmin};
use crate::error::AppError;
use crate::provision;
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
    pub created_at: Option<chrono::NaiveDateTime>,
}

pub async fn list_churches(_admin: SuperAdmin, State(st): State<AppState>) -> Result<Json<Vec<Church>>, AppError> {
    let rows = sqlx::query_as::<_, Church>("SELECT * FROM churches ORDER BY created_at DESC")
        .fetch_all(&st.pool)
        .await?;
    Ok(Json(rows))
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
