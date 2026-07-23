use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;
use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{Campaign, CreateCampaign, Paginated, Pagination, UpdateCampaign};

pub async fn list(Db(pool): Db, Query(p): Query<Pagination>) -> Result<Json<Paginated<Campaign>>, AppError> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM campaigns").fetch_one(&pool).await?;
    let rows = sqlx::query_as::<_, Campaign>("SELECT * FROM campaigns ORDER BY sort_order NULLS LAST, created_at DESC LIMIT $1 OFFSET $2")
        .bind(p.limit()).bind(p.offset()).fetch_all(&pool).await?;
    Ok(Json(Paginated::new(rows, total, &p)))
}

pub async fn get(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<Campaign>, AppError> {
    let row = sqlx::query_as::<_, Campaign>("SELECT * FROM campaigns WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Campaign not found"))?;
    Ok(Json(row))
}

pub async fn get_stats(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    let pledge_total: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(amount), 0) FROM pledges WHERE campaign_id = $1 AND status = 'active'")
        .bind(id).fetch_one(&pool).await?;
    let pledge_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM pledges WHERE campaign_id = $1")
        .bind(id).fetch_one(&pool).await?;
    let donation_total: (i64,) = sqlx::query_as("SELECT COALESCE(SUM(amount), 0) FROM donations WHERE campaign_id = $1 AND status = 'completed'")
        .bind(id).fetch_one(&pool).await?;
    let donation_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM donations WHERE campaign_id = $1 AND status = 'completed'")
        .bind(id).fetch_one(&pool).await?;
    let campaign: Option<Campaign> = sqlx::query_as("SELECT * FROM campaigns WHERE id = $1")
        .bind(id).fetch_optional(&pool).await?;
    let goal = campaign.as_ref().map(|c| c.goal).unwrap_or(0);
    let raised = campaign.as_ref().map(|c| c.raised).unwrap_or(0);
    let total_toward_goal = raised + pledge_total.0;
    let pct = if goal > 0 { ((total_toward_goal as f64 / goal as f64) * 100.0).min(100.0) } else { 0.0 };

    Ok(Json(serde_json::json!({
        "pledge_amount": pledge_total.0,
        "pledge_count": pledge_count.0,
        "donation_amount": donation_total.0,
        "donation_count": donation_count.0,
        "raised": raised,
        "goal": goal,
        "total_toward_goal": total_toward_goal,
        "progress_percent": pct,
    })))
}

pub async fn recalc_raised(Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<Campaign>, AppError> {
    let row = sqlx::query_as::<_, Campaign>(
        r#"UPDATE campaigns SET raised = COALESCE(
            (SELECT SUM(amount) FROM donations WHERE campaign_id = $1 AND status = 'completed'),
            0
        ) WHERE id = $1 RETURNING *"#,
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Campaign not found"))?;
    Ok(Json(row))
}

pub async fn create(_auth: AuthUser, Db(pool): Db, Json(input): Json<CreateCampaign>) -> Result<Json<Campaign>, AppError> {
    let raised = input.raised.unwrap_or(0);
    let row = sqlx::query_as::<_, Campaign>(
        r#"INSERT INTO campaigns (title, raised, goal) VALUES ($1,$2,$3) RETURNING *"#,
    )
    .bind(&input.title)
    .bind(raised)
    .bind(input.goal)
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn update(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>, Json(input): Json<UpdateCampaign>) -> Result<Json<Campaign>, AppError> {
    let existing = sqlx::query_as::<_, Campaign>("SELECT * FROM campaigns WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool).await?.ok_or_else(|| AppError::not_found("Campaign not found"))?;
    let row = sqlx::query_as::<_, Campaign>(
        r#"UPDATE campaigns SET title=COALESCE($2,title), raised=COALESCE($3,raised), goal=COALESCE($4,goal) WHERE id=$1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.title.as_deref().unwrap_or(&existing.title))
    .bind(input.raised.unwrap_or(existing.raised))
    .bind(input.goal.unwrap_or(existing.goal))
    .fetch_one(&pool).await?;
    Ok(Json(row))
}

pub async fn delete(_auth: AuthUser, Db(pool): Db, Path(id): Path<uuid::Uuid>) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM campaigns WHERE id = $1")
        .bind(id)
        .execute(&pool).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Campaign>, AppError> {
    let row = sqlx::query_as::<_, Campaign>(
        "UPDATE campaigns SET enabled = NOT enabled WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Campaign not found"))?;
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
) -> Result<Json<Campaign>, AppError> {
    let row = sqlx::query_as::<_, Campaign>(
        "UPDATE campaigns SET sort_order = $2 WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(input.sort_order)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Campaign not found"))?;
    Ok(Json(row))
}
