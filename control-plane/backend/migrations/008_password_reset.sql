CREATE TABLE IF NOT EXISTS password_resets (
    token_hash TEXT PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES admins(id),
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_password_resets_admin_id ON password_resets(admin_id);
