-- Additional seed data to populate dashboard

-- More Sermons
INSERT INTO sermons (title, speaker, date, duration, series, topic, image, description) VALUES
('The Power of Forgiveness', 'Ps. Anita Gurung', 'May 25, 2026', '36 min', 'The Way of Love', 'Forgiveness', 'https://images.unsplash.com/photo-1528828085966-aff4e01c5f2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Forgiveness is not a feeling — it is a choice that sets both the giver and receiver free.'),
('Standing in the Gap', 'Elder Suman Tamang', 'May 18, 2026', '41 min', 'Foundations', 'Intercession', 'https://images.unsplash.com/photo-1770097286875-0cbf4ca2f8c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'The church is called to be a praying church. A message on the power of standing in the gap for others.'),
('Joy in Every Season', 'Ps. Bishal Rai', 'May 11, 2026', '39 min', 'Living Hope', 'Joy', 'https://images.unsplash.com/photo-1645788421204-0e4eb1d2a518?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920', 'Joy is not dependent on circumstances. Discover the deep, abiding joy that comes from knowing Christ.'),
('The Generous Life', 'Ps. Bishal Rai', 'May 4, 2026', '37 min', 'Grace Upon Grace', 'Generosity', 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Generosity is the overflow of a heart transformed by grace. Learn to give freely and joyfully.'),
('Faithful in the Small Things', 'Ps. Anita Gurung', 'April 27, 2026', '34 min', 'The Way of Love', 'Faithfulness', 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'God honors faithfulness in the small, everyday moments. A challenge to be diligent where God has placed you.'),
('Building on the Rock', 'Elder Suman Tamang', 'April 20, 2026', '43 min', 'Foundations', 'Discipleship', 'https://images.unsplash.com/photo-1609234656388-0ff363383899?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'A life built on the rock of Jesus Christ stands firm through every storm. A message on spiritual foundations.')
ON CONFLICT DO NOTHING;

-- More Events
INSERT INTO events (title, date, display_date, time, location, image, description) VALUES
('Women''s Conference 2026', '2026-10-10T09:00:00', 'Oct 10–11, 2026', '9:00 AM', 'Main Sanctuary, Kathmandu', 'https://images.unsplash.com/photo-1522158637959-30385a09e0da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Two days of worship, teaching and fellowship for women of all ages.'),
('Christmas Eve Service', '2026-12-24T18:00:00', 'Dec 24, 2026', '6:00 PM', 'Main Sanctuary, Kathmandu', 'https://images.unsplash.com/photo-1528828085966-aff4e01c5f2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'A special candlelight service celebrating the birth of our Lord Jesus Christ.'),
('New Year Prayer Vigil', '2026-12-31T20:00:00', 'Dec 31, 2026', '8:00 PM', 'Main Sanctuary, Kathmandu', 'https://images.unsplash.com/photo-1769755410067-a1ea14b0602a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Ring in the new year with prayer, worship and seeking God together.'),
('Village Outreach Trip', '2026-11-15T07:00:00', 'Nov 15–17, 2026', '7:00 AM', 'Sindhupalchok District', 'https://images.unsplash.com/photo-1721165578169-390db9ee2fba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 'Three-day mission trip to share the gospel and serve communities in eastern Nepal.')
ON CONFLICT DO NOTHING;

-- More Testimonies
INSERT INTO testimonies (name, role, quote, image, rating) VALUES
('Hari Tamang', 'Youth member', 'I came to church as a skeptic, but the love of this community changed my heart. Now I cannot imagine life without Jesus.', 'https://images.unsplash.com/photo-1647456605091-ab3e1b4baf8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 5),
('Sushila Rai', 'Bible study member', 'The Bible study group helped me understand God''s Word in a way I never had before. My faith has grown tremendously.', 'https://images.unsplash.com/photo-1753455598828-482a9b029ed3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800', 5),
('Bikash Gurung', 'Outreach volunteer', 'Serving in the village outreach showed me the heart of God for the lost. Every trip changes me more than the people we serve.', 'https://images.unsplash.com/photo-1582115422763-db7417d14db2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800', 5),
('Anita Sharma', 'Worship team', 'Being part of the worship team is not just about music — it is about leading people into God''s presence every week.', 'https://images.unsplash.com/photo-1653133672754-82025e7e9074?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 5),
('Rajesh Thapa', 'New member', 'I moved to Kathmandu alone and felt lost. This church became my family from the very first Sunday.', 'https://images.unsplash.com/photo-1609234656388-0ff363383899?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', 5)
ON CONFLICT DO NOTHING;

-- More Notices
INSERT INTO notices (title, date, category, text, urgent) VALUES
('Volunteer Appreciation Sunday', 'August 10, 2026', 'Church Life', 'Join us in celebrating and thanking all our wonderful volunteers who serve faithfully week after week.', false),
('Church Picnic — All Are Welcome', 'September 20, 2026', 'Fellowship', 'A fun-filled day of food, games and fellowship at Godavari Park. Bring your family and friends!', false),
('Building Fund Update', 'July 2026', 'Finance', 'We have reached 60% of our building fund goal. Thank you for your generous giving!', false),
('Youth Leadership Training', 'August 15, 2026', 'Youth', 'A 3-day intensive training for young leaders aged 18-30. Register at the welcome desk.', false),
('Annual General Meeting', 'September 7, 2026', 'Church Life', 'All members are invited to our annual general meeting to review the year and discuss future plans.', false)
ON CONFLICT DO NOTHING;

-- More Verses
INSERT INTO verses (text, ref_text, ne) VALUES
('Trust in the LORD with all your heart and lean not on your own understanding.', 'Proverbs 3:5', 'आफ्नो सम्पूर्ण हृदयले परमप्रभुमा भरोसा राख र आफ्नो बुझाइमा भर नपर।'),
('Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you.', 'Joshua 1:9', 'बलियो र साहसी बन। डर नलागोस्, निराश नहोस्, किनभने तिम्रो परमेश्वर तिम्रोसँग छ।'),
('Come to me, all you who are weary and burdened, and I will give you rest.', 'Matthew 11:28', 'मलाई आ, तिमीहरू जो थाकेका र बोझिला छौ, म तिमीलाई विश्राम दिन्छु।'),
('The LORD is my light and my salvation — whom shall I fear?', 'Psalm 27:1', 'परमप्रभु मेरो उज्यालो र मेरो उद्धार हो — म कसलाई डराउने?'),
('And we know that in all things God works for the good of those who love him.', 'Romans 8:28', 'र हामीलाई थाहा छ कि परमेश्वरले आफूलाई माया गर्नेहरूको भलाइका लागि सबै कुरामा काम गर्छ।'),
('I will give you a new heart and put a new spirit in you.', 'Ezekiel 36:26', 'म तिमीलाई नयाँ हृदय दिन्छु र तिमीभित्र नयाँ आत्मा राख्छु।'),
('But those who hope in the LORD will renew their strength.', 'Isaiah 40:31', 'तर जसले परमप्रभुमा आशा राख्छन्, उनीहरूको शक्ति नवीकरण हुनेछ।')
ON CONFLICT DO NOTHING;

-- More Campaigns
INSERT INTO campaigns (title, raised, goal) VALUES
('Church Renovation', 380000, 500000),
('Community Food Drive', 65000, 100000),
('School Supplies for Village Kids', 42000, 75000)
ON CONFLICT DO NOTHING;
