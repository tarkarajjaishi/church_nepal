-- Receipt sends, and the columns recurring giving was missing.

-- ---------------------------------------------------------------------------
-- Who was sent which receipt, and when
-- ---------------------------------------------------------------------------
-- Without this, "was this donor ever sent their receipt?" has no answer, and
-- the honest UI has nothing to show but a blank column. One row per offering:
-- resending replaces the record rather than accumulating, because what matters
-- is whether the donor holds a receipt, not how many times we tried.
CREATE TABLE IF NOT EXISTS offering_receipt_sends (
    offering_id UUID PRIMARY KEY REFERENCES offerings(id) ON DELETE CASCADE,
    sent_to VARCHAR(255) NOT NULL,
    sent_by VARCHAR(255) NOT NULL DEFAULT '',
    sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT offering_receipt_sends_to_not_blank CHECK (sent_to <> '')
);

-- ---------------------------------------------------------------------------
-- Recurring giving
-- ---------------------------------------------------------------------------
-- The table existed with member_id, amount, interval and next_charge_at, which
-- is enough to know that money is expected and nothing about where it should
-- land. A standing order that cannot name its fund is one somebody has to
-- allocate by hand every month.
ALTER TABLE recurring_donations
    ADD COLUMN IF NOT EXISTS fund_id UUID REFERENCES funds(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES offering_categories(id) ON DELETE SET NULL,
    -- For a donor with no person record: a standing order arranged by phone.
    ADD COLUMN IF NOT EXISTS donor_name VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS donor_contact VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '',
    -- Set when a standing order is stopped, so a cancelled one keeps its
    -- history instead of being deleted.
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS started_on DATE NOT NULL DEFAULT CURRENT_DATE,
    -- How many times it has actually been collected, so "expected" and
    -- "received" can be told apart.
    ADD COLUMN IF NOT EXISTS charge_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_charged_at TIMESTAMP;

-- A standing order must name someone. Anonymous recurring giving is not a
-- thing you can chase when it stops arriving.
UPDATE recurring_donations
   SET donor_name = 'Unnamed donor'
 WHERE member_id IS NULL AND btrim(donor_name) = '';

DO $$
BEGIN
    ALTER TABLE recurring_donations
        ADD CONSTRAINT recurring_donations_has_a_donor
        CHECK (member_id IS NOT NULL OR btrim(donor_name) <> '');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- An interval the scheduler does not understand silently never fires.
UPDATE recurring_donations
   SET interval = 'monthly'
 WHERE interval NOT IN ('weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly');

DO $$
BEGIN
    ALTER TABLE recurring_donations
        ADD CONSTRAINT recurring_donations_interval_known
        CHECK (interval IN ('weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Money is never negative here; a refund is its own record.
DO $$
BEGIN
    ALTER TABLE recurring_donations
        ADD CONSTRAINT recurring_donations_amount_positive CHECK (amount > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS ix_recurring_due
    ON recurring_donations(next_charge_at) WHERE active;
