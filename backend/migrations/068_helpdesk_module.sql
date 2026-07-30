-- Help Desk module.
--
-- Deliberately absent: an `assigned_to` column that anyone may overwrite.
--
-- Two volunteers both press "Assign to me" on the same ticket, both writes
-- succeed, and the second silently wins — so one of them keeps working on a
-- ticket that is no longer theirs, and nobody sees a conflict. Claiming is an
-- `UPDATE ... WHERE assignee_name = ''` instead: the loser's statement matches
-- zero rows and the handler can say so. Reassignment is a separate, explicit
-- act, not an accident of two clicks landing together.
--
-- Also deliberately absent: any stored "age", "time to first response" or
-- "SLA breached" column. Those are functions of the clock, and a stored copy
-- is wrong the moment it is written. They are computed on read from the
-- timestamps below.
--
-- `first_responded_at` is the one timestamp that must never be rewritten: a
-- response time recomputed on every later comment would drift towards zero
-- and every SLA report would flatter the team. It is set once, by a
-- conditional update that only fires when it is still NULL.

-- ---------------------------------------------------------------------------
-- Categories — what kind of problem this is
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS helpdesk_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(160) NOT NULL,
    slug VARCHAR(160) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    icon VARCHAR(60) NOT NULL DEFAULT 'LifeBuoy',
    color VARCHAR(20) NOT NULL DEFAULT '#0b3c5d',
    -- Hours the team aims to respond in. Per category because a dead sound
    -- desk on Sunday morning is not the same urgency as a spare key request.
    response_hours INTEGER NOT NULL DEFAULT 24,
    resolve_hours INTEGER NOT NULL DEFAULT 72,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT helpdesk_categories_sla_positive
        CHECK (response_hours > 0 AND resolve_hours > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_helpdesk_categories_slug ON helpdesk_categories(slug);

-- ---------------------------------------------------------------------------
-- Tickets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS helpdesk_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Human-readable, gapless, allocated under a row lock. People quote these
    -- to each other in corridors; a UUID is useless for that.
    ticket_code VARCHAR(40) NOT NULL,
    subject VARCHAR(300) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    category_id UUID REFERENCES helpdesk_categories(id) ON DELETE SET NULL,

    -- Who raised it. person_id when they are on file, plain text when a
    -- visitor reports a broken tap and is never seen again.
    person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    reporter_name VARCHAR(255) NOT NULL DEFAULT '',
    reporter_contact VARCHAR(255) NOT NULL DEFAULT '',

    -- Optional link to the thing that is broken. SET NULL, not CASCADE:
    -- removing a projector must not delete the history of why it kept failing.
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    location VARCHAR(255) NOT NULL DEFAULT '',

    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    status VARCHAR(30) NOT NULL DEFAULT 'open',

    -- '' means unclaimed. See the header: claiming is a conditional UPDATE
    -- against this, which is why it is NOT NULL DEFAULT '' rather than NULL.
    assignee_name VARCHAR(255) NOT NULL DEFAULT '',
    assignee_contact VARCHAR(255) NOT NULL DEFAULT '',

    opened_at TIMESTAMP NOT NULL DEFAULT NOW(),
    -- Write-once. Never recomputed from later activity.
    first_responded_at TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    due_at TIMESTAMP,

    resolution TEXT NOT NULL DEFAULT '',
    -- Set when a closed ticket is opened again. A ticket that keeps coming
    -- back is the signal that the fix never worked.
    reopen_count INTEGER NOT NULL DEFAULT 0,

    created_by VARCHAR(255) NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT helpdesk_tickets_priority
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    CONSTRAINT helpdesk_tickets_status
        CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed', 'cancelled')),
    -- A resolved ticket with no resolution text is how "we fixed it, no idea
    -- how" gets into the record, and it is exactly the ticket that comes back
    -- in six months. Refuse it at the database.
    --
    -- Only 'resolved' is constrained: 'closed' is a filing action that may
    -- follow a resolution or a cancellation, and 'cancelled' means it never
    -- needed fixing.
    CONSTRAINT helpdesk_tickets_resolved_is_complete
        CHECK (status <> 'resolved' OR (resolution <> '' AND resolved_at IS NOT NULL)),
    CONSTRAINT helpdesk_tickets_closed_has_time
        CHECK (status <> 'closed' OR closed_at IS NOT NULL),
    CONSTRAINT helpdesk_tickets_resolved_after_opened
        CHECK (resolved_at IS NULL OR resolved_at >= opened_at),
    CONSTRAINT helpdesk_tickets_responded_after_opened
        CHECK (first_responded_at IS NULL OR first_responded_at >= opened_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_helpdesk_ticket_code ON helpdesk_tickets(ticket_code);
CREATE INDEX IF NOT EXISTS ix_helpdesk_tickets_status ON helpdesk_tickets(status);
CREATE INDEX IF NOT EXISTS ix_helpdesk_tickets_open ON helpdesk_tickets(opened_at DESC);
CREATE INDEX IF NOT EXISTS ix_helpdesk_tickets_assignee ON helpdesk_tickets(lower(assignee_name));
CREATE INDEX IF NOT EXISTS ix_helpdesk_tickets_asset ON helpdesk_tickets(asset_id);

INSERT INTO receipt_sequences (scope, prefix, next_value, padding)
VALUES ('helpdesk_ticket', 'HD', 1, 5)
ON CONFLICT (scope) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Comments — the conversation, and the audit trail of what changed
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS helpdesk_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL DEFAULT '',
    body TEXT NOT NULL,
    -- An internal note is for the team; the reporter never sees it. Kept in
    -- the same thread so the order of events survives.
    is_internal BOOLEAN NOT NULL DEFAULT false,
    -- Set for rows the system wrote (status changes, assignment) rather than
    -- a person typing. Renders differently and never counts as a response.
    event_kind VARCHAR(40) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT helpdesk_comments_body_not_blank CHECK (body <> '')
);
CREATE INDEX IF NOT EXISTS ix_helpdesk_comments_ticket
    ON helpdesk_comments(ticket_id, created_at);

-- ---------------------------------------------------------------------------
-- Knowledge base — the answers that stop tickets being raised at all
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS helpdesk_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    category_id UUID REFERENCES helpdesk_categories(id) ON DELETE SET NULL,
    keywords TEXT NOT NULL DEFAULT '',
    is_published BOOLEAN NOT NULL DEFAULT true,
    view_count INTEGER NOT NULL DEFAULT 0,
    helpful_count INTEGER NOT NULL DEFAULT 0,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_helpdesk_articles_slug ON helpdesk_articles(slug);

-- ---------------------------------------------------------------------------
-- Seed categories
-- ---------------------------------------------------------------------------
INSERT INTO helpdesk_categories (name, slug, description, icon, color, response_hours, resolve_hours, sort_order)
VALUES
    ('Sound & Audio',      'sound-audio',      'Microphones, mixer, speakers, feedback',        'Mic',        '#c94f4f',  2,  8,  1),
    ('Projection & Slides','projection',       'Projector, screens, slide software',            'MonitorPlay','#0b3c5d',  2,  8,  2),
    ('Livestream',         'livestream',       'Camera, encoder, streaming platform',           'Video',      '#6b4fc9',  2,  8,  3),
    ('Building & Facility','building',         'Doors, plumbing, electrics, cleaning',          'Building2',  '#8a6d3b', 24, 72,  4),
    ('IT & Network',       'it-network',       'Wifi, computers, printers, accounts',           'Wifi',       '#2f7d63', 12, 48,  5),
    ('Instruments',        'instruments',      'Keyboard, guitars, drums, cables',              'Music',      '#c98f4f', 12, 48,  6),
    ('Website & Email',    'website-email',    'Church site, email accounts, forms',            'Globe',      '#3b6ea5', 24, 96,  7),
    ('Safety & Security',  'safety',           'Fire equipment, locks, first aid, incidents',   'ShieldAlert','#a33b3b',  1,  8,  8),
    ('Transport',          'transport',        'Church van, parking, driver requests',          'Bus',        '#4f7dc9', 24, 72,  9),
    ('Volunteer Support',  'volunteer-support','Rota problems, training, access requests',      'HandHelping','#2f7d63', 24, 96, 10),
    ('Finance & Admin',    'finance-admin',    'Reimbursements, invoices, records',             'Receipt',    '#6b7280', 48, 120, 11),
    ('Other',              'other',            'Anything that fits nowhere else',               'HelpCircle', '#6b7280', 24, 96, 99)
ON CONFLICT (slug) DO NOTHING;
