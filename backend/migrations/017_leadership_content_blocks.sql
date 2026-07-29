-- Leadership page content blocks (Phase 0.2)
-- Migrates hero and team section text/images into CMS-editable content_blocks.

INSERT INTO content_blocks (section_key, title, subtitle, body, image, items, enabled, sort_order)
VALUES
  ('leadership_hero',
   'Our Leadership Team',
   'Meet the dedicated servants who guide our church family',
   NULL,
   'https://images.unsplash.com/photo-1609234656388-0ff363383899?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
   NULL,
   TRUE,
   0),
  ('leadership_team',
   'Leadership Team',
   NULL,
   'Meet the dedicated servants who guide our church family with wisdom, compassion, and faithfulness.',
   NULL,
   '[{"category":"All","heading":"Leadership Team"}]'::jsonb,
   TRUE,
   1)
ON CONFLICT (section_key) DO NOTHING;
