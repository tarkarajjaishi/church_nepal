-- Pagination indexes: hot columns for filtering, sorting, and foreign keys.

-- Sermons
CREATE INDEX IF NOT EXISTS idx_sermons_sort_order ON sermons(sort_order);
CREATE INDEX IF NOT EXISTS idx_sermons_created_at ON sermons(created_at DESC);

-- Ministries
CREATE INDEX IF NOT EXISTS idx_ministries_created_at ON ministries(created_at DESC);

-- Events
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);

-- Leaders
CREATE INDEX IF NOT EXISTS idx_leaders_created_at ON leaders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaders_category ON leaders(category);

-- Gallery
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category);

-- Testimonies
CREATE INDEX IF NOT EXISTS idx_testimonies_created_at ON testimonies(created_at DESC);

-- Notices
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);

-- Members
CREATE INDEX IF NOT EXISTS idx_members_created_at ON members(created_at DESC);

-- Service Times
CREATE INDEX IF NOT EXISTS idx_service_times_sort_order ON service_times(sort_order);

-- Verses
CREATE INDEX IF NOT EXISTS idx_verses_created_at ON verses(created_at DESC);

-- Campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

-- Blog
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);

-- Services
CREATE INDEX IF NOT EXISTS idx_services_sort_order ON services(sort_order);

-- Team
CREATE INDEX IF NOT EXISTS idx_team_sort_order ON team(sort_order);
CREATE INDEX IF NOT EXISTS idx_team_created_at ON team(created_at DESC);

-- Portfolio
CREATE INDEX IF NOT EXISTS idx_portfolio_sort_order ON portfolio(sort_order);

-- Groups
CREATE INDEX IF NOT EXISTS idx_groups_sort_order ON groups(sort_order);

-- Todos
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_sort_order ON todos(sort_order);

-- Contact messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
