-- Presentation & Worship Display module.
--
-- Single church. Tenancy is one database per church, so no tenant columns.
--
-- Design notes worth reading before changing anything here:
--
-- * A "presentation" is a deck of slides. A song, a sermon outline, an
--   announcement set and an imported PowerPoint are all presentations with
--   different `kind` values, so the editor and the live presenter have exactly
--   one thing to render instead of a branch per content type.
-- * A "playlist" is the running order of a service. Its items point at
--   presentations, or carry inline content (a countdown, a blank), so an
--   operator can drop a 5-minute countdown into the order without first
--   creating a deck for it.
-- * `presentation_live` is a single row holding what is on screen right now.
--   Displays watch its `version` column. See the long-poll note in the handler.

-- ---------------------------------------------------------------------------
-- Song library
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(300) NOT NULL,
    title_normalized VARCHAR(300) NOT NULL DEFAULT '',
    artist VARCHAR(255) NOT NULL DEFAULT '',
    author VARCHAR(255) NOT NULL DEFAULT '',
    album VARCHAR(255) NOT NULL DEFAULT '',
    language VARCHAR(60) NOT NULL DEFAULT 'ne',
    category VARCHAR(120) NOT NULL DEFAULT '',
    song_key VARCHAR(20) NOT NULL DEFAULT '',
    alternate_keys VARCHAR(120) NOT NULL DEFAULT '',
    tempo VARCHAR(40) NOT NULL DEFAULT '',
    bpm INTEGER,
    time_signature VARCHAR(20) NOT NULL DEFAULT '',
    ccli_number VARCHAR(60) NOT NULL DEFAULT '',
    copyright TEXT NOT NULL DEFAULT '',
    -- Raw lyrics with blank-line stanza breaks. The canonical source; slides
    -- are generated from this so an edit to the lyrics can regenerate them.
    lyrics TEXT NOT NULL DEFAULT '',
    chords TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_favourite BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    use_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMP,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
-- Normalised title + artist is the natural key: it stops the same song being
-- added twice with different capitalisation, which is the usual way a song
-- library rots.
CREATE UNIQUE INDEX IF NOT EXISTS uq_songs_title_artist
    ON songs(title_normalized, artist);
