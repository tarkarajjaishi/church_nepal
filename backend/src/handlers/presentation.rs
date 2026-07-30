//! Presentation & Worship Display handlers.
//!
//! Live state propagation uses long-polling on `presentation_live.version`
//! rather than websockets or SSE. See `live_watch` for why.

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::presentation::*;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;
use sqlx::PgPool;

/// A display seen within this window is "online".
pub const ONLINE_SECS: i64 = 15;
/// Seen within this window but not the one above is "stale".
pub const STALE_SECS: i64 = 60;

pub const SCREEN_MODES: [&str; 5] = ["normal", "black", "logo", "blank", "freeze"];

pub fn slugify(s: &str) -> String {
    s.trim()
        .to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect::<String>()
        .split('-')
        .filter(|p| !p.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}

/// Normalise a song title for duplicate detection: case-folded, punctuation
/// stripped, whitespace collapsed. "Amazing Grace!" and "amazing  grace" are
/// the same song.
fn normalize_title(s: &str) -> String {
    s.to_lowercase()
        .chars()
        .filter(|c| c.is_alphanumeric() || c.is_whitespace())
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

// ===========================================================================
// Lyrics -> slides
// ===========================================================================

/// A stanza extracted from raw lyrics.
#[derive(Debug, PartialEq)]
pub struct Stanza {
    pub label: String,
    pub lines: Vec<String>,
}

/// Does this line look like a stanza label rather than lyrics?
///
/// Labels are short and either bracketed (`[Chorus]`) or a known section word
/// optionally numbered (`Verse 2`, `Pre-Chorus:`). Anything else is treated as
/// lyrics — guessing wrong drops a line of the song from the screen, so this
/// stays conservative.
fn parse_label(line: &str) -> Option<String> {
    let t = line.trim();
    if t.is_empty() || t.chars().count() > 24 {
        return None;
    }

    // Bracketed form is unambiguous.
    let inner = t
        .strip_prefix('[')
        .and_then(|r| r.strip_suffix(']'))
        .or_else(|| t.strip_prefix('(').and_then(|r| r.strip_suffix(')')));
    if let Some(inner) = inner {
        let inner = inner.trim();
        if !inner.is_empty() {
            return Some(inner.to_string());
        }
    }

    // Bare or colon-terminated section word.
    let bare = t.trim_end_matches(':').trim();
    let lower = bare.to_lowercase();
    const WORDS: [&str; 12] = [
        "verse", "chorus", "pre-chorus", "prechorus", "bridge", "refrain",
        "intro", "outro", "tag", "vamp", "interlude", "ending",
    ];
    let head = lower.split_whitespace().next().unwrap_or("");
    let numbered_ok = lower
        .split_whitespace()
        .skip(1)
        .all(|w| w.chars().all(|c| c.is_ascii_digit()));
    // Require the colon or bracket for a bare single word, otherwise a lyric
    // line that happens to read "Bridge" would vanish as a label.
    let had_marker = t.ends_with(':') || inner.is_some();
    if WORDS.contains(&head) && numbered_ok && (had_marker || lower.split_whitespace().count() > 1) {
        return Some(bare.to_string());
    }
    None
}

/// Split raw lyrics into stanzas on blank lines, honouring section labels.
pub fn split_stanzas(lyrics: &str) -> Vec<Stanza> {
    let mut out: Vec<Stanza> = Vec::new();
    let mut current = Stanza { label: String::new(), lines: Vec::new() };
    let mut auto_verse = 0;

    let flush = |cur: &mut Stanza, out: &mut Vec<Stanza>, auto: &mut i32| {
        if cur.lines.is_empty() {
            // A label with no lines under it is dropped rather than emitting an
            // empty slide.
            cur.label.clear();
            return;
        }
        if cur.label.is_empty() {
            *auto += 1;
            cur.label = format!("Verse {auto}");
        }
        out.push(Stanza {
            label: std::mem::take(&mut cur.label),
            lines: std::mem::take(&mut cur.lines),
        });
    };

    for raw in lyrics.lines() {
        let line = raw.trim_end();
        if line.trim().is_empty() {
            flush(&mut current, &mut out, &mut auto_verse);
            continue;
        }
        if let Some(label) = parse_label(line) {
            // A label starts a new stanza.
            flush(&mut current, &mut out, &mut auto_verse);
            current.label = label;
            continue;
        }
        current.lines.push(line.trim().to_string());
    }
    flush(&mut current, &mut out, &mut auto_verse);
    out
}

/// A slide to be created: label plus the lines shown on it.
#[derive(Debug, PartialEq)]
pub struct PlannedSlide {
    pub label: String,
    pub body: String,
}

/// Turn lyrics into slides, splitting any stanza longer than `max_lines`.
///
/// A stanza split across several slides keeps its label with a part suffix, so
/// the operator can still see where they are in the song.
pub fn plan_song_slides(lyrics: &str, max_lines: usize) -> Vec<PlannedSlide> {
    let max = max_lines.clamp(1, 20);
    let mut out = Vec::new();
    for st in split_stanzas(lyrics) {
        let chunks: Vec<&[String]> = st.lines.chunks(max).collect();
        let multi = chunks.len() > 1;
        for (i, chunk) in chunks.iter().enumerate() {
            out.push(PlannedSlide {
                label: if multi {
                    format!("{} ({}/{})", st.label, i + 1, chunks.len())
                } else {
                    st.label.clone()
                },
                body: chunk.join("\n"),
            });
        }
    }
    out
}

// ===========================================================================
// Songs
// ===========================================================================

pub async fn songs_list(
    Db(pool): Db,
    Query(q): Query<SongQuery>,
) -> Result<Json<SongPage>, AppError> {
    let page = q.page.unwrap_or(1).max(1);
    let per_page = q.per_page.unwrap_or(50).clamp(1, 200);
    let offset = (page - 1) * per_page;

    let where_sql = r#"
        WHERE ($1::text IS NULL OR (
                title ILIKE '%' || $1 || '%'
             OR artist ILIKE '%' || $1 || '%'
             OR author ILIKE '%' || $1 || '%'
             OR lyrics ILIKE '%' || $1 || '%'
             OR ccli_number ILIKE '%' || $1 || '%'))
          AND ($2::text IS NULL OR language = $2)
          AND ($3::text IS NULL OR category = $3)
          AND ($4::text IS NULL OR $4 = ANY(tags))
          AND ($5::bool IS NULL OR is_favourite = $5)
          AND is_archived = COALESCE($6, false)
    "#;

    let total: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM songs {where_sql}"))
        .bind(q.search.as_deref())
        .bind(q.language.as_deref())
        .bind(q.category.as_deref())
        .bind(q.tag.as_deref())
        .bind(q.favourite)
        .bind(q.archived)
        .fetch_one(&pool)
        .await?;

    // Allowlisted so user input never reaches ORDER BY.
    let order = match q.sort.as_deref() {
        Some("recent") => "last_used_at DESC NULLS LAST",
        Some("popular") => "use_count DESC",
        Some("added") => "created_at DESC",
        Some("artist") => "artist ASC, title ASC",
        _ => "title ASC",
    };

    let data = sqlx::query_as::<_, Song>(&format!(
        "SELECT * FROM songs {where_sql} ORDER BY {order} LIMIT $7 OFFSET $8"
    ))
    .bind(q.search.as_deref())
    .bind(q.language.as_deref())
    .bind(q.category.as_deref())
    .bind(q.tag.as_deref())
    .bind(q.favourite)
    .bind(q.archived)
    .bind(per_page)
    .bind(offset)
    .fetch_all(&pool)
    .await?;

    Ok(Json(SongPage {
        data,
        total,
        page,
        per_page,
        total_pages: (total + per_page - 1) / per_page,
    }))
}

pub async fn songs_get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Song>, AppError> {
    sqlx::query_as::<_, Song>("SELECT * FROM songs WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .map(Json)
        .ok_or_else(|| AppError::not_found("Song not found"))
}

pub async fn songs_create(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertSong>,
) -> Result<Json<Song>, AppError> {
    if input.title.trim().is_empty() {
        return Err(AppError::bad_request("Song title is required"));
    }
    let row = sqlx::query_as::<_, Song>(
        r#"INSERT INTO songs
             (title, title_normalized, artist, author, album, language, category, song_key,
              alternate_keys, tempo, bpm, time_signature, ccli_number, copyright, lyrics,
              chords, notes, tags, is_favourite, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
           RETURNING *"#,
    )
    .bind(input.title.trim())
    .bind(normalize_title(&input.title))
    .bind(input.artist.clone().unwrap_or_default())
    .bind(input.author.unwrap_or_default())
    .bind(input.album.unwrap_or_default())
    .bind(input.language.unwrap_or_else(|| "ne".into()))
    .bind(input.category.unwrap_or_default())
    .bind(input.song_key.unwrap_or_default())
    .bind(input.alternate_keys.unwrap_or_default())
    .bind(input.tempo.unwrap_or_default())
    .bind(input.bpm)
    .bind(input.time_signature.unwrap_or_default())
    .bind(input.ccli_number.unwrap_or_default())
    .bind(input.copyright.unwrap_or_default())
    .bind(input.lyrics.unwrap_or_default())
    .bind(input.chords.unwrap_or_default())
    .bind(input.notes.unwrap_or_default())
    .bind(input.tags.unwrap_or_default())
    .bind(input.is_favourite.unwrap_or(false))
    .bind(&auth.email)
    .fetch_one(&pool)
    .await
    .map_err(|e| match e {
        sqlx::Error::Database(ref db) if db.code().as_deref() == Some("23505") => {
            AppError::conflict("That song already exists for this artist")
        }
        other => other.into(),
    })?;
    Ok(Json(row))
}

pub async fn songs_update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpsertSong>,
) -> Result<Json<Song>, AppError> {
    if input.title.trim().is_empty() {
        return Err(AppError::bad_request("Song title is required"));
    }
    let row = sqlx::query_as::<_, Song>(
        r#"UPDATE songs SET
             title=$2, title_normalized=$3,
             artist=COALESCE($4,artist), author=COALESCE($5,author), album=COALESCE($6,album),
             language=COALESCE($7,language), category=COALESCE($8,category),
             song_key=COALESCE($9,song_key), alternate_keys=COALESCE($10,alternate_keys),
             tempo=COALESCE($11,tempo), bpm=$12, time_signature=COALESCE($13,time_signature),
             ccli_number=COALESCE($14,ccli_number), copyright=COALESCE($15,copyright),
             lyrics=COALESCE($16,lyrics), chords=COALESCE($17,chords), notes=COALESCE($18,notes),
             tags=COALESCE($19,tags), is_favourite=COALESCE($20,is_favourite),
             is_archived=COALESCE($21,is_archived), updated_at=NOW()
           WHERE id=$1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.title.trim())
    .bind(normalize_title(&input.title))
    .bind(input.artist)
    .bind(input.author)
    .bind(input.album)
    .bind(input.language)
    .bind(input.category)
    .bind(input.song_key)
    .bind(input.alternate_keys)
    .bind(input.tempo)
    .bind(input.bpm)
    .bind(input.time_signature)
    .bind(input.ccli_number)
    .bind(input.copyright)
    .bind(input.lyrics)
    .bind(input.chords)
    .bind(input.notes)
    .bind(input.tags)
    .bind(input.is_favourite)
    .bind(input.is_archived)
    .fetch_optional(&pool)
    .await
    .map_err(|e| match e {
        sqlx::Error::Database(ref db) if db.code().as_deref() == Some("23505") => {
            AppError::conflict("Another song already has that title and artist")
        }
        other => other.into(),
    })?
    .ok_or_else(|| AppError::not_found("Song not found"))?;
    Ok(Json(row))
}

pub async fn songs_delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Archive rather than delete when decks were built from the song: removing
    // it would leave those decks with no traceable source.
    let decks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM presentations WHERE song_id = $1")
        .bind(id)
        .fetch_one(&pool)
        .await?;
    if decks > 0 {
        sqlx::query("UPDATE songs SET is_archived = true, updated_at = NOW() WHERE id = $1")
            .bind(id)
            .execute(&pool)
            .await?;
        return Ok(Json(serde_json::json!({
            "archived": true,
            "reason": format!("{decks} presentation(s) were built from this song, so it was archived rather than deleted")
        })));
    }
    let res = sqlx::query("DELETE FROM songs WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Song not found"));
    }
    Ok(Json(serde_json::json!({ "deleted": true })))
}

