INSERT INTO content_blocks (section_key, title, subtitle, body, image, icon, items, enabled, sort_order) VALUES
('about_cta', 'Visit Us This Sunday', 'We would love to welcome you and your family.', 'Come as you are. Our friendly hospitality team will help you feel right at home from the moment you arrive.', '', 'Heart', '[{"label":"Plan Your Visit","link":"/visit","style":"primary"},{"label":"Contact Us","link":"/contact","style":"outline"}]', true, 5)
ON CONFLICT (section_key) DO NOTHING;
