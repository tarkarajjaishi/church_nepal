-- Volunteer page content blocks
-- CMS-editable blocks for the /volunteer page

INSERT INTO content_blocks (section_key, title, subtitle, body, image, items, enabled, sort_order)
VALUES
  ('volunteer_hero',
   'Volunteer With Us',
   'Use your gifts to make a difference. Join our volunteer family and serve the community.',
   NULL,
   NULL,
   '[{"crumb":"Volunteer"}]'::jsonb,
   TRUE,
   0),
  ('volunteer_form',
   'Volunteer Sign-Up',
   'Tell us about yourself and how you''d like to serve.',
   'We''ve received your volunteer application. Our team will reach out to you soon to discuss how you can serve.',
   NULL,
   '[{"submitLabel":"Submit Volunteer Application","availabilityPlaceholder":"e.g. Sunday mornings, weekday evenings"}]'::jsonb,
   TRUE,
   1)
ON CONFLICT (section_key) DO NOTHING;
