-- ============================================================================
-- Rich per-church seed: ~40 people in ~15 households, ~60 donations,
-- 20 prayer requests, group memberships, offerings, volunteer data.
-- Designed so every feature is demoable out of the box.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- HOUSEHOLDS (15)
-- ---------------------------------------------------------------------------
INSERT INTO households (id, name, address, phone, notes, enabled, sort_order) VALUES
('a0000001-0000-0000-0000-000000000001', 'Rai Family', 'Baneshwor-12, Kathmandu', '+977-9841-100001', 'Founding family', true, 1),
('a0000001-0000-0000-0000-000000000002', 'Shrestha Family', 'New Baneshwor, Kathmandu', '+977-9841-100002', '', true, 2),
('a0000001-0000-0000-0000-000000000003', 'Gurung Family', 'Lalitpur-3, Patan', '+977-9841-100003', '', true, 3),
('a0000001-0000-0000-0000-000000000004', 'Tamang Family', 'Budhanilkantha, Kathmandu', '+977-9841-100004', '', true, 4),
('a0000001-0000-0000-0000-000000000005', 'Magar Family', 'Koteshwor-14, Kathmandu', '+977-9841-100005', '', true, 5),
('a0000001-0000-0000-0000-000000000006', 'Thapa Family', 'Lazimpat, Kathmandu', '+977-9841-100006', '', true, 6),
('a0000001-0000-0000-0000-000000000007', 'Karki Family', 'Madhyapur Thimi, Bhaktapur', '+977-9841-100007', '', true, 7),
('a0000001-0000-0000-0000-000000000008', 'Lama Family', 'Sankhu, Kathmandu', '+977-9841-100008', '', true, 8),
('a0000001-0000-0000-0000-000000000009', 'Sherpa Family', 'Chhauni, Kathmandu', '+977-9841-100009', '', true, 9),
('a0000001-0000-0000-0000-000000000010', 'Adhikari Family', 'Gongabu, Kathmandu', '+977-9841-100010', '', true, 10),
('a0000001-0000-0000-0000-000000000011', 'KC Family', 'Jawalakhel, Lalitpur', '+977-9841-100011', '', true, 11),
('a0000001-0000-0000-0000-000000000012', 'Bhandari Family', 'Balaju, Kathmandu', '+977-9841-100012', '', true, 12),
('a0000001-0000-0000-0000-000000000013', 'Pokharel Family', 'Kirtipur, Kathmandu', '+977-9841-100013', '', true, 13),
('a0000001-0000-0000-0000-000000000014', 'Dahal Family', 'Imadole, Lalitpur', '+977-9841-100014', '', true, 14),
('a0000001-0000-0000-0000-000000000015', 'Basnet Family', 'Sinamangal, Kathmandu', '+977-9841-100015', '', true, 15)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- PEOPLE (42 across 15 households + some standalone)
-- ---------------------------------------------------------------------------
-- Clear duplicates from the old migration and reseed cleanly
DELETE FROM person_notes;
DELETE FROM person_tags;
DELETE FROM group_memberships;
DELETE FROM people;

