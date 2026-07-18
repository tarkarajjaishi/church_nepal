-- Offering records (weekly/monthly offering tracking per service)
CREATE TABLE IF NOT EXISTS offerings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_date DATE NOT NULL,
    service_name VARCHAR(255) NOT NULL DEFAULT 'Sunday Service',
    offering_type VARCHAR(100) NOT NULL DEFAULT 'general', -- general, tithe, building, missions, special, thanksgiving
    total_amount BIGINT NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'NPR',
    recorded_by VARCHAR(255) NOT NULL DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offerings_service_date ON offerings(service_date DESC);
CREATE INDEX IF NOT EXISTS idx_offerings_type ON offerings(offering_type);

-- Individual offering line items (denomination/breakdown per offering)
CREATE TABLE IF NOT EXISTS offering_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
    denomination VARCHAR(100) NOT NULL, -- e.g. "Rs 1000", "Rs 500", "Rs 100", "Coin", "Online"
    count INTEGER NOT NULL DEFAULT 0,
    amount BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offering_items_offering ON offering_items(offering_id);

-- Seed content blocks for offering page
INSERT INTO content_blocks (section_key, title, subtitle, body, enabled, sort_order) VALUES
('offering_hero', 'Offering Records', 'Track and manage church offerings', 'Record weekly offerings, view history, and generate reports.', true, 0)
ON CONFLICT (section_key) DO NOTHING;
