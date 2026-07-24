-- Add directory opt-in flag to people table
ALTER TABLE people
ADD COLUMN IF NOT EXISTS directory_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

-- Optional: add index for performance
CREATE INDEX IF NOT EXISTS idx_people_directory_opt_in ON people(directory_opt_in);