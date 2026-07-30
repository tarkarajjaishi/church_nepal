//! Playlists, displays and live presentation control.
//!
//! Split from `presentation.rs` (songs, decks, slides) purely for file size;
//! shared helpers live there and are re-used here.

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::handlers::presentation::{
    bump_version, resolve_theme, slugify, ONLINE_SECS, SCREEN_MODES, STALE_SECS,
};
use crate::models::presentation::*;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;
use sqlx::PgPool;

// ===========================================================================
// Playlists
// ===========================================================================

pub async fn playlists_list(Db(pool): Db) -> Result<Json<Vec<Playlist>>, AppError> {
    let rows = sqlx::query_as::<_, Playlist>(
        "SELECT * FROM playlists ORDER BY is_template ASC,
                service_date DESC NULLS LAST, created_at DESC LIMIT 200",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn playlists_get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<PlaylistWithItems>, AppError> {
    let playlist = sqlx::query_as::<_, Playlist>("SELECT * FROM playlists WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Playlist not found"))?;

    let items = sqlx::query_as::<_, PlaylistItem>(
        r#"SELECT pi.*,
                  (SELECT COUNT(*) FROM slides s WHERE s.presentation_id = pi.presentation_id)
                    AS slide_count
           FROM playlist_items pi
           WHERE pi.playlist_id = $1
           ORDER BY pi.sort_order ASC"#,
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    let planned_total_seconds = items
        .iter()
        .map(|i| i64::from(i.planned_seconds.unwrap_or(0)))
        .sum();

    Ok(Json(PlaylistWithItems { playlist, items, planned_total_seconds }))
}

fn parse_date(s: Option<&str>) -> Result<Option<chrono::NaiveDate>, AppError> {
    match s {
        Some(d) if !d.is_empty() => Ok(Some(
            chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d")
                .map_err(|_| AppError::bad_request("Invalid service_date, expected YYYY-MM-DD"))?,
        )),
        _ => Ok(None),
    }
}

fn parse_time(s: Option<&str>) -> Result<Option<chrono::NaiveTime>, AppError> {
    match s {
        Some(t) if !t.is_empty() => Ok(Some(
            chrono::NaiveTime::parse_from_str(t, "%H:%M")
                .or_else(|_| chrono::NaiveTime::parse_from_str(t, "%H:%M:%S"))
                .map_err(|_| AppError::bad_request("Invalid service_time, expected HH:MM"))?,
        )),
        _ => Ok(None),
    }
}

pub async fn playlists_create(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertPlaylist>,
) -> Result<Json<Playlist>, AppError> {
    if input.name.trim().is_empty() {
        return Err(AppError::bad_request("Playlist name is required"));
    }
    let row = sqlx::query_as::<_, Playlist>(
        r#"INSERT INTO playlists
             (name, service_date, service_time, service_name, operator, notes,
              status, is_template, created_by)
           VALUES ($1,$2,$3,COALESCE($4,''),COALESCE($5,''),COALESCE($6,''),
                   COALESCE($7,'draft'),COALESCE($8,false),$9)
           RETURNING *"#,
    )
    .bind(input.name.trim())
    .bind(parse_date(input.service_date.as_deref())?)
    .bind(parse_time(input.service_time.as_deref())?)
    .bind(input.service_name)
    .bind(input.operator)
    .bind(input.notes)
    .bind(input.status)
    .bind(input.is_template)
    .bind(&auth.email)
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn playlists_update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpsertPlaylist>,
) -> Result<Json<Playlist>, AppError> {
    let row = sqlx::query_as::<_, Playlist>(
        r#"UPDATE playlists SET
             name=$2, service_date=$3, service_time=$4,
             service_name=COALESCE($5,service_name), operator=COALESCE($6,operator),
             notes=COALESCE($7,notes), status=COALESCE($8,status),
             is_template=COALESCE($9,is_template), updated_at=NOW()
           WHERE id=$1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.name.trim())
    .bind(parse_date(input.service_date.as_deref())?)
    .bind(parse_time(input.service_time.as_deref())?)
    .bind(input.service_name)
    .bind(input.operator)
    .bind(input.notes)
    .bind(input.status)
    .bind(input.is_template)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Playlist not found"))?;
    Ok(Json(row))
}

/// Duplicate a playlist including its items.
///
/// This is how a template becomes next Sunday's order, so it is one call rather
/// than something the client reassembles item by item.
pub async fn playlists_duplicate(
    auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpsertPlaylist>,
) -> Result<Json<PlaylistWithItems>, AppError> {
    let source = sqlx::query_as::<_, Playlist>("SELECT * FROM playlists WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Playlist not found"))?;

    let name = if input.name.trim().is_empty() {
        format!("{} (copy)", source.name)
    } else {
        input.name.trim().to_string()
    };

    let mut tx = pool.begin().await?;
    let copy = sqlx::query_as::<_, Playlist>(
        r#"INSERT INTO playlists
             (name, service_date, service_time, service_name, operator, notes,
              status, is_template, created_by)
           VALUES ($1,$2,$3,$4,COALESCE($5,''),$6,'draft',false,$7)
           RETURNING *"#,
    )
    .bind(&name)
    .bind(parse_date(input.service_date.as_deref())?)
    .bind(source.service_time)
    .bind(&source.service_name)
    .bind(input.operator)
    .bind(&source.notes)
    .bind(&auth.email)
    .fetch_one(&mut *tx)
    .await?;

    // Copy items in one statement so ordering is preserved exactly.
    sqlx::query(
        r#"INSERT INTO playlist_items
             (playlist_id, sort_order, item_kind, presentation_id, title,
              settings, planned_seconds, notes)
           SELECT $1, sort_order, item_kind, presentation_id, title,
                  settings, planned_seconds, notes
           FROM playlist_items WHERE playlist_id = $2"#,
    )
    .bind(copy.id)
    .bind(id)
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;

    playlists_get(Db(pool), Path(copy.id)).await
}

