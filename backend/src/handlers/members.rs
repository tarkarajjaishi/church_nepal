use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{CreateMember, Member, Paginated, Pagination, UpdateMember};

pub async fn list(Db(pool): Db, Query(p): Query<Pagination>) -> Result<Json<Paginated<Member>>, AppError> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM members").fetch_one(&pool).await?;
    let rows = sqlx::query_as::<_, Member>("SELECT * FROM members ORDER BY created_at DESC LIMIT $1 OFFSET $2")
        .bind(p.limit()).bind(p.offset()).fetch_all(&pool).await?;
    Ok(Json(Paginated::new(rows, total, &p)))
}

pub async fn get(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<Member>, AppError> {
    let row = sqlx::query_as::<_, Member>("SELECT * FROM members WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Member not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, Db(pool): Db, Json(input): Json<CreateMember>) -> Result<Json<Member>, AppError> {
    let row = sqlx::query_as::<_, Member>(
        r#"INSERT INTO members (name, role, since, image) VALUES ($1,$2,$3,$4) RETURNING *"#,
    )
    .bind(&input.name)
    .bind(&input.role)
    .bind(&input.since)
    .bind(&input.image)
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateMember>) -> Result<Json<Member>, AppError> {
    let existing = sqlx::query_as::<_, Member>("SELECT * FROM members WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Member not found"))?;
    let row = sqlx::query_as::<_, Member>(
        r#"UPDATE members SET name=COALESCE($2,name), role=COALESCE($3,role), since=COALESCE($4,since), image=COALESCE($5,image) WHERE id=$1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.name.as_deref().unwrap_or(&existing.name))
    .bind(input.role.as_deref().unwrap_or(&existing.role))
    .bind(input.since.as_deref().unwrap_or(&existing.since))
    .bind(input.image.as_deref().unwrap_or(&existing.image))
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM members WHERE id = $1")
        .bind(id)
        .execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Member>, AppError> {
    let row = sqlx::query_as::<_, Member>(
        "UPDATE members SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Member not found"))?;
    Ok(Json(row))
}

#[derive(serde::Deserialize)]
pub struct ReorderRequest {
    pub sort_order: i32,
}

pub async fn reorder(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<ReorderRequest>,
) -> Result<Json<Member>, AppError> {
    let row = sqlx::query_as::<_, Member>(
        "UPDATE members SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Member not found"))?;
    Ok(Json(row))
}