/// Preview the slides that would be generated, without writing anything.
///
/// The lyric editor needs this so a leader can see the split before committing.
pub async fn songs_preview_slides(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Query(q): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let lyrics: String = sqlx::query_scalar("SELECT lyrics FROM songs WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Song not found"))?;

    let max_lines = q
        .get("max_lines")
        .and_then(|v| v.parse::<usize>().ok())
        .unwrap_or(4);

    let planned = plan_song_slides(&lyrics, max_lines);
    Ok(Json(serde_json::json!({
        "count": planned.len(),
        "max_lines": max_lines.clamp(1, 20),
        "slides": planned.iter().map(|p| serde_json::json!({
            "label": p.label, "body": p.body,
        })).collect::<Vec<_>>(),
    })))
}

// ===========================================================================
// Themes
// ===========================================================================

pub async fn themes_list(Db(pool): Db) -> Result<Json<Vec<PresentationTheme>>, AppError> {
    let rows = sqlx::query_as::<_, PresentationTheme>(
        "SELECT * FROM presentation_themes ORDER BY is_default DESC, name ASC",
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn themes_create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertTheme>,
) -> Result<Json<PresentationTheme>, AppError> {
    if input.name.trim().is_empty() {
        return Err(AppError::bad_request("Theme name is required"));
    }
    let mut tx = pool.begin().await?;
    // Only one theme may be default; clear the old one first so the partial
    // unique index does not reject the insert.
    if input.is_default.unwrap_or(false) {
        sqlx::query("UPDATE presentation_themes SET is_default = false WHERE is_default")
            .execute(&mut *tx)
            .await?;
    }
    let row = sqlx::query_as::<_, PresentationTheme>(
        r#"INSERT INTO presentation_themes
             (name, slug, font_family, font_size, text_color, background_color,
              background_image, text_align, vertical_align, text_effects, transition, is_default)
           VALUES ($1,$2,COALESCE($3,'Poppins'),COALESCE($4,64),COALESCE($5,'#ffffff'),
                   COALESCE($6,'#0b3c5d'),COALESCE($7,''),COALESCE($8,'center'),
                   COALESCE($9,'center'),
                   COALESCE($10,'{"outline":true,"shadow":true,"glow":false}'::jsonb),
                   COALESCE($11,'fade'),$12)
           RETURNING *"#,
    )
    .bind(input.name.trim())
    .bind(slugify(&input.name))
    .bind(input.font_family)
    .bind(input.font_size)
    .bind(input.text_color)
    .bind(input.background_color)
    .bind(input.background_image)
    .bind(input.text_align)
    .bind(input.vertical_align)
    .bind(input.text_effects)
    .bind(input.transition)
    .bind(input.is_default.unwrap_or(false))
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| match e {
        sqlx::Error::Database(ref db) if db.code().as_deref() == Some("23505") => {
            AppError::conflict("A theme with that name already exists")
        }
        other => other.into(),
    })?;
    tx.commit().await?;
    Ok(Json(row))
}

