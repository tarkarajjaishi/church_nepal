-- Seed the announcement_bar content block (used by AnnouncementBar component)
-- Links to the announcement settings seeded in 002_seed.sql

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('announcement_bar',
 'Sunday service live at 10:00 AM (NPT) — everyone is welcome!',
 NULL,
 '[{"link":"/events"}]'::jsonb,
 true,
 -10)
ON CONFLICT (section_key) DO NOTHING;
