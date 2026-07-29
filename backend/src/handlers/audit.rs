use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{Paginated, Pagination};
use crate::models::audit::AuditLog;
use crate::tenant::Db;
use axum::extract::{Path, Query, State};
use axum::http::header;
use axum::response::IntoResponse;
use axum::Json;
use sqlx::PgPool;
use sqlx::QueryBuilder;
use std::sync::Arc;

#[derive(serde::Deserialize)]
pub struct ListQuery {
    pub user_email: Option<String>,
    pub action: Option<String>,
    pub entity_type: Option<String>,
    pub from_date: Option<String>,
    pub to_date: Option<String>,
    pub q: Option<String>,
    #[serde(flatten)]
    pub pagination: Pagination,
}

impl Default for ListQuery {
    fn default() -> Self {
        Self {
            user_email: None,
            action: None,
            entity_type: None,
            from_date: None,
            to_date: None,
            q: None,
            pagination: Pagination::default(),
        }
    }
}

pub async fn list(
    _auth: AuthUser,
    Db(pool): Db,
    Query(q): Query<ListQuery>,
) -> Result<Json<Paginated<AuditLog>>, AppError> {
    let mut count_builder = QueryBuilder::new("SELECT COUNT(*) FROM audit_log WHERE 1=1");
    let mut data_builder = QueryBuilder::new("SELECT * FROM audit_log WHERE 1=1");

    if let Some(ref email) = q.user_email {
        count_builder.push(" AND user_email = ").push_bind(email);
        data_builder.push(" AND user_email = ").push_bind(email);
    }
    if let Some(ref action) = q.action {
        count_builder.push(" AND action = ").push_bind(action);
        data_builder.push(" AND action = ").push_bind(action);
    }
    if let Some(ref etype) = q.entity_type {
        count_builder.push(" AND entity_type = ").push_bind(etype);
        data_builder.push(" AND entity_type = ").push_bind(etype);
    }
    if let Some(ref from) = q.from_date {
        count_builder.push(" AND created_at >= ").push_bind(from);
        data_builder.push(" AND created_at >= ").push_bind(from);
    }
    if let Some(ref to) = q.to_date {
        count_builder.push(" AND created_at <= ").push_bind(to);
        data_builder.push(" AND created_at <= ").push_bind(to);
    }
    if let Some(ref qs) = q.q {
        let pattern = format!("%{}%", qs);
        count_builder.push(" AND (");
        count_builder.push("user_email ILIKE ").push_bind(&pattern);
        count_builder.push(" OR action ILIKE ").push_bind(&pattern);
        count_builder.push(" OR entity_type ILIKE ").push_bind(&pattern);
        count_builder.push(" OR entity_id::text ILIKE ").push_bind(&pattern);
        count_builder.push(")");
        data_builder.push(" AND (");
        data_builder.push("user_email ILIKE ").push_bind(&pattern);
        data_builder.push(" OR action ILIKE ").push_bind(&pattern);
        data_builder.push(" OR entity_type ILIKE ").push_bind(&pattern);
        data_builder.push(" OR entity_id::text ILIKE ").push_bind(&pattern);
        data_builder.push(")");
    }

    let total: i64 = count_builder
        .build_query_scalar()
        .fetch_one(&pool)
        .await?;

    let page = q.pagination.page();
    let per_page = q.pagination.limit();
    let offset = q.pagination.offset();

    data_builder.push(" ORDER BY created_at DESC LIMIT ");
    data_builder.push_bind::<i64>(per_page);
    data_builder.push(" OFFSET ");
    data_builder.push_bind::<i64>(offset);

    let rows = data_builder
        .build_query_as::<AuditLog>()
        .fetch_all(&pool)
        .await?;

    let paginated = Paginated::new(rows, total, &q.pagination);
    Ok(Json(paginated))
}

pub async fn export_csv(
    _auth: AuthUser,
    Db(pool): Db,
    Query(q): Query<ListQuery>,
) -> Result<impl IntoResponse, AppError> {
    let mut builder = QueryBuilder::new("SELECT * FROM audit_log WHERE 1=1");

    if let Some(ref email) = q.user_email {
        builder.push(" AND user_email = ").push_bind(email);
    }
    if let Some(ref action) = q.action {
        builder.push(" AND action = ").push_bind(action);
    }
    if let Some(ref etype) = q.entity_type {
        builder.push(" AND entity_type = ").push_bind(etype);
    }
    if let Some(ref from) = q.from_date {
        builder.push(" AND created_at >= ").push_bind(from);
    }
    if let Some(ref to) = q.to_date {
        builder.push(" AND created_at <= ").push_bind(to);
    }
    builder.push(" ORDER BY created_at DESC LIMIT 5000");

    let rows = builder
        .build_query_as::<AuditLog>()
        .fetch_all(&pool)
        .await?;

    let mut csv = String::from("id,user_email,action,entity_type,entity_id,details,created_at\n");
    for row in &rows {
        let details_str = row.details.as_ref().map(|d| {
            let s = d.to_string();
            if s.contains(',') || s.contains('"') || s.contains('\n') {
                format!("\"{}\"", s.replace('"', "\"\""))
            } else {
                s
            }
        }).unwrap_or_default();
        csv.push_str(&format!(
            "{},{},{},{},{},{},{}\n",
            row.id,
            escape_csv(&row.user_email),
            escape_csv(&row.action),
            escape_csv(&row.entity_type),
            escape_csv(&row.entity_id),
            details_str,
            row.created_at,
        ));
    }

    Ok(([(header::CONTENT_TYPE, "text/csv; charset=utf-8")], csv))
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

fn escape_csv(s: &str) -> String {
    if s.contains(',') || s.contains('"') || s.contains('\n') {
        format!("\"{}\"", s.replace('"', "\"\""))
    } else {
        s.to_string()
    }
}
