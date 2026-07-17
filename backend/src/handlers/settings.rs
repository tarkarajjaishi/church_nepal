use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{Setting, UpdateSetting};

pub async fn list(_auth: AuthUser, State(pool): State<PgPool>) -> Result<Json<Vec<Setting>>, AppError> {
    let rows = sqlx::query_as::<_, Setting>("SELECT * FROM settings ORDER BY key ASC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(_auth: AuthUser, State(pool): State<PgPool>, Path(key): Path<String>) -> Result<Json<Setting>, AppError> {
    let row = sqlx::query_as::<_, Setting>("SELECT * FROM settings WHERE key = $1")
        .bind(&key)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Setting not found"))?;
    Ok(Json(row))
}

pub async fn upsert(_auth: AuthUser, State(pool): State<PgPool>, Path(key): Path<String>, Json(input): Json<UpdateSetting>) -> Result<Json<Setting>, AppError> {
    let row = sqlx::query_as::<_, Setting>(
        r#"INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW() RETURNING *"#,
    )
    .bind(&key)
    .bind(&input.value)
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn toggle_section(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Path(section): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let key = format!("section_enabled_{}", section);
    let row = sqlx::query_as::<_, Setting>(
        r#"INSERT INTO settings (key, value) VALUES ($1, 'false') ON CONFLICT (key) DO UPDATE SET value = CASE WHEN settings.value = 'true' THEN 'false' ELSE 'true' END, updated_at = NOW() RETURNING *"#,
    )
    .bind(&key)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Section not found"))?;
    Ok(Json(serde_json::json!({ "key": row.key, "enabled": row.value == "true" })))
}

pub async fn get_sections(
    _auth: AuthUser,
    State(pool): State<PgPool>,
) -> Result<Json<serde_json::Value>, AppError> {
    let rows = sqlx::query_as::<_, Setting>(
        "SELECT * FROM settings WHERE key LIKE 'section_enabled_%' ORDER BY key",
    )
    .fetch_all(&pool)
    .await?;

    let mut sections = serde_json::Map::new();
    for row in rows {
        let section_name = row.key.strip_prefix("section_enabled_").unwrap_or(&row.key);
        sections.insert(section_name.to_string(), serde_json::Value::Bool(row.value == "true"));
    }
    Ok(Json(serde_json::Value::Object(sections)))
}
