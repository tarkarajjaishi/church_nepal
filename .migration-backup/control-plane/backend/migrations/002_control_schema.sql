-- Control DB schema pass: add columns needed across the build.
-- These are used for plan assignment, custom domains, activity tracking, and notes.

-- Add new columns to churches table
ALTER TABLE churches ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS storage_bytes BIGINT DEFAULT 0;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add index on status for filtering churches by status (slug already indexed in 001_control.sql)
CREATE INDEX IF NOT EXISTS idx_churches_status ON churches (status);

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_churches_slug_status ON churches (slug, status);