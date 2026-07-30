//! Presentation & Worship Display models.

use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Songs
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Song {
    pub id: uuid::Uuid,
    pub title: String,
    pub artist: String,
    pub author: String,
    pub album: String,
    pub language: String,
    pub category: String,
    pub song_key: String,
    pub alternate_keys: String,
    pub tempo: String,
    pub bpm: Option<i32>,
    pub time_signature: String,
    pub ccli_number: String,
    pub copyright: String,
    pub lyrics: String,
    pub chords: String,
    pub notes: String,
    pub tags: Vec<String>,
    pub is_favourite: bool,
    pub is_archived: bool,
    pub use_count: i32,
    pub last_used_at: Option<chrono::NaiveDateTime>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct UpsertSong {
    pub title: String,
    pub artist: Option<String>,
    pub author: Option<String>,
    pub album: Option<String>,
    pub language: Option<String>,
    pub category: Option<String>,
    pub song_key: Option<String>,
    pub alternate_keys: Option<String>,
    pub tempo: Option<String>,
    pub bpm: Option<i32>,
    pub time_signature: Option<String>,
    pub ccli_number: Option<String>,
    pub copyright: Option<String>,
    pub lyrics: Option<String>,
    pub chords: Option<String>,
    pub notes: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_favourite: Option<bool>,
    pub is_archived: Option<bool>,
}

#[derive(Debug, Deserialize, Default)]
pub struct SongQuery {
    pub search: Option<String>,
    pub language: Option<String>,
    pub category: Option<String>,
    pub tag: Option<String>,
    pub favourite: Option<bool>,
    pub archived: Option<bool>,
    pub sort: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct SongPage {
    pub data: Vec<Song>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub total_pages: i64,
}

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct PresentationTheme {
    pub id: uuid::Uuid,
    pub name: String,
    pub slug: String,
    pub font_family: String,
    pub font_size: i32,
    pub text_color: String,
    pub background_color: String,
    pub background_image: String,
    pub text_align: String,
    pub vertical_align: String,
    pub text_effects: serde_json::Value,
    pub transition: String,
    pub is_default: bool,
}

#[derive(Debug, Deserialize)]
pub struct UpsertTheme {
    pub name: String,
    pub font_family: Option<String>,
    pub font_size: Option<i32>,
    pub text_color: Option<String>,
    pub background_color: Option<String>,
    pub background_image: Option<String>,
    pub text_align: Option<String>,
    pub vertical_align: Option<String>,
    pub text_effects: Option<serde_json::Value>,
    pub transition: Option<String>,
    pub is_default: Option<bool>,
}

// ---------------------------------------------------------------------------
// Presentations & slides
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Presentation {
    pub id: uuid::Uuid,
    pub title: String,
    pub kind: String,
    pub description: String,
    pub song_id: Option<uuid::Uuid>,
    pub theme_id: Option<uuid::Uuid>,
    pub source_file: String,
    pub source_kind: String,
    pub tags: Vec<String>,
    pub is_archived: bool,
    pub use_count: i32,
    pub last_used_at: Option<chrono::NaiveDateTime>,
    pub created_by: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

/// List row with the slide count, which every library view shows.
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct PresentationRow {
    pub id: uuid::Uuid,
    pub title: String,
    pub kind: String,
    pub description: String,
    pub song_id: Option<uuid::Uuid>,
    pub theme_id: Option<uuid::Uuid>,
    pub tags: Vec<String>,
    pub is_archived: bool,
    pub use_count: i32,
    pub last_used_at: Option<chrono::NaiveDateTime>,
    pub slide_count: i64,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Slide {
    pub id: uuid::Uuid,
    pub presentation_id: uuid::Uuid,
    pub sort_order: i32,
    pub slide_type: String,
    pub label: String,
    pub title: String,
    pub body: String,
    pub reference: String,
    pub media_url: String,
    pub background_url: String,
    pub background_color: String,
    pub settings: serde_json::Value,
    pub notes: String,
    pub duration_seconds: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct PresentationWithSlides {
    #[serde(flatten)]
    pub presentation: Presentation,
    pub slides: Vec<Slide>,
    pub theme: Option<PresentationTheme>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertPresentation {
    pub title: String,
    pub kind: Option<String>,
    pub description: Option<String>,
    pub song_id: Option<uuid::Uuid>,
    pub theme_id: Option<uuid::Uuid>,
    pub tags: Option<Vec<String>>,
    pub is_archived: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertSlide {
    pub slide_type: Option<String>,
    pub label: Option<String>,
    pub title: Option<String>,
    pub body: Option<String>,
    pub reference: Option<String>,
    pub media_url: Option<String>,
    pub background_url: Option<String>,
    pub background_color: Option<String>,
    pub settings: Option<serde_json::Value>,
    pub notes: Option<String>,
    pub duration_seconds: Option<i32>,
    /// Insert at this position; appended when omitted.
    pub position: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct ReorderInput {
    /// Ids in their new order. Any id not belonging to the parent is rejected.
    pub ids: Vec<uuid::Uuid>,
}

/// Build a song deck from lyrics.
#[derive(Debug, Deserialize)]
pub struct BuildFromSongInput {
    pub song_id: uuid::Uuid,
    pub theme_id: Option<uuid::Uuid>,
    /// Maximum lines per slide. Long stanzas are split rather than overflowing
    /// the screen. Defaults to 4.
    pub max_lines: Option<usize>,
    /// Replace the existing slides of this deck instead of creating a new one.
    pub presentation_id: Option<uuid::Uuid>,
}

// ---------------------------------------------------------------------------
// Playlists
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Playlist {
    pub id: uuid::Uuid,
    pub name: String,
    pub service_date: Option<chrono::NaiveDate>,
    pub service_time: Option<chrono::NaiveTime>,
    pub service_name: String,
    pub operator: String,
    pub notes: String,
    pub status: String,
    pub is_template: bool,
    pub created_by: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct PlaylistItem {
    pub id: uuid::Uuid,
    pub playlist_id: uuid::Uuid,
    pub sort_order: i32,
    pub item_kind: String,
    pub presentation_id: Option<uuid::Uuid>,
    pub title: String,
    pub settings: serde_json::Value,
    pub planned_seconds: Option<i32>,
    pub notes: String,
    /// Joined so the running order can show "12 slides" without an extra call.
    pub slide_count: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct PlaylistWithItems {
    #[serde(flatten)]
    pub playlist: Playlist,
    pub items: Vec<PlaylistItem>,
    /// Sum of planned_seconds, so the team can see if the order overruns.
    pub planned_total_seconds: i64,
}

#[derive(Debug, Deserialize)]
pub struct UpsertPlaylist {
    pub name: String,
    pub service_date: Option<String>,
    pub service_time: Option<String>,
    pub service_name: Option<String>,
    pub operator: Option<String>,
    pub notes: Option<String>,
    pub status: Option<String>,
    pub is_template: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertPlaylistItem {
    pub item_kind: Option<String>,
    pub presentation_id: Option<uuid::Uuid>,
    pub title: Option<String>,
    pub settings: Option<serde_json::Value>,
    pub planned_seconds: Option<i32>,
    pub notes: Option<String>,
    pub position: Option<i32>,
}

// ---------------------------------------------------------------------------
// Displays
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Display {
    pub id: uuid::Uuid,
    pub name: String,
    pub slug: String,
    pub display_kind: String,
    pub resolution: String,
    pub orientation: String,
    pub aspect_ratio: String,
    pub shows_notes: bool,
    pub shows_next_slide: bool,
    pub is_stream_output: bool,
    pub theme_id: Option<uuid::Uuid>,
    pub is_enabled: bool,
    pub last_seen_at: Option<chrono::NaiveDateTime>,
}

/// Display plus a derived connection state, so the client does not have to
/// know the staleness threshold.
#[derive(Debug, Serialize)]
pub struct DisplayStatus {
    #[serde(flatten)]
    pub display: Display,
    /// online | stale | offline
    pub connection: &'static str,
    pub seconds_since_seen: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertDisplay {
    pub name: String,
    pub display_kind: Option<String>,
    pub resolution: Option<String>,
    pub orientation: Option<String>,
    pub aspect_ratio: Option<String>,
    pub shows_notes: Option<bool>,
    pub shows_next_slide: Option<bool>,
    pub is_stream_output: Option<bool>,
    pub theme_id: Option<uuid::Uuid>,
    pub is_enabled: Option<bool>,
}

// ---------------------------------------------------------------------------
// Live state
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct LiveState {
    pub version: i64,
    pub is_live: bool,
    pub playlist_id: Option<uuid::Uuid>,
    pub playlist_item_id: Option<uuid::Uuid>,
    pub presentation_id: Option<uuid::Uuid>,
    pub slide_id: Option<uuid::Uuid>,
    pub slide_index: i32,
    pub screen_mode: String,
    pub countdown_target: Option<chrono::NaiveDateTime>,
    pub countdown_message: String,
    pub countdown_paused_seconds: Option<i32>,
    pub lower_third_title: String,
    pub lower_third_subtitle: String,
    pub lower_third_visible: bool,
    pub operator: String,
    pub started_at: Option<chrono::NaiveDateTime>,
    pub updated_at: chrono::NaiveDateTime,
}

/// Everything a display needs for one frame, in a single response.
///
/// Displays are often cheap devices on poor wifi; making them stitch together
/// three calls per slide change would be the wrong trade.
#[derive(Debug, Serialize)]
pub struct LiveFrame {
    #[serde(flatten)]
    pub state: LiveState,
    pub current_slide: Option<Slide>,
    pub next_slide: Option<Slide>,
    pub presentation_title: Option<String>,
    pub theme: Option<PresentationTheme>,
    pub slide_total: i64,
}

#[derive(Debug, Deserialize)]
pub struct GoLiveInput {
    pub playlist_id: Option<uuid::Uuid>,
    pub playlist_item_id: Option<uuid::Uuid>,
    pub presentation_id: Option<uuid::Uuid>,
    pub slide_index: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct ScreenModeInput {
    /// normal | black | logo | blank | freeze
    pub mode: String,
}

#[derive(Debug, Deserialize)]
pub struct GotoSlideInput {
    pub slide_index: Option<i32>,
    pub slide_id: Option<uuid::Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct CountdownInput {
    /// Seconds from now. Mutually exclusive with `target`.
    pub seconds: Option<i64>,
    /// Absolute ISO-8601 target instant.
    pub target: Option<String>,
    pub message: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LowerThirdInput {
    pub title: Option<String>,
    pub subtitle: Option<String>,
    pub visible: Option<bool>,
}

#[derive(Debug, Deserialize, Default)]
pub struct WatchQuery {
    /// Version the caller already has. The request blocks until the stored
    /// version differs, or the poll window elapses.
    pub version: Option<i64>,
    /// Display slug, so the poll doubles as a heartbeat.
    pub display: Option<String>,
    pub timeout_ms: Option<u64>,
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize)]
pub struct PresentationDashboard {
    pub is_live: bool,
    pub screen_mode: String,
    pub operator: String,
    pub current_presentation: Option<String>,
    pub current_slide_index: i32,
    pub current_slide_total: i64,
    pub next_slide_label: Option<String>,
    pub live_seconds: Option<i64>,
    pub displays_total: i64,
    pub displays_online: i64,
    pub today_playlist: Option<Playlist>,
    pub today_playlist_items: i64,
    pub song_count: i64,
    pub presentation_count: i64,
    pub slide_count: i64,
    pub recent_presentations: Vec<PresentationRow>,
    pub recent_activity: Vec<HistoryEntry>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct HistoryEntry {
    pub id: uuid::Uuid,
    pub action: String,
    pub detail: String,
    pub operator: String,
    pub created_at: chrono::NaiveDateTime,
}
