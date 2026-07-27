-- Groups (Small Groups / Cell Groups)
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    meeting_day TEXT,
    meeting_time TEXT,
    location TEXT,
    leader_id INTEGER,
    category TEXT DEFAULT 'general',
    image_url TEXT,
    max_members INTEGER,
    enabled BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed 6 sample groups
INSERT INTO groups (slug, name, description, meeting_day, meeting_time, location, category, image_url, max_members, enabled, sort_order) VALUES
('youth-fellowship', 'Youth Fellowship', 'A vibrant community for young people ages 13-25 to grow in faith together through worship, games, and deep discussions.', 'Saturday', '4:00 PM', 'Youth Hall', 'youth', '', 30, true, 1),
('womens-prayer-circle', 'Women''s Prayer Circle', 'A safe and nurturing space for women to share, pray, and support one another in their spiritual journey.', 'Wednesday', '10:00 AM', 'Room 201', 'women', '', 20, true, 2),
('mens-brotherhood', 'Men''s Brotherhood', 'Iron sharpens iron — men supporting men in faith, leadership, and accountability.', 'Friday', '6:30 AM', 'Fellowship Hall', 'men', '', 25, true, 3),
('married-couples', 'Married Couples', 'Strengthening marriages through Bible study, fellowship, and shared experiences.', 'Sunday', '12:30 PM', 'Conference Room', 'couples', '', 15, true, 4),
('young-adults', 'Young Adults', 'For professionals and college students navigating faith in the modern world.', 'Thursday', '7:00 PM', 'Coffee House', 'young-adults', '', 20, true, 5),
('seniors-fellowship', 'Seniors Fellowship', 'A warm community for our senior members to connect, share wisdom, and enjoy fellowship.', 'Tuesday', '10:00 AM', 'Senior Center', 'seniors', '', 25, true, 6)
ON CONFLICT (slug) DO NOTHING;

-- Seed content blocks for the /groups page
INSERT INTO content_blocks (section_key, title, subtitle, body, enabled, sort_order) VALUES
('groups_hero', 'Our Small Groups', 'Connect & Grow Together', 'Find your place in community through one of our small groups.', true, 0)
ON CONFLICT (section_key) DO NOTHING;
