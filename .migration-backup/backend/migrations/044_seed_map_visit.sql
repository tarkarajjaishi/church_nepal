-- Seed the map_visit content block for the homepage map + visit info section

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('map_visit',
 'Plan Your Visit',
 'We would love to welcome you this Sunday. Find us easily and plan your first visit.',
 '[{"address":"Baneshwor, Kathmandu 44600, Nepal","phone":"+977 1-4000000","mapUrl":"https://www.openstreetmap.org/export/embed.html?bbox=85.32%2C27.69%2C85.35%2C27.71&layer=mapnik&marker=27.70%2C85.335"}]'::jsonb,
 true,
 16)
ON CONFLICT (section_key) DO NOTHING;
