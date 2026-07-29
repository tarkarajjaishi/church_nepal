INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('service_times_section', 'Service Times', 'There''s a place for everyone in the family of God. Come as you are.', '[{"eyebrow":"Join Us"}]', true, 10)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('featured_sermons', 'Featured Sermons', '', '[{"eyebrow":"Watch & Listen"}]', true, 100)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('ministries_section', 'Our Ministries', 'Discover a ministry where you can grow, serve and belong.', '[{"eyebrow":"Get Involved"}]', true, 200)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('events_section', 'Upcoming Events', '', '[{"eyebrow":"Mark Your Calendar"}]', true, 300)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('testimonies_section', 'Testimonies', '', '[{"eyebrow":"Stories of Grace"}]', true, 400)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('gallery_section', 'Gallery', '', '[{"eyebrow":"Moments"}]', true, 500)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('verse_section', 'Verse of the Day', '', '[{"eyebrow":""}]', true, 600)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('donation_section', 'Support Our Ministry', 'Your generosity fuels the mission.', '[{"eyebrow":"Give","payment_methods":["eSewa","Khalti","Bank Transfer","QR Code"]}]', true, 700)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('notice_board', 'Church Notices & Announcements', 'Stay up to date with the latest news from Grace Nepal Church.', '[{"eyebrow":"Notice Board","view_all":"View All Events"}]', true, 800)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('church_members', 'Church Members', 'We are one family in Christ.', '[{"eyebrow":"Our Family","become_member":"Become a Member","join_desc":"Join our church family and grow in community, service and worship. Our next New Members Class begins soon.","join_btn":"Join Us","connected_btn":"Get Connected"}]', true, 850)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('floating_buttons', '', '', '[{"whatsapp":"https://wa.me/9771400000","phone":"tel:+97714000000","prayer_label":"Request Prayer","whatsapp_label":"WhatsApp","call_label":"Call us"}]', true, 0)
ON CONFLICT (section_key) DO NOTHING;
