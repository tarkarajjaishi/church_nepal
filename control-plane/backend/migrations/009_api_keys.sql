-- Migration 009: api keys table (one-time secret)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    last_four TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    revoked_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys (prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_revoked_at ON api_keys (revoked_at);