CREATE INDEX IF NOT EXISTS idx_songs_language ON songs(language);
CREATE INDEX IF NOT EXISTS idx_songs_favourite ON songs(is_favourite) WHERE is_favourite;
CREATE INDEX IF NOT EXISTS idx_songs_last_used ON songs(last_used_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_songs_tags ON songs USING GIN(tags);

-- ---------------------------------------------------------------------------
-- Themes: reusable look for a deck (font, colours, alignment, effects)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS presentation_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    font_family VARCHAR(200) NOT NULL DEFAULT 'Poppins',
    font_size INTEGER NOT NULL DEFAULT 64,
    text_color VARCHAR(20) NOT NULL DEFAULT '#ffffff',
    background_color VARCHAR(20) NOT NULL DEFAULT '#0b3c5d',
    background_image TEXT NOT NULL DEFAULT '',
    text_align VARCHAR(20) NOT NULL DEFAULT 'center',
    vertical_align VARCHAR(20) NOT NULL DEFAULT 'center',
    -- Outline/shadow/glow live together because they are always tuned as a set
    -- for legibility against video backgrounds.
    text_effects JSONB NOT NULL DEFAULT '{"outline":true,"shadow":true,"glow":false}'::jsonb,
    transition VARCHAR(40) NOT NULL DEFAULT 'fade',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_presentation_themes_slug ON presentation_themes(slug);
-- At most one default theme, enforced by the database rather than the handler.
CREATE UNIQUE INDEX IF NOT EXISTS uq_presentation_themes_one_default
    ON presentation_themes(is_default) WHERE is_default;

-- ---------------------------------------------------------------------------
-- Presentations (decks) and slides
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(300) NOT NULL,
    -- song | sermon | announcement | scripture | countdown | media | import | custom
    kind VARCHAR(40) NOT NULL DEFAULT 'custom',
    description TEXT NOT NULL DEFAULT '',
    -- Set when kind='song', so editing the song can regenerate the deck.
    song_id UUID REFERENCES songs(id) ON DELETE SET NULL,
    theme_id UUID REFERENCES presentation_themes(id) ON DELETE SET NULL,
    -- Source file for an imported PPTX/PDF, kept so the import is traceable.
    source_file TEXT NOT NULL DEFAULT '',
    source_kind VARCHAR(20) NOT NULL DEFAULT '',
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_archived BOOLEAN NOT NULL DEFAULT false,
    use_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMP,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_presentations_kind ON presentations(kind);
CREATE INDEX IF NOT EXISTS idx_presentations_song ON presentations(song_id);
CREATE INDEX IF NOT EXISTS idx_presentations_last_used ON presentations(last_used_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
    -- Gaps are allowed and expected: reordering rewrites these, and leaving
    -- room avoids a full renumber on every insert.
    sort_order INTEGER NOT NULL DEFAULT 0,
    -- text | lyrics | image | video | audio | countdown | bible | announcement
    -- | quote | scripture | offering | welcome | thank_you | prayer
    -- | communion | baptism | blank | custom
    slide_type VARCHAR(40) NOT NULL DEFAULT 'text',
    -- Stanza label for lyrics: Verse 1, Chorus, Bridge…
    label VARCHAR(120) NOT NULL DEFAULT '',
    title VARCHAR(300) NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    -- Reference shown in the corner for scripture slides.
    reference VARCHAR(200) NOT NULL DEFAULT '',
    media_url TEXT NOT NULL DEFAULT '',
    background_url TEXT NOT NULL DEFAULT '',
    background_color VARCHAR(20) NOT NULL DEFAULT '',
    -- Per-slide overrides of the theme, plus free-form object data for the
    -- editor. JSONB so the editor can evolve without a migration per feature.
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT NOT NULL DEFAULT '',
    duration_seconds INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_slides_presentation ON slides(presentation_id, sort_order);

-- ---------------------------------------------------------------------------
-- Playlists: the running order for a service
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(300) NOT NULL,
    service_date DATE,
    service_time TIME,
    service_name VARCHAR(255) NOT NULL DEFAULT '',
    operator VARCHAR(255) NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    -- draft | ready | live | done | template
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    is_template BOOLEAN NOT NULL DEFAULT false,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_playlists_date ON playlists(service_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_playlists_status ON playlists(status);

CREATE TABLE IF NOT EXISTS playlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    -- presentation | countdown | blank | logo | note
    item_kind VARCHAR(40) NOT NULL DEFAULT 'presentation',
    presentation_id UUID REFERENCES presentations(id) ON DELETE SET NULL,
    -- Label shown in the running order. Denormalised from the presentation so
    -- a deleted deck leaves a readable gap instead of an empty row.
    title VARCHAR(300) NOT NULL DEFAULT '',
    -- Countdown target / inline settings for non-presentation items.
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    planned_seconds INTEGER,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist ON playlist_items(playlist_id, sort_order);

-- ---------------------------------------------------------------------------
-- Displays
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS displays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    -- projector | led_wall | stage | confidence | lobby | children | outdoor | stream
    display_kind VARCHAR(40) NOT NULL DEFAULT 'projector',
    resolution VARCHAR(40) NOT NULL DEFAULT '1920x1080',
    orientation VARCHAR(20) NOT NULL DEFAULT 'landscape',
    aspect_ratio VARCHAR(20) NOT NULL DEFAULT '16:9',
    -- A stage/confidence monitor shows notes and the next slide; the main
    -- output must not. This flag is what separates them.
    shows_notes BOOLEAN NOT NULL DEFAULT false,
    shows_next_slide BOOLEAN NOT NULL DEFAULT false,
    -- A stream output takes a clean feed with lower thirds instead of full slides.
    is_stream_output BOOLEAN NOT NULL DEFAULT false,
    theme_id UUID REFERENCES presentation_themes(id) ON DELETE SET NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    -- Written by the display itself on each poll; connection state is derived
    -- from how long ago this was, not stored as a stale boolean.
    last_seen_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_displays_slug ON displays(slug);

-- ---------------------------------------------------------------------------
-- Live state: exactly one row, id = 1.
--
-- `version` increments on every change. Displays long-poll on it, so a slide
-- advance reaches every screen without websockets. Keeping it in the database
-- rather than process memory means it survives a backend restart mid-service
-- and works if the API is running more than one process.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS presentation_live (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    version BIGINT NOT NULL DEFAULT 1,
    is_live BOOLEAN NOT NULL DEFAULT false,
    playlist_id UUID REFERENCES playlists(id) ON DELETE SET NULL,
    playlist_item_id UUID REFERENCES playlist_items(id) ON DELETE SET NULL,
    presentation_id UUID REFERENCES presentations(id) ON DELETE SET NULL,
    slide_id UUID REFERENCES slides(id) ON DELETE SET NULL,
    slide_index INTEGER NOT NULL DEFAULT 0,
    -- Mutually exclusive screen overrides, resolved in the handler so two
    -- cannot be on at once.
    screen_mode VARCHAR(20) NOT NULL DEFAULT 'normal', -- normal|black|logo|blank|freeze
    -- Countdown target as an absolute instant, so every display agrees without
    -- clock-syncing to the operator's machine.
    countdown_target TIMESTAMP,
    countdown_message VARCHAR(300) NOT NULL DEFAULT '',
    countdown_paused_seconds INTEGER,
    lower_third_title VARCHAR(300) NOT NULL DEFAULT '',
    lower_third_subtitle VARCHAR(300) NOT NULL DEFAULT '',
    lower_third_visible BOOLEAN NOT NULL DEFAULT false,
    operator VARCHAR(255) NOT NULL DEFAULT '',
    started_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
INSERT INTO presentation_live (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Presentation history: who showed what, for the activity timeline
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS presentation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID REFERENCES playlists(id) ON DELETE SET NULL,
    presentation_id UUID REFERENCES presentations(id) ON DELETE SET NULL,
    action VARCHAR(60) NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    operator VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_presentation_history_created
    ON presentation_history(created_at DESC);

-- ---------------------------------------------------------------------------
-- Seed: default theme, the usual displays, one starter playlist template
-- ---------------------------------------------------------------------------
INSERT INTO presentation_themes
    (name, slug, font_family, font_size, text_color, background_color, is_default)
VALUES
    ('Church Navy',  'church-navy',  'Poppins', 64, '#ffffff', '#0b3c5d', true),
    ('High Contrast','high-contrast','Inter',   72, '#ffffff', '#000000', false),
    ('Warm Gold',    'warm-gold',    'Poppins', 60, '#1f2937', '#f3e2b3', false)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO displays (name, slug, display_kind, resolution, shows_notes, shows_next_slide, is_stream_output)
VALUES
    ('Main Projector',    'main-projector',    'projector',  '1920x1080', false, false, false),
    ('Stage Display',     'stage-display',     'stage',      '1920x1080', true,  true,  false),
    ('Confidence Monitor','confidence-monitor','confidence', '1920x1080', true,  true,  false),
    ('Lobby TV',          'lobby-tv',          'lobby',      '1920x1080', false, false, false),
    ('Livestream Output', 'livestream-output', 'stream',     '1920x1080', false, false, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO playlists (name, service_name, status, is_template, notes)
SELECT 'Standard Sunday Order', 'Sunday Service', 'template', true,
       'Starter running order — duplicate this for a new service.'
WHERE NOT EXISTS (
    SELECT 1 FROM playlists WHERE is_template AND name = 'Standard Sunday Order'
);

-- Items for the starter template, in service order.
INSERT INTO playlist_items (playlist_id, sort_order, item_kind, title, planned_seconds)
SELECT p.id, v.ord, v.kind, v.title, v.secs
FROM playlists p
CROSS JOIN (VALUES
    (10,  'countdown',    'Countdown',        300),
    (20,  'presentation', 'Welcome',           60),
    (30,  'presentation', 'Opening Prayer',   120),
    (40,  'presentation', 'Song 1',           300),
    (50,  'presentation', 'Song 2',           300),
    (60,  'presentation', 'Announcements',    240),
    (70,  'presentation', 'Bible Reading',    180),
    (80,  'presentation', 'Offering',         240),
    (90,  'presentation', 'Special Music',    240),
    (100, 'presentation', 'Message',         1800),
    (110, 'presentation', 'Communion',        480),
    (120, 'presentation', 'Closing Song',     300),
    (130, 'presentation', 'Thank You',         60)
) AS v(ord, kind, title, secs)
WHERE p.is_template AND p.name = 'Standard Sunday Order'
  AND NOT EXISTS (SELECT 1 FROM playlist_items pi WHERE pi.playlist_id = p.id);
