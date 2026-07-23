use crate::tenant::Db;
use axum::extract::Query;
use axum::Json;
use sqlx::QueryBuilder;
use sqlx::PgPool;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::audit::AuditLog;
use crate::models::{Paginated, Pagination};

#[derive(serde::Deserialize, Default)]
pub struct ListQuery {
    pub user_email: Option<String>,
    pub action: Option<String>,
    pub entity_type: Option<String>,
    #[serde(flatten)]
    pub pagination: Pagination,
}

pub async fn list(
    _auth: AuthUser,
    Db(pool): Db,
    Query(q): Query<ListQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let has_pagination = q.pagination.page.is_some() || q.pagination.per_page.is_some();

    if has_pagination {
        let mut count_builder = QueryBuilder::new("SELECT COUNT(*) FROM audit_log WHERE 1=1");
        let mut data_builder = QueryBuilder::new("SELECT * FROM audit_log WHERE 1=1");

        if let Some(ref email) = q.user_email {
            let clause = " AND user_email = ";
            count_builder.push(clause).push_bind(email);
            data_builder.push(clause).push_bind(email);
        }
        if let Some(ref action) = q.action {
            let clause = " AND action = ";
            count_builder.push(clause).push_bind(action);
            data_builder.push(clause).push_bind(action);
        }
        if let Some(ref etype) = q.entity_type {
            let clause = " AND entity_type = ";
            count_builder.push(clause).push_bind(etype);
            data_builder.push(clause).push_bind(etype);
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
        Ok(Json(serde_json::to_value(paginated)?))
    } else {
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
        builder.push(" ORDER BY created_at DESC LIMIT 200");

        let rows = builder
            .build_query_as::<AuditLog>()
            .fetch_all(&pool)
            .await?;

        Ok(Json(serde_json::to_value(rows)?))
    }
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
