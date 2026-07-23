ALTER TABLE testimonies ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'pending';
CREATE INDEX IF NOT EXISTS idx_testimonies_status ON testimonies(status);