-- The tables behind the thirteen console pages that had nothing under them.
--
-- Storage, retention and operations are deliberately absent here: they are
-- read models over churches, sessions and Postgres' own statistics, and a
-- stored copy would start lying the moment anything moved.

-- ---------------------------------------------------------------------------
-- Feature flags
-- ---------------------------------------------------------------------------
-- A flag needs to name who turned it on and when, or the first question after
-- an incident ("who enabled this?") has no answer.
CREATE TABLE IF NOT EXISTS feature_flags (
    key             VARCHAR(80) PRIMARY KEY,
    description     TEXT NOT NULL DEFAULT '',
    enabled         BOOLEAN NOT NULL DEFAULT FALSE,
    -- 0-100. Applies only when `enabled`; a flag that is off is off for
    -- everyone regardless of the percentage.
    rollout_percent INTEGER NOT NULL DEFAULT 100,
    -- Named churches always get it, whatever the percentage says. This is how
    -- a feature reaches one willing church before it reaches everybody.
    church_slugs    TEXT[] NOT NULL DEFAULT '{}',
    updated_by      VARCHAR(255) NOT NULL DEFAULT '',
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT feature_flags_rollout_range CHECK (rollout_percent BETWEEN 0 AND 100)
);

INSERT INTO feature_flags (key, description, enabled) VALUES
    ('presentation_live', 'Live worship presentation and display output', TRUE),
    ('helpdesk_public',   'Public fault reporting without an account', TRUE),
    ('offering_deposits', 'Bank deposit reconciliation in Offering Management', TRUE),
    ('library',           'Church library: catalogue, loans and holds', TRUE),
    ('recurring_giving',  'Standing orders and scheduled gifts', FALSE)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Outbound webhooks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url         TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    -- Which events this endpoint wants. Empty means every event, which is a
    -- decision worth making explicitly rather than by omission.
    events      TEXT[] NOT NULL DEFAULT '{}',
    -- Signing secret. A receiver that cannot verify origin will eventually
    -- accept a forged payload.
    secret      VARCHAR(80) NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT webhook_endpoints_url_is_https
        CHECK (url LIKE 'https://%' OR url LIKE 'http://localhost%')
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id          BIGSERIAL PRIMARY KEY,
    endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    event       VARCHAR(80) NOT NULL,
    payload     JSONB NOT NULL DEFAULT '{}',
    status_code INTEGER,
    error       TEXT NOT NULL DEFAULT '',
    attempt     INTEGER NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_webhook_deliveries_endpoint
    ON webhook_deliveries(endpoint_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Email templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_templates (
    key         VARCHAR(80) PRIMARY KEY,
    name        VARCHAR(160) NOT NULL,
    subject     TEXT NOT NULL,
    body        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    -- The substitutions this template understands, so the editor can list them
    -- rather than leaving someone to guess and ship {{chruch_name}}.
    variables   TEXT[] NOT NULL DEFAULT '{}',
    updated_by  VARCHAR(255) NOT NULL DEFAULT '',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO email_templates (key, name, subject, body, description, variables) VALUES
    ('church_welcome', 'Welcome a new church',
     'Your church website is ready',
     E'Hello {{admin_name}},\n\nYour site for {{church_name}} is live at {{site_url}}.\n\nSign in at {{admin_url}} to add your service times and your first sermon.\n\nChurchNepal',
     'Sent once, when provisioning finishes.',
     ARRAY['church_name','admin_name','site_url','admin_url']),
    ('invoice_paid', 'Invoice paid',
     'Receipt for {{church_name}}',
     E'Thank you — we have received {{amount}} for {{plan}}.\n\nYour next payment is due {{next_due}}.\n\nChurchNepal',
     'Sent when a payment succeeds.',
     ARRAY['church_name','amount','plan','next_due']),
    ('payment_failed', 'Payment failed',
     'We could not take payment for {{church_name}}',
     E'We tried to charge {{amount}} for {{plan}} and it did not go through.\n\nUpdate your card at {{billing_url}}. Your site stays online for {{grace_days}} days.\n\nChurchNepal',
     'Sent on a failed charge, before any suspension.',
     ARRAY['church_name','amount','plan','billing_url','grace_days']),
    ('church_suspended', 'Church suspended',
     '{{church_name}} has been suspended',
     E'{{church_name}} is no longer serving.\n\nReason: {{reason}}\n\nReactivate at {{billing_url}}.\n\nChurchNepal',
     'Sent when a site is taken offline.',
     ARRAY['church_name','reason','billing_url'])
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Coupons
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
    code             VARCHAR(40) PRIMARY KEY,
    description      TEXT NOT NULL DEFAULT '',
    -- 'percent' off the plan price, or 'amount' off in paisa.
    kind             VARCHAR(10) NOT NULL,
    value            BIGINT NOT NULL,
    -- How many months the discount lasts. NULL means forever, which is a
    -- promise worth having to type deliberately.
    duration_months  INTEGER,
    max_redemptions  INTEGER,
    expires_at       TIMESTAMPTZ,
    active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_by       VARCHAR(255) NOT NULL DEFAULT '',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT coupons_kind_known CHECK (kind IN ('percent','amount')),
    CONSTRAINT coupons_value_positive CHECK (value > 0),
    -- A percentage over 100 would pay the church to exist.
    CONSTRAINT coupons_percent_sane CHECK (kind <> 'percent' OR value <= 100)
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
    coupon_code VARCHAR(40) NOT NULL REFERENCES coupons(code) ON DELETE CASCADE,
    church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- One church cannot redeem the same coupon twice.
    PRIMARY KEY (coupon_code, church_id)
);

-- ---------------------------------------------------------------------------
-- Broadcasts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS broadcasts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject    TEXT NOT NULL,
    body       TEXT NOT NULL,
    -- 'all', a plan name, or a status. Resolved to real recipients at send
    -- time, not stored as a list, so a church added tomorrow is not silently
    -- included in something addressed yesterday.
    audience   VARCHAR(40) NOT NULL DEFAULT 'all',
    status     VARCHAR(20) NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    sent_at    TIMESTAMPTZ,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT broadcasts_status_known
        CHECK (status IN ('draft','scheduled','sending','sent','failed')),
    CONSTRAINT broadcasts_subject_not_blank CHECK (btrim(subject) <> '')
);

