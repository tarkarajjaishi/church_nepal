INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('site_brand', 'Grace Nepal Church', 'Faith • Hope • Love', '[{"logo":""}]', true, -2),
('social_links', 'Follow Us', '', '[{"label":"Facebook","url":"https://facebook.com/gracenepalchurch","icon":"Facebook"},{"label":"YouTube","url":"https://youtube.com/@gracenepalchurch","icon":"Youtube"},{"label":"Instagram","url":"https://instagram.com/gracenepalchurch","icon":"Instagram"}]', true, -3)
ON CONFLICT (section_key) DO NOTHING;
