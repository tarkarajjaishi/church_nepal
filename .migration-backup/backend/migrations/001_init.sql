-- Users (admin auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sermons
CREATE TABLE IF NOT EXISTS sermons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    speaker VARCHAR(255) NOT NULL,
    date VARCHAR(100) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    series VARCHAR(255) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    image TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ministries
CREATE TABLE IF NOT EXISTS ministries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_ne VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    leader VARCHAR(255) NOT NULL,
    meeting VARCHAR(255) NOT NULL,
    image TEXT NOT NULL,
    icon VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    date VARCHAR(100) NOT NULL,
    display_date VARCHAR(100) NOT NULL,
    time VARCHAR(50) NOT NULL,
    location VARCHAR(500) NOT NULL,
    image TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Leaders
CREATE TABLE IF NOT EXISTS leaders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image TEXT NOT NULL,
    bio TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Gallery
CREATE TABLE IF NOT EXISTS gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Testimonies
CREATE TABLE IF NOT EXISTS testimonies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    quote TEXT NOT NULL,
    image TEXT NOT NULL,
    rating INT NOT NULL DEFAULT 5,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Notices
CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    date VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    urgent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Members
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    since VARCHAR(20) NOT NULL,
    image TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Service Times
CREATE TABLE IF NOT EXISTS service_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_ne VARCHAR(255) NOT NULL,
    day VARCHAR(50) NOT NULL,
    time VARCHAR(50) NOT NULL,
    icon VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

-- Verses
CREATE TABLE IF NOT EXISTS verses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    ref_text VARCHAR(255) NOT NULL,
    ne TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    raised BIGINT NOT NULL DEFAULT 0,
    goal BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Content Blocks (CMS core)
CREATE TABLE IF NOT EXISTS content_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key VARCHAR(255) UNIQUE NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    subtitle TEXT,
    body TEXT,
    image TEXT,
    icon TEXT,
    items JSONB,
    enabled BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_blocks_section_key ON content_blocks (section_key);
CREATE INDEX IF NOT EXISTS idx_content_blocks_sort_order ON content_blocks (sort_order);
