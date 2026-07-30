-- Birthday and anniversary for people.
--
-- The church dashboard is meant to surface "Today's Birthdays" and "Today's
-- Anniversaries", but `people` stored neither, so those cards could only ever
-- have been decorative. Adding the columns makes the feature real instead.
--
-- Nullable on purpose: most churches will not have a date of birth for every
-- visitor, and a required field would force bad data in.

ALTER TABLE people
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS anniversary   DATE;

-- "Whose birthday is today" is a month/day match that ignores the year, so a
-- plain index on the date column cannot serve it.
--
-- EXTRACT rather than to_char: to_char(date, text) resolves to the timestamp
-- overload, which is STABLE (it reads DateStyle and lc_time), and Postgres
-- rejects a stable function in an index expression. EXTRACT on a date is
-- immutable, so it can be indexed — and the dashboard query must use the same
-- expression for the index to be used at all.
CREATE INDEX IF NOT EXISTS idx_people_birthday_md
    ON people (EXTRACT(MONTH FROM date_of_birth), EXTRACT(DAY FROM date_of_birth))
    WHERE date_of_birth IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_people_anniversary_md
    ON people (EXTRACT(MONTH FROM anniversary), EXTRACT(DAY FROM anniversary))
    WHERE anniversary IS NOT NULL;

-- Dashboard reads filter on enabled people ordered by join date.
CREATE INDEX IF NOT EXISTS idx_people_enabled_joined
    ON people (enabled, joined_date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_service_date
    ON attendance (service_date DESC);
