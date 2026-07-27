-- Member CRM enhancement: add CRM fields and related tables

-- Enhance members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE members ADD COLUMN IF NOT EXISTS phone VARCHAR(100);
ALTER TABLE members ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS city VARCHAR(255);
ALTER TABLE members ADD COLUMN IF NOT EXISTS member_status VARCHAR(50) NOT NULL DEFAULT 'member';
ALTER TABLE members ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS joined_date DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS household_id UUID;

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

-- Member tags
CREATE TABLE IF NOT EXISTS member_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Member <-> Tag assignments
CREATE TABLE IF NOT EXISTS member_tag_assignments (
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES member_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (member_id, tag_id)
);

-- Member notes / timeline
CREATE TABLE IF NOT EXISTS member_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    author VARCHAR(255) NOT NULL DEFAULT '',
    note TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Member custom fields (key-value)
CREATE TABLE IF NOT EXISTS member_custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    field_key VARCHAR(255) NOT NULL,
    field_value TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_members_household_id ON members(household_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_member_notes_member_id ON member_notes(member_id);
CREATE INDEX IF NOT EXISTS idx_member_custom_fields_member_id ON member_custom_fields(member_id);
CREATE INDEX IF NOT EXISTS idx_member_tag_assignments_member ON member_tag_assignments(member_id);