pub async fn playlists_delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Refuse while live: deleting the running order mid-service would blank
    // every screen.
    let live: Option<uuid::Uuid> =
        sqlx::query_scalar("SELECT playlist_id FROM presentation_live WHERE id = 1")
            .fetch_optional(&pool)
            .await?
            .flatten();
    if live == Some(id) {
        return Err(AppError::conflict(
            "This playlist is currently live — stop the presentation before deleting it",
        ));
    }
    let res = sqlx::query("DELETE FROM playlists WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Playlist not found"));
    }
    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn playlist_items_add(
    _auth: AuthUser,
    Db(pool): Db,
    Path(playlist_id): Path<uuid::Uuid>,
    Json(input): Json<UpsertPlaylistItem>,
) -> Result<Json<PlaylistItem>, AppError> {
    let exists: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM playlists WHERE id = $1)")
        .bind(playlist_id)
        .fetch_one(&pool)
        .await?;
    if !exists {
        return Err(AppError::not_found("Playlist not found"));
    }

    // Fall back to the deck's title so the running order is never a row of
    // blanks when the client omits one.
    let title = match (input.title.as_deref(), input.presentation_id) {
        (Some(t), _) if !t.trim().is_empty() => t.trim().to_string(),
        (_, Some(pid)) => {
            sqlx::query_scalar::<_, String>("SELECT title FROM presentations WHERE id = $1")
                .bind(pid)
                .fetch_optional(&pool)
                .await?
                .ok_or_else(|| AppError::not_found("Presentation not found"))?
        }
        _ => "Untitled".into(),
    };

    let sort_order = match input.position {
        Some(p) => p,
        None => {
            let max: Option<i32> = sqlx::query_scalar(
                "SELECT MAX(sort_order) FROM playlist_items WHERE playlist_id = $1",
            )
            .bind(playlist_id)
            .fetch_one(&pool)
            .await?;
            max.unwrap_or(0) + 10
        }
    };

    let row = sqlx::query_as::<_, PlaylistItem>(
        r#"WITH ins AS (
             INSERT INTO playlist_items
               (playlist_id, sort_order, item_kind, presentation_id, title,
                settings, planned_seconds, notes)
             VALUES ($1,$2,COALESCE($3,'presentation'),$4,$5,
                     COALESCE($6,'{}'::jsonb),$7,COALESCE($8,''))
             RETURNING *
           )
           SELECT ins.*,
                  (SELECT COUNT(*) FROM slides s WHERE s.presentation_id = ins.presentation_id)
                    AS slide_count
           FROM ins"#,
    )
    .bind(playlist_id)
    .bind(sort_order)
    .bind(input.item_kind)
    .bind(input.presentation_id)
    .bind(&title)
    .bind(input.settings)
    .bind(input.planned_seconds)
    .bind(input.notes)
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn playlist_items_delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let res = sqlx::query("DELETE FROM playlist_items WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Playlist item not found"));
    }
    Ok(Json(serde_json::json!({ "deleted": true })))
}

/// Reorder the running order.
///
/// The full id list is required. A partial list would silently leave the
/// omitted items at stale positions, which on a service order means an item
/// jumping to the wrong place mid-service.
pub async fn playlist_items_reorder(
    _auth: AuthUser,
    Db(pool): Db,
    Path(playlist_id): Path<uuid::Uuid>,
    Json(input): Json<ReorderInput>,
) -> Result<Json<PlaylistWithItems>, AppError> {
    let existing: Vec<uuid::Uuid> =
        sqlx::query_scalar("SELECT id FROM playlist_items WHERE playlist_id = $1")
            .bind(playlist_id)
            .fetch_all(&pool)
            .await?;

    if input.ids.len() != existing.len() {
        return Err(AppError::bad_request(format!(
            "Send all {} item ids in their new order (got {})",
            existing.len(),
            input.ids.len()
        )));
    }
    let set: std::collections::HashSet<_> = existing.iter().collect();
    if input.ids.iter().any(|id| !set.contains(id)) {
        return Err(AppError::bad_request(
            "One or more items do not belong to this playlist",
        ));
    }
    if input.ids.iter().collect::<std::collections::HashSet<_>>().len() != input.ids.len() {
        return Err(AppError::bad_request("Duplicate item ids in the new order"));
    }

    let mut tx = pool.begin().await?;
    for (i, id) in input.ids.iter().enumerate() {
        sqlx::query("UPDATE playlist_items SET sort_order = $2 WHERE id = $1")
            .bind(id)
            .bind((i as i32 + 1) * 10)
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await?;

    playlists_get(Db(pool), Path(playlist_id)).await
}

// ===========================================================================
// Displays
// ===========================================================================

/// Connection state derived from `last_seen_at`, so a crashed display reports
/// offline on its own instead of leaving a stale "connected" flag behind.
pub fn connection_for(last_seen: Option<chrono::NaiveDateTime>) -> (&'static str, Option<i64>) {
    match last_seen {
        None => ("offline", None),
        Some(ts) => {
            let secs = (chrono::Utc::now().naive_utc() - ts).num_seconds();
            let state = if secs <= ONLINE_SECS {
                "online"
            } else if secs <= STALE_SECS {
                "stale"
            } else {
                "offline"
            };
            (state, Some(secs))
        }
    }
}

pub async fn displays_list(Db(pool): Db) -> Result<Json<Vec<DisplayStatus>>, AppError> {
    let rows = sqlx::query_as::<_, Display>("SELECT * FROM displays ORDER BY name ASC")
        .fetch_all(&pool)
        .await?;
    Ok(Json(
        rows.into_iter()
            .map(|d| {
                let (connection, seconds_since_seen) = connection_for(d.last_seen_at);
                DisplayStatus { display: d, connection, seconds_since_seen }
            })
            .collect(),
    ))
}

pub async fn displays_create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertDisplay>,
) -> Result<Json<Display>, AppError> {
    if input.name.trim().is_empty() {
        return Err(AppError::bad_request("Display name is required"));
    }
    let row = sqlx::query_as::<_, Display>(
        r#"INSERT INTO displays
             (name, slug, display_kind, resolution, orientation, aspect_ratio,
              shows_notes, shows_next_slide, is_stream_output, theme_id, is_enabled)
           VALUES ($1,$2,COALESCE($3,'projector'),COALESCE($4,'1920x1080'),
                   COALESCE($5,'landscape'),COALESCE($6,'16:9'),
                   COALESCE($7,false),COALESCE($8,false),COALESCE($9,false),
                   $10,COALESCE($11,true))
           RETURNING *"#,
    )
    .bind(input.name.trim())
    .bind(slugify(&input.name))
    .bind(input.display_kind)
    .bind(input.resolution)
    .bind(input.orientation)
    .bind(input.aspect_ratio)
    .bind(input.shows_notes)
    .bind(input.shows_next_slide)
    .bind(input.is_stream_output)
    .bind(input.theme_id)
    .bind(input.is_enabled)
    .fetch_one(&pool)
    .await
    .map_err(|e| match e {
        sqlx::Error::Database(ref db) if db.code().as_deref() == Some("23505") => {
            AppError::conflict("A display with that name already exists")
        }
        other => other.into(),
    })?;
    Ok(Json(row))
}

