CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_name VARCHAR(255) NOT NULL DEFAULT '',
    donor_email VARCHAR(255) NOT NULL DEFAULT '',
    donor_phone VARCHAR(50) NOT NULL DEFAULT '',
    amount BIGINT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    campaign_id UUID,
    transaction_id VARCHAR(255) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_payment_method ON donations(payment_method);
CREATE INDEX idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX idx_donations_campaign_id ON donations(campaign_id);
