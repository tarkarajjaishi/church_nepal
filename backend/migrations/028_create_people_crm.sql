-- People (CRM-grade person records, replacing simple members display)
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL DEFAULT '',
    email VARCHAR(255),
    phone VARCHAR(100),
    address TEXT,
    city VARCHAR(255),
    photo TEXT,
    member_status VARCHAR(50) NOT NULL DEFAULT 'visitor', -- visitor, regular, member, inactive
    household_id UUID,
    notes TEXT,
    joined_date DATE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_people_member_status ON people(member_status);
CREATE INDEX IF NOT EXISTS idx_people_household_id ON people(household_id);
CREATE INDEX IF NOT EXISTS idx_people_email ON people(email);

-- Households (families)
CREATE TABLE IF NOT EXISTS households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(100),
    notes TEXT,
    enabled BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- People <-> Tags junction
CREATE TABLE IF NOT EXISTS person_tags (
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (person_id, tag_id)
);

-- Person notes / timeline
CREATE TABLE IF NOT EXISTS person_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    author VARCHAR(255) NOT NULL DEFAULT '',
    note TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_person_notes_person_id ON person_notes(person_id);

-- Group memberships (link people <-> groups)
CREATE TABLE IF NOT EXISTS group_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL DEFAULT 'member', -- leader, member, visitor
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, person_id)
);

CREATE INDEX idx_group_memberships_group ON group_memberships(group_id);
CREATE INDEX idx_group_memberships_person ON group_memberships(person_id);

-- Migrate existing members data to people table
INSERT INTO people (first_name, last_name, photo, member_status, joined_date, enabled, sort_order, created_at)
SELECT
    SPLIT_PART(name, ' ', 1),
    CASE WHEN array_length(string_to_array(name, ' '), 1) > 1 THEN SUBSTRING(name FROM position(' ' IN name) + 1) ELSE '' END,
    image,
    'member',
    CASE WHEN since ~ '^\d{4}$' THEN (since || '-01-01')::date ELSE NOW()::date END,
    COALESCE(enabled, true),
    COALESCE(sort_order, 0),
    created_at
FROM members
WHERE NOT EXISTS (SELECT 1 FROM people LIMIT 1);
