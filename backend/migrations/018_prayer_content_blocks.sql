-- Prayer page content blocks
-- Migrates hero, form, and prayer wall text/images into CMS-editable content_blocks.

INSERT INTO content_blocks (section_key, title, subtitle, body, image, items, enabled, sort_order)
VALUES
  ('prayer_hero',
   'Prayer Request',
   'Whatever you''re facing, you don''t have to face it alone. Let us pray with you.',
   NULL,
   NULL,
   '[{"image":"","crumb":"Prayer Request"}]'::jsonb,
   TRUE,
   0),
  ('prayer_form',
   'Share Your Request',
   NULL,
   'Every request is kept strictly confidential.',
   NULL,
   '[{"eyebrow":"Confidential","categories":["Healing","Family","Finances","Guidance","Salvation","Thanksgiving","Other"]}]'::jsonb,
   TRUE,
   1),
  ('prayer_wall',
   'Prayer Wall',
   'Stand together with others in prayer.',
   NULL,
   NULL,
   '[{"name":"Anonymous","text":"Please pray for my mother''s health and recovery.","count":34},{"name":"Ramesh","text":"Thanking God for a new job after months of waiting!","count":58},{"name":"Sita","text":"Pray for peace and unity in my family.","count":27}]'::jsonb,
   TRUE,
   2)
ON CONFLICT (section_key) DO NOTHING;
