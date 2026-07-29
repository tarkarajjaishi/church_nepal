use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::handlers::ValidatedJson;
use crate::handlers::audit::create_audit_entry;
use crate::models::*;
use crate::security::xss;
use chrono::Utc;

#[derive(serde::Deserialize)]
pub struct ReorderRequest {
    pub sort_order: i32,
}

#[derive(serde::Deserialize, Default)]
pub struct SermonQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub q: Option<String>,
    pub speaker: Option<String>,
    pub topic: Option<String>,
    pub series: Option<String>,
    pub sort: Option<String>,
}

pub async fn list(
    Db(pool): Db,
    Query(p): Query<Pagination>,
) -> Result<Json<Paginated<Sermon>>, AppError> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM sermons")
        .fetch_one(&pool).await?;
    let rows = sqlx::query_as::<_, Sermon>(
        "SELECT * FROM sermons ORDER BY sort_order ASC, created_at DESC LIMIT $1 OFFSET $2")
        .bind(p.limit()).bind(p.offset())
        .fetch_all(&pool).await?;
    Ok(Json(Paginated::new(rows, total, &p)))
}

pub async fn list_public(
    Db(pool): Db,
    Query(params): Query<SermonQuery>,
) -> Result<Json<Paginated<Sermon>>, AppError> {
    let mut sql = String::from("SELECT * FROM sermons WHERE enabled = TRUE AND (published_at IS NULL OR published_at <= NOW())");
    let mut count_sql = String::from("SELECT COUNT(*) FROM sermons WHERE enabled = TRUE AND (published_at IS NULL OR published_at <= NOW())");
    let mut pos = 1;

    if let Some(ref q) = params.q {
        if !q.is_empty() {
            let clause = format!(" AND (title ILIKE ${} OR description ILIKE ${} OR series ILIKE ${} OR speaker ILIKE ${})", pos, pos, pos, pos);
            sql.push_str(&clause);
            count_sql.push_str(&clause);
            pos += 1;
        }
    }
    if let Some(ref speaker) = params.speaker {
        if !speaker.is_empty() && *speaker != "all" {
            sql.push_str(&format!(" AND speaker = ${}", pos));
            count_sql.push_str(&format!(" AND speaker = ${}", pos));
            pos += 1;
        }
    }
    if let Some(ref topic) = params.topic {
        if !topic.is_empty() && *topic != "all" {
            sql.push_str(&format!(" AND topic = ${}", pos));
            count_sql.push_str(&format!(" AND topic = ${}", pos));
            pos += 1;
        }
    }
    if let Some(ref series) = params.series {
        if !series.is_empty() && *series != "all" {
            sql.push_str(&format!(" AND series = ${}", pos));
            count_sql.push_str(&format!(" AND series = ${}", pos));
            pos += 1;
        }
    }

    let order_by = match params.sort.as_deref() {
        Some("date-asc") => "ORDER BY sort_order ASC, date ASC",
        Some("title-asc") => "ORDER BY title ASC",
        Some("title-desc") => "ORDER BY title DESC",
        Some("date-desc") | Some(_) | None => "ORDER BY sort_order ASC, created_at DESC",
    };
    sql.push_str(" ");
    sql.push_str(order_by);
    sql.push_str(&format!(" LIMIT ${} OFFSET ${}", pos, pos + 1));

    let p = Pagination {
        page: params.page,
        per_page: params.per_page,
    };

    let mut count_query = sqlx::query_scalar::<_, i64>(&count_sql);
    if let Some(ref q) = params.q {
        if !q.is_empty() {
            count_query = count_query.bind(format!("%{}%", q));
        }
    }
    if let Some(ref speaker) = params.speaker {
        if !speaker.is_empty() && *speaker != "all" {
            count_query = count_query.bind(speaker);
        }
    }
    if let Some(ref topic) = params.topic {
        if !topic.is_empty() && *topic != "all" {
            count_query = count_query.bind(topic);
        }
    }
    if let Some(ref series) = params.series {
        if !series.is_empty() && *series != "all" {
            count_query = count_query.bind(series);
        }
    }
    let total: i64 = count_query.fetch_one(&pool).await?;

    let mut query = sqlx::query_as::<_, Sermon>(&sql);
    if let Some(ref q) = params.q {
        if !q.is_empty() {
            query = query.bind(format!("%{}%", q));
        }
    }
    if let Some(ref speaker) = params.speaker {
        if !speaker.is_empty() && *speaker != "all" {
            query = query.bind(speaker);
        }
    }
    if let Some(ref topic) = params.topic {
        if !topic.is_empty() && *topic != "all" {
            query = query.bind(topic);
        }
    }
    if let Some(ref series) = params.series {
        if !series.is_empty() && *series != "all" {
            query = query.bind(series);
        }
    }
    query = query.bind(p.limit()).bind(p.offset());

    let rows = query.fetch_all(&pool).await?;
    Ok(Json(Paginated::new(rows, total, &p)))
}

