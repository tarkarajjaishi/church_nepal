-- Offering Management module.
--
-- Builds on the existing `offerings` + `offering_items` tables rather than
-- replacing them: `offering_items` already stores denomination/count/amount,
-- which is exactly the cash-counting breakdown, so counting sessions reuse it.
--
-- Single church: no branch/campus/tenant columns. Tenancy is one database per
-- church (see backend/src/tenant.rs), so church scoping is already implicit.

-- ---------------------------------------------------------------------------
-- Categories: what the money was given FOR (Tithe, Building Fund, ...)
-- Distinct from `funds`, which is where it is HELD. A category can default to
-- a fund, and fund_allocation_rules can split one category across several.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS offering_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    color VARCHAR(20) NOT NULL DEFAULT '#0b3c5d',
    icon VARCHAR(60) NOT NULL DEFAULT 'HandCoins',
    default_fund_id UUID REFERENCES funds(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
-- Natural key so re-running the seed below is idempotent.
CREATE UNIQUE INDEX IF NOT EXISTS uq_offering_categories_slug ON offering_categories(slug);

-- ---------------------------------------------------------------------------
-- Bank accounts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name VARCHAR(255) NOT NULL,
    account_name VARCHAR(255) NOT NULL DEFAULT '',
    account_number VARCHAR(100) NOT NULL,
    branch VARCHAR(255) NOT NULL DEFAULT '',
    swift_code VARCHAR(50) NOT NULL DEFAULT '',
    currency VARCHAR(10) NOT NULL DEFAULT 'NPR',
    -- Money is stored in minor units (paisa) as BIGINT everywhere in this
    -- schema. Never use floating point for currency.
    opening_balance BIGINT NOT NULL DEFAULT 0,
    current_balance BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_bank_accounts_number
    ON bank_accounts(bank_name, account_number);

-- ---------------------------------------------------------------------------
-- Offerings: enterprise columns.
-- Added rather than recreated so existing rows and the current handlers keep
-- working; every column is nullable or defaulted.
-- ---------------------------------------------------------------------------
ALTER TABLE offerings
    ADD COLUMN IF NOT EXISTS receipt_no       VARCHAR(50),
    ADD COLUMN IF NOT EXISTS category_id      UUID REFERENCES offering_categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS fund_id          UUID REFERENCES funds(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS donor_person_id  UUID REFERENCES people(id) ON DELETE SET NULL,
    -- Free-text donor for walk-in givers who are not people records yet.
    ADD COLUMN IF NOT EXISTS donor_name       VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS is_anonymous     BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS giver_type       VARCHAR(20) NOT NULL DEFAULT 'member',
    ADD COLUMN IF NOT EXISTS service_time     TIME,
    ADD COLUMN IF NOT EXISTS payment_method   VARCHAR(40) NOT NULL DEFAULT 'cash',
    ADD COLUMN IF NOT EXISTS reference_no     VARCHAR(120) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS bank_account_id  UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    -- draft -> submitted -> counted -> approved (or rejected). Enforced in the
    -- handler, not by an enum, so the workflow can be reconfigured per church.
    ADD COLUMN IF NOT EXISTS status           VARCHAR(20) NOT NULL DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS entered_by       VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS approved_by      VARCHAR(255),
    ADD COLUMN IF NOT EXISTS approved_at      TIMESTAMP,
    ADD COLUMN IF NOT EXISTS rejected_reason  TEXT,
    ADD COLUMN IF NOT EXISTS attachments      JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Receipt numbers are unique when present; drafts have none yet.
CREATE UNIQUE INDEX IF NOT EXISTS uq_offerings_receipt_no
    ON offerings(receipt_no) WHERE receipt_no IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_offerings_status         ON offerings(status);
CREATE INDEX IF NOT EXISTS idx_offerings_category       ON offerings(category_id);
CREATE INDEX IF NOT EXISTS idx_offerings_fund           ON offerings(fund_id);
CREATE INDEX IF NOT EXISTS idx_offerings_donor          ON offerings(donor_person_id);
CREATE INDEX IF NOT EXISTS idx_offerings_payment_method ON offerings(payment_method);
-- Dashboard and the offerings table both sort by date within a status.
CREATE INDEX IF NOT EXISTS idx_offerings_status_date    ON offerings(status, service_date DESC);

-- Receipt numbering: a single row holding the counter, incremented inside the
-- same transaction as the insert so two simultaneous submissions cannot claim
-- the same number.
CREATE TABLE IF NOT EXISTS receipt_sequences (
    scope VARCHAR(50) PRIMARY KEY,
    prefix VARCHAR(20) NOT NULL DEFAULT 'RCP',
    next_value BIGINT NOT NULL DEFAULT 1,
    padding INTEGER NOT NULL DEFAULT 5,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
INSERT INTO receipt_sequences (scope, prefix, next_value, padding)
VALUES ('offering', 'RCP', 1, 5)
ON CONFLICT (scope) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Cash counting sessions.
-- The denomination breakdown lives in offering_items; this table records who
-- counted, what the system expected, and the variance.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cash_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offering_id UUID REFERENCES offerings(id) ON DELETE CASCADE,
    count_date DATE NOT NULL DEFAULT CURRENT_DATE,
    service_name VARCHAR(255) NOT NULL DEFAULT '',
    counter_one VARCHAR(255) NOT NULL DEFAULT '',
    counter_two VARCHAR(255) NOT NULL DEFAULT '',
    supervisor VARCHAR(255) NOT NULL DEFAULT '',
    expected_total BIGINT NOT NULL DEFAULT 0,
    counted_total BIGINT NOT NULL DEFAULT 0,
    -- Stored, not derived, so an approved count keeps the variance it was
    -- approved with even if the expected figure is later restated.
    variance BIGINT NOT NULL DEFAULT 0,
    variance_reason TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    -- Once locked the row is immutable; the handler refuses writes.
    is_locked BOOLEAN NOT NULL DEFAULT false,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cash_counts_date ON cash_counts(count_date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_counts_status ON cash_counts(status);

-- Denomination lines for a counting session.
CREATE TABLE IF NOT EXISTS cash_count_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_count_id UUID NOT NULL REFERENCES cash_counts(id) ON DELETE CASCADE,
    -- Face value in minor units; 0 marks the mixed-coins line.
    denomination BIGINT NOT NULL,
    label VARCHAR(40) NOT NULL DEFAULT '',
    quantity INTEGER NOT NULL DEFAULT 0,
    subtotal BIGINT NOT NULL DEFAULT 0,
    counted_by VARCHAR(20) NOT NULL DEFAULT 'one',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cash_count_lines_count ON cash_count_lines(cash_count_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cash_count_lines
    ON cash_count_lines(cash_count_id, denomination, counted_by);

-- ---------------------------------------------------------------------------
-- Deposits
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deposit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    reference_no VARCHAR(120) NOT NULL DEFAULT '',
    amount BIGINT NOT NULL DEFAULT 0,
    slip_url TEXT NOT NULL DEFAULT '',
    deposited_by VARCHAR(255) NOT NULL DEFAULT '',
    verified_by VARCHAR(255),
    verified_at TIMESTAMP,
    -- pending | deposited | verified | rejected | cancelled
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deposits_date ON deposits(deposit_date DESC);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);

-- Which offerings a deposit banks. Many-to-many because one deposit commonly
-- covers several services, and a large offering can be split across deposits.
CREATE TABLE IF NOT EXISTS deposit_offerings (
    deposit_id UUID NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
    offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (deposit_id, offering_id)
);
CREATE INDEX IF NOT EXISTS idx_deposit_offerings_offering ON deposit_offerings(offering_id);

-- ---------------------------------------------------------------------------
-- Fund allocation rules: split a category across funds by percentage.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fund_allocation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES offering_categories(id) ON DELETE CASCADE,
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    -- Basis points (10000 = 100%) so a 33.33% split is exact in integers.
    percentage_bps INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_fund_allocation_rules
    ON fund_allocation_rules(category_id, fund_id);

-- What was actually allocated, per offering. Kept separate from the rules so
-- a manual override on one offering does not rewrite history for others.
CREATE TABLE IF NOT EXISTS offering_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL DEFAULT 0,
    is_manual BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_offering_allocations_offering ON offering_allocations(offering_id);
CREATE INDEX IF NOT EXISTS idx_offering_allocations_fund ON offering_allocations(fund_id);

-- ---------------------------------------------------------------------------
-- Seed the categories from the spec. Slug is the natural key, so this is safe
-- to re-run and safe alongside 059_unique_seed_keys.sql.
-- ---------------------------------------------------------------------------
INSERT INTO offering_categories (name, slug, description, color, icon, sort_order) VALUES
    ('Sunday Offering',   'sunday-offering',   'General Sunday worship offering',        '#0b3c5d', 'Church',        10),
    ('Tithe',             'tithe',             'Ten percent giving',                     '#1f6f8b', 'Percent',       20),
    ('Thanksgiving',      'thanksgiving',      'Thanksgiving and gratitude offerings',   '#d4a017', 'HeartHandshake',30),
    ('Building Fund',     'building-fund',     'Church building and construction',       '#7c3aed', 'Building2',     40),
    ('Mission Fund',      'mission-fund',      'Local and foreign missions',             '#0891b2', 'Globe',         50),
    ('Youth Ministry',    'youth-ministry',    'Youth programmes and events',            '#ea580c', 'Users',         60),
    ('Children Ministry', 'children-ministry', 'Children and Sunday school',             '#16a34a', 'Baby',          70),
    ('Women Fellowship',  'women-fellowship',  'Women fellowship activities',            '#db2777', 'Users',         80),
    ('Men Fellowship',    'men-fellowship',    'Men fellowship activities',              '#2563eb', 'Users',         90),
    ('Love Offering',     'love-offering',     'Love and benevolence offerings',         '#e11d48', 'Heart',        100),
    ('Pastor Support',    'pastor-support',    'Pastoral support and honorarium',        '#0f766e', 'UserCheck',    110),
    ('Charity',           'charity',           'Charitable giving',                      '#65a30d', 'HandHeart',    120),
    ('Emergency Relief',  'emergency-relief',  'Disaster and emergency response',        '#dc2626', 'Siren',        130),
    ('Conference',        'conference',        'Conference and convention offerings',    '#4f46e5', 'Presentation', 140),
    ('Camp',              'camp',              'Camp and retreat offerings',             '#059669', 'Tent',         150),
    ('Christmas Offering','christmas-offering','Christmas season offering',              '#b91c1c', 'Gift',         160),
    ('Easter Offering',   'easter-offering',   'Easter season offering',                 '#7e22ce', 'Sunrise',      170),
    ('Community Outreach','community-outreach','Community service and outreach',         '#0284c7', 'Megaphone',    180)
ON CONFLICT (slug) DO NOTHING;

-- Point each seeded category at the General Fund where one exists, so a fresh
-- install can record an offering without configuring funds first.
UPDATE offering_categories oc
SET default_fund_id = f.id
FROM funds f
WHERE oc.default_fund_id IS NULL
  AND f.fund_type = 'general'
  AND f.is_active = true;
