-- Ministries page content blocks
-- Migrates hero and section heading/filter text into CMS-editable content_blocks.

INSERT INTO content_blocks (section_key, title, subtitle, body, image, items, enabled, sort_order)
VALUES
  ('ministries_hero',
   'Our Ministries',
   'However God has gifted you, there is a place to serve, grow and belong.',
   NULL,
   NULL,
   '[{"crumb":"Ministries"}]'::jsonb,
   TRUE,
   0),
  ('ministries_heading',
   'Find Your Place',
   NULL,
   NULL,
   NULL,
   '[{"eyebrow":"Get Involved","filters":["All","Children & Youth","Fellowship","Worship & Media","Outreach & Mission","Prayer & Teaching"]}]'::jsonb,
   TRUE,
   1),
  ('ministries_error',
   'Failed to load ministries.',
   NULL,
   NULL,
   NULL,
   NULL,
   TRUE,
   2),
  ('ministries_cta',
   'Join Ministry',
   NULL,
   NULL,
   NULL,
   NULL,
   TRUE,
   3)
ON CONFLICT (section_key) DO NOTHING;
