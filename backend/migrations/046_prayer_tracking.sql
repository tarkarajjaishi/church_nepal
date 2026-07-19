-- Add notes and answered_at columns for prayer request tracking
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS answered_at TIMESTAMP;