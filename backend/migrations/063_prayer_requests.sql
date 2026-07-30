-- Create the prayer_requests table.
--
-- This is a repair, not a new feature. The model (models/prayer_request.rs),
-- handler, routes and admin page have all existed for some time, but no
-- migration ever created the table — so GET /api/prayer-requests/public has
-- been returning 500 in every database, and the public prayer form could not
-- store anything.
--
-- Columns match what handlers/prayer_requests.rs selects and inserts, and the
-- `SELECT *` in those queries means the column ORDER must match the struct
-- field order in models/prayer_request.rs for sqlx to decode it.

CREATE TABLE IF NOT EXISTS prayer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL DEFAULT '',
    phone VARCHAR(100) NOT NULL DEFAULT '',
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    message TEXT NOT NULL,
    -- A request can be submitted anonymously; `is_public` is a separate,
    -- stricter decision made by an admin before it appears on the site.
    anonymous BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT false,
    pray_count INTEGER NOT NULL DEFAULT 0,
    -- pending | approved | answered | archived
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- The public list filters on status + is_public and orders by date; the admin
-- list orders by date alone.
CREATE INDEX IF NOT EXISTS idx_prayer_requests_created ON prayer_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_status ON prayer_requests(status);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_public
    ON prayer_requests(status, is_public, created_at DESC);
