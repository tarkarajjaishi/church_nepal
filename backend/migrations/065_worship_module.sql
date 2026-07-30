-- Worship Management module.
--
-- Reuses `songs` (created by 062 for the presentation module) rather than
-- adding a parallel music library — a church has one song catalogue, and two
-- would drift the moment someone edited a key in the wrong place.
--
-- There is deliberately no separate `setlists` table. A setlist IS the songs
-- inside a service plan, in order, and modelling it separately would mean two
-- running orders that can disagree about the same service. Songs are
-- service_plan_items of kind 'song' with a song_id.

-- ---------------------------------------------------------------------------
-- Song fields the worship team needs that the presentation module did not
-- ---------------------------------------------------------------------------
ALTER TABLE songs
    ADD COLUMN IF NOT EXISTS composer            VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS theme               VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS duration_seconds    INTEGER,
    ADD COLUMN IF NOT EXISTS sheet_music_url     TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS chord_chart_url     TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS audio_url           TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS instrumental_url    TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS practice_track_url  TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS video_url           TEXT NOT NULL DEFAULT '';

-- ---------------------------------------------------------------------------
-- Roles: the instrument / position catalogue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worship_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    -- vocal | strings | keys | rhythm | wind | tech
    category VARCHAR(40) NOT NULL DEFAULT 'other',
    icon VARCHAR(60) NOT NULL DEFAULT 'Music',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_worship_roles_slug ON worship_roles(slug);

-- ---------------------------------------------------------------------------
-- Team members
--
-- person_id is optional: worship volunteers are often on the team before they
-- exist as a people record, and blocking the roster on that would push admins
-- to create half-empty person records just to add a drummer.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worship_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    photo TEXT NOT NULL DEFAULT '',
    phone VARCHAR(100) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL DEFAULT '',
    -- soprano | alto | tenor | bass | none
    voice_type VARCHAR(40) NOT NULL DEFAULT 'none',
    -- beginner | intermediate | advanced
    experience VARCHAR(40) NOT NULL DEFAULT 'intermediate',
    emergency_contact VARCHAR(255) NOT NULL DEFAULT '',
    emergency_phone VARCHAR(100) NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    is_leader BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_worship_members_active ON worship_members(is_active, name);

