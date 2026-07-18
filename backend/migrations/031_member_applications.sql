-- Member applications (Become a Member form submissions)
CREATE TABLE IF NOT EXISTS member_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(100) NOT NULL DEFAULT '',
    address TEXT,
    city VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(50),
    marital_status VARCHAR(50),
    baptism_status VARCHAR(50) DEFAULT 'not_baptized',
    church_background TEXT,
    how_found VARCHAR(255),
    interest_areas TEXT,
    testimony TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_applications_status ON member_applications(status);
CREATE INDEX IF NOT EXISTS idx_member_applications_created ON member_applications(created_at DESC);

-- Seed content block for the Become a Member page
INSERT INTO content_blocks (section_key, title, subtitle, body, enabled, sort_order) VALUES
('member_hero', 'Become a Member', 'Join Our Church Family', 'Fill out the form below to apply for membership at Grace Nepal Church. We would love to welcome you into our family.', true, 0)
ON CONFLICT (section_key) DO NOTHING;
