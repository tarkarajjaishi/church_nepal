CREATE TABLE IF NOT EXISTS stripe_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    session_id VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stripe_sessions_church_id ON stripe_sessions (church_id);
CREATE INDEX IF NOT EXISTS idx_stripe_sessions_session_id ON stripe_sessions (session_id);
