-- Add is_pinned column to verses for "Verse of the Day" pinning
ALTER TABLE verses ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Pin the first verse as default "Verse of the Day"
UPDATE verses SET is_pinned = TRUE WHERE id = (
    SELECT id FROM verses ORDER BY created_at ASC LIMIT 1
);
