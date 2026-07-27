-- Migration 007: platform_settings, api_keys, and church lifecycle columns
CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    prefix TEXT NOT NULL,
    hash TEXT NOT NULL,
    scopes TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys (prefix);

ALTER TABLE churches
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'provisioning')),
    ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
