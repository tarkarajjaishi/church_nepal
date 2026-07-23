-- Content scheduling: add published_at to blog_posts, notices, and sermons

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;
ALTER TABLE notices ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_notices_published_at ON notices(published_at);
CREATE INDEX IF NOT EXISTS idx_sermons_published_at ON sermons(published_at);
