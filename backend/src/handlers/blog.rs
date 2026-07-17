use axum::extract::{Path, State};
use axum::Json;
use sqlx::PgPool;

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::{BlogPost, CreateBlogPost, UpdateBlogPost};

pub async fn list(State(pool): State<PgPool>) -> Result<Json<Vec<BlogPost>>, AppError> {
    let rows = sqlx::query_as::<_, BlogPost>("SELECT * FROM blog_posts ORDER BY created_at DESC")
        .fetch_all(&pool)
        .await?;
    Ok(Json(rows))
}

pub async fn list_published(State(pool): State<PgPool>) -> Result<Json<Vec<BlogPost>>, AppError> {
    let rows = sqlx::query_as::<_, BlogPost>("SELECT * FROM blog_posts WHERE published = true ORDER BY created_at DESC")
        .fetch_all(&pool)
        .await?;
    Ok(Json(rows))
}

pub async fn get(
    State(pool): State<PgPool>,
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
    State(pool): State<PgPool>,
    Json(input): Json<CreateBlogPost>,
) -> Result<Json<BlogPost>, AppError> {
    let row = sqlx::query_as::<_, BlogPost>(
        r#"INSERT INTO blog_posts (title, slug, content, excerpt, author, category, image, published, featured)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *"#,
    )
    .bind(&input.title)
    .bind(&input.slug)
    .bind(&input.content)
    .bind(input.excerpt.unwrap_or_default())
    .bind(input.author.unwrap_or_default())
    .bind(input.category.unwrap_or_default())
    .bind(input.image.unwrap_or_default())
    .bind(input.published.unwrap_or(false))
    .bind(input.featured.unwrap_or(false))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn update(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdateBlogPost>,
) -> Result<Json<BlogPost>, AppError> {
    let existing = sqlx::query_as::<_, BlogPost>("SELECT * FROM blog_posts WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Blog post not found"))?;

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
    .bind(input.published.unwrap_or(existing.published))
    .bind(input.featured.unwrap_or(existing.featured))
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn delete(
    _auth: AuthUser,
    State(pool): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM blog_posts WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}