// ===========================================================================
// Presentations & slides
// ===========================================================================

pub async fn presentations_list(
    Db(pool): Db,
    Query(q): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Vec<PresentationRow>>, AppError> {
    let kind = q.get("kind").map(String::as_str);
    let search = q.get("search").map(String::as_str);
    let archived = q.get("archived").map(|v| v == "true").unwrap_or(false);

    let rows = sqlx::query_as::<_, PresentationRow>(
        r#"SELECT p.id, p.title, p.kind, p.description, p.song_id, p.theme_id, p.tags,
                  p.is_archived, p.use_count, p.last_used_at,
                  (SELECT COUNT(*) FROM slides s WHERE s.presentation_id = p.id) AS slide_count,
                  p.updated_at
           FROM presentations p
           WHERE ($1::text IS NULL OR p.kind = $1)
             AND ($2::text IS NULL OR p.title ILIKE '%' || $2 || '%' OR p.description ILIKE '%' || $2 || '%')
             AND p.is_archived = $3
           ORDER BY p.updated_at DESC
           LIMIT 300"#,
    )
    .bind(kind)
    .bind(search)
    .bind(archived)
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn presentations_get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<PresentationWithSlides>, AppError> {
    let presentation =
        sqlx::query_as::<_, Presentation>("SELECT * FROM presentations WHERE id = $1")
            .bind(id)
            .fetch_optional(&pool)
            .await?
            .ok_or_else(|| AppError::not_found("Presentation not found"))?;

    let slides = sqlx::query_as::<_, Slide>(
        "SELECT * FROM slides WHERE presentation_id = $1 ORDER BY sort_order ASC",
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    let theme = resolve_theme(&pool, presentation.theme_id).await?;

    Ok(Json(PresentationWithSlides { presentation, slides, theme }))
}

/// Increment the live version. Displays long-poll on this, so every mutation
/// that changes what is on screen must call it.
pub async fn bump_version(pool: &PgPool) -> Result<i64, AppError> {
    let v: i64 = sqlx::query_scalar(
        "UPDATE presentation_live SET version = version + 1, updated_at = NOW()
         WHERE id = 1 RETURNING version",
    )
    .fetch_one(pool)
    .await?;
    Ok(v)
}

/// The deck's theme, or the default when it has none.
pub async fn resolve_theme(
    pool: &PgPool,
    theme_id: Option<uuid::Uuid>,
) -> Result<Option<PresentationTheme>, AppError> {
    let row = match theme_id {
        Some(id) => {
            sqlx::query_as::<_, PresentationTheme>(
                "SELECT * FROM presentation_themes WHERE id = $1",
            )
            .bind(id)
            .fetch_optional(pool)
            .await?
        }
        None => None,
    };
    if row.is_some() {
        return Ok(row);
    }
    Ok(sqlx::query_as::<_, PresentationTheme>(
        "SELECT * FROM presentation_themes WHERE is_default LIMIT 1",
    )
    .fetch_optional(pool)
    .await?)
}

pub async fn presentations_create(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertPresentation>,
) -> Result<Json<Presentation>, AppError> {
    if input.title.trim().is_empty() {
        return Err(AppError::bad_request("Presentation title is required"));
    }
    let row = sqlx::query_as::<_, Presentation>(
        r#"INSERT INTO presentations (title, kind, description, song_id, theme_id, tags, created_by)
           VALUES ($1,COALESCE($2,'custom'),COALESCE($3,''),$4,$5,COALESCE($6,'{}'),$7)
           RETURNING *"#,
    )
    .bind(input.title.trim())
    .bind(input.kind)
    .bind(input.description)
    .bind(input.song_id)
    .bind(input.theme_id)
    .bind(input.tags)
    .bind(&auth.email)
    .fetch_one(&pool)
    .await?;
    Ok(Json(row))
}

pub async fn presentations_delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Refuse while the deck is on screen. Deleting the live presentation would
    // blank every display mid-service.
    let live: Option<uuid::Uuid> =
        sqlx::query_scalar("SELECT presentation_id FROM presentation_live WHERE id = 1")
            .fetch_optional(&pool)
            .await?
            .flatten();
    if live == Some(id) {
        return Err(AppError::conflict(
            "This presentation is currently live — stop the presentation before deleting it",
        ));
    }
    let res = sqlx::query("DELETE FROM presentations WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Presentation not found"));
    }
    Ok(Json(serde_json::json!({ "deleted": true })))
}

