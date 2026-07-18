use crate::tenant::Db;
use axum::extract::{State, Query};
use axum::Json;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::audit::AuditLog;

#[derive(serde::Deserialize, Default)]
pub struct ListQuery {
    pub user_email: Option<String>,
    pub entity_type: Option<String>,
}

pub async fn list(
    _auth: AuthUser,
    Db(pool): Db,
    Query(q): Query<ListQuery>,
) -> Result<Json<Vec<AuditLog>>, AppError> {
    let mut sql = String::from("SELECT * FROM audit_log WHERE 1=1");
    if let Some(ref email) = q.user_email {
        sql.push_str(&format!(" AND user_email = '{}'", email));
    }
    if let Some(ref etype) = q.entity_type {
        sql.push_str(&format!(" AND entity_type = '{}'", etype));
    }
    sql.push_str(" ORDER BY created_at DESC LIMIT 200");
    let rows = sqlx::query_as::<_, AuditLog>(&sql)
        .fetch_all(&pool)
        .await?;
    Ok(Json(rows))
}

pub async fn create_audit_entry(
    pool: &PgPool,
    user_email: &str,
    action: &str,
    entity_type: &str,
    entity_id: &str,
    details: Option<serde_json::Value>,
) -> Result<AuditLog, AppError> {
    let row = sqlx::query_as::<_, AuditLog>(
        r#"INSERT INTO audit_log (user_email, action, entity_type, entity_id, details)
           VALUES ($1, $2, $3, $4, $5) RETURNING *"#,
    )
    .bind(user_email)
    .bind(action)
    .bind(entity_type)
    .bind(entity_id)
    .bind(details)
    .fetch_one(pool)
    .await?;
    Ok(row)
}
