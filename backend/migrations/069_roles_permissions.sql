-- Roles and permissions.
--
-- Until now authorisation was binary: `users.role = 'admin'` meant every
-- module, including the giving records. A church that wants a librarian who
-- cannot read donor history, or a finance officer who cannot edit the website,
-- had no way to say so.
--
-- Deliberately absent: a `permissions` table an administrator can add rows to.
--
-- A permission string only means anything if code checks it. A row invented in
-- the UI would grant nothing and deny nothing, while looking in every screen
-- exactly like a real one — the worst kind of security control, the sort that
-- reassures without protecting. The catalogue lives in the binary
-- (`src/permissions.rs`); this table is seeded from it so the UI can list and
-- describe what exists, and a stale row is visible rather than authoritative.
--
-- Roles, by contrast, are data: which permissions a "Worship Leader" holds is
-- genuinely a per-church decision.

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(80) NOT NULL,
    name VARCHAR(160) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    -- Seeded roles cannot be deleted and their slug cannot change, because
    -- the backfill below and the tests refer to them by slug. Their permission
    -- set is still editable — that is the point of them being data.
    is_system BOOLEAN NOT NULL DEFAULT false,
    -- The one role that must always be able to fix a lockout. Enforced in the
    -- handler: the last user holding it cannot be stripped of it.
    is_superuser BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_slug ON roles(slug);

-- ---------------------------------------------------------------------------
-- Permission catalogue — a mirror of src/permissions.rs, for display only
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
    code VARCHAR(80) PRIMARY KEY,
    module VARCHAR(80) NOT NULL,
    label VARCHAR(160) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    -- Reading this module is itself sensitive (donor giving, personal data),
    -- so view and manage are separate permissions rather than one.
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- Which permissions a role holds
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission VARCHAR(80) NOT NULL,
    PRIMARY KEY (role_id, permission)
);

-- ---------------------------------------------------------------------------
-- Which roles a user holds. Permissions are the union of them.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_by VARCHAR(255) NOT NULL DEFAULT '',
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);
CREATE INDEX IF NOT EXISTS ix_user_roles_user ON user_roles(user_id);

-- ---------------------------------------------------------------------------
-- Seed the catalogue
-- ---------------------------------------------------------------------------
INSERT INTO permissions (code, module, label, description, sort_order) VALUES
    ('dashboard.view',      'Overview',      'See the dashboard',        'The church overview and the task list.', 1),
    ('content.manage',      'Website',       'Manage website content',   'Sermons, events, ministries, leaders, gallery, notices, blog and the pages themselves.', 2),
    ('settings.manage',     'Website',       'Change site settings',     'Theme, contact details and site-wide configuration.', 3),
    ('people.view',         'People',        'See people records',       'Names, contact details and the member directory.', 4),
    ('people.manage',       'People',        'Edit people records',      'Add, edit, import and delete people, groups and attendance.', 5),
    ('giving.view',         'Giving',        'See giving records',       'Donations, offerings, funds and who gave what. The most sensitive data in the system.', 6),
    ('giving.manage',       'Giving',        'Record and approve giving','Enter offerings, count cash, make deposits and issue refunds.', 7),
    ('worship.manage',      'Worship',       'Plan services',            'Service plans, song lists, team rotas and rehearsals.', 8),
    ('presentation.manage', 'Presentation',  'Run the screens',          'Slides, playlists, live control and display setup.', 9),
    ('assets.manage',       'Operations',    'Manage equipment',         'The asset register, check-outs, bookings and maintenance.', 10),
    ('library.manage',      'Operations',    'Run the library',          'The catalogue, lending, holds and fees.', 11),
    ('helpdesk.manage',     'Operations',    'Work the help desk',       'Raise, claim, answer and resolve support tickets.', 12),
    ('communication.manage','Communication', 'Contact the church',       'Broadcasts, newsletters, forms, prayer requests and enquiries.', 13),
    ('users.manage',        'Administration','Manage users and roles',   'Create accounts and decide what everyone else can do. Grants the ability to grant.', 14),
    ('audit.view',          'Administration','Read the audit log',       'Who did what, and the webhook delivery record.', 15),
    ('system.admin',        'Administration','Unrestricted access',      'Everything, including anything added later that has not been categorised yet.', 16)
