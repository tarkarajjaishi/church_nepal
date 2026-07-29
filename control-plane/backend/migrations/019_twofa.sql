-- Migration 011: two-factor auth (TOTP) support
ALTER TABLE IF EXISTS admins ADD COLUMN IF NOT EXISTS totp_secret TEXT;
ALTER TABLE IF EXISTS admins ADD COLUMN IF NOT EXISTS twofa_enabled BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_admins_twofa ON admins (twofa_enabled);
