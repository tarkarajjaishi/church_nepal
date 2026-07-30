-- Asset Management module.
--
-- Money is BIGINT minor units (paisa) throughout, matching the offering
-- module. Never floating point for a purchase cost.
--
-- Deliberately absent: a stored `current_value` column. A depreciated value is
-- a function of purchase cost, date, method and useful life — storing it means
-- it is wrong the day after it is written, and every read has to wonder how
-- stale it is. It is computed on read instead (see handlers/assets.rs).

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asset_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(160) NOT NULL,
    slug VARCHAR(160) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    icon VARCHAR(60) NOT NULL DEFAULT 'Package',
    color VARCHAR(20) NOT NULL DEFAULT '#0b3c5d',
    -- Default straight-line life for assets in this category, so a projector
    -- does not have to be told it lasts 5 years every single time.
    default_useful_life_years INTEGER NOT NULL DEFAULT 5,
    is_reservable BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_asset_categories_slug ON asset_categories(slug);

-- ---------------------------------------------------------------------------
-- Suppliers / vendors
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL DEFAULT '',
    phone VARCHAR(100) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    website VARCHAR(255) NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_suppliers_name ON suppliers(lower(name));

-- ---------------------------------------------------------------------------
-- Assets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES asset_categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL DEFAULT '',
    serial_number VARCHAR(160) NOT NULL DEFAULT '',
    barcode VARCHAR(160) NOT NULL DEFAULT '',
    manufacturer VARCHAR(160) NOT NULL DEFAULT '',
    model VARCHAR(160) NOT NULL DEFAULT '',

    -- Purchase & depreciation inputs
    purchase_date DATE,
    purchase_cost BIGINT NOT NULL DEFAULT 0,
    salvage_value BIGINT NOT NULL DEFAULT 0,
    -- straight_line | declining_balance | none
    depreciation_method VARCHAR(30) NOT NULL DEFAULT 'straight_line',
    useful_life_years INTEGER NOT NULL DEFAULT 5,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    warranty_expires DATE,

    -- Where it lives
    building VARCHAR(160) NOT NULL DEFAULT '',
    room VARCHAR(160) NOT NULL DEFAULT '',
    department VARCHAR(160) NOT NULL DEFAULT '',

    -- excellent | good | fair | poor | broken
    condition VARCHAR(20) NOT NULL DEFAULT 'good',
    -- available | assigned | reserved | maintenance | repair | disposed | lost | retired
    status VARCHAR(20) NOT NULL DEFAULT 'available',

    photo TEXT NOT NULL DEFAULT '',
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT NOT NULL DEFAULT '',
    is_reservable BOOLEAN NOT NULL DEFAULT false,

    disposed_at DATE,
    disposal_reason TEXT NOT NULL DEFAULT '',

    created_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- A negative cost or a zero-year life would silently produce nonsense
    -- depreciation, so they are refused at the database rather than trusted.
    CONSTRAINT assets_cost_non_negative CHECK (purchase_cost >= 0),
    CONSTRAINT assets_salvage_non_negative CHECK (salvage_value >= 0),
    CONSTRAINT assets_salvage_not_above_cost CHECK (salvage_value <= purchase_cost),
    CONSTRAINT assets_useful_life_positive CHECK (useful_life_years > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_assets_code ON assets(asset_code);
-- Serial numbers are unique when present; blank is common and must not clash.
CREATE UNIQUE INDEX IF NOT EXISTS uq_assets_serial
    ON assets(lower(serial_number)) WHERE serial_number <> '';
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_warranty ON assets(warranty_expires)
    WHERE warranty_expires IS NOT NULL;

-- Asset codes come from a sequence row locked FOR UPDATE, the same mechanism
-- receipt numbers use, so two simultaneous creates cannot collide.
INSERT INTO receipt_sequences (scope, prefix, next_value, padding)
VALUES ('asset', 'AST', 1, 4)
ON CONFLICT (scope) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Assignments — who currently holds an asset
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asset_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    assigned_to VARCHAR(255) NOT NULL DEFAULT '',
    department VARCHAR(160) NOT NULL DEFAULT '',
    assigned_at DATE NOT NULL DEFAULT CURRENT_DATE,
    due_back DATE,
    returned_at DATE,
    condition_out VARCHAR(20) NOT NULL DEFAULT 'good',
    condition_in VARCHAR(20),
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_asset ON asset_assignments(asset_id);
-- One open assignment per asset. A partial unique index enforces it in the
-- database, so a race cannot hand the same projector to two people.
CREATE UNIQUE INDEX IF NOT EXISTS uq_asset_open_assignment
    ON asset_assignments(asset_id) WHERE returned_at IS NULL;

-- ---------------------------------------------------------------------------
-- Reservations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asset_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    requested_by VARCHAR(255) NOT NULL DEFAULT '',
    person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    purpose TEXT NOT NULL DEFAULT '',
    starts_on DATE NOT NULL,
    ends_on DATE NOT NULL,
    -- pending | approved | rejected | cancelled | collected | returned
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    reject_reason TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT reservations_dates_ordered CHECK (ends_on >= starts_on)
);
CREATE INDEX IF NOT EXISTS idx_asset_reservations_asset ON asset_reservations(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_reservations_status ON asset_reservations(status);

-- Two live reservations for the same asset may not overlap in time.
--
-- An EXCLUDE constraint rather than a check in the handler: a handler check
-- reads then writes, and two concurrent requests can both pass the read before
-- either writes. The database enforces this atomically, so the race simply
-- cannot happen. btree_gist supplies the equality operator for the uuid.
--
-- Only live states are constrained — a rejected or cancelled request must not
-- block the slot it was refused for.
--
-- The range is '[]', inclusive at both ends, so a booking that ends on the 5th
-- DOES block one starting on the 5th. That is intentional for a physical
-- object: the projector is still out on its last day, and assuming a same-day
-- handoff is how two groups end up standing in the car park with one camera.
-- Adjacent bookings (ends 5th, starts 6th) are fine.
ALTER TABLE asset_reservations DROP CONSTRAINT IF EXISTS asset_reservations_no_overlap;
ALTER TABLE asset_reservations ADD CONSTRAINT asset_reservations_no_overlap
    EXCLUDE USING gist (
        asset_id WITH =,
        daterange(starts_on, ends_on, '[]') WITH &&
    ) WHERE (status IN ('pending', 'approved', 'collected'));

-- ---------------------------------------------------------------------------
-- Maintenance
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asset_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    -- preventive | corrective | inspection | cleaning | calibration | replacement | repair
    maintenance_kind VARCHAR(30) NOT NULL DEFAULT 'preventive',
    title VARCHAR(255) NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    scheduled_for DATE,
    performed_on DATE,
    next_due DATE,
    technician VARCHAR(255) NOT NULL DEFAULT '',
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    cost BIGINT NOT NULL DEFAULT 0,
    -- scheduled | in_progress | completed | cancelled
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    condition_after VARCHAR(20),
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT maintenance_cost_non_negative CHECK (cost >= 0)
);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_asset ON asset_maintenance(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_status ON asset_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_due ON asset_maintenance(next_due)
    WHERE next_due IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_scheduled ON asset_maintenance(scheduled_for)
    WHERE scheduled_for IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Seed the category list from the spec.
-- `is_reservable` marks the things a church actually lends out.
-- ---------------------------------------------------------------------------
INSERT INTO asset_categories (name, slug, icon, color, default_useful_life_years, is_reservable, sort_order) VALUES
    ('Musical Instruments',  'musical-instruments',  'Music',        '#7c3aed', 10, true,  10),
    ('Speakers',             'speakers',             'Speaker',      '#0891b2', 8,  false, 20),
    ('Microphones',          'microphones',          'Mic',          '#0891b2', 5,  true,  30),
    ('Mixers',               'mixers',               'SlidersHorizontal','#0891b2', 8, false, 40),
    ('Projectors',           'projectors',           'Projector',    '#2563eb', 5,  true,  50),
    ('LED Screens',          'led-screens',          'MonitorPlay',  '#2563eb', 7,  false, 60),
    ('Computers',            'computers',            'Monitor',      '#0f766e', 4,  false, 70),
    ('Laptops',              'laptops',              'Laptop',       '#0f766e', 4,  true,  80),
    ('Printers',             'printers',             'Printer',      '#0f766e', 5,  false, 90),
    ('Networking',           'networking',           'Network',      '#0f766e', 6,  false, 100),
    ('CCTV',                 'cctv',                 'Cctv',         '#dc2626', 6,  false, 110),
    ('Cameras',              'cameras',              'Camera',       '#dc2626', 5,  true,  120),
    ('Lighting',             'lighting',             'Lightbulb',    '#d4a017', 8,  false, 130),
    ('Furniture',            'furniture',            'Armchair',     '#65a30d', 10, false, 140),
    ('Chairs',               'chairs',               'Armchair',     '#65a30d', 10, true,  150),
    ('Tables',               'tables',               'Table',        '#65a30d', 10, true,  160),
    ('Podiums',              'podiums',              'Presentation', '#65a30d', 12, true,  170),
    ('Air Conditioners',     'air-conditioners',     'AirVent',      '#0284c7', 8,  false, 180),
    ('Generators',           'generators',           'Zap',          '#ea580c', 12, false, 190),
    ('Vehicles',             'vehicles',             'Bus',          '#b91c1c', 10, true,  200),
    ('Buildings',            'buildings',            'Building2',    '#4f46e5', 40, false, 210),
    ('Office Equipment',     'office-equipment',      'Briefcase',    '#64748b', 6,  false, 220),
    ('Kitchen Equipment',    'kitchen-equipment',    'ChefHat',      '#16a34a', 8,  false, 230),
    ('Children Ministry',    'children-ministry',    'Baby',         '#db2777', 6,  true,  240),
    ('Cleaning Equipment',   'cleaning-equipment',   'Brush',        '#0d9488', 5,  false, 250),
    ('Other Assets',         'other-assets',         'Package',      '#64748b', 5,  false, 260)
ON CONFLICT (slug) DO NOTHING;
