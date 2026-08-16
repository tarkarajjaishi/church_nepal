-- Where a church actually is.
--
-- The directory could list churches but not group them, so "Churches in
-- Pokhara" was a page with nothing true to put on it. City is the column that
-- unblocks the location pages; district and province are stored alongside it
-- because Nepal's addressing is three levels and deriving one from another
-- would mean hardcoding a gazetteer in the app.
--
-- All nullable: existing churches have no location recorded, and a church with
-- an unknown city must be listable without inventing one for it.
ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS city     text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS province text;

-- The directory's hot path is "active churches in city X", ordered by name.
CREATE INDEX IF NOT EXISTS idx_churches_city
  ON churches (lower(city))
  WHERE status = 'active';
