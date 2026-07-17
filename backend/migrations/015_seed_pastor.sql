-- Seed content blocks for the /pastor page

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('pastor_hero', 'Our Pastor', 'Meet Ps. Bishal Rai — shepherd, teacher and friend.', '[{"image":""}]', true, 0)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, body, enabled, sort_order) VALUES
('pastor_biography', 'Biography', '', 'Ps. Bishal has faithfully served Grace Nepal Church since its earliest days. His heart beats for discipleship, the local church, and the unreached peoples of the Himalayas.', true, 1)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, body, enabled, sort_order) VALUES
('pastor_quote', 'Favorite Scripture', '"For I know the plans I have for you" — Jeremiah 29:11', true, 2)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, items, enabled, sort_order) VALUES
('pastor_social', 'Connect', '[{"platform":"facebook","url":"https://facebook.com/gracenepalchurch"},{"platform":"youtube","url":"https://youtube.com/@gracenepalchurch"},{"platform":"instagram","url":"https://instagram.com/gracenepalchurch"}]', true, 3)
ON CONFLICT (section_key) DO NOTHING;
