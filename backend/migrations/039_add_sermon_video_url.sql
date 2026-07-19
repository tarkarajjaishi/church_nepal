-- Add missing video_url column to sermons (model expects it but 001_init.sql didn't include it)
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS video_url TEXT;
