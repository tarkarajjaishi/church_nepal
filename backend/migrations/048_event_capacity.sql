-- Event capacity for RSVP waitlist management
ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0;