INSERT INTO people (id, first_name, last_name, email, phone, address, city, member_status, household_id, notes, joined_date, enabled, sort_order) VALUES
-- Rai Family (household 1) — pastoral family
('b0000001-0000-0000-0000-000000000001', 'Bishal', 'Rai', 'bishal.rai@gracenepal.org', '+977-9841-200001', 'Baneshwor-12', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000001', 'Senior Pastor', '2008-03-15', true, 1),
('b0000001-0000-0000-0000-000000000002', 'Sunita', 'Rai', 'sunita.rai@email.com', '+977-9841-200002', 'Baneshwor-12', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000001', 'Pastor''s wife, worship team', '2008-03-15', true, 2),
('b0000001-0000-0000-0000-000000000003', 'Daniel', 'Rai', 'daniel.rai@student.com', '+977-9841-200003', 'Baneshwor-12', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000001', 'Youth, worship team', '2020-01-01', true, 3),

-- Shrestha Family (household 2)
('b0000001-0000-0000-0000-000000000004', 'Ramesh', 'Shrestha', 'ramesh.shrestha@email.com', '+977-9841-200004', 'New Baneshwor', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000002', 'Elder, Bible school teacher', '2010-06-01', true, 4),
('b0000001-0000-0000-0000-000000000005', 'Kabita', 'Shrestha', 'kabita.shrestha@email.com', '+977-9841-200005', 'New Baneshwor', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000002', 'Women''s ministry leader', '2010-06-01', true, 5),
('b0000001-0000-0000-0000-000000000006', 'Anisha', 'Shrestha', 'anisha@student.com', '+977-9841-200006', 'New Baneshwor', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000002', 'Children''s ministry volunteer', '2022-03-01', true, 6),

-- Gurung Family (household 3)
('b0000001-0000-0000-0000-000000000007', 'Anita', 'Gurung', 'anita.gurung@gracenepal.org', '+977-9841-200007', 'Lalitpur-3', 'Lalitpur', 'member', 'a0000001-0000-0000-0000-000000000003', 'Associate Pastor, women''s ministry', '2012-01-01', true, 7),
('b0000001-0000-0000-0000-000000000008', 'Bikash', 'Gurung', 'bikash.gurung@email.com', '+977-9841-200008', 'Lalitpur-3', 'Lalitpur', 'member', 'a0000001-0000-0000-0000-000000000003', 'Outreach volunteer', '2015-04-01', true, 8),

-- Tamang Family (household 4)
('b0000001-0000-0000-0000-000000000009', 'Suman', 'Tamang', 'suman.tamang@email.com', '+977-9841-200009', 'Budhanilkantha', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000004', 'Elder, Bible school teacher', '2009-09-01', true, 9),
('b0000001-0000-0000-0000-000000000010', 'Hari', 'Tamang', 'hari.tamang@email.com', '+977-9841-200010', 'Budhanilkantha', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000004', 'Youth member', '2021-01-01', true, 10),

-- Magar Family (household 5)
('b0000001-0000-0000-0000-000000000011', 'Grace', 'Magar', 'grace.magar@gracenepal.org', '+977-9841-200011', 'Koteshwor-14', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000005', 'Prayer coordinator', '2015-01-01', true, 11),
('b0000001-0000-0000-0000-000000000012', 'Sushila', 'Magar', 'sushila.magar@email.com', '+977-9841-200012', 'Koteshwor-14', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000005', 'Bible study member', '2018-06-01', true, 12),

-- Thapa Family (household 6)
('b0000001-0000-0000-0000-000000000013', 'David', 'Thapa', 'david.thapa@gracenepal.org', '+977-9841-200013', 'Lazimpat', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000006', 'Worship leader', '2017-01-01', true, 13),
('b0000001-0000-0000-0000-000000000014', 'Rajesh', 'Thapa', 'rajesh.thapa@email.com', '+977-9841-200014', 'Lazimpat', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000006', 'New member, moved from Pokhara', '2025-09-01', true, 14),

-- Karki Family (household 7)
('b0000001-0000-0000-0000-000000000015', 'Ramesh', 'Karki', 'ramesh.karki@email.com', '+977-9841-200015', 'Madhyapur Thimi', 'Bhaktapur', 'member', 'a0000001-0000-0000-0000-000000000007', 'Youth mentor', '2020-01-01', true, 15),

-- Lama Family (household 8)
('b0000001-0000-0000-0000-000000000016', 'Maya', 'Lama', 'maya.lama@email.com', '+977-9841-200016', 'Sankhu', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000008', 'Children''s teacher', '2021-01-01', true, 16),

-- Sherpa Family (household 9)
('b0000001-0000-0000-0000-000000000017', 'John', 'Sherpa', 'john.sherpa@email.com', '+977-9841-200017', 'Chhauni', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000009', 'Media ministry lead', '2019-03-01', true, 17),

-- Adhikari Family (household 10)
('b0000001-0000-0000-0000-000000000018', 'Samuel', 'Adhikari', 'samuel.adhikari@email.com', '+977-9841-200018', 'Gongabu', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000010', 'Outreach team', '2019-01-01', true, 18),
('b0000001-0000-0000-0000-000000000019', 'Naomi', 'Adhikari', 'naomi.adhikari@email.com', '+977-9841-200019', 'Gongabu', 'Kathmandu', 'regular', 'a0000001-0000-0000-0000-000000000010', 'Visitor becoming regular', '2024-06-01', true, 19),

-- KC Family (household 11)
('b0000001-0000-0000-0000-000000000020', 'Prakash', 'KC', 'prakash.kc@email.com', '+977-9841-200020', 'Jawalakhel', 'Lalitpur', 'member', 'a0000001-0000-0000-0000-000000000011', 'Youth leader', '2016-01-01', true, 20),
('b0000001-0000-0000-0000-000000000021', 'Anita', 'KC', 'anita.kc@email.com', '+977-9841-200021', 'Jawalakhel', 'Lalitpur', 'member', 'a0000001-0000-0000-0000-000000000011', '', '2016-06-01', true, 21),

-- Bhandari Family (household 12)
('b0000001-0000-0000-0000-000000000022', 'Prakash', 'Bhandari', 'prakash.bhandari@email.com', '+977-9841-200022', 'Balaju', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000012', 'Bible study leader', '2014-01-01', true, 22),
('b0000001-0000-0000-0000-000000000023', 'Sunita', 'Bhandari', 'sunita.bhandari@email.com', '+977-9841-200023', 'Balaju', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000012', 'Prayer ministry', '2014-06-01', true, 23),

-- Pokharel Family (household 13)
('b0000001-0000-0000-0000-000000000024', 'Ram', 'Pokharel', 'ram.pokharel@email.com', '+977-9841-200024', 'Kirtipur', 'Kathmandu', 'regular', 'a0000001-0000-0000-0000-000000000013', 'Regular attender', '2023-01-01', true, 24),
('b0000001-0000-0000-0000-000000000025', 'Gita', 'Pokharel', 'gita.pokharel@email.com', '+977-9841-200025', 'Kirtipur', 'Kathmandu', 'regular', 'a0000001-0000-0000-0000-000000000013', '', '2023-03-01', true, 25),

-- Dahal Family (household 14)
('b0000001-0000-0000-0000-000000000026', 'Nabin', 'Dahal', 'nabin.dahal@email.com', '+977-9841-200026', 'Imadole', 'Lalitpur', 'visitor', 'a0000001-0000-0000-0000-000000000014', 'First-time visitor, friend of Prakash', '2025-11-01', true, 26),
('b0000001-0000-0000-0000-000000000027', 'Sita', 'Dahal', 'sita.dahal@email.com', '+977-9841-200027', 'Imadole', 'Lalitpur', 'visitor', 'a0000001-0000-0000-0000-000000000014', '', '2025-11-01', true, 27),

-- Basnet Family (household 15)
('b0000001-0000-0000-0000-000000000028', 'Arun', 'Basnet', 'arun.basnet@email.com', '+977-9841-200028', 'Sinamangal', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000015', 'Sound/media volunteer', '2020-06-01', true, 28),
('b0000001-0000-0000-0000-000000000029', 'Nirmala', 'Basnet', 'nirmala.basnet@email.com', '+977-9841-200029', 'Sinamangal', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000015', 'Children''s ministry', '2020-06-01', true, 29),
('b0000001-0000-0000-0000-000000000030', 'Aaron', 'Basnet', 'aaron.basnet@student.com', '+977-9841-200030', 'Sinamangal', 'Kathmandu', 'member', 'a0000001-0000-0000-0000-000000000015', 'Youth', '2022-01-01', true, 30),

-- Standalone members (no household)
('b0000001-0000-0000-0000-000000000031', 'Saroj', 'Dhungana', 'saroj.dhungana@email.com', '+977-9841-200031', 'Thankot', 'Kathmandu', 'member', NULL, 'Usher team', '2018-01-01', true, 31),
('b0000001-0000-0000-0000-000000000032', 'Bishnu', 'KC', 'bishnu.kc@email.com', '+977-9841-200032', 'Dillibazar', 'Kathmandu', 'member', NULL, 'Parking volunteer', '2017-03-01', true, 32),
('b0000001-0000-0000-0000-000000000033', 'Laxmi', 'Poudel', 'laxmi.poudel@email.com', '+977-9841-200033', 'Pepsicola', 'Kathmandu', 'regular', NULL, 'New regular', '2024-09-01', true, 33),
('b0000001-0000-0000-0000-000000000034', 'Dipak', 'Poudel', 'dipak.poudel@email.com', '+977-9841-200034', 'Pepsicola', 'Kathmandu', 'regular', NULL, '', '2024-09-01', true, 34),
('b0000001-0000-0000-0000-000000000035', 'Rita', 'Gurung', 'rita.gurung@email.com', '+977-9841-200035', 'Chabahil', 'Kathmandu', 'member', NULL, 'Hospitality team', '2016-01-01', true, 35),
('b0000001-0000-0000-0000-000000000036', 'Binod', 'Rai', 'binod.rai@email.com', '+977-9841-200036', 'Chandragiri', 'Kathmandu', 'member', NULL, 'Security volunteer', '2019-01-01', true, 36),
('b0000001-0000-0000-0000-000000000037', 'Mina', 'Shrestha', 'mina.shrestha@email.com', '+977-9841-200037', 'Tokha', 'Kathmandu', 'inactive', NULL, 'Moved away temporarily', '2020-01-01', true, 37),
('b0000001-0000-0000-0000-000000000038', 'Kiran', 'Thapa', 'kiran.thapa@email.com', '+977-9841-200038', 'Kathmandu', 'Kathmandu', 'visitor', NULL, 'Walk-in visitor', '2025-10-01', true, 38),
('b0000001-0000-0000-0000-000000000039', 'Sapana', 'Limbu', 'sapana.limbu@email.com', '+977-9841-200039', 'Maharajgunj', 'Kathmandu', 'visitor', NULL, 'College student', '2025-12-01', true, 39),
('b0000001-0000-0000-0000-000000000040', 'Tara', 'Magar', 'tara.magar@email.com', '+977-9841-200040', 'Gatthaghar', 'Bhaktapur', 'regular', NULL, 'Attends Bible study', '2023-06-01', true, 40),
('b0000001-0000-0000-0000-000000000041', 'Rajan', 'Gyawali', 'rajan.gyawali@email.com', '+977-9841-200041', 'Dubalikhel', 'Lalitpur', 'visitor', NULL, 'First-time visitor', '2026-01-05', true, 41),
('b0000001-0000-0000-0000-000000000042', 'Sangita', 'Bishwakarma', 'sangita.b@email.com', '+977-9841-200042', 'Sanepa', 'Lalitpur', 'regular', NULL, 'Regular attender, newcomer', '2024-03-01', true, 42);

-- ---------------------------------------------------------------------------
-- TAGS
-- ---------------------------------------------------------------------------
INSERT INTO tags (id, name, color) VALUES
('c0000001-0000-0000-0000-000000000001', 'First-Time Visitor', '#f59e0b'),
('c0000001-0000-0000-0000-000000000002', 'Volunteer', '#3b82f6'),
('c0000001-0000-0000-0000-000000000003', 'Small Group Leader', '#10b981'),
('c0000001-0000-0000-0000-000000000004', 'New Member', '#8b5cf6'),
('c0000001-0000-0000-0000-000000000005', 'Youth', '#ec4899'),
('c0000001-0000-0000-0000-000000000006', 'Elder', '#6366f1'),
('c0000001-0000-0000-0000-000000000007', 'Music Team', '#f97316'),
('c0000001-0000-0000-0000-000000000008', 'Prayer Team', '#14b8a6'),
('c0000001-0000-0000-0000-000000000009', 'Outreach', '#ef4444'),
('c0000001-0000-0000-0000-000000000010', 'Pastoral', '#0b3c5d')
ON CONFLICT DO NOTHING;

-- Tag assignments.
-- Resolve tag ids by NAME (not hardcoded uuid): tags may already exist in the
-- DB with different uuids (the tags INSERT above uses ON CONFLICT DO NOTHING on
-- the unique name), so joining by name keeps this robust and idempotent.
INSERT INTO person_tags (person_id, tag_id)
SELECT v.person_id::uuid, t.id
FROM (
    VALUES
    -- Pastoral team
    ('b0000001-0000-0000-0000-000000000001', 'Pastoral'),
    ('b0000001-0000-0000-0000-000000000007', 'Pastoral'),
    -- Elders
    ('b0000001-0000-0000-0000-000000000004', 'Elder'),
    ('b0000001-0000-0000-0000-000000000009', 'Elder'),
    -- Volunteers
    ('b0000001-0000-0000-0000-000000000013', 'Volunteer'),
    ('b0000001-0000-0000-0000-000000000016', 'Volunteer'),
    ('b0000001-0000-0000-0000-000000000028', 'Volunteer'),
    ('b0000001-0000-0000-0000-000000000035', 'Volunteer'),
    ('b0000001-0000-0000-0000-000000000036', 'Volunteer'),
    -- Music team
    ('b0000001-0000-0000-0000-000000000013', 'Music Team'),
    ('b0000001-0000-0000-0000-000000000002', 'Music Team'),
    -- Prayer team
    ('b0000001-0000-0000-0000-000000000011', 'Prayer Team'),
    ('b0000001-0000-0000-0000-000000000023', 'Prayer Team'),
    -- Outreach
    ('b0000001-0000-0000-0000-000000000018', 'Outreach'),
    ('b0000001-0000-0000-0000-000000000008', 'Outreach'),
    -- Youth
    ('b0000001-0000-0000-0000-000000000020', 'Youth'),
    ('b0000001-0000-0000-0000-000000000010', 'Youth'),
    ('b0000001-0000-0000-0000-000000000030', 'Youth'),
    -- Small group leaders
    ('b0000001-0000-0000-0000-000000000022', 'Small Group Leader'),
    ('b0000001-0000-0000-0000-000000000005', 'Small Group Leader'),
    -- New members
    ('b0000001-0000-0000-0000-000000000014', 'New Member'),
    ('b0000001-0000-0000-0000-000000000033', 'New Member'),
    -- First-time visitors
    ('b0000001-0000-0000-0000-000000000038', 'First-Time Visitor'),
    ('b0000001-0000-0000-0000-000000000041', 'First-Time Visitor')
) AS v(person_id, tag_name)
JOIN tags t ON t.name = v.tag_name
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- GROUP MEMBERSHIPS
-- ---------------------------------------------------------------------------
INSERT INTO group_memberships (group_id, person_id, role, joined_at) VALUES
-- Youth Fellowship (group 1)
(1, 'b0000001-0000-0000-0000-000000000020', 'leader', '2020-01-01'),
(1, 'b0000001-0000-0000-0000-000000000010', 'member', '2021-06-01'),
(1, 'b0000001-0000-0000-0000-000000000030', 'member', '2022-09-01'),
(1, 'b0000001-0000-0000-0000-000000000003', 'member', '2022-01-01'),
(1, 'b0000001-0000-0000-0000-000000000039', 'member', '2026-01-01'),
-- Women's Prayer Circle (group 2)
(2, 'b0000001-0000-0000-0000-000000000005', 'leader', '2018-01-01'),
(2, 'b0000001-0000-0000-0000-000000000023', 'member', '2019-01-01'),
(2, 'b0000001-0000-0000-0000-000000000029', 'member', '2021-01-01'),
(2, 'b0000001-0000-0000-0000-000000000035', 'member', '2020-01-01'),
-- Men's Brotherhood (group 3)
(3, 'b0000001-0000-0000-0000-000000000004', 'leader', '2015-01-01'),
(3, 'b0000001-0000-0000-0000-000000000018', 'member', '2019-01-01'),
(3, 'b0000001-0000-0000-0000-000000000032', 'member', '2018-01-01'),
(3, 'b0000001-0000-0000-0000-000000000036', 'member', '2019-06-01'),
-- Married Couples (group 4)
(4, 'b0000001-0000-0000-0000-000000000001', 'leader', '2015-01-01'),
(4, 'b0000001-0000-0000-0000-000000000002', 'member', '2015-01-01'),
(4, 'b0000001-0000-0000-0000-000000000009', 'member', '2016-01-01'),
(4, 'b0000001-0000-0000-0000-000000000022', 'member', '2017-01-01'),
-- Young Adults (group 5)
(5, 'b0000001-0000-0000-0000-000000000008', 'leader', '2020-01-01'),
(5, 'b0000001-0000-0000-0000-000000000006', 'member', '2022-06-01'),
(5, 'b0000001-0000-0000-0000-000000000025', 'member', '2023-09-01'),
(5, 'b0000001-0000-0000-0000-000000000042', 'member', '2024-06-01'),
-- Seniors Fellowship (group 6)
(6, 'b0000001-0000-0000-0000-000000000011', 'leader', '2020-01-01'),
(6, 'b0000001-0000-0000-0000-000000000024', 'member', '2023-01-01'),
(6, 'b0000001-0000-0000-0000-000000000040', 'member', '2023-09-01')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- PERSON NOTES (timeline entries)
-- ---------------------------------------------------------------------------
INSERT INTO person_notes (person_id, author, note, created_at) VALUES
('b0000001-0000-0000-0000-000000000014', 'Ps. Bishal Rai', 'Welcome coffee meeting. Rajesh moved from Pokhara and is looking for a church home.', '2025-09-15'),
('b0000001-0000-0000-0000-000000000026', 'Welcome Desk', 'First-time visitor with wife Sita. Referred by Prakash Bhandari.', '2025-11-02'),
('b0000001-0000-0000-0000-000000000038', 'Welcome Desk', 'Walk-in visitor on Sunday. Took a welcome packet.', '2025-10-05'),
('b0000001-0000-0000-0000-000000000039', 'Prakash KC', 'College student referred by youth group. Attended youth fellowship.', '2025-12-07'),
('b0000001-0000-0000-0000-000000000041', 'Welcome Desk', 'Walk-in visitor. Took connect card.', '2026-01-05');

-- ---------------------------------------------------------------------------
-- DONATIONS / GIFTS (~60 across people, funds, methods, months)
-- ---------------------------------------------------------------------------
INSERT INTO donations (donor_name, donor_email, amount, payment_method, campaign_id, transaction_id, status, notes, created_at) VALUES
-- General Fund donations (via various methods)
('Bishal Rai', 'bishal.rai@gracenepal.org', 25000, 'bank', NULL, 'TXN-2026-0001', 'completed', 'Monthly tithe', '2026-01-05'),
('Sunita Rai', 'sunita.rai@email.com', 15000, 'bank', NULL, 'TXN-2026-0002', 'completed', 'Monthly tithe', '2026-01-05'),
('Ramesh Shrestha', 'ramesh.shrestha@email.com', 20000, 'esewa', NULL, 'TXN-2026-0003', 'completed', 'Monthly tithe', '2026-01-07'),
('Kabita Shrestha', 'kabita.shrestha@email.com', 10000, 'esewa', NULL, 'TXN-2026-0004', 'completed', '', '2026-01-07'),
('Suman Tamang', 'suman.tamang@email.com', 30000, 'bank', NULL, 'TXN-2026-0005', 'completed', 'Monthly tithe', '2026-01-10'),
('Anita Gurung', 'anita.gurung@gracenepal.org', 15000, 'khalti', NULL, 'TXN-2026-0006', 'completed', '', '2026-01-12'),
('David Thapa', 'david.thapa@gracenepal.org', 8000, 'bank', NULL, 'TXN-2026-0007', 'completed', '', '2026-01-14'),
('Prakash KC', 'prakash.kc@email.com', 12000, 'esewa', NULL, 'TXN-2026-0008', 'completed', '', '2026-01-15'),
('Grace Magar', 'grace.magar@gracenepal.org', 10000, 'bank', NULL, 'TXN-2026-0009', 'completed', '', '2026-01-18'),
('Samuel Adhikari', 'samuel.adhikari@email.com', 8000, 'khalti', NULL, 'TXN-2026-0010', 'completed', '', '2026-01-20'),
('Prakash Bhandari', 'prakash.bhandari@email.com', 15000, 'bank', NULL, 'TXN-2026-0011', 'completed', '', '2026-01-22'),
('Arun Basnet', 'arun.basnet@email.com', 5000, 'esewa', NULL, 'TXN-2026-0012', 'completed', '', '2026-01-25'),
('Saroj Dhungana', 'saroj.dhungana@email.com', 7000, 'bank', NULL, 'TXN-2026-0013', 'completed', '', '2026-01-28'),
-- February
('Bishal Rai', 'bishal.rai@gracenepal.org', 25000, 'bank', NULL, 'TXN-2026-0014', 'completed', 'Monthly tithe', '2026-02-05'),
('Ramesh Shrestha', 'ramesh.shrestha@email.com', 20000, 'esewa', NULL, 'TXN-2026-0015', 'completed', '', '2026-02-07'),
('Suman Tamang', 'suman.tamang@email.com', 30000, 'bank', NULL, 'TXN-2026-0016', 'completed', 'Monthly tithe', '2026-02-10'),
('Anita Gurung', 'anita.gurung@gracenepal.org', 15000, 'khalti', NULL, 'TXN-2026-0017', 'completed', '', '2026-02-12'),
('Prakash KC', 'prakash.kc@email.com', 12000, 'esewa', NULL, 'TXN-2026-0018', 'completed', '', '2026-02-15'),
('Rita Gurung', 'rita.gurung@email.com', 5000, 'bank', NULL, 'TXN-2026-0019', 'completed', '', '2026-02-18'),
('Binod Rai', 'binod.rai@email.com', 6000, 'bank', NULL, 'TXN-2026-0020', 'completed', '', '2026-02-20'),
-- March
('Bishal Rai', 'bishal.rai@gracenepal.org', 25000, 'bank', NULL, 'TXN-2026-0021', 'completed', 'Monthly tithe', '2026-03-05'),
('Sunita Rai', 'sunita.rai@email.com', 15000, 'bank', NULL, 'TXN-2026-0022', 'completed', '', '2026-03-05'),
('Ramesh Shrestha', 'ramesh.shrestha@email.com', 20000, 'esewa', NULL, 'TXN-2026-0023', 'completed', '', '2026-03-07'),
('David Thapa', 'david.thapa@gracenepal.org', 8000, 'bank', NULL, 'TXN-2026-0024', 'completed', '', '2026-03-10'),
('Prakash Bhandari', 'prakash.bhandari@email.com', 15000, 'bank', NULL, 'TXN-2026-0025', 'completed', '', '2026-03-15'),
('Ram Pokharel', 'ram.pokharel@email.com', 5000, 'khalti', NULL, 'TXN-2026-0026', 'completed', '', '2026-03-18'),
('Nirmala Basnet', 'nirmala.basnet@email.com', 4000, 'esewa', NULL, 'TXN-2026-0027', 'completed', '', '2026-03-22'),
('Saroj Dhungana', 'saroj.dhungana@email.com', 7000, 'bank', NULL, 'TXN-2026-0028', 'completed', '', '2026-03-25'),
-- April
('Bishal Rai', 'bishal.rai@gracenepal.org', 25000, 'bank', NULL, 'TXN-2026-0029', 'completed', 'Monthly tithe', '2026-04-05'),
('Suman Tamang', 'suman.tamang@email.com', 30000, 'bank', NULL, 'TXN-2026-0030', 'completed', 'Monthly tithe', '2026-04-10'),
('Anita Gurung', 'anita.gurung@gracenepal.org', 15000, 'khalti', NULL, 'TXN-2026-0031', 'completed', '', '2026-04-12'),
('Prakash KC', 'prakash.kc@email.com', 12000, 'esewa', NULL, 'TXN-2026-0032', 'completed', '', '2026-04-15'),
('Grace Magar', 'grace.magar@gracenepal.org', 10000, 'bank', NULL, 'TXN-2026-0033', 'completed', '', '2026-04-18'),
('Arun Basnet', 'arun.basnet@email.com', 5000, 'esewa', NULL, 'TXN-2026-0034', 'completed', '', '2026-04-20'),
('Bishnu KC', 'bishnu.kc@email.com', 4000, 'bank', NULL, 'TXN-2026-0035', 'completed', '', '2026-04-25'),
-- May
('Bishal Rai', 'bishal.rai@gracenepal.org', 25000, 'bank', NULL, 'TXN-2026-0036', 'completed', 'Monthly tithe', '2026-05-05'),
('Ramesh Shrestha', 'ramesh.shrestha@email.com', 20000, 'esewa', NULL, 'TXN-2026-0037', 'completed', '', '2026-05-07'),
('Suman Tamang', 'suman.tamang@email.com', 30000, 'bank', NULL, 'TXN-2026-0038', 'completed', 'Monthly tithe', '2026-05-10'),
('David Thapa', 'david.thapa@gracenepal.org', 8000, 'bank', NULL, 'TXN-2026-0039', 'completed', '', '2026-05-12'),
('Prakash Bhandari', 'prakash.bhandari@email.com', 15000, 'bank', NULL, 'TXN-2026-0040', 'completed', '', '2026-05-15'),
('Samuel Adhikari', 'samuel.adhikari@email.com', 8000, 'khalti', NULL, 'TXN-2026-0041', 'completed', '', '2026-05-18'),
('Rita Gurung', 'rita.gurung@email.com', 5000, 'bank', NULL, 'TXN-2026-0042', 'completed', '', '2026-05-20'),
('Binod Rai', 'binod.rai@email.com', 6000, 'bank', NULL, 'TXN-2026-0043', 'completed', '', '2026-05-22'),
('Nirmala Basnet', 'nirmala.basnet@email.com', 4000, 'esewa', NULL, 'TXN-2026-0044', 'completed', '', '2026-05-25'),
-- June
('Bishal Rai', 'bishal.rai@gracenepal.org', 25000, 'bank', NULL, 'TXN-2026-0045', 'completed', 'Monthly tithe', '2026-06-05'),
('Sunita Rai', 'sunita.rai@email.com', 15000, 'bank', NULL, 'TXN-2026-0046', 'completed', '', '2026-06-05'),
('Anita Gurung', 'anita.gurung@gracenepal.org', 15000, 'khalti', NULL, 'TXN-2026-0047', 'completed', '', '2026-06-10'),
('Prakash KC', 'prakash.kc@email.com', 12000, 'esewa', NULL, 'TXN-2026-0048', 'completed', '', '2026-06-12'),
('Grace Magar', 'grace.magar@gracenepal.org', 10000, 'bank', NULL, 'TXN-2026-0049', 'completed', '', '2026-06-15'),
('Prakash Bhandari', 'prakash.bhandari@email.com', 15000, 'bank', NULL, 'TXN-2026-0050', 'completed', '', '2026-06-18'),
('Saroj Dhungana', 'saroj.dhungana@email.com', 7000, 'bank', NULL, 'TXN-2026-0051', 'completed', '', '2026-06-20'),
('Arun Basnet', 'arun.basnet@email.com', 5000, 'esewa', NULL, 'TXN-2026-0052', 'completed', '', '2026-06-22'),
('Ram Pokharel', 'ram.pokharel@email.com', 5000, 'khalti', NULL, 'TXN-2026-0053', 'completed', '', '2026-06-25'),
-- July (partial month)
('Bishal Rai', 'bishal.rai@gracenepal.org', 25000, 'bank', NULL, 'TXN-2026-0054', 'completed', 'Monthly tithe', '2026-07-05'),
('Ramesh Shrestha', 'ramesh.shrestha@email.com', 20000, 'esewa', NULL, 'TXN-2026-0055', 'completed', '', '2026-07-07'),
('Suman Tamang', 'suman.tamang@email.com', 30000, 'bank', NULL, 'TXN-2026-0056', 'completed', 'Monthly tithe', '2026-07-10'),
('David Thapa', 'david.thapa@gracenepal.org', 8000, 'bank', NULL, 'TXN-2026-0057', 'completed', '', '2026-07-12'),
('Prakash KC', 'prakash.kc@email.com', 12000, 'esewa', NULL, 'TXN-2026-0058', 'completed', '', '2026-07-14'),
('Anita Gurung', 'anita.gurung@gracenepal.org', 15000, 'khalti', NULL, 'TXN-2026-0059', 'completed', '', '2026-07-15'),
('Bishnu KC', 'bishnu.kc@email.com', 4000, 'bank', NULL, 'TXN-2026-0060', 'completed', '', '2026-07-18');

-- ---------------------------------------------------------------------------
-- PRAYER REQUESTS (contact_messages with type='prayer')
-- ---------------------------------------------------------------------------
INSERT INTO contact_messages (message_type, name, email, phone, message, category, anonymous, status, created_at) VALUES
('prayer', 'Sunita Rai', 'sunita.rai@email.com', '+977-9841-200002', 'Please pray for my mother who is in the hospital. She had a fall and is recovering from surgery.', 'Healing', false, 'new', '2026-06-01'),
('prayer', 'Anonymous', '', '', 'Pray for our nation — for peace, unity and godly leadership in these difficult times.', 'Guidance', true, 'praying', '2026-06-03'),
('prayer', 'Ramesh Shrestha', 'ramesh.shrestha@email.com', '+977-9841-200004', 'My son is preparing for his exams. Please pray for wisdom and focus.', 'Guidance', false, 'new', '2026-06-05'),
('prayer', 'Kabita Shrestha', 'kabita.shrestha@email.com', '+977-9841-200005', 'Struggling with anxiety and need God''s peace. Please pray.', 'Family', false, 'praying', '2026-06-08'),
('prayer', 'Anonymous', '', '', 'Please pray for my marriage. We are going through a rough patch.', 'Family', true, 'praying', '2026-06-10'),
('prayer', 'Prakash Bhandari', 'prakash.bhandari@email.com', '+977-9841-200022', 'Pray for our small group — we are studying Romans and it has stirred up deep questions.', 'Guidance', false, 'answered', '2026-06-12'),
('prayer', 'Grace Magar', 'grace.magar@gracenepal.org', '+977-9841-200011', 'Praying for revival in our city. Join us in intercession this Friday.', 'Salvation', false, 'praying', '2026-06-14'),
('prayer', 'Anonymous', '', '', 'Need prayer for financial breakthrough. Lost my job last month.', 'Finances', true, 'new', '2026-06-16'),
('prayer', 'Saroj Dhungana', 'saroj.dhungana@email.com', '+977-9841-200031', 'Pray for the upcoming village outreach trip. That God would open doors.', 'Salvation', false, 'praying', '2026-06-18'),
('prayer', 'Anita Gurung', 'anita.gurung@gracenepal.org', '+977-9841-200007', 'Thanksgiving — God answered prayer! My sister has been healed from her illness.', 'Thanksgiving', false, 'answered', '2026-06-20'),
('prayer', 'David Thapa', 'david.thapa@gracenepal.org', '+977-9841-200013', 'Pray for the worship team as we prepare new songs for next month.', 'Guidance', false, 'praying', '2026-06-22'),
('prayer', 'Nirmala Basnet', 'nirmala.basnet@email.com', '+977-9841-200029', 'Please pray for my husband who has been unwell.', 'Healing', false, 'new', '2026-06-25'),
('prayer', 'Anonymous', '', '', 'Pray for our youth camp next month. That every young person would encounter God.', 'Salvation', true, 'praying', '2026-06-28'),
('prayer', 'Laxmi Poudel', 'laxmi.poudel@email.com', '+977-9841-200033', 'Praying for direction in my career. I feel called to ministry but unsure how.', 'Guidance', false, 'new', '2026-07-01'),
('prayer', 'Samuel Adhikari', 'samuel.adhikari@email.com', '+977-9841-200018', 'Pray for the unreached villages in Sindhupalchok. They have no church.', 'Salvation', false, 'praying', '2026-07-03'),
('prayer', 'Binod Rai', 'binod.rai@email.com', '+977-9841-200036', 'Thanksgiving — God provided a new vehicle for the outreach team!', 'Thanksgiving', false, 'answered', '2026-07-05'),
('prayer', 'Anonymous', '', '', 'Pray for peace in my neighborhood. There has been conflict and tension.', 'Family', true, 'new', '2026-07-07'),
('prayer', 'Suman Tamang', 'suman.tamang@email.com', '+977-9841-200009', 'Please pray for the Bible school graduates. May they remain faithful.', 'Guidance', false, 'praying', '2026-07-09'),
('prayer', 'Rita Gurung', 'rita.gurung@email.com', '+977-9841-200035', 'Pray for my parents who do not yet know the Lord.', 'Salvation', false, 'new', '2026-07-11'),
('prayer', 'Tara Magar', 'tara.magar@email.com', '+977-9841-200040', 'Thanksgiving for answered prayer — got admitted to the nursing program!', 'Thanksgiving', false, 'answered', '2026-07-13');

-- ---------------------------------------------------------------------------
-- OFFERINGS (weekly records)
-- ---------------------------------------------------------------------------
INSERT INTO offerings (service_date, service_name, offering_type, total_amount, currency, recorded_by, notes) VALUES
('2026-07-06', 'Sunday Service', 'general', 185000, 'NPR', 'Prakash Bhandari', 'Regular Sunday offering'),
('2026-06-29', 'Sunday Service', 'general', 172000, 'NPR', 'Prakash Bhandari', 'Regular Sunday offering'),
('2026-06-22', 'Sunday Service', 'general', 168000, 'NPR', 'Prakash Bhandari', 'Regular Sunday offering'),
('2026-06-15', 'Sunday Service', 'general', 195000, 'NPR', 'Prakash Bhandari', 'Special offering for missions'),
('2026-06-08', 'Sunday Service', 'general', 162000, 'NPR', 'Prakash Bhandari', 'Regular Sunday offering'),
('2026-06-01', 'Sunday Service', 'general', 158000, 'NPR', 'Prakash Bhandari', 'Regular Sunday offering'),
('2026-05-25', 'Sunday Service', 'general', 170000, 'NPR', 'Prakash Bhandari', 'Regular Sunday offering'),
('2026-05-18', 'Sunday Service', 'general', 165000, 'NPR', 'Prakash Bhandari', 'Regular Sunday offering'),
('2026-05-11', 'Sunday Service', 'general', 200000, 'NPR', 'Prakash Bhandari', 'Mothers Day special offering'),
('2026-05-04', 'Sunday Service', 'general', 155000, 'NPR', 'Prakash Bhandari', 'Regular Sunday offering'),
('2026-04-27', 'Sunday Service', 'general', 160000, 'NPR', 'Prakash Bhandari', 'Regular Sunday offering'),
('2026-04-20', 'Sunday Service', 'general', 175000, 'NPR', 'Prakash Bhandari', 'Easter special offering');
