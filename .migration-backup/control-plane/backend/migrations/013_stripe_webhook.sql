-- Migration 013: Stripe webhook support
CREATE TABLE IF NOT EXISTS stripe_events (
    id BIGSERIAL PRIMARY KEY,
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON stripe_events (event_id);

ALTER TABLE IF EXISTS churches ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE IF EXISTS churches ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE IF EXISTS churches ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE IF EXISTS churches ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
