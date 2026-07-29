-- Make the seed idempotent.
--
-- 002_seed.sql / 003_more_seed.sql already end every INSERT with
-- `ON CONFLICT DO NOTHING`, but a bare ON CONFLICT only fires when an actual
-- unique constraint is violated. These tables had none, so re-running the seed
-- silently doubled every row (service_times 7->14, sermons 12->24, ...).
-- `settings` was the only table that stayed clean, because it alone had
-- `ON CONFLICT (key)` backed by a unique key.
--
-- Adding the natural keys below makes the existing guards do what they say.
-- Deduplicate first so the index creation cannot fail on legacy data.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['service_times','ministries','verses','notices','gallery',
                           'testimonies','campaigns','leaders','events','sermons','members']
  LOOP
    EXECUTE format(
      'DELETE FROM %I a WHERE EXISTS (SELECT 1 FROM %I b WHERE b.ctid < a.ctid
         AND (to_jsonb(b) - ''id'' - ''created_at'' - ''updated_at'')
           = (to_jsonb(a) - ''id'' - ''created_at'' - ''updated_at''))', t, t);
  END LOOP;
END $$;

-- Near-duplicate: the same verse seeded twice, then one copy pinned in the
-- admin. Exact-match dedupe above can't see it, so collapse by reference and
-- keep the pinned copy (falling back to the earliest row).
DELETE FROM verses a
WHERE EXISTS (
  SELECT 1 FROM verses b
  WHERE b.ref_text = a.ref_text
    AND b.id <> a.id
    AND (b.is_pinned, b.created_at) > (a.is_pinned, a.created_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS service_times_natural_key ON service_times (name, day, time);
CREATE UNIQUE INDEX IF NOT EXISTS ministries_natural_key    ON ministries (name);
CREATE UNIQUE INDEX IF NOT EXISTS verses_natural_key        ON verses (ref_text);
CREATE UNIQUE INDEX IF NOT EXISTS notices_natural_key       ON notices (title, date);
CREATE UNIQUE INDEX IF NOT EXISTS gallery_natural_key       ON gallery (title, image);
CREATE UNIQUE INDEX IF NOT EXISTS testimonies_natural_key   ON testimonies (name, quote);
CREATE UNIQUE INDEX IF NOT EXISTS campaigns_natural_key     ON campaigns (title);
CREATE UNIQUE INDEX IF NOT EXISTS leaders_natural_key       ON leaders (name, role);
CREATE UNIQUE INDEX IF NOT EXISTS events_natural_key        ON events (title, date);
CREATE UNIQUE INDEX IF NOT EXISTS sermons_natural_key       ON sermons (title, date);
CREATE UNIQUE INDEX IF NOT EXISTS members_natural_key       ON members (name, role);
