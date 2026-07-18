-- Event RSVPs
CREATE TABLE IF NOT EXISTS event_rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL DEFAULT '',
    phone VARCHAR(100) NOT NULL DEFAULT '',
    guests INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'registered',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON event_rsvps(event_id);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID,
    person_id UUID,
    name VARCHAR(255) NOT NULL DEFAULT '',
    service_date DATE NOT NULL,
    service_name VARCHAR(255) NOT NULL DEFAULT 'Sunday Service',
    checked_in_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(service_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance(event_id);

-- Broadcasts
CREATE TABLE IF NOT EXISTS broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR(500) NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    broadcast_type VARCHAR(50) NOT NULL DEFAULT 'email',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    recipient_group VARCHAR(100) NOT NULL DEFAULT 'all',
    recipient_count INT NOT NULL DEFAULT 0,
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS broadcast_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL DEFAULT '',
    recipient_phone VARCHAR(100) NOT NULL DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_broadcast ON broadcast_recipients(broadcast_id);

-- Forms
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    fields JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    submit_action VARCHAR(50) NOT NULL DEFAULT 'email',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}',
    submitted_ip VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form ON form_submissions(form_id);

-- Volunteer Teams
CREATE TABLE IF NOT EXISTS volunteer_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    color VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
    enabled BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS volunteer_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES volunteer_teams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    shift_date DATE NOT NULL,
    start_time VARCHAR(20) NOT NULL DEFAULT '',
    end_time VARCHAR(20) NOT NULL DEFAULT '',
    location VARCHAR(255) NOT NULL DEFAULT '',
    slots INT NOT NULL DEFAULT 1,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_volunteer_shifts_date ON volunteer_shifts(shift_date DESC);
CREATE INDEX IF NOT EXISTS idx_volunteer_shifts_team ON volunteer_shifts(team_id);

CREATE TABLE IF NOT EXISTS volunteer_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES volunteer_shifts(id) ON DELETE CASCADE,
    person_id UUID,
    name VARCHAR(255) NOT NULL DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'assigned',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_shift ON volunteer_assignments(shift_id);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255) NOT NULL DEFAULT '',
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NOT NULL DEFAULT '',
    entity_id VARCHAR(100) NOT NULL DEFAULT '',
    details JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type);

-- Funds
CREATE TABLE IF NOT EXISTS funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    fund_type VARCHAR(100) NOT NULL DEFAULT 'general',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add fund_id to donations
ALTER TABLE donations ADD COLUMN IF NOT EXISTS fund_id UUID;

-- Recurring Donations
CREATE TABLE IF NOT EXISTS recurring_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_name VARCHAR(255) NOT NULL DEFAULT '',
    donor_email VARCHAR(255) NOT NULL DEFAULT '',
    donor_phone VARCHAR(100) NOT NULL DEFAULT '',
    fund_id UUID REFERENCES funds(id),
    amount BIGINT NOT NULL DEFAULT 0,
    frequency VARCHAR(50) NOT NULL DEFAULT 'monthly',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'bank',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    next_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Pledges
CREATE TABLE IF NOT EXISTS pledges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    person_name VARCHAR(255) NOT NULL DEFAULT '',
    person_email VARCHAR(255) NOT NULL DEFAULT '',
    amount BIGINT NOT NULL DEFAULT 0,
    fulfilled_amount BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pledges_campaign ON pledges(campaign_id);

-- Seed content blocks
INSERT INTO content_blocks (section_key, title, subtitle, body, enabled, sort_order) VALUES
('volunteer_hero', 'Volunteer With Us', 'Use your gifts to serve', 'Join our volunteer teams and make a difference in your community.', true, 0),
('volunteer_form', 'Volunteer Signup', 'We would love to have you on the team', '', true, 1)
ON CONFLICT (section_key) DO NOTHING;

-- Seed default funds
INSERT INTO funds (name, description, fund_type, sort_order) VALUES
('General Fund', 'For general church operations and ministry', 'general', 1),
('Tithe', 'Faithful tithes and offerings', 'tithe', 2),
('Building Fund', 'Supporting our church building project', 'building', 3),
('Missions', 'Supporting missionaries and gospel outreach', 'missions', 4),
('Benevolence', 'Helping those in need in our community', 'benevolence', 5),
('Scholarship Fund', 'Supporting students and education', 'scholarship', 6)
ON CONFLICT DO NOTHING;
