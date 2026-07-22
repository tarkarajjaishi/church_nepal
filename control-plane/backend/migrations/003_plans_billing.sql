-- Plans and billing schema for the control plane
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
    price_annual NUMERIC(10,2) NOT NULL DEFAULT 0,
    max_members INTEGER NOT NULL DEFAULT 1000,
    max_storage_mb INTEGER NOT NULL DEFAULT 1024,
    max_emails INTEGER NOT NULL DEFAULT 1000,
    max_churches INTEGER NOT NULL DEFAULT 1,
    features JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plans_name ON plans (name);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_church_id ON invoices (church_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);

-- Seed default plans
INSERT INTO plans (name, price_monthly, price_annual, max_members, max_storage_mb, max_emails, max_churches, features)
VALUES 
    ('Free', 0, 0, 100, 100, 100, 1, '{"giving": true, "groups": true, "sermons": true}'::jsonb),
    ('Standard', 2900, 29000, 500, 500, 500, 1, '{"giving": true, "groups": true, "sermons": true, "events": true, "crm": true}'::jsonb),
    ('Pro', 9900, 99000, 5000, 2000, 2000, 5, '{"giving": true, "groups": true, "sermons": true, "events": true, "crm": true, "multi_admin": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;