/// Build (or rebuild) a deck from a song's lyrics.
pub async fn presentations_from_song(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<BuildFromSongInput>,
) -> Result<Json<PresentationWithSlides>, AppError> {
    let song = sqlx::query_as::<_, Song>("SELECT * FROM songs WHERE id = $1")
        .bind(input.song_id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Song not found"))?;

    if song.lyrics.trim().is_empty() {
        return Err(AppError::bad_request(
            "This song has no lyrics yet, so there is nothing to build slides from",
        ));
    }

    let planned = plan_song_slides(&song.lyrics, input.max_lines.unwrap_or(4));
    if planned.is_empty() {
        return Err(AppError::bad_request(
            "Could not find any lyric lines to put on slides",
        ));
    }

    let mut tx = pool.begin().await?;

    let presentation = match input.presentation_id {
        Some(pid) => {
            // Rebuilding: drop the old slides so a lyric edit does not leave
            // stale ones behind.
            sqlx::query("DELETE FROM slides WHERE presentation_id = $1")
                .bind(pid)
                .execute(&mut *tx)
                .await?;
            sqlx::query_as::<_, Presentation>(
                "UPDATE presentations SET title=$2, song_id=$3, kind='song',
                        theme_id=COALESCE($4, theme_id), updated_at=NOW()
                 WHERE id=$1 RETURNING *",
            )
            .bind(pid)
            .bind(&song.title)
            .bind(song.id)
            .bind(input.theme_id)
            .fetch_optional(&mut *tx)
            .await?
            .ok_or_else(|| AppError::not_found("Presentation not found"))?
        }
        None => {
            sqlx::query_as::<_, Presentation>(
                r#"INSERT INTO presentations (title, kind, song_id, theme_id, description, created_by)
                   VALUES ($1,'song',$2,$3,$4,$5) RETURNING *"#,
            )
            .bind(&song.title)
            .bind(song.id)
            .bind(input.theme_id)
            .bind(if song.artist.is_empty() {
                String::new()
            } else {
                format!("by {}", song.artist)
            })
            .bind(&auth.email)
            .fetch_one(&mut *tx)
            .await?
        }
    };

    for (i, p) in planned.iter().enumerate() {
        sqlx::query(
            r#"INSERT INTO slides (presentation_id, sort_order, slide_type, label, body)
               VALUES ($1,$2,'lyrics',$3,$4)"#,
        )
        .bind(presentation.id)
        // Step by 10 so a slide can be inserted between two without renumbering.
        .bind((i as i32 + 1) * 10)
        .bind(&p.label)
        .bind(&p.body)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    let slides = sqlx::query_as::<_, Slide>(
        "SELECT * FROM slides WHERE presentation_id = $1 ORDER BY sort_order ASC",
    )
    .bind(presentation.id)
    .fetch_all(&pool)
    .await?;
    let theme = resolve_theme(&pool, presentation.theme_id).await?;

    Ok(Json(PresentationWithSlides { presentation, slides, theme }))
}

pub async fn slides_create(
    _auth: AuthUser,
    Db(pool): Db,
    Path(presentation_id): Path<uuid::Uuid>,
    Json(input): Json<UpsertSlide>,
) -> Result<Json<Slide>, AppError> {
    let exists: bool =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM presentations WHERE id = $1)")
            .bind(presentation_id)
            .fetch_one(&pool)
            .await?;
    if !exists {
        return Err(AppError::not_found("Presentation not found"));
    }

    let sort_order = match input.position {
        Some(p) => p,
        None => {
            let max: Option<i32> = sqlx::query_scalar(
                "SELECT MAX(sort_order) FROM slides WHERE presentation_id = $1",
            )
            .bind(presentation_id)
            .fetch_one(&pool)
            .await?;
            max.unwrap_or(0) + 10
        }
    };

    let row = sqlx::query_as::<_, Slide>(
        r#"INSERT INTO slides
             (presentation_id, sort_order, slide_type, label, title, body, reference,
              media_url, background_url, background_color, settings, notes, duration_seconds)
           VALUES ($1,$2,COALESCE($3,'text'),COALESCE($4,''),COALESCE($5,''),COALESCE($6,''),
                   COALESCE($7,''),COALESCE($8,''),COALESCE($9,''),COALESCE($10,''),
                   COALESCE($11,'{}'::jsonb),COALESCE($12,''),$13)
           RETURNING *"#,
    )
    .bind(presentation_id)
    .bind(sort_order)
    .bind(input.slide_type)
    .bind(input.label)
    .bind(input.title)
    .bind(input.body)
    .bind(input.reference)
    .bind(input.media_url)
    .bind(input.background_url)
    .bind(input.background_color)
    .bind(input.settings)
    .bind(input.notes)
    .bind(input.duration_seconds)
    .fetch_one(&pool)
    .await?;

    touch_presentation(&pool, presentation_id).await?;
    Ok(Json(row))
}

pub async fn slides_update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpsertSlide>,
) -> Result<Json<Slide>, AppError> {
    let row = sqlx::query_as::<_, Slide>(
        r#"UPDATE slides SET
             slide_type=COALESCE($2,slide_type), label=COALESCE($3,label),
             title=COALESCE($4,title), body=COALESCE($5,body),
             reference=COALESCE($6,reference), media_url=COALESCE($7,media_url),
             background_url=COALESCE($8,background_url),
             background_color=COALESCE($9,background_color),
             settings=COALESCE($10,settings), notes=COALESCE($11,notes),
             duration_seconds=$12, updated_at=NOW()
           WHERE id=$1 RETURNING *"#,
    )
    .bind(id)
    .bind(input.slide_type)
    .bind(input.label)
    .bind(input.title)
    .bind(input.body)
    .bind(input.reference)
    .bind(input.media_url)
    .bind(input.background_url)
    .bind(input.background_color)
    .bind(input.settings)
    .bind(input.notes)
    .bind(input.duration_seconds)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::not_found("Slide not found"))?;

    // A live display is showing this slide; bump the version so it re-renders.
    bump_if_live_slide(&pool, id).await?;
    Ok(Json(row))
}

