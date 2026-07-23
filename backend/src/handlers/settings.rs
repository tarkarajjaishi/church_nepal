use crate::tenant::Db;
use axum::extract::Path;
use axum::Json;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{Setting, UpdateSetting};
use serde_json::json;

pub async fn list(Db(pool): Db) -> Result<Json<Vec<Setting>>, AppError> {
    let rows = sqlx::query_as::<_, Setting>("SELECT * FROM settings ORDER BY key ASC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn get(Db(pool): Db, Path(key): Path<String>) -> Result<Json<Setting>, AppError> {
    let row = sqlx::query_as::<_, Setting>("SELECT * FROM settings WHERE key = $1")
        .bind(&key)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Setting not found"))?;
    Ok(Json(row))
}

pub async fn upsert(_auth: AuthUser, Db(pool): Db, Path(key): Path<String>, Json(input): Json<UpdateSetting>) -> Result<Json<Setting>, AppError> {
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
    Db(pool): Db,
    Path(section): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let key = format!("section_enabled_{}", section);
    // If the key doesn't exist yet it means the section was implicitly enabled,
    // so we insert it as 'false' (first toggle = disable). On conflict we flip
    // the existing value. INSERT…ON CONFLICT…RETURNING always produces a row.
    let row = sqlx::query_as::<_, Setting>(
        r#"INSERT INTO settings (key, value) VALUES ($1, 'false') ON CONFLICT (key) DO UPDATE SET value = CASE WHEN settings.value = 'true' THEN 'false' ELSE 'true' END, updated_at = NOW() RETURNING *"#,
    )
    .bind(&key)
    .fetch_one(&pool)
    .await?;
    Ok(Json(serde_json::json!({ "key": row.key, "enabled": row.value == "true" })))
}

pub async fn get_sections(
    Db(pool): Db,
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

pub async fn get_theme_draft(Db(pool): Db) -> Result<Json<serde_json::Value>, AppError> {
    let row = sqlx::query_as::<_, Setting>("SELECT * FROM settings WHERE key = $1")
        .bind("theme_draft")
        .fetch_optional(&pool)
        .await?;

    let value = row
        .map(|r| serde_json::from_str(&r.value).unwrap_or_else(|_| json!({})))
        .unwrap_or_else(|| json!({}));

    Ok(Json(value))
}

pub async fn save_theme_draft(
    _auth: AuthUser,
    Db(pool): Db,
    Json(draft): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query(
        r#"INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()"#,
    )
    .bind("theme_draft")
    .bind(draft.to_string())
    .execute(&pool)
    .await?;

    Ok(Json(draft))
}

pub async fn publish_theme(
    _auth: AuthUser,
    Db(pool): Db,
    Json(draft): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    if let Some(obj) = draft.as_object() {
        for (key, val) in obj {
            if let Some(s) = val.as_str() {
                sqlx::query(
                    r#"INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()"#,
                )
                .bind(key)
                .bind(s)
                .execute(&pool)
                .await?;
            }
        }
    }
    Ok(Json(draft))
}
