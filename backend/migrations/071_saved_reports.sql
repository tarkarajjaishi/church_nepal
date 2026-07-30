-- Saved reports, and schedules that send them.
--
-- A saved report is a report key plus the period and filters you chose,
-- under a name. It is the unit everything else here operates on: you schedule
-- a saved report, you email a saved report, you share a saved report.
--
-- Deliberately absent: a stored copy of the figures.
--
-- The obvious design is to save the numbers so the view opens instantly and
-- always shows what it showed. It is also the design where a treasurer opens
-- "Giving 2026" in December and reads July's total, because the snapshot was
-- taken in July and nothing said so. A saved report stores the *question*;
-- the answer is computed when it is opened, from the records as they are now.
--
-- The period is stored as an offset, not as two dates, for the same reason.
-- "This month" saved in July must still mean this month in December — a
-- schedule that emails a fixed 1–31 July window every Monday for a year is
-- not a report, it is a stuck clock.

CREATE TABLE IF NOT EXISTS saved_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    -- Matches a key in the REPORTS catalogue in src/handlers/reports.rs. Not
    -- a foreign key: the catalogue lives in the binary, because a permission
    -- and a query only exist if code implements them.
    report_key VARCHAR(80) NOT NULL,

    -- One of the named ranges (this_month, last_month, last_3_months,
    -- this_year, last_year, last_12_months) or 'custom'.
    period VARCHAR(40) NOT NULL DEFAULT 'this_month',
    -- Only read when period = 'custom'.
    custom_from DATE,
    custom_to DATE,

    -- Column keys to show, in order. Empty means the report's own default
    -- set, so a saved view does not silently freeze the column list against
    -- a report that later gains one.
    columns TEXT[] NOT NULL DEFAULT '{}',
    -- Row filters as [{column, op, value}], applied after the report runs.
    filters JSONB NOT NULL DEFAULT '[]',
    sort_column VARCHAR(80) NOT NULL DEFAULT '',
    sort_desc BOOLEAN NOT NULL DEFAULT false,

    -- Visible to everyone who can run the underlying report, or only to the
    -- person who made it. Never wider than the report's own permission —
    -- sharing a view cannot share data the viewer may not see.
    is_shared BOOLEAN NOT NULL DEFAULT true,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT saved_reports_period_valid CHECK (
        period IN ('this_month','last_month','last_3_months','this_year',
                   'last_year','last_12_months','custom')),
    CONSTRAINT saved_reports_custom_has_dates CHECK (
        period <> 'custom' OR (custom_from IS NOT NULL AND custom_to IS NOT NULL)),
    CONSTRAINT saved_reports_custom_ordered CHECK (
        custom_from IS NULL OR custom_to IS NULL OR custom_from <= custom_to)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_reports_name ON saved_reports(lower(name));
CREATE INDEX IF NOT EXISTS ix_saved_reports_key ON saved_reports(report_key);

-- ---------------------------------------------------------------------------
-- Schedules
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saved_report_id UUID NOT NULL REFERENCES saved_reports(id) ON DELETE CASCADE,
    frequency VARCHAR(20) NOT NULL DEFAULT 'weekly',
    -- 0 = Sunday. Read for weekly only.
    day_of_week INTEGER NOT NULL DEFAULT 1,
    -- Read for monthly only. 1..28, so February always has one.
    day_of_month INTEGER NOT NULL DEFAULT 1,
    -- Local hour to send at, 0..23.
    hour INTEGER NOT NULL DEFAULT 7,

    recipients TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- When it is next due. Advanced *before* the send is attempted, so a
    -- failing send retries on the next cycle rather than every 60 seconds
    -- forever — and a report nobody can generate does not become a mail loop.
    next_run_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_run_at TIMESTAMP,
    last_status VARCHAR(40) NOT NULL DEFAULT '',
    last_error TEXT NOT NULL DEFAULT '',
    run_count INTEGER NOT NULL DEFAULT 0,

    created_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT report_schedules_frequency CHECK (frequency IN ('daily','weekly','monthly')),
    CONSTRAINT report_schedules_day_of_week CHECK (day_of_week BETWEEN 0 AND 6),
    CONSTRAINT report_schedules_day_of_month CHECK (day_of_month BETWEEN 1 AND 28),
    CONSTRAINT report_schedules_hour CHECK (hour BETWEEN 0 AND 23),
    -- A schedule with nobody to send to is a background job that burns a
    -- report generation every week and delivers it nowhere.
    CONSTRAINT report_schedules_has_recipients CHECK (
        NOT is_active OR recipients <> '')
);
CREATE INDEX IF NOT EXISTS ix_report_schedules_due
    ON report_schedules(next_run_at) WHERE is_active;

-- ---------------------------------------------------------------------------
-- Delivery log
-- ---------------------------------------------------------------------------
-- Without this, "did the treasurer get last Monday's report?" has no answer
-- and the only evidence is somebody's inbox.
CREATE TABLE IF NOT EXISTS report_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES report_schedules(id) ON DELETE SET NULL,
    saved_report_id UUID REFERENCES saved_reports(id) ON DELETE SET NULL,
    report_name VARCHAR(200) NOT NULL DEFAULT '',
    recipients TEXT NOT NULL DEFAULT '',
    status VARCHAR(40) NOT NULL DEFAULT 'sent',
    error TEXT NOT NULL DEFAULT '',
    period_from DATE,
    period_to DATE,
    row_count INTEGER NOT NULL DEFAULT 0,
    sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_report_deliveries_sent ON report_deliveries(sent_at DESC);