pub async fn slides_delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let res = sqlx::query("DELETE FROM slides WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Slide not found"));
    }
    Ok(Json(serde_json::json!({ "deleted": true })))
}

/// Reorder slides within a presentation.
///
/// Every id must belong to the presentation, and the list must cover all of
/// them. A partial list would silently leave orphans at stale positions.
pub async fn slides_reorder(
    _auth: AuthUser,
    Db(pool): Db,
    Path(presentation_id): Path<uuid::Uuid>,
    Json(input): Json<ReorderInput>,
) -> Result<Json<Vec<Slide>>, AppError> {
    let existing: Vec<uuid::Uuid> =
        sqlx::query_scalar("SELECT id FROM slides WHERE presentation_id = $1")
            .bind(presentation_id)
            .fetch_all(&pool)
            .await?;

    if input.ids.len() != existing.len() {
        return Err(AppError::bad_request(format!(
            "Send all {} slide ids in their new order (got {})",
            existing.len(),
            input.ids.len()
        )));
    }
    let set: std::collections::HashSet<_> = existing.iter().collect();
    if input.ids.iter().any(|id| !set.contains(id)) {
        return Err(AppError::bad_request(
            "One or more slides do not belong to this presentation",
        ));
    }
    if input.ids.iter().collect::<std::collections::HashSet<_>>().len() != input.ids.len() {
        return Err(AppError::bad_request("Duplicate slide ids in the new order"));
    }

    let mut tx = pool.begin().await?;
    for (i, id) in input.ids.iter().enumerate() {
        sqlx::query("UPDATE slides SET sort_order = $2, updated_at = NOW() WHERE id = $1")
            .bind(id)
            .bind((i as i32 + 1) * 10)
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await?;

    // Slide indices moved, so any live display is now pointing at the wrong
    // slide until it refetches.
    bump_version(&pool).await?;

    let slides = sqlx::query_as::<_, Slide>(
        "SELECT * FROM slides WHERE presentation_id = $1 ORDER BY sort_order ASC",
    )
    .bind(presentation_id)
    .fetch_all(&pool)
    .await?;
    Ok(Json(slides))
}

async fn touch_presentation(pool: &PgPool, id: uuid::Uuid) -> Result<(), AppError> {
    sqlx::query("UPDATE presentations SET updated_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

async fn bump_if_live_slide(pool: &PgPool, slide_id: uuid::Uuid) -> Result<(), AppError> {
    let live: Option<uuid::Uuid> =
        sqlx::query_scalar("SELECT slide_id FROM presentation_live WHERE id = 1")
            .fetch_optional(pool)
            .await?
            .flatten();
    if live == Some(slide_id) {
        bump_version(pool).await?;
    }
    Ok(())
}

// ===========================================================================
// Unit tests for the lyric splitter — the only pure logic in this module, and
// the part most likely to silently mangle a song on screen.
// ===========================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn splits_on_blank_lines_and_auto_numbers_verses() {
        let st = split_stanzas("Line one\nLine two\n\nLine three\nLine four");
        assert_eq!(st.len(), 2);
        assert_eq!(st[0].label, "Verse 1");
        assert_eq!(st[1].label, "Verse 2");
        assert_eq!(st[1].lines, vec!["Line three", "Line four"]);
    }

    #[test]
    fn honours_bracketed_and_colon_labels() {
        let st = split_stanzas("[Chorus]\nHoly holy\n\nVerse 2:\nAll the earth");
        assert_eq!(st.len(), 2);
        assert_eq!(st[0].label, "Chorus");
        assert_eq!(st[0].lines, vec!["Holy holy"]);
        assert_eq!(st[1].label, "Verse 2");
    }

    #[test]
    fn a_lyric_line_that_reads_like_a_section_word_is_kept() {
        // "Bridge" with no colon or brackets is a lyric, not a label. Treating
        // it as a label would delete the line from the screen.
        let st = split_stanzas("Bridge\nover troubled water");
        assert_eq!(st.len(), 1);
        assert_eq!(st[0].lines, vec!["Bridge", "over troubled water"]);
    }

    #[test]
    fn label_with_no_lines_under_it_is_dropped() {
        let st = split_stanzas("[Chorus]\n\n[Verse]\nReal line");
        assert_eq!(st.len(), 1);
        assert_eq!(st[0].label, "Verse");
    }

    #[test]
    fn long_stanza_is_split_and_parts_are_numbered() {
        let slides = plan_song_slides("a\nb\nc\nd\ne\nf", 4);
        assert_eq!(slides.len(), 2);
        assert_eq!(slides[0].label, "Verse 1 (1/2)");
        assert_eq!(slides[0].body, "a\nb\nc\nd");
        assert_eq!(slides[1].label, "Verse 1 (2/2)");
        assert_eq!(slides[1].body, "e\nf");
    }

    #[test]
    fn short_stanza_keeps_its_plain_label() {
        let slides = plan_song_slides("[Chorus]\na\nb", 4);
        assert_eq!(slides.len(), 1);
        assert_eq!(slides[0].label, "Chorus");
    }

    #[test]
    fn max_lines_of_zero_is_clamped_so_it_cannot_loop_forever() {
        let slides = plan_song_slides("a\nb\nc", 0);
        assert_eq!(slides.len(), 3, "clamped to one line per slide");
    }

    #[test]
    fn empty_lyrics_produce_no_slides() {
        assert!(plan_song_slides("", 4).is_empty());
        assert!(plan_song_slides("\n\n  \n", 4).is_empty());
    }

    #[test]
    fn nepali_lyrics_split_on_stanza_breaks() {
        let lyrics = "आदिमा वचन हुनुहुन्थ्यो\nवचन परमेश्वरसँग हुनुहुन्थ्यो\n\nअनि वचन परमेश्वर हुनुहुन्थ्यो";
        let slides = plan_song_slides(lyrics, 4);
        assert_eq!(slides.len(), 2);
        assert!(slides[0].body.contains("आदिमा"));
        assert!(slides[1].body.contains("अनि"));
    }

    #[test]
    fn windows_line_endings_do_not_leak_carriage_returns_onto_slides() {
        let slides = plan_song_slides("a\r\nb\r\n\r\nc", 4);
        assert_eq!(slides.len(), 2);
        assert_eq!(slides[0].body, "a\nb");
        assert!(!slides[0].body.contains('\r'));
    }

    #[test]
    fn every_lyric_line_survives_the_split() {
        // The property that matters: no line may be dropped or duplicated.
        let lyrics = "[Verse 1]\none\ntwo\nthree\nfour\nfive\n\n[Chorus]\nsix\nseven";
        let slides = plan_song_slides(lyrics, 4);
        let rendered: Vec<&str> = slides
            .iter()
            .flat_map(|s| s.body.lines())
            .collect();
        assert_eq!(
            rendered,
            vec!["one", "two", "three", "four", "five", "six", "seven"]
        );
    }

    #[test]
    fn title_normalisation_catches_duplicate_songs() {
        assert_eq!(normalize_title("Amazing Grace!"), normalize_title("amazing  grace"));
        assert_ne!(normalize_title("Amazing Grace"), normalize_title("Amazing Love"));
    }

    #[test]
    fn slugify_produces_url_safe_slugs() {
        assert_eq!(slugify("Main Projector"), "main-projector");
        assert_eq!(slugify("  LED Wall #2  "), "led-wall-2");
    }
}