pub async fn displays_update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpsertDisplay>,
) -> Result<Json<Display>, AppError> {
    let row = sqlx::query_as::<_, Display>(
        r#"UPDATE displays SET
             name=$2, display_kind=COALESCE($3,display_kind),
             resolution=COALESCE($4,resolution), orientation=COALESCE($5,orientation),
             aspect_ratio=COALESCE($6,aspect_ratio), shows_notes=COALESCE($7,shows_notes),
             shows_next_slide=COALESCE($8,shows_next_slide),
             is_stream_output=COALESCE($9,is_stream_output),
             theme_id=$10, is_enabled=COALESCE($11,is_enabled), updated_at=NOW()
           WHERE id=$1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.name.trim())
    .bind(input.display_kind)
    .bind(input.resolution)
    .bind(input.orientation)
    .bind(input.aspect_ratio)
    .bind(input.shows_notes)
    .bind(input.shows_next_slide)
    .bind(input.is_stream_output)
    .bind(input.theme_id)
    .bind(input.is_enabled)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Display not found"))?;
    Ok(Json(row))
}

pub async fn displays_delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let res = sqlx::query("DELETE FROM displays WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Display not found"));
    }
    Ok(Json(serde_json::json!({ "deleted": true })))
}

// ===========================================================================
// Live control
// ===========================================================================

pub async fn read_state(pool: &PgPool) -> Result<LiveState, AppError> {
    sqlx::query_as::<_, LiveState>("SELECT * FROM presentation_live WHERE id = 1")
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::internal("Live state row is missing — run migration 062"))
}

/// Everything a display needs for one frame, in one response.
///
/// Displays are often cheap devices on poor wifi; making them stitch three
/// calls together per slide change would be the wrong trade.
pub async fn build_frame(pool: &PgPool) -> Result<LiveFrame, AppError> {
    let state = read_state(pool).await?;

    let (slides, presentation_title, theme_id) = match state.presentation_id {
        Some(pid) => {
            let slides = sqlx::query_as::<_, Slide>(
                "SELECT * FROM slides WHERE presentation_id = $1 ORDER BY sort_order ASC",
            )
            .bind(pid)
            .fetch_all(pool)
            .await?;
            let row: Option<(String, Option<uuid::Uuid>)> =
                sqlx::query_as("SELECT title, theme_id FROM presentations WHERE id = $1")
                    .bind(pid)
                    .fetch_optional(pool)
                    .await?;
            let (title, theme_id) = match row {
                Some((t, th)) => (Some(t), th),
                None => (None, None),
            };
            (slides, title, theme_id)
        }
        None => (Vec::new(), None, None),
    };

    let slide_total = slides.len() as i64;
    let idx = state.slide_index.max(0) as usize;
    let mut iter = slides.into_iter().skip(idx);
    let current_slide = iter.next();
    let next_slide = iter.next();
    let theme = resolve_theme(pool, theme_id).await?;

    Ok(LiveFrame { state, current_slide, next_slide, presentation_title, theme, slide_total })
}

pub async fn live_get(Db(pool): Db) -> Result<Json<LiveFrame>, AppError> {
    Ok(Json(build_frame(&pool).await?))
}

/// Long-poll for a live-state change.
///
/// Why long-polling rather than websockets or SSE: axum's `ws` feature is off
/// and SSE needs a Stream (tokio-stream), so either would add a dependency.
/// More importantly the version lives in the database, so this keeps working
/// when the API runs more than one process — an in-memory broadcast channel
/// would only reach displays that happened to connect to the same one. A
/// display recovers from a dropped connection by simply calling again with the
/// version it holds, so there is no reconnect logic to get wrong.
///
/// The poll doubles as the heartbeat: `display=<slug>` stamps `last_seen_at`,
/// which is what the connection indicator is derived from.
pub async fn live_watch(
    Db(pool): Db,
    Query(q): Query<WatchQuery>,
) -> Result<Json<LiveFrame>, AppError> {
    if let Some(slug) = q.display.as_deref() {
        sqlx::query("UPDATE displays SET last_seen_at = NOW() WHERE slug = $1")
            .bind(slug)
            .execute(&pool)
            .await?;
    }

    let known = q.version.unwrap_or(0);
    // Capped below the usual proxy idle timeout so the client, not the proxy,
    // decides when the poll ends.
    let budget_ms = q.timeout_ms.unwrap_or(25_000).clamp(1_000, 30_000);
    let deadline = tokio::time::Instant::now() + std::time::Duration::from_millis(budget_ms);
    let poll_every = std::time::Duration::from_millis(150);

    loop {
        let current: i64 =
            sqlx::query_scalar("SELECT version FROM presentation_live WHERE id = 1")
                .fetch_one(&pool)
                .await?;
        // `!=` rather than `>` so a database restored from backup (version
        // lower than the client's) still converges instead of hanging forever.
        if current != known {
            return Ok(Json(build_frame(&pool).await?));
        }
        if tokio::time::Instant::now() >= deadline {
            // Return the frame rather than 204: a display that somehow missed a
            // change still resynchronises on the timeout.
            return Ok(Json(build_frame(&pool).await?));
        }
        tokio::time::sleep(poll_every).await;
    }
}