ON CONFLICT (code) DO UPDATE
    SET module = EXCLUDED.module, label = EXCLUDED.label,
        description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;

-- ---------------------------------------------------------------------------
-- Seed roles
-- ---------------------------------------------------------------------------
INSERT INTO roles (slug, name, description, is_system, is_superuser, sort_order) VALUES
    ('administrator',        'Administrator',        'Everything, including managing what everyone else can do.', true, true, 1),
    ('pastor',               'Pastor',               'The whole church except the giving ledger and user administration.', true, false, 2),
    ('finance-officer',      'Finance Officer',      'Giving, offerings and deposits. No website, no user administration.', true, false, 3),
    ('worship-leader',       'Worship Leader',       'Service planning and the screens.', true, false, 4),
    ('media-tech',           'Media & Tech',         'Screens, equipment and support tickets.', true, false, 5),
    ('librarian',            'Librarian',            'The church library, and nothing else.', true, false, 6),
    ('facilities',           'Facilities',           'Equipment and building support tickets.', true, false, 7),
    ('communications',       'Communications',       'The website and everything sent out from it.', true, false, 8),
    ('volunteer-coordinator','Volunteer Coordinator','People, groups and getting hold of them.', true, false, 9),
    ('viewer',               'Viewer',               'The overview only. Nothing can be changed.', true, false, 10)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed each role's permissions
--
-- Only for roles that have none yet, so a church that has tuned "Pastor" does
-- not get its choices overwritten the next time migrations run.
-- ---------------------------------------------------------------------------
INSERT INTO role_permissions (role_id, permission)
SELECT r.id, p.permission
FROM roles r
JOIN (VALUES
    ('administrator', 'system.admin'),

    ('pastor', 'dashboard.view'), ('pastor', 'content.manage'),
    ('pastor', 'people.view'), ('pastor', 'people.manage'),
    ('pastor', 'giving.view'), ('pastor', 'worship.manage'),
    ('pastor', 'presentation.manage'), ('pastor', 'communication.manage'),
    ('pastor', 'helpdesk.manage'), ('pastor', 'audit.view'),
    ('pastor', 'library.manage'),

    ('finance-officer', 'dashboard.view'), ('finance-officer', 'giving.view'),
    ('finance-officer', 'giving.manage'), ('finance-officer', 'people.view'),
    ('finance-officer', 'audit.view'),

    ('worship-leader', 'dashboard.view'), ('worship-leader', 'worship.manage'),
    ('worship-leader', 'presentation.manage'),

    ('media-tech', 'dashboard.view'), ('media-tech', 'presentation.manage'),
    ('media-tech', 'assets.manage'), ('media-tech', 'helpdesk.manage'),

    ('librarian', 'dashboard.view'), ('librarian', 'library.manage'),

    ('facilities', 'dashboard.view'), ('facilities', 'assets.manage'),
    ('facilities', 'helpdesk.manage'),

    ('communications', 'dashboard.view'), ('communications', 'content.manage'),
    ('communications', 'settings.manage'), ('communications', 'communication.manage'),

    ('volunteer-coordinator', 'dashboard.view'),
    ('volunteer-coordinator', 'people.view'),
    ('volunteer-coordinator', 'people.manage'),
    ('volunteer-coordinator', 'communication.manage'),

    ('viewer', 'dashboard.view')
) AS p(role_slug, permission) ON p.role_slug = r.slug
WHERE NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Backfill: every existing admin becomes an Administrator
--
-- Without this, turning on permission checks would lock every current user out
-- of their own church the moment the new build shipped. After it, `user_roles`
-- is authoritative for real users and there is no ambiguity about what an
-- empty role list means: no access.
-- ---------------------------------------------------------------------------
INSERT INTO user_roles (user_id, role_id, granted_by)
SELECT u.id, r.id, 'migration 069'
FROM users u
CROSS JOIN roles r
WHERE r.slug = 'administrator'
  AND u.role = 'admin'
  AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id)
ON CONFLICT DO NOTHING;