CREATE TABLE IF NOT EXISTS broadcast_recipients (
    id           BIGSERIAL PRIMARY KEY,
    broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
    church_id    UUID REFERENCES churches(id) ON DELETE SET NULL,
    email        VARCHAR(255) NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'pending',
    error        TEXT NOT NULL DEFAULT '',
    sent_at      TIMESTAMPTZ,
    opened_at    TIMESTAMPTZ,
    UNIQUE (broadcast_id, email)
);

-- ---------------------------------------------------------------------------
-- Control-plane roles
-- ---------------------------------------------------------------------------
-- `admins.role` is already text; this gives those names a meaning that can be
-- read and changed rather than being hard-coded in the extractor.
CREATE TABLE IF NOT EXISTS control_roles (
    name        VARCHAR(40) PRIMARY KEY,
    description TEXT NOT NULL DEFAULT '',
    permissions TEXT[] NOT NULL DEFAULT '{}',
    -- A built-in role cannot be deleted: removing 'super_admin' would leave
    -- nobody able to grant it back.
    is_builtin  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO control_roles (name, description, permissions, is_builtin) VALUES
    ('super_admin', 'Everything, including managing other administrators',
     ARRAY['churches.manage','billing.manage','admins.manage','settings.manage',
           'flags.manage','broadcasts.send','reports.view','ops.view'], TRUE),
    ('admin', 'Day-to-day platform operation, but not other administrators',
     ARRAY['churches.manage','billing.manage','settings.manage','reports.view','ops.view'], TRUE),
    ('support', 'Read-only, for answering questions',
     ARRAY['churches.view','reports.view'], FALSE)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Backup runs
-- ---------------------------------------------------------------------------
-- The record of what was taken and whether it worked. "We have backups" is
-- only true if a restore has been tried, so a restore is a run like any other.
CREATE TABLE IF NOT EXISTS backup_runs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_slug  VARCHAR(120),
    kind         VARCHAR(20) NOT NULL DEFAULT 'backup',
    status       VARCHAR(20) NOT NULL DEFAULT 'running',
    size_bytes   BIGINT NOT NULL DEFAULT 0,
    path         TEXT NOT NULL DEFAULT '',
    error        TEXT NOT NULL DEFAULT '',
    started_by   VARCHAR(255) NOT NULL DEFAULT '',
    started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at  TIMESTAMPTZ,
    CONSTRAINT backup_runs_kind_known CHECK (kind IN ('backup','restore','drill')),
    CONSTRAINT backup_runs_status_known CHECK (status IN ('running','ok','failed'))
);
CREATE INDEX IF NOT EXISTS ix_backup_runs_recent ON backup_runs(started_at DESC);
