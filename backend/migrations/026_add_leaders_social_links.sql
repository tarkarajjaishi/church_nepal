-- Add social_links JSONB column to leaders table (was referenced in code but missing from schema)
ALTER TABLE leaders ADD COLUMN IF NOT EXISTS social_links JSONB;