async fn log_history(
    pool: &PgPool,
    playlist_id: Option<uuid::Uuid>,
    presentation_id: Option<uuid::Uuid>,
    action: &str,
    detail: &str,
    operator: &str,
) -> Result<(), AppError> {
    sqlx::query(
        "INSERT INTO presentation_history
           (playlist_id, presentation_id, action, detail, operator)
         VALUES ($1,$2,$3,$4,$5)",
    )
    .bind(playlist_id)
    .bind(presentation_id)
    .bind(action)
    .bind(detail)
    .bind(operator)
    .execute(pool)
    .await?;
    Ok(())
}

async fn slide_at(
    pool: &PgPool,
    presentation_id: uuid::Uuid,
    index: i32,
) -> Result<Option<uuid::Uuid>, AppError> {
    Ok(sqlx::query_scalar(
        "SELECT id FROM slides WHERE presentation_id = $1
         ORDER BY sort_order ASC OFFSET $2 LIMIT 1",
    )
    .bind(presentation_id)
    .bind(i64::from(index.max(0)))
    .fetch_optional(pool)
    .await?)
}

pub async fn live_go(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<GoLiveInput>,
) -> Result<Json<LiveFrame>, AppError> {
    // Resolve the deck: given directly, or taken from the playlist item.
    let presentation_id = match (input.presentation_id, input.playlist_item_id) {
        (Some(p), _) => Some(p),
        (None, Some(item)) => sqlx::query_scalar::<_, Option<uuid::Uuid>>(
            "SELECT presentation_id FROM playlist_items WHERE id = $1",
        )
        .bind(item)
        .fetch_optional(&pool)
        .await?
        .flatten(),
        _ => None,
    };

    if let Some(pid) = presentation_id {
        let exists: bool =
            sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM presentations WHERE id = $1)")
                .bind(pid)
                .fetch_one(&pool)
                .await?;
        if !exists {
            return Err(AppError::not_found("Presentation not found"));
        }
    }

    let index = input.slide_index.unwrap_or(0).max(0);
    let slide_id = match presentation_id {
        Some(pid) => slide_at(&pool, pid, index).await?,
        None => None,
    };

    sqlx::query(
        r#"UPDATE presentation_live SET
             is_live = true,
             playlist_id = COALESCE($1, playlist_id),
             playlist_item_id = $2,
             presentation_id = $3,
             slide_id = $4,
             slide_index = $5,
             screen_mode = 'normal',
             operator = $6,
             started_at = COALESCE(started_at, NOW()),
             version = version + 1,
             updated_at = NOW()
           WHERE id = 1"#,
    )
    .bind(input.playlist_id)
    .bind(input.playlist_item_id)
    .bind(presentation_id)
    .bind(slide_id)
    .bind(index)
    .bind(&auth.email)
    .execute(&pool)
    .await?;

    // Usage counters feed the "recently used" lists an operator works from.
    if let Some(pid) = presentation_id {
        sqlx::query(
            "UPDATE presentations SET use_count = use_count + 1, last_used_at = NOW()
             WHERE id = $1",
        )
        .bind(pid)
        .execute(&pool)
        .await?;
        sqlx::query(
            "UPDATE songs SET use_count = use_count + 1, last_used_at = NOW()
             WHERE id = (SELECT song_id FROM presentations WHERE id = $1)",
        )
        .bind(pid)
        .execute(&pool)
        .await?;
    }
    if let Some(plid) = input.playlist_id {
        sqlx::query("UPDATE playlists SET status='live', updated_at=NOW() WHERE id=$1")
            .bind(plid)
            .execute(&pool)
            .await?;
    }

    log_history(&pool, input.playlist_id, presentation_id, "go_live", "", &auth.email).await?;
    Ok(Json(build_frame(&pool).await?))
}

