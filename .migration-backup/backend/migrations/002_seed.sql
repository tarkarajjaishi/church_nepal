-- Seed data from frontend data.ts

-- Service Times
INSERT INTO service_times (name, name_ne, day, time, icon, sort_order) VALUES
('Sunday Worship', 'आइतबार आराधना', 'Sunday', '10:00 AM', 'Church', 1),
('Morning Prayer', 'बिहानी प्रार्थना', 'Daily', '6:00 AM', 'Sunrise', 2),
('Youth Fellowship', 'युवा सङ्गति', 'Friday', '5:00 PM', 'Users', 3),
('Bible Study', 'बाइबल अध्ययन', 'Wednesday', '7:00 PM', 'BookOpen', 4),
('Women''s Fellowship', 'महिला सङ्गति', 'Tuesday', '2:00 PM', 'Flower2', 5),
('Men''s Fellowship', 'पुरुष सङ्गति', 'Saturday', '4:00 PM', 'HandHelping', 6),
('Children Ministry', 'बाल सेवा', 'Sunday', '10:00 AM', 'Baby', 7)
ON CONFLICT DO NOTHING;

-- Sermons
INSERT INTO sermons (title, speaker, date, duration, series, topic, image, description) VALUES
('The Anchor of Hope', 'Ps. Bishal Rai', 'July 6, 2026', '42 min', 'Living Hope', 'Hope', 'https://images.unsplash.com/photo-1653133672754-82025e7e9074?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'In a shifting world, our hope is anchored in the risen Christ. Discover what it means to hold fast.'),
('Walking in Grace', 'Ps. Bishal Rai', 'June 29, 2026', '38 min', 'Grace Upon Grace', 'Grace', 'https://images.unsplash.com/photo-1522158637959-30385a09e0da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Grace is not just how we are saved, but how we live each day. A message on daily dependence on God.'),
('A Heart for Prayer', 'Elder Suman Tamang', 'June 22, 2026', '35 min', 'Foundations', 'Prayer', 'https://images.unsplash.com/photo-1663162550932-f67b561e656f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Learn how a life of prayer transforms the ordinary into the extraordinary.'),
('Light on the Mountain', 'Ps. Bishal Rai', 'June 15, 2026', '45 min', 'Living Hope', 'Faith', 'https://images.unsplash.com/photo-1645788421204-0e4eb1d2a518?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920', 'The gospel is reaching every village of Nepal. A stirring call to be light where God has placed us.'),
('Love in Action', 'Ps. Anita Gurung', 'June 8, 2026', '40 min', 'The Way of Love', 'Love', 'https://images.unsplash.com/photo-1528828085966-aff4e01c5f2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'True love serves. A challenge to move from good intentions to faithful action.'),
('Rooted and Built Up', 'Elder Suman Tamang', 'June 1, 2026', '37 min', 'Foundations', 'Discipleship', 'https://images.unsplash.com/photo-1609234656388-0ff363383899?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Spiritual maturity grows from being deeply rooted in Christ. A message on discipleship.')
ON CONFLICT DO NOTHING;

-- Ministries
INSERT INTO ministries (name, name_ne, description, leader, meeting, image, icon) VALUES
('Children Ministry', 'बाल सेवा', 'Nurturing young hearts with the love of Jesus through stories, songs and play.', 'Sister Maya Lama', 'Sunday 10:00 AM', 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Baby'),
('Youth Ministry', 'युवा सेवा', 'Empowering the next generation to live boldly for Christ in Nepal.', 'Bro. Prakash Rai', 'Friday 5:00 PM', 'https://images.unsplash.com/photo-1533222481259-ce20eda1e20b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Flame'),
('Women Ministry', 'महिला सेवा', 'A sisterhood growing together in faith, prayer and fellowship.', 'Ps. Anita Gurung', 'Tuesday 2:00 PM', 'https://images.unsplash.com/photo-1663162550932-f67b561e656f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Flower2'),
('Men Ministry', 'पुरुष सेवा', 'Building godly men who lead their families and community with integrity.', 'Elder Suman Tamang', 'Saturday 4:00 PM', 'https://images.unsplash.com/photo-1609234656388-0ff363383899?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'HandHelping'),
('Worship Team', 'आराधना समूह', 'Leading the congregation into the presence of God through music.', 'Bro. David Thapa', 'Thursday 6:00 PM', 'https://images.unsplash.com/photo-1522158637959-30385a09e0da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Music'),
('Prayer Ministry', 'प्रार्थना सेवा', 'Interceding for our church, city and nation day and night.', 'Sister Grace Magar', 'Daily 6:00 AM', 'https://images.unsplash.com/photo-1769755410067-a1ea14b0602a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'HandHeart'),
('Outreach Ministry', 'प्रचार सेवा', 'Sharing the good news and serving villages across Nepal.', 'Bro. Samuel Rai', 'Monthly', 'https://images.unsplash.com/photo-1721165578169-390db9ee2fba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Handshake'),
('Media Ministry', 'मिडिया सेवा', 'Telling God''s story through sound, video and live streaming.', 'Bro. John Sherpa', 'As needed', 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Video'),
('Bible School', 'बाइबल विद्यालय', 'Equipping believers with a deep foundation in God''s Word.', 'Ps. Bishal Rai', 'Wednesday 7:00 PM', 'https://images.unsplash.com/photo-1703292227601-d57b5b845c14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'GraduationCap'),
('Mission Ministry', 'मिसन सेवा', 'Taking the gospel to unreached people groups in the Himalayas.', 'Ps. Bishal Rai', 'Quarterly', 'https://images.unsplash.com/photo-1645788421204-0e4eb1d2a518?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920', 'Globe')
ON CONFLICT DO NOTHING;

-- Events
INSERT INTO events (title, date, display_date, time, location, image, description) VALUES
('Sunday Celebration Service', '2026-07-19T10:00:00', 'July 19, 2026', '10:00 AM', 'Main Sanctuary, Kathmandu', 'https://images.unsplash.com/photo-1770097286875-0cbf4ca2f8c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Join us for a Spirit-filled morning of worship, the Word, and community.'),
('Youth Summer Camp', '2026-08-02T09:00:00', 'Aug 2–5, 2026', '9:00 AM', 'Nagarkot Retreat Centre', 'https://images.unsplash.com/photo-1533222481259-ce20eda1e20b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Four days of adventure, worship and life-changing encounters with God.'),
('Community Baptism Service', '2026-08-16T11:00:00', 'Aug 16, 2026', '11:00 AM', 'Bagmati Riverside', 'https://images.unsplash.com/photo-1769755410067-a1ea14b0602a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Celebrating new life in Christ as believers take the step of baptism.'),
('Annual Mission Conference', '2026-09-05T09:30:00', 'Sep 5–6, 2026', '9:30 AM', 'Main Sanctuary, Kathmandu', 'https://images.unsplash.com/photo-1645788421204-0e4eb1d2a518?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920', 'Two days focused on God''s heart for the nations, with guest speakers.')
ON CONFLICT DO NOTHING;

-- Leaders
INSERT INTO leaders (name, role, category, image, bio) VALUES
('Ps. Bishal Rai', 'Senior Pastor', 'Pastors', 'https://images.unsplash.com/photo-1647456605091-ab3e1b4baf8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Serving the church for over 18 years with a heart for discipleship and mission across Nepal.'),
('Ps. Anita Gurung', 'Associate Pastor', 'Pastors', 'https://images.unsplash.com/photo-1753455598828-482a9b029ed3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800', 'Leads women''s ministry and pastoral care with warmth and wisdom.'),
('Elder Suman Tamang', 'Elder', 'Elders', 'https://images.unsplash.com/photo-1582115422763-db7417d14db2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800', 'Oversees teaching and Bible school, grounding the church in God''s Word.'),
('Grace Magar', 'Prayer Coordinator', 'Deacons', 'https://images.unsplash.com/photo-1653133672754-82025e7e9074?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Mobilises the church in prayer and intercession day and night.'),
('David Thapa', 'Worship Leader', 'Ministry Leaders', 'https://images.unsplash.com/photo-1522158637959-30385a09e0da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Leads the worship team and cultivates a culture of praise.'),
('Prakash Rai', 'Youth Leader', 'Ministry Leaders', 'https://images.unsplash.com/photo-1533222481259-ce20eda1e20b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Passionate about raising up the next generation of leaders.')
ON CONFLICT DO NOTHING;

-- Gallery
INSERT INTO gallery (title, category, image) VALUES
('Christmas Celebration', 'Christmas', 'https://images.unsplash.com/photo-1528828085966-aff4e01c5f2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'),
('Youth Camp 2025', 'Youth', 'https://images.unsplash.com/photo-1533222481259-ce20eda1e20b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'),
('Baptism Service', 'Baptism', 'https://images.unsplash.com/photo-1769755410067-a1ea14b0602a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'),
('Mission Conference', 'Conference', 'https://images.unsplash.com/photo-1645788421204-0e4eb1d2a518?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920'),
('Sunday Worship', 'Worship', 'https://images.unsplash.com/photo-1653133672754-82025e7e9074?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'),
('Village Outreach', 'Mission', 'https://images.unsplash.com/photo-1721165578169-390db9ee2fba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'),
('Children''s Day', 'Youth', 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'),
('Prayer Night', 'Worship', 'https://images.unsplash.com/photo-1770097286875-0cbf4ca2f8c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'),
('Easter Sunrise', 'Christmas', 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080')
ON CONFLICT DO NOTHING;

-- Testimonies
INSERT INTO testimonies (name, role, quote, image, rating) VALUES
('Sunita Shrestha', 'Member since 2019', 'This church became my family. Through the hardest season of my life, they prayed with me and never left my side.', 'https://images.unsplash.com/photo-1663162550932-f67b561e656f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 5),
('Ramesh Karki', 'Youth volunteer', 'I met Jesus at the youth camp. Today I serve the very ministry that changed my life forever.', 'https://images.unsplash.com/photo-1582115422763-db7417d14db2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800', 5),
('Kabita Rai', 'Women''s fellowship', 'The teaching is deep yet practical. I have grown more in two years here than I ever imagined possible.', 'https://images.unsplash.com/photo-1769755410067-a1ea14b0602a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 5)
ON CONFLICT DO NOTHING;

-- Notices
INSERT INTO notices (title, date, category, text, urgent) VALUES
('Special Fasting & Prayer Week', 'July 21–27, 2026', 'Prayer', 'Join the whole church for a week of fasting and prayer as we seek God''s direction for the year ahead.', true),
('New Members Class Begins', 'August 3, 2026', 'Membership', 'A 4-week class for anyone wishing to become a member of Grace Nepal Church. Register at the welcome desk.', false),
('Choir Auditions Open', 'July 18, 2026', 'Worship', 'The worship team is welcoming new voices and musicians. Auditions after the Sunday service.', false),
('Relief Fund for Flood Victims', 'Ongoing', 'Outreach', 'We are collecting food and supplies for families affected by recent flooding in eastern Nepal.', false)
ON CONFLICT DO NOTHING;

-- Members
INSERT INTO members (name, role, since, image) VALUES
('Sunita Shrestha', 'Worship Volunteer', '2019', 'https://images.unsplash.com/photo-1663162550932-f67b561e656f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'),
('Ramesh Karki', 'Youth Mentor', '2020', 'https://images.unsplash.com/photo-1582115422763-db7417d14db2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800'),
('Kabita Rai', 'Women''s Fellowship', '2018', 'https://images.unsplash.com/photo-1769755410067-a1ea14b0602a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'),
('David Thapa', 'Musician', '2017', 'https://images.unsplash.com/photo-1522158637959-30385a09e0da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'),
('Grace Magar', 'Intercessor', '2015', 'https://images.unsplash.com/photo-1653133672754-82025e7e9074?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'),
('Prakash Rai', 'Youth Leader', '2016', 'https://images.unsplash.com/photo-1533222481259-ce20eda1e20b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'),
('Maya Lama', 'Children''s Teacher', '2021', 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'),
('Samuel Rai', 'Outreach Team', '2019', 'https://images.unsplash.com/photo-1721165578169-390db9ee2fba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080')
ON CONFLICT DO NOTHING;

-- Verses
INSERT INTO verses (text, ref_text, ne) VALUES
('For God so loved the world that he gave his one and only Son.', 'John 3:16', 'किनभने परमेश्वरले संसारलाई यस्तो प्रेम गर्नुभयो, कि उहाँले आफ्ना एकमात्र पुत्र दिनुभयो।'),
('The Lord is my shepherd, I lack nothing.', 'Psalm 23:1', 'परमप्रभु मेरा गोठालो हुनुहुन्छ, मलाई केही कुराको अभाव हुनेछैन।'),
('I can do all things through Christ who strengthens me.', 'Philippians 4:13', 'मलाई शक्ति दिनुहुने ख्रीष्टद्वारा म सबै कुरा गर्न सक्छु।')
ON CONFLICT DO NOTHING;

-- Campaigns
INSERT INTO campaigns (title, raised, goal) VALUES
('Building Fund', 720000, 1200000),
('Youth Camp Scholarships', 145000, 200000),
('Village Mission Trip', 88000, 150000)
ON CONFLICT DO NOTHING;

-- Settings
INSERT INTO settings (key, value) VALUES
('announcement_text', 'Sunday service live at 10:00 AM (NPT) — everyone is welcome!'),
('announcement_text_ne', 'आइतबारको सेवा बिहान १०:०० बजे (नेपाल समय) प्रत्यक्ष प्रसारण हुन्छ — सबैलाई स्वागत छ!')
ON CONFLICT (key) DO NOTHING;
