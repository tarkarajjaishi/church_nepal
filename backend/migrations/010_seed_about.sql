INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('about_hero', 'About Our Church', 'A Christ-centred family growing in faith, hope and love since 2008.', '[{"image":""}]', true, 0)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('about_history', 'Church History', 'What began as a handful of families praying together has grown into a vibrant community of hundreds. Through every season, God has been faithful — and our story is still being written.', '[{"image":"","timeline":[{"year":"2008","title":"Humble Beginnings","text":"The church began as a small prayer group of seven families in a Kathmandu living room."},{"year":"2012","title":"First Sanctuary","text":"God provided our first dedicated worship space as the congregation grew to over 100."},{"year":"2017","title":"Mission Expansion","text":"We planted our first village fellowship and launched the Bible school."},{"year":"2022","title":"A Growing Family","text":"Crossed 800 members with twelve thriving ministries serving the city and beyond."},{"year":"2026","title":"Reaching Every Village","text":"Today we continue our vision to bring hope to every corner of Nepal."}]}]', true, 1)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('about_mission', 'Mission & Vision', '', '[{"title":"Our Mission","desc":"To make disciples of Jesus Christ who love God, love one another, and reach Nepal with the gospel.","icon":"Target"},{"title":"Our Vision","desc":"A transformed nation where every village has a thriving community of believers.","icon":"Eye"},{"title":"Our Values","desc":"Faith, love, humility, generosity and unwavering hope in Christ alone.","icon":"Heart"}]', true, 2)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('about_values', 'Core Values', '', '[{"title":"Love","desc":"We love God and love people as Christ loved us.","icon":"Heart"},{"title":"Truth","desc":"We are grounded in the authority of Scripture.","icon":"CheckCircle2"},{"title":"Mission","desc":"We exist to make disciples across Nepal.","icon":"Target"},{"title":"Community","desc":"We do life together as one family in Christ.","icon":"Eye"}]', true, 3)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('about_faq', 'Frequently Asked', '', '[{"q":"What denomination is Grace Nepal Church?","a":"We are an independent, Christ-centred church. We affirm the core historic Christian faith and partner with like-minded churches across Nepal."},{"q":"What are your service times?","a":"We meet every Sunday at 10:00 AM for worship and the Word. Wednesday prayer meetings are at 6:30 PM."},{"q":"How can I get involved?","a":"Join a ministry team, attend a small group, or sign up for the next New Members Class. Visit our Ministries page for options."},{"q":"Do you offer counselling?","a":"Yes. Our pastoral team offers confidential prayer and counselling. Contact us or visit the Welcome Desk on Sunday."},{"q":"Is there a dress code?","a":"No dress code. Come as you are — from traditional dress to casual attire, everyone is welcome."}]', true, 4)
ON CONFLICT (section_key) DO NOTHING;