pub async fn list_enabled(Db(pool): Db) -> Result<Json<Vec<Sermon>>, AppError> {
    let rows = sqlx::query_as::<_, Sermon>("SELECT * FROM sermons WHERE enabled = TRUE ORDER BY sort_order ASC, created_at DESC")
        .fetch_all(&pool).await?;
    Ok(Json(rows))
}

pub async fn toggle(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Sermon>, AppError> {
     let row = sqlx::query_as::<_, Sermon>(
         "UPDATE sermons SET enabled = NOT enabled WHERE id = $1 RETURNING *")
         .bind(id).fetch_optional(&pool).await?
         .ok_or_else(|| AppError::not_found("Sermon not found"))?;
     let _ = create_audit_entry(&pool, &_auth.email, "toggle", "sermon", &row.id.to_string(), Some(serde_json::json!({"id": row.id, "title": row.title}))).await;
     Ok(Json(row))
}

pub async fn reorder(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<ReorderRequest>,
) -> Result<Json<Sermon>, AppError> {
     let row = sqlx::query_as::<_, Sermon>(
         "UPDATE sermons SET sort_order = $2 WHERE id = $1 RETURNING *")
         .bind(id).bind(input.sort_order).fetch_optional(&pool).await?
         .ok_or_else(|| AppError::not_found("Sermon not found"))?;
     let _ = create_audit_entry(&pool, &_auth.email, "reorder", "sermon", &row.id.to_string(), Some(serde_json::json!({"id": row.id, "title": row.title}))).await;
     Ok(Json(row))
}

pub async fn get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Sermon>, AppError> {
    let row = sqlx::query_as::<_, Sermon>("SELECT * FROM sermons WHERE id = $1")
        .bind(id).fetch_optional(&pool).await?
        .ok_or_else(|| AppError::not_found("Sermon not found"))?;
    Ok(Json(row))
}

pub async fn create(
     _auth: AuthUser,
     Db(pool): Db,
     ValidatedJson(input): ValidatedJson<CreateSermon>,
 ) -> Result<Json<Sermon>, AppError> {
     let title = xss::sanitize_plain(&input.title);
     let description = xss::sanitize_html(&input.description);
     let row = sqlx::query_as::<_, Sermon>(
         "INSERT INTO sermons (title, speaker, date, duration, series, topic, image, description, video_url)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *")
         .bind(&title)
         .bind(xss::sanitize_plain(&input.speaker))
         .bind(&input.date)
         .bind(&input.duration)
         .bind(xss::sanitize_plain(&input.series))
         .bind(xss::sanitize_plain(&input.topic))
         .bind(&input.image)
          .bind(&description)
          .bind(&input.video_url)
          .fetch_one(&pool).await?;
     let _ = create_audit_entry(&pool, &_auth.email, "create", "sermon", &row.id.to_string(), Some(serde_json::json!({"id": row.id, "title": row.title}))).await;
     Ok(Json(row))
 }

pub async fn update(
     _auth: AuthUser,
     Db(pool): Db,
     Path(id): Path<uuid::Uuid>,
     ValidatedJson(input): ValidatedJson<UpdateSermon>,
 ) -> Result<Json<Sermon>, AppError> {
     let existing = sqlx::query_as::<_, Sermon>(
         "SELECT * FROM sermons WHERE id = $1")
         .bind(id).fetch_optional(&pool).await?
         .ok_or_else(|| AppError::not_found("Sermon not found"))?;

     let row = sqlx::query_as::<_, Sermon>(
         "UPDATE sermons SET title=COALESCE($2,title), speaker=COALESCE($3,speaker),
          date=COALESCE($4,date), duration=COALESCE($5,duration), series=COALESCE($6,series),
          topic=COALESCE($7,topic), image=COALESCE($8,image), description=COALESCE($9,description),
          video_url=COALESCE($10,video_url), updated_at=NOW()
          WHERE id=$1 RETURNING *")
         .bind(id)
         .bind(input.title.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.title.as_deref()))
         .bind(input.speaker.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.speaker.as_deref()))
         .bind(input.date.as_deref().or(existing.date.as_deref()))
         .bind(input.duration.as_deref().or(existing.duration.as_deref()))
         .bind(input.series.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.series.as_deref()))
         .bind(input.topic.as_deref().map(|t| xss::sanitize_plain(t)).or(existing.topic.as_deref()))
         .bind(input.image.as_deref().or(existing.image.as_deref()))
         .bind(input.description.as_deref().map(|t| xss::sanitize_html(t)).or(existing.description.as_deref()))
          .bind(input.video_url.as_deref().or(existing.video_url.as_deref()))
          .fetch_optional(&pool).await?
          .ok_or_else(|| AppError::not_found("Sermon not found"))?;
     let _ = create_audit_entry(&pool, &_auth.email, "update", "sermon", &row.id.to_string(), Some(serde_json::json!({"id": row.id, "title": row.title}))).await;
     Ok(Json(row))
 }

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let affected = sqlx::query("DELETE FROM sermons WHERE id = $1")
        .bind(id).execute(&pool).await?.rows_affected();
    if affected == 0 { return Err(AppError::not_found("Sermon not found")); }
    Ok(Json(serde_json::json!({"deleted": true})))
}
