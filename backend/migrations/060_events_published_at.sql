-- 052_content_scheduling.sql added published_at to blog_posts, notices and
-- sermons but missed events, while models::ChurchEvent and the events handlers
-- were written to expect it. The result: GET /api/events returned
-- `no column found for name: published_at` for every tenant, so the public
-- events page and the homepage events section could never load.

ALTER TABLE events ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_events_published_at ON events(published_at);