pub async fn live_stop(auth: AuthUser, Db(pool): Db) -> Result<Json<LiveFrame>, AppError> {
    let before = read_state(&pool).await?;
    sqlx::query(
        r#"UPDATE presentation_live SET
             is_live=false, screen_mode='normal', presentation_id=NULL, slide_id=NULL,
             slide_index=0, playlist_item_id=NULL, lower_third_visible=false,
             countdown_target=NULL, countdown_paused_seconds=NULL, started_at=NULL,
             version=version+1, updated_at=NOW()
           WHERE id = 1"#,
    )
    .execute(&pool)
    .await?;

    if let Some(plid) = before.playlist_id {
        sqlx::query(
            "UPDATE playlists SET status='done', updated_at=NOW()
             WHERE id=$1 AND status='live'",
        )
        .bind(plid)
        .execute(&pool)
        .await?;
    }
    log_history(&pool, before.playlist_id, before.presentation_id, "stop", "", &auth.email)
        .await?;
    Ok(Json(build_frame(&pool).await?))
}

/// Step forward or back one slide.
///
/// Clamps at both ends rather than wrapping: wrapping past the last slide of
/// the closing song would put the welcome slide back in front of the
/// congregation.
pub async fn live_step(
    auth: AuthUser,
    Db(pool): Db,
    Path(direction): Path<String>,
) -> Result<Json<LiveFrame>, AppError> {
    let delta: i32 = match direction.as_str() {
        "next" => 1,
        "prev" | "previous" => -1,
        _ => return Err(AppError::bad_request("Direction must be 'next' or 'prev'")),
    };

    let state = read_state(&pool).await?;
    let pid = state
        .presentation_id
        .ok_or_else(|| AppError::bad_request("Nothing is live — start a presentation first"))?;

    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM slides WHERE presentation_id = $1")
        .bind(pid)
        .fetch_one(&pool)
        .await?;
    if total == 0 {
        return Err(AppError::bad_request("This presentation has no slides"));
    }

    let target = (state.slide_index + delta).clamp(0, (total - 1) as i32);
    if target == state.slide_index {
        // At the boundary. Return unchanged without bumping the version, so
        // displays are not woken for a no-op.
        return Ok(Json(build_frame(&pool).await?));
    }

    let slide_id = slide_at(&pool, pid, target).await?;
    sqlx::query(
        "UPDATE presentation_live SET slide_index=$1, slide_id=$2, screen_mode='normal',
                operator=$3, version=version+1, updated_at=NOW() WHERE id=1",
    )
    .bind(target)
    .bind(slide_id)
    .bind(&auth.email)
    .execute(&pool)
    .await?;

    Ok(Json(build_frame(&pool).await?))
}

pub async fn live_goto(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<GotoSlideInput>,
) -> Result<Json<LiveFrame>, AppError> {
    let state = read_state(&pool).await?;
    let pid = state
        .presentation_id
        .ok_or_else(|| AppError::bad_request("Nothing is live — start a presentation first"))?;

    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM slides WHERE presentation_id = $1")
        .bind(pid)
        .fetch_one(&pool)
        .await?;

    // Address by id (a click in the slide list) or by index (a number key).
    let index = match (input.slide_id, input.slide_index) {
        (Some(sid), _) => {
            let pos: Option<i64> = sqlx::query_scalar(
                r#"SELECT pos - 1 FROM (
                     SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order ASC) AS pos
                     FROM slides WHERE presentation_id = $1
                   ) t WHERE id = $2"#,
            )
            .bind(pid)
            .bind(sid)
            .fetch_optional(&pool)
            .await?;
            pos.ok_or_else(|| {
                AppError::bad_request("That slide does not belong to the live presentation")
            })? as i32
        }
        (None, Some(i)) => {
            if i < 0 || i64::from(i) >= total {
                return Err(AppError::bad_request(format!(
                    "Slide index out of range (0..{})",
                    total.saturating_sub(1)
                )));
            }
            i
        }
        _ => return Err(AppError::bad_request("Provide slide_index or slide_id")),
    };

    let slide_id = slide_at(&pool, pid, index).await?;
    sqlx::query(
        "UPDATE presentation_live SET slide_index=$1, slide_id=$2, screen_mode='normal',
                operator=$3, version=version+1, updated_at=NOW() WHERE id=1",
    )
    .bind(index)
    .bind(slide_id)
    .bind(&auth.email)
    .execute(&pool)
    .await?;
    Ok(Json(build_frame(&pool).await?))
}