-- What each member can play. Many-to-many because a musician who only plays
-- one instrument is the exception, not the rule.
CREATE TABLE IF NOT EXISTS worship_member_roles (
    member_id UUID NOT NULL REFERENCES worship_members(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES worship_roles(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (member_id, role_id)
);

-- Weekly availability, one row per member per weekday (0=Sunday).
CREATE TABLE IF NOT EXISTS worship_availability (
    member_id UUID NOT NULL REFERENCES worship_members(id) ON DELETE CASCADE,
    weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
    is_available BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (member_id, weekday)
);

-- ---------------------------------------------------------------------------
-- Service plans
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worship_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    service_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    theme VARCHAR(255) NOT NULL DEFAULT '',
    speaker VARCHAR(255) NOT NULL DEFAULT '',
    -- sunday | midweek | special | youth | prayer
    service_type VARCHAR(40) NOT NULL DEFAULT 'sunday',
    description TEXT NOT NULL DEFAULT '',
    -- draft | planned | confirmed | completed | cancelled
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    worship_leader VARCHAR(255) NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Links the plan to the projector running order built in module 062.
    playlist_id UUID REFERENCES playlists(id) ON DELETE SET NULL,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_worship_services_date ON worship_services(service_date DESC);
CREATE INDEX IF NOT EXISTS idx_worship_services_status ON worship_services(status);

-- The running order. Songs are items of kind 'song' with a song_id, which is
-- what makes the setlist and the service plan the same object.
CREATE TABLE IF NOT EXISTS service_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES worship_services(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    -- countdown | welcome | prayer | song | announcements | offering
    -- | reading | sermon | communion | special | dismissal | other
    item_kind VARCHAR(40) NOT NULL DEFAULT 'other',
    title VARCHAR(255) NOT NULL DEFAULT '',
    song_id UUID REFERENCES songs(id) ON DELETE SET NULL,
    -- Per-service key override: the same song is often transposed to suit
    -- whoever is leading, and rewriting the song's key would corrupt it for
    -- every other service.
    song_key VARCHAR(20) NOT NULL DEFAULT '',
    leader VARCHAR(255) NOT NULL DEFAULT '',
    planned_seconds INTEGER NOT NULL DEFAULT 0,
    actual_seconds INTEGER,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_service_plan_items_service
    ON service_plan_items(service_id, sort_order);

-- Who is playing what, in which service.
CREATE TABLE IF NOT EXISTS service_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES worship_services(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES worship_members(id) ON DELETE CASCADE,
    role_id UUID REFERENCES worship_roles(id) ON DELETE SET NULL,
    -- invited | accepted | declined | confirmed
    status VARCHAR(20) NOT NULL DEFAULT 'invited',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
-- One person cannot cover the same role twice in one service. They CAN cover
-- two different roles, which is normal in a small church.
CREATE UNIQUE INDEX IF NOT EXISTS uq_service_assignment
    ON service_assignments(service_id, member_id, role_id);
CREATE INDEX IF NOT EXISTS idx_service_assignments_service ON service_assignments(service_id);

-- ---------------------------------------------------------------------------
-- Rehearsals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rehearsals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES worship_services(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Rehearsal',
    rehearsal_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255) NOT NULL DEFAULT '',
    agenda TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    -- scheduled | completed | cancelled
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rehearsals_date ON rehearsals(rehearsal_date DESC);

CREATE TABLE IF NOT EXISTS rehearsal_attendees (
    rehearsal_id UUID NOT NULL REFERENCES rehearsals(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES worship_members(id) ON DELETE CASCADE,
    -- invited | present | absent | excused
    status VARCHAR(20) NOT NULL DEFAULT 'invited',
    PRIMARY KEY (rehearsal_id, member_id)
);

-- ---------------------------------------------------------------------------
-- Seed the role catalogue from the spec. Slug is the natural key so re-running
-- is idempotent (the lesson from 059_unique_seed_keys).
-- ---------------------------------------------------------------------------
INSERT INTO worship_roles (name, slug, category, icon, sort_order) VALUES
    ('Worship Leader',      'worship-leader',      'vocal',  'Mic',        10),
    ('Lead Vocal',          'lead-vocal',          'vocal',  'Mic',        20),
    ('Backing Vocal',       'backing-vocal',       'vocal',  'Mic2',       30),
    ('Choir',               'choir',               'vocal',  'Users',      40),
    ('Acoustic Guitar',     'acoustic-guitar',     'strings','Guitar',     50),
    ('Electric Guitar',     'electric-guitar',     'strings','Guitar',     60),
    ('Bass Guitar',         'bass-guitar',         'strings','Guitar',     70),
    ('Violin',              'violin',              'strings','Music',      80),
    ('Cello',               'cello',               'strings','Music',      90),
    ('Keyboard',            'keyboard',            'keys',   'Piano',     100),
    ('Piano',               'piano',               'keys',   'Piano',     110),
    ('Drums',               'drums',               'rhythm', 'Drum',      120),
    ('Percussion',          'percussion',          'rhythm', 'Drum',      130),
    ('Trumpet',             'trumpet',             'wind',   'Music',     140),
    ('Saxophone',           'saxophone',           'wind',   'Music',     150),
    ('Flute',               'flute',               'wind',   'Music',     160),
    ('Sound Engineer',      'sound-engineer',      'tech',   'SlidersHorizontal', 170),
    ('Lighting',            'lighting',            'tech',   'Lightbulb', 180),
    ('Projection Operator', 'projection-operator', 'tech',   'MonitorPlay',190),
    ('Livestream Operator', 'livestream-operator', 'tech',   'Radio',     200),
    ('Camera Operator',     'camera-operator',     'tech',   'Video',     210)
ON CONFLICT (slug) DO NOTHING;
