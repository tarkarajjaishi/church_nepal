use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{BlogPost, CreateBlogPost, Paginated, Pagination, UpdateBlogPost};
use chrono::Utc;

#[derive(serde::Deserialize, Default)]
pub struct BlogQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub q: Option<String>,
    pub category: Option<String>,
}

pub async fn list(Db(pool): Db, Query(p): Query<Pagination>) -> Result<Json<Paginated<BlogPost>>, AppError> {
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM blog_posts").fetch_one(&pool).await?;
    let rows = sqlx::query_as::<_, BlogPost>("SELECT * FROM blog_posts ORDER BY created_at DESC LIMIT $1 OFFSET $2")
        .bind(p.limit()).bind(p.offset()).fetch_all(&pool).await?;
    Ok(Json(Paginated::new(rows, total, &p)))
}

pub async fn list_published(
    Db(pool): Db,
    Query(params): Query<BlogQuery>,
) -> Result<Json<Paginated<BlogPost>>, AppError> {
    let mut sql = String::from("SELECT * FROM blog_posts WHERE published = true AND (published_at IS NULL OR published_at <= NOW())");
    let mut count_sql = String::from("SELECT COUNT(*) FROM blog_posts WHERE published = true AND (published_at IS NULL OR published_at <= NOW())");
    let mut pos = 1;

    if let Some(ref q) = params.q {
        if !q.is_empty() {
            let clause = format!(" AND (title ILIKE ${} OR excerpt ILIKE ${} OR content ILIKE ${} OR category ILIKE ${})", pos, pos, pos, pos);
            sql.push_str(&clause);
            count_sql.push_str(&clause);
            pos += 1;
        }
    }
    if let Some(ref category) = params.category {
        if !category.is_empty() && *category != "all" {
            sql.push_str(&format!(" AND category = ${}", pos));
            count_sql.push_str(&format!(" AND category = ${}", pos));
            pos += 1;
        }
    }

    sql.push_str(" ORDER BY created_at DESC");
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
    if let Some(ref category) = params.category {
        if !category.is_empty() && *category != "all" {
            count_query = count_query.bind(category);
        }
    }
    let total: i64 = count_query.fetch_one(&pool).await?;

    let mut query = sqlx::query_as::<_, BlogPost>(&sql);
    if let Some(ref q) = params.q {
        if !q.is_empty() {
            query = query.bind(format!("%{}%", q));
        }
    }
    if let Some(ref category) = params.category {
        if !category.is_empty() && *category != "all" {
            query = query.bind(category);
        }
    }
    query = query.bind(p.limit()).bind(p.offset());

    let rows = query.fetch_all(&pool).await?;
    Ok(Json(Paginated::new(rows, total, &p)))
}

pub async fn get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<BlogPost>, AppError> {
    let row = sqlx::query_as::<_, BlogPost>("SELECT * FROM blog_posts WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Blog post not found"))?;
    Ok(Json(row))
}

pub async fn create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CreateBlogPost>,
) -> Result<Json<BlogPost>, AppError> {
    let published = match input.published_at {
        Some(ref at) if *at <= Utc::now().naive_utc() => true,
        _ => input.published.unwrap_or(false),
    };
    let row = sqlx::query_as::<_, BlogPost>(
        r#"INSERT INTO blog_posts (title, slug, content, excerpt, author, category, image, published, featured, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *"#,
    )
    .bind(&input.title)
    .bind(&input.slug)
    .bind(&input.content)
    .bind(input.excerpt.unwrap_or_default())
    .bind(input.author.unwrap_or_default())
    .bind(input.category.unwrap_or_default())
    .bind(input.image.unwrap_or_default())
    .bind(published)
    .bind(input.featured.unwrap_or(false))
    .bind(input.published_at)
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdateBlogPost>,
) -> Result<Json<BlogPost>, AppError> {
    let existing = sqlx::query_as::<_, BlogPost>("SELECT * FROM blog_posts WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Blog post not found"))?;

    let published = match input.published_at {
        Some(ref at) if *at <= Utc::now().naive_utc() => true,
        None => input.published.unwrap_or(existing.published),
        _ => existing.published,
    };

    let row = sqlx::query_as::<_, BlogPost>(
        r#"UPDATE blog_posts SET
            title = COALESCE($2, title),
            slug = COALESCE($3, slug),
            content = COALESCE($4, content),
            excerpt = COALESCE($5, excerpt),
            author = COALESCE($6, author),
            category = COALESCE($7, category),
            image = COALESCE($8, image),
            published = COALESCE($9, published),
            featured = COALESCE($10, featured),
            published_at = COALESCE($11, published_at),
            updated_at = NOW()
           WHERE id = $1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.title.as_deref().unwrap_or(&existing.title))
    .bind(input.slug.as_deref().unwrap_or(&existing.slug))
    .bind(input.content.as_deref().unwrap_or(&existing.content))
    .bind(input.excerpt.as_deref().unwrap_or(&existing.excerpt))
    .bind(input.author.as_deref().unwrap_or(&existing.author))
    .bind(input.category.as_deref().unwrap_or(&existing.category))
    .bind(input.image.as_deref().unwrap_or(&existing.image))
    .bind(published)
    .bind(input.featured.unwrap_or(existing.featured))
    .bind(input.published_at)
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM blog_posts WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
