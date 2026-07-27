-- Full-text search: tsvector columns + GIN indexes + triggers

-- Sermons full-text search (title, speaker, description, series, topic)
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
CREATE INDEX IF NOT EXISTS idx_sermons_search ON sermons USING GIN (search_vector);

-- Blog posts full-text search (title, content, excerpt, author, category)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
CREATE INDEX IF NOT EXISTS idx_blog_posts_search ON blog_posts USING GIN (search_vector);

-- Events full-text search (title, location, description)
ALTER TABLE events ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
CREATE INDEX IF NOT EXISTS idx_events_search ON events USING GIN (search_vector);

-- Members full-text search (name, email, phone, address, role)
ALTER TABLE members ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
CREATE INDEX IF NOT EXISTS idx_members_search ON members USING GIN (search_vector);

-- Triggers to auto-update search vectors
CREATE OR REPLACE FUNCTION update_sermon_search_vector() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.speaker, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW.series, '')), 'D') ||
        setweight(to_tsvector('english', coalesce(NEW.topic, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_blog_post_search_vector() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.excerpt, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW.author, '')), 'D') ||
        setweight(to_tsvector('english', coalesce(NEW.category, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_event_search_vector() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.location, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_member_search_vector() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.email, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.phone, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW.address, '')), 'D') ||
        setweight(to_tsvector('english', coalesce(NEW.role, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers if they don't exist
DROP TRIGGER IF EXISTS sermons_search_update ON sermons;
CREATE TRIGGER sermons_search_update BEFORE INSERT OR UPDATE ON sermons
    FOR EACH ROW EXECUTE FUNCTION update_sermon_search_vector();

DROP TRIGGER IF EXISTS blog_posts_search_update ON blog_posts;
CREATE TRIGGER blog_posts_search_update BEFORE INSERT OR UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_blog_post_search_vector();

DROP TRIGGER IF EXISTS events_search_update ON events;
CREATE TRIGGER events_search_update BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_event_search_vector();

DROP TRIGGER IF EXISTS members_search_update ON members;
CREATE TRIGGER members_search_update BEFORE INSERT OR UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_member_search_vector();

-- Populate existing search vectors
UPDATE sermons SET search_vector = 
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(speaker, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(series, '')), 'D') ||
    setweight(to_tsvector('english', coalesce(topic, '')), 'D');

UPDATE blog_posts SET search_vector = 
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(author, '')), 'D') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'D');

UPDATE events SET search_vector = 
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C');

UPDATE members SET search_vector = 
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(email, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(phone, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(address, '')), 'D') ||
    setweight(to_tsvector('english', coalesce(role, '')), 'D');