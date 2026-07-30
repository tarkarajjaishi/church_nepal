-- Help desk: public submission, attachments, watchers, merge and satisfaction.
--
-- The gap this closes: until now a ticket could only be raised from inside the
-- admin panel. The person who notices the broken tap is almost never the
-- person with a login, so every report went through somebody relaying it — and
-- what does not get relayed does not get fixed.

-- ---------------------------------------------------------------------------
-- Public tracking
-- ---------------------------------------------------------------------------
ALTER TABLE helpdesk_tickets
    -- Given to whoever raised the ticket so they can follow it without an
    -- account. Random and unguessable rather than the ticket code, which is
    -- sequential: HD-00042 would let anyone read HD-00041.
    ADD COLUMN IF NOT EXISTS public_token VARCHAR(64) NOT NULL DEFAULT '',
    -- Where it came from. A ticket raised by a stranger at 2am is triaged
    -- differently from one an administrator typed, and after the fact there is
    -- no other way to tell.
    ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'staff',
    -- Set when this ticket was folded into another as a duplicate. The row
    -- stays: two people reported the same fault, and deleting one loses the
    -- fact that two people cared.
    ADD COLUMN IF NOT EXISTS merged_into UUID REFERENCES helpdesk_tickets(id) ON DELETE SET NULL,
    -- 1..5, set by the reporter after it is resolved. NULL means not asked or
    -- not answered — never 0, which would drag every average down.
    ADD COLUMN IF NOT EXISTS satisfaction INTEGER,
    ADD COLUMN IF NOT EXISTS satisfaction_note TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS satisfaction_at TIMESTAMP,
    -- Set once when the SLA breach notification goes out, so a breached ticket
    -- generates one email rather than one every minute until it is fixed.
    ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP;

DO $$ BEGIN
    ALTER TABLE helpdesk_tickets
        ADD CONSTRAINT helpdesk_tickets_source
        CHECK (source IN ('staff', 'public', 'email'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE helpdesk_tickets
        ADD CONSTRAINT helpdesk_tickets_satisfaction_range
        CHECK (satisfaction IS NULL OR satisfaction BETWEEN 1 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE helpdesk_tickets
        ADD CONSTRAINT helpdesk_tickets_not_merged_into_itself
        CHECK (merged_into IS NULL OR merged_into <> id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Unique so a token cannot collide, partial so the empty default on every
-- staff-raised ticket does not collide with itself.
CREATE UNIQUE INDEX IF NOT EXISTS uq_helpdesk_public_token
    ON helpdesk_tickets(public_token) WHERE public_token <> '';

-- Backfill: existing tickets get a token so they can be tracked too. Built
-- from gen_random_uuid() twice — 256 bits, not a counter.
UPDATE helpdesk_tickets
SET public_token = replace(gen_random_uuid()::text, '-', '')
                || replace(gen_random_uuid()::text, '-', '')
WHERE public_token = '';

-- ---------------------------------------------------------------------------
-- Watchers
-- ---------------------------------------------------------------------------
-- The reporter and the assignee are on the ticket itself. This is everyone
-- else who wants to know: the pastor who asked about it, the volunteer who
-- will cover the service if it is not fixed.
CREATE TABLE IF NOT EXISTS helpdesk_watchers (
    ticket_id UUID NOT NULL REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT '',
    added_by VARCHAR(255) NOT NULL DEFAULT '',
    added_at TIMESTAMP NOT NULL DEFAULT NOW(),
    -- Lowercased, so the same person added twice with different capitalisation
    -- does not receive two copies of everything.
    PRIMARY KEY (ticket_id, email)
);

-- ---------------------------------------------------------------------------
-- Attachments
-- ---------------------------------------------------------------------------
-- A photo of the fault says more than three paragraphs describing it.
CREATE TABLE IF NOT EXISTS helpdesk_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
    -- Which message it belongs to, when it came in with a reply rather than
    -- with the original report.
    comment_id UUID REFERENCES helpdesk_comments(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    filename VARCHAR(255) NOT NULL DEFAULT '',
    content_type VARCHAR(120) NOT NULL DEFAULT '',
    size_bytes BIGINT NOT NULL DEFAULT 0,
    uploaded_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT helpdesk_attachments_url_not_blank CHECK (url <> '')
);
CREATE INDEX IF NOT EXISTS ix_helpdesk_attachments_ticket
    ON helpdesk_attachments(ticket_id);

-- ---------------------------------------------------------------------------
-- Canned replies
-- ---------------------------------------------------------------------------
-- The same five answers cover most of what a church help desk is asked. A
-- volunteer on the rota should not have to compose them from scratch at 08:30
-- on a Sunday.
CREATE TABLE IF NOT EXISTS helpdesk_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    category_id UUID REFERENCES helpdesk_categories(id) ON DELETE SET NULL,
    use_count INTEGER NOT NULL DEFAULT 0,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT helpdesk_replies_body_not_blank CHECK (body <> '')
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_helpdesk_replies_title
    ON helpdesk_replies(lower(title));

INSERT INTO helpdesk_replies (title, body) VALUES
    ('Received, looking into it',
     'Thanks for letting us know. We have logged this and someone will look at it shortly. We will update you here when there is news.'),
    ('Need a bit more detail',
     'Thanks for reporting this. Could you tell us a little more — when it happens, and whether it happens every time? A photo helps if you can take one.'),
    ('Fixed, please check',
     'This should now be sorted. Please have a look next time you are in and tell us if anything is still not right.'),
    ('Waiting on a part',
     'We have looked at this and need a part before it can be fixed. We will come back to you as soon as it arrives.'),
    ('Working as intended',
     'Thanks for flagging this. Having checked, it is behaving the way it is meant to — but do tell us if it causes trouble in practice.')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Notification log
-- ---------------------------------------------------------------------------
-- Without it, "was the reporter ever told it was fixed?" has no answer. Also
-- the guard against sending the same notification twice.
CREATE TABLE IF NOT EXISTS helpdesk_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
    kind VARCHAR(40) NOT NULL,
    recipients TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'sent',
    error TEXT NOT NULL DEFAULT '',
    sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_helpdesk_notifications_ticket
    ON helpdesk_notifications(ticket_id, sent_at DESC);
