-- Contact messages (prayer requests and visit inquiries)
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_type VARCHAR(50) NOT NULL DEFAULT 'contact', -- 'prayer', 'visit', 'contact'
    name VARCHAR(255) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL DEFAULT '',
    phone VARCHAR(100) NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    category VARCHAR(255) NOT NULL DEFAULT '',
    anonymous BOOLEAN NOT NULL DEFAULT false,
    visit_date VARCHAR(100) NOT NULL DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'new', -- 'new', 'read', 'responded'
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_type ON contact_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
