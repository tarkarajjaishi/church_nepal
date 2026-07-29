-- Events page content blocks
-- Migrates hero, heading, error, and empty-state text into CMS-editable content_blocks.

INSERT INTO content_blocks (section_key, title, subtitle, body, image, items, enabled, sort_order)
VALUES
  ('events_hero',
   'Events',
   'Gather, grow and celebrate together. There''s always something happening at Grace.',
   NULL,
   NULL,
   '[{"crumb":"Events"}]'::jsonb,
   TRUE,
   0),
  ('events_heading',
   'Events',
   NULL,
   NULL,
   NULL,
   NULL,
   TRUE,
   1),
  ('events_error',
   'Failed to load events.',
   NULL,
   NULL,
   NULL,
   NULL,
   TRUE,
   2),
  ('events_empty_state',
   'No upcoming events right now — check back soon!',
   NULL,
   NULL,
   NULL,
   NULL,
   TRUE,
   3)
ON CONFLICT (section_key) DO NOTHING;