/// Set the screen override.
///
/// One field rather than a boolean per mode, so two cannot be on at once —
/// "black and logo simultaneously" has no meaning on a projector.
pub async fn live_screen_mode(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<ScreenModeInput>,
) -> Result<Json<LiveFrame>, AppError> {
    let mode = input.mode.trim().to_lowercase();
    if !SCREEN_MODES.contains(&mode.as_str()) {
        return Err(AppError::bad_request(format!(
            "Mode must be one of: {}",
            SCREEN_MODES.join(", ")
        )));
    }
    sqlx::query(
        "UPDATE presentation_live SET screen_mode=$1, operator=$2,
                version=version+1, updated_at=NOW() WHERE id=1",
    )
    .bind(&mode)
    .bind(&auth.email)
    .execute(&pool)
    .await?;
    log_history(&pool, None, None, "screen_mode", &mode, &auth.email).await?;
    Ok(Json(build_frame(&pool).await?))
}

/// Start or clear a countdown.
///
/// Stored as an absolute instant so every display counts to the same moment
/// without its clock being synced to the operator's machine.
pub async fn live_countdown(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<CountdownInput>,
) -> Result<Json<LiveFrame>, AppError> {
    let target = match (input.seconds, input.target.as_deref()) {
        (Some(s), _) => {
            if s <= 0 {
                None // zero or negative clears the countdown
            } else if s > 86_400 {
                return Err(AppError::bad_request("Countdown cannot exceed 24 hours"));
            } else {
                Some(chrono::Utc::now().naive_utc() + chrono::Duration::seconds(s))
            }
        }
        (None, Some(t)) if !t.is_empty() => Some(
            chrono::NaiveDateTime::parse_from_str(t, "%Y-%m-%dT%H:%M:%S")
                .or_else(|_| chrono::NaiveDateTime::parse_from_str(t, "%Y-%m-%d %H:%M:%S"))
                .map_err(|_| {
                    AppError::bad_request("Invalid target, expected YYYY-MM-DDTHH:MM:SS")
                })?,
        ),
        _ => None,
    };

    sqlx::query(
        "UPDATE presentation_live SET countdown_target=$1,
                countdown_message=COALESCE($2, countdown_message),
                countdown_paused_seconds=NULL, operator=$3,
                version=version+1, updated_at=NOW() WHERE id=1",
    )
    .bind(target)
    .bind(input.message.as_deref())
    .bind(&auth.email)
    .execute(&pool)
    .await?;
    Ok(Json(build_frame(&pool).await?))
}

/// Pause or resume the countdown.
///
/// Pausing stores the remaining seconds and clears the target; resuming turns
/// the remainder back into a fresh target. Only one of the two is ever set, so
/// a display never has to decide which to believe.
pub async fn live_countdown_toggle(
    auth: AuthUser,
    Db(pool): Db,
) -> Result<Json<LiveFrame>, AppError> {
    let state = read_state(&pool).await?;

    match (state.countdown_target, state.countdown_paused_seconds) {
        (Some(target), None) => {
            let remaining = (target - chrono::Utc::now().naive_utc()).num_seconds().max(0);
            sqlx::query(
                "UPDATE presentation_live SET countdown_paused_seconds=$1,
                        countdown_target=NULL, operator=$2,
                        version=version+1, updated_at=NOW() WHERE id=1",
            )
            .bind(remaining as i32)
            .bind(&auth.email)
            .execute(&pool)
            .await?;
        }
        (None, Some(remaining)) => {
            let target =
                chrono::Utc::now().naive_utc() + chrono::Duration::seconds(i64::from(remaining));
            sqlx::query(
                "UPDATE presentation_live SET countdown_target=$1,
                        countdown_paused_seconds=NULL, operator=$2,
                        version=version+1, updated_at=NOW() WHERE id=1",
            )
            .bind(target)
            .bind(&auth.email)
            .execute(&pool)
            .await?;
        }
        _ => return Err(AppError::bad_request("No countdown is running")),
    }
    Ok(Json(build_frame(&pool).await?))
}

