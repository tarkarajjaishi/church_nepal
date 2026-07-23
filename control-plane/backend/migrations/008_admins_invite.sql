-- Migration 008: add invite token columns to admins
ALTER TABLE admins ADD COLUMN IF NOT EXISTS invite_token TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_admins_invite_token ON admins (invite_token);