pub async fn live_lower_third(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<LowerThirdInput>,
) -> Result<Json<LiveFrame>, AppError> {
    sqlx::query(
        "UPDATE presentation_live SET
           lower_third_title=COALESCE($1, lower_third_title),
           lower_third_subtitle=COALESCE($2, lower_third_subtitle),
           lower_third_visible=COALESCE($3, lower_third_visible),
           operator=$4, version=version+1, updated_at=NOW()
         WHERE id=1",
    )
    .bind(input.title.as_deref())
    .bind(input.subtitle.as_deref())
    .bind(input.visible)
    .bind(&auth.email)
    .execute(&pool)
    .await?;
    Ok(Json(build_frame(&pool).await?))
}

// ===========================================================================
// Dashboard
// ===========================================================================

pub async fn dashboard(Db(pool): Db) -> Result<Json<PresentationDashboard>, AppError> {
    let frame = build_frame(&pool).await?;
    let state = &frame.state;

    let displays = sqlx::query_as::<_, Display>("SELECT * FROM displays WHERE is_enabled")
        .fetch_all(&pool)
        .await?;
    let displays_total = displays.len() as i64;
    let displays_online = displays
        .iter()
        .filter(|d| connection_for(d.last_seen_at).0 == "online")
        .count() as i64;

    let today_playlist = sqlx::query_as::<_, Playlist>(
        "SELECT * FROM playlists WHERE service_date = CURRENT_DATE AND NOT is_template
         ORDER BY service_time ASC NULLS LAST LIMIT 1",
    )
    .fetch_optional(&pool)
    .await?;

    let today_playlist_items = match &today_playlist {
        Some(p) => {
            sqlx::query_scalar::<_, i64>(
                "SELECT COUNT(*) FROM playlist_items WHERE playlist_id = $1",
            )
            .bind(p.id)
            .fetch_one(&pool)
            .await?
        }
        None => 0,
    };

    let song_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM songs WHERE NOT is_archived")
        .fetch_one(&pool)
        .await?;
    let presentation_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM presentations WHERE NOT is_archived")
            .fetch_one(&pool)
            .await?;
    let slide_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM slides")
        .fetch_one(&pool)
        .await?;

    let recent_presentations = sqlx::query_as::<_, PresentationRow>(
        r#"SELECT p.id, p.title, p.kind, p.description, p.song_id, p.theme_id, p.tags,
                  p.is_archived, p.use_count, p.last_used_at,
                  (SELECT COUNT(*) FROM slides s WHERE s.presentation_id = p.id) AS slide_count,
                  p.updated_at
           FROM presentations p WHERE NOT p.is_archived
           ORDER BY p.last_used_at DESC NULLS LAST, p.updated_at DESC LIMIT 8"#,
    )
    .fetch_all(&pool)
    .await?;

    let recent_activity = sqlx::query_as::<_, HistoryEntry>(
        "SELECT id, action, detail, operator, created_at FROM presentation_history
         ORDER BY created_at DESC LIMIT 12",
    )
    .fetch_all(&pool)
    .await?;

    let live_seconds = state
        .started_at
        .map(|s| (chrono::Utc::now().naive_utc() - s).num_seconds().max(0));

    Ok(Json(PresentationDashboard {
        is_live: state.is_live,
        screen_mode: state.screen_mode.clone(),
        operator: state.operator.clone(),
        current_presentation: frame.presentation_title.clone(),
        current_slide_index: state.slide_index,
        current_slide_total: frame.slide_total,
        next_slide_label: frame.next_slide.as_ref().map(|s| {
            if s.label.is_empty() {
                s.title.clone()
            } else {
                s.label.clone()
            }
        }),
        live_seconds,
        displays_total,
        displays_online,
        today_playlist,
        today_playlist_items,
        song_count,
        presentation_count,
        slide_count,
        recent_presentations,
        recent_activity,
    }))
}

/// Public long-poll for display devices.
///
/// A projector or lobby TV runs an unattended kiosk browser and cannot hold an
/// admin token, so this endpoint is unauthenticated. What it exposes is already
/// on a screen in a public room — but the operator's email is not, so it is
/// blanked here rather than broadcast to every device on the network.
pub async fn live_watch_public(
    Db(pool): Db,
    Query(q): Query<WatchQuery>,
) -> Result<Json<LiveFrame>, AppError> {
    let Json(mut frame) = live_watch(Db(pool), Query(q)).await?;
    frame.state.operator = String::new();
    Ok(Json(frame))
}
