# ChurchNepal — Architecture

> Authored by the lead architect. This document maps **both** applications in the
> repository — the **Church app** (`backend/` Rust API + `nextjs/` frontend) and
> the **Master Control plane** (`control-plane/`) — and explains how a single
> backend process serves dozens of independent church sites.

---

## 1. What this is

ChurchNepal is a **multi-tenant church management platform**. One *master control*
site provisions and governs many independent *church sites*. Each church gets its
own:

- **subdomain** label — e.g. `gracechurchkathmandu.churchnepal.com`
- **Postgres database** — named exactly after the subdomain label
- **file storage folder** — `storage/<slug>/`

All of this is routed through a **single** church backend process that resolves
the tenant on every request (see §3). No per-church server is ever spawned.

### Component overview

| Component | Path | Dev port | Stack |
|---|---|---|---|
| Master control UI | `control-plane/nextjs` | 3200 | Next.js (App Router) + React |
| Master control API | `control-plane/backend` | 3100 | Rust / Axum 0.8 |
| Church app UI | `nextjs` | 3000 locally, 3005 in queue smoke runs | Next.js App Router + React 19 + shadcn/ui + Tailwind |
| Church app API | `backend` | 3002 | Rust / Axum 0.8 + SQLx 0.8 |
| PostgreSQL | Docker | 5432 | PostgreSQL 16 |
| Reverse proxy | `Caddyfile` | 80/443 | Caddy (wildcard `*.churchnepal.com`) |

Ports are defined in the `Caddyfile`, Rust env config, and each `package.json`.
Caddy routes `/api/*` and `/uploads/*` to the Rust backends and everything else
to the appropriate Next.js UI while preserving the incoming `Host` header.

---

## 2. Request / data flow (high level)

```mermaid
flowchart TB
    Browser[Browser] --> Caddy[Caddy reverse proxy<br/>Host-based routing]
    Caddy -->|church subdomain| ChurchUI[nextjs/ :3000]
    Caddy -->|apex domain| ControlUI[control-plane/nextjs :3200]
    ChurchUI -->|/api/* same subdomain| ChurchAPI[backend/ :3002]
    ControlUI -->|/api/*| ControlAPI[control-plane/backend :3100]
    ChurchAPI --> TenantMW[Tenant middleware<br/>Host -> slug -> DB pool]
    TenantMW --> PG[(Postgres<br/>per-church databases)]
    ChurchAPI --> Store[(storage/&lt;slug&gt;/)]
    ControlAPI --> ControlDB[(churchnepal_control DB)]
    ControlAPI -->|CREATE DATABASE + migrations| PG
```

Key facts:

- The frontend discovers the API origin dynamically so the **same subdomain**
  reaches the tenant middleware and therefore the right database:
  ```typescript
  // nextjs/lib/apiBase.ts
  API_ORIGIN = NEXT_PUBLIC_API_URL || `${location.protocol}//${location.hostname}:3002`
  ```
  At `gracechurchkathmandu.localhost:3005` the browser calls
  `gracechurchkathmandu.localhost:3002/api/...`.
- All API responses are **snake_case** (Postgres convention). A response
  interceptor converts them to **camelCase** on the client (`nextjs/lib/api.ts`).
- There is **no global church database** for church data. The only shared DB is
  `churchnepal_control`, which stores the church *registry* and super-admins.

---

## 3. Tenant resolution: Host → slug → DB + storage

This is the heart of the system. Implemented in `backend/src/tenant.rs`.

### 3.1 The universal key

> **slug == database name == storage folder == subdomain label**

Because of this invariant there is no lookup table required to find a church's
resources — resolution is a direct string mapping.

### 3.2 Resolution algorithm

On **every** request the `tenant_mw` middleware (`backend/src/main.rs:35`) runs:

```text
Host: gracechurchkathmandu.churchnepal.com
        │
        ▼  subdomain_from_host()
"gracechurchkathmandu"
        │
        ▼  pool_for()  ->  pg_base_url / gracechurchkathmandu
PgPool opened + cached (max 5 connections)
        │
        ▼  inject into request extensions
req.extensions.insert(PgPool)      // used by the `Db` extractor
req.extensions.insert(TenantSlug)  // used by storage / upload paths
```

Rules (`backend/src/tenant.rs`):

- `subdomain_from_host(host, base_domain)` strips the port, then takes the **first
  DNS label**. If the host equals `base_domain` (apex) or `www`, or there is no
  subdomain, it returns `None` (not a church request).
- On `localhost` with no subdomain, it falls back to the `DEFAULT_TENANT` env var.
- `valid_slug()` in the church backend accepts 3–63 chars, starting with a
  lowercase letter, made of `[a-z0-9_]`. This acts as the connection-string
  safety guard when the slug is interpolated into the database URL.
- Provisioning is stricter: `control-plane/backend/src/provision.rs` creates
  slugs with lowercase ASCII letters/digits only (`[a-z0-9]`) and validates the
  same range before running `CREATE DATABASE`.
- Pools are lazily opened and cached in `Arc<Mutex<HashMap<_, PgPool>>>`.

### 3.3 Handler data access (the `Db` extractor)

Handlers **never** take `State<PgPool>`. They extract the tenant-resolved pool
via the `Db` extractor:

```rust
pub async fn list(Db(db): Db) -> Result<Json<Vec<Sermon>>, AppError> {
    let rows = sqlx::query_as::<_, Sermon>("SELECT * FROM sermons ORDER BY date DESC")
        .fetch_all(&*db).await?;
    Ok(Json(rows))
}
```

This makes every handler tenant-aware by default — no manual wiring.

### 3.4 Storage resolution

Uploads are kept per church under `storage/<slug>/`. The upload handler
(`backend/src/handlers/upload.rs`) derives the directory from `TenantSlug`:

```rust
fn storage_dir(slug: &str) -> PathBuf { Path::new(&storage_root()).join(slug) }
```

Files are served back through `/uploads/<filename>`, which is tenant-scoped by
the same middleware, so a church only ever reads its own folder.

### 3.5 Sequence diagram

```mermaid
sequenceDiagram
    participant Browser
    participant Caddy as Caddy (reverse proxy)
    participant Rust as Church Backend (:3002)
    participant TMW as Tenant Middleware
    participant DB as Postgres (<slug> DB)
    participant Storage as storage/<slug>/

    Browser->>Caddy: GET gracechurch.churchnepal.com/events
    Caddy->>Rust: Proxy request (Host: gracechurch.churchnepal.com)
    Rust->>TMW: tenant_mw()
    TMW->>TMW: subdomain_from_host("gracechurch.churchnepal.com") → "gracechurch"
    TMW->>DB: pool_for("gracechurch") → pg_base/gracechurch
    TMW-->>Rust: inject PgPool + TenantSlug into request
    Rust->>DB: SELECT * FROM events
    DB-->>Rust: rows
    Rust-->>Browser: JSON response
```

---

## 4. Content Blocks CMS model

The CMS is a **single, flexible table** that stores every editable piece of
content on the site. There is **zero hardcoded content** — every string, image,
and list is editable from the admin and persisted here.

### 4.1 Schema

```sql
CREATE TABLE content_blocks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key VARCHAR(255) UNIQUE NOT NULL,  -- e.g. "hero", "footer_columns"
    title       TEXT NOT NULL DEFAULT '',
    subtitle    TEXT,
    body        TEXT,
    image       TEXT,
    icon        TEXT,
    items       JSONB,            -- structured list data (nav, footer cols, FAQ...)
    enabled     BOOLEAN DEFAULT TRUE,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 How it works

- Each homepage section, page block, and UI element maps to a **`section_key`**
  (e.g. `hero`, `service_times`, `ministries`, `footer_columns`,
  `social_links`, `announcement_bar`).
- The `items` **JSONB** column holds structured data — arrays of objects for
  nav items, footer columns, FAQ pairs, stats, etc.
- `enabled` controls visibility; `sort_order` controls display order.
- Admin reorders via drag-and-drop → `PATCH /api/content-blocks/reorder`.
- Public frontend reads via `GET /api/content-blocks/enabled` or
  `GET /api/content-blocks/key/<key>`.
- The `EditableBlock` component (`nextjs/components/site/EditableBlock.tsx`)
  wraps inline editing with a pencil icon in the admin preview.

### 4.3 Reused patterns (the "headless" contract)

The whole product follows these conventions so features stay consistent:

| Pattern | Purpose |
|---|---|
| `content_blocks` + `EditableBlock` | Headless editable text/image/list content |
| `CrudPage` | Standard admin CRUD scaffold for a resource |
| `ItemsEditor` | Add / remove / reorder / edit fields inside a list-type block |
| `MediaPicker` | Pick an uploaded image from the per-church media library |
| React-Query hooks (one per resource) | List / get / create / update / delete with snake→camel mapping |

### 4.4 Example seed

```sql
INSERT INTO content_blocks (section_key, title, subtitle, icon, enabled, sort_order, items)
VALUES ('hero', 'Welcome to God''s House',
        'A loving community in the heart of Nepal...', 'Sparkles', true, 0,
        '[{"text":"Faith • Hope • Love","type":"tagline"}]')
ON CONFLICT (section_key) DO NOTHING;
```

All apostrophes inside SQL string literals are escaped as `''`.

---

## 5. Authentication (JWT)

Both apps use the **same JWT pattern** but with **separate signing secrets**, so
a church-admin token cannot be used to manage other churches or the control
plane.

### 5.1 Church app auth (`backend/src/auth.rs`)

- **Login:** `POST /api/auth/login` validates the bcrypt hash from `users`,
  returns a JWT (24h expiry).
- **Token:** `Authorization: Bearer <jwt>` on all write endpoints.
- **Claims:** `{ sub: user_id, email, role, exp }`.
- **Extractors:**
  - `AuthUser` — decodes the JWT → `user_id`, `email`, `role`. Returns `401`
    when missing/invalid.
  - `AdminGuard` — wraps `AuthUser` and calls `require_admin()` → `403` when
    `role != 'admin'`.
- Tokens are signed with the church app's `JWT_SECRET` only.

```rust
pub fn require_admin(&self) -> Result<(), StatusCode> {
    if self.role == "admin" { Ok(()) } else { Err(StatusCode::FORBIDDEN) }
}
```

### 5.2 Control plane auth (`control-plane/backend/src/auth.rs`)

- **Login:** `POST /api/auth/login` validates against `control_admins`.
- **Whoami:** `GET /api/auth/me` returns the current super-admin.
- **Extractor:** `SuperAdmin` decodes the JWT → `id` + `email`.
- **Bootstrap:** on first startup the control DB is auto-created if missing,
  migrations run, and the super-admin is seeded from `SUPER_ADMIN_EMAIL` /
  `SUPER_ADMIN_PASSWORD`.
- **Surface:** `/auth/login`, `/auth/me`, `GET|POST /churches`,
  `DELETE /churches/{id}`.

### 5.3 Frontend

- `nextjs/lib/auth.tsx` owns admin login state and local token storage.
- `nextjs/lib/api.ts` attaches `Authorization: Bearer <token>` and redirects to
  `/admin/login` on `401`.
- `nextjs/app/admin/layout.tsx` wraps admin pages with the admin shell/guard.
- `control-plane/nextjs` mirrors the same browser-token pattern for
  super-admin sessions against the control-plane API.

### 5.4 Flow diagram

```mermaid
sequenceDiagram
    participant Admin
    participant UI as Church Admin UI
    participant API as Church API (:3002)
    participant DB as <slug> DB (users)

    Admin->>UI: email + password
    UI->>API: POST /api/auth/login
    API->>DB: SELECT password_hash WHERE email=?
    DB-->>API: bcrypt hash
    API->>API: verify bcrypt -> create_token(24h, role=admin)
    API-->>UI: { token }
    UI->>UI: store token (localStorage)
    Admin->>UI: open admin page
    UI->>API: GET /api/people  (Authorization: Bearer <token>)
    API->>API: AdminGuard -> require_admin()
    API->>DB: SELECT ... FROM people
    DB-->>API: rows
    API-->>UI: JSON
```

---

## 6. Provisioning: DB + storage + admin

Implemented in `control-plane/backend/src/provision.rs`. When a super-admin
creates a church from the control plane:

```mermaid
sequenceDiagram
    participant SA as Super Admin
    participant UI as Control Plane UI (:3200)
    participant API as Control API (:3100)
    participant PG as PostgreSQL (superuser)
    participant FS as storage/

    SA->>UI: Church name "Grace Church"
    UI->>API: POST /api/churches { name: "Grace Church" }
    API->>API: slugify("Grace Church") → "gracechurch"
    API->>PG: CREATE DATABASE "gracechurch"
    API->>PG: run backend/migrations/*.sql (sorted) into "gracechurch"
    API->>FS: mkdir storage/gracechurch/
    API->>PG: INSERT users (admin@gracechurch.churchnepal.com, bcrypt)
    API->>PG: INSERT churches (name, slug, db_name, storage_path, subdomain, admin_email)
    API-->>UI: { slug, subdomain, admin_email, admin_password (shown once) }
    UI-->>SA: Display credentials
```

Step by step (`provision_church`):

1. `slugify(name)` → lowercase alphanumeric only, truncated to ≤63 chars.
   `"Grace Church Kathmandu"` → `"gracechurchkathmandu"`.
2. `create_database` — connects as superuser, checks the DB doesn't already
   exist, then `CREATE DATABASE "<slug>"` (identifier is validated so it is
   injection-safe).
3. `run_church_migrations` — reads `backend/migrations/*.sql`, sorts them
   lexically (matching a plain `files.sort()`), and executes each with
   `sqlx::raw_sql` (one transaction per file). This applies schema **and** seed
   data (content blocks, dummy content).
4. `create_storage` — `mkdir storage/<slug>/`.
5. `seed_church_admin` — inserts a `users` row with
   `email = admin@<slug>.<base_domain>`, a random 14-char bcrypt-hashed
   password, `role = 'admin'`. The **plaintext password is only returned here**,
   never stored or logged.

**Deprovisioning** (`deprovision`): terminate connections → `DROP DATABASE
"<slug>"` → `rm -rf storage/<slug>/`.

---

## 7. Folder structure

```
FullProductionSetup-main/
├── ARCHITECTURE.md                  # This file
├── docker-compose.yml               # Postgres + Redis + app services
├── Caddyfile                        # Reverse proxy (Host-based routing)
│
├── backend/                         # Church app API (Rust / Axum 0.8)
│   ├── Cargo.toml                   # axum 0.8, sqlx 0.8, jsonwebtoken, bcrypt
│   ├── migrations/                  # 40+ .sql files — schema + seeds (001..045)
│   │   ├── 001_init.sql             # Core tables
│   │   ├── 006_seed_content_blocks.sql
│   │   ├── 028_create_people_crm.sql
│   │   ├── 030_all_remaining_features.sql
│   │   └── 045_seed_gift_fund_allocation.sql
│   └── src/
│       ├── main.rs                  # Axum server, tenant middleware, CORS
│       ├── tenant.rs                # TenantRegistry, subdomain resolution, Db extractor
│       ├── auth.rs                  # JWT, AuthUser + AdminGuard extractors
│       ├── db.rs                    # Legacy single-pool helper (superseded)
│       ├── config.rs                # Env-based config
│       ├── error.rs                 # AppError → JSON response
│       ├── routes.rs                # All /api/* route definitions
│       ├── handlers/                # One module per resource (~40)
│       │   ├── auth.rs, users.rs, sermons.rs, ministries.rs, events.rs,
│       │   ├── people.rs, donations.rs, groups.rs, forms.rs, broadcasts.rs,
│       │   ├── content_blocks.rs, settings.rs, upload.rs, dashboard.rs,
│       │   ├── attendance.rs, volunteers.rs, pledges.rs, reports.rs, ...
│       ├── models/                  # SQLx model structs
│       └── payment/                 # eSewa + Khalti integration
│           ├── esewa.rs
│           └── khalti.rs
│
├── nextjs/                          # Church app frontend (Next.js App Router)
│   ├── package.json                 # Next 16, React 19, axios, react-query, sonner, motion
│   ├── tailwind.config.ts
│   ├── app/
│   │   ├── layout.tsx               # Root layout (ThemeProvider, SiteThemeApplier)
│   │   ├── (site)/                  # Public pages (route group)
│   │   │   ├── layout.tsx           # Navbar + Footer + AnnouncementBar + FloatingButtons
│   │   │   ├── page.tsx             # Homepage
│   │   │   ├── about/, contact/, events/, gallery/, give/, groups/,
│   │   │   ├── leadership/, live/, ministries/, pastor/, prayer/,
│   │   │   ├── privacy/, sermons/, terms/, visit/, volunteer/, membership/
│   │   ├── admin/                   # Per-church admin
│   │   │   ├── layout.tsx           # AuthGuard + AdminNav sidebar
│   │   │   ├── dashboard/, people/, giving/, groups/, events/, forms/,
│   │   │   ├── sermons/, ministries/, content-blocks/, settings/, ...
│   │   ├── api/                     # Next.js API routes (if any)
│   │   └── bible/                   # Bible reader
│   ├── components/
│   │   ├── site/                    # Public site components
│   │   │   ├── HomepageSections.tsx  # Section orchestrator (sort_order + visibility)
│   │   │   ├── EditableBlock.tsx     # Inline CMS editor
│   │   │   ├── Navbar.tsx, Footer.tsx, AnnouncementBar.tsx, ...
│   │   ├── admin/                   # Admin components (Layout, AdminNav, CrudPage, ...)
│   │   ├── ui/                      # shadcn/ui primitives (Button, Dialog, Table, ...)
│   │   ├── theme/                   # ThemeProvider, SiteThemeApplier, ThemeCustomizer
│   │   └── bible/                   # Bible components
│   └── lib/
│       ├── api.ts                   # Axios instance + snake→camel interceptor
│       ├── apiBase.ts               # Dynamic API origin (subdomain-aware)
│       ├── auth.tsx                 # AuthProvider, login/logout, token management
│       ├── hooks.ts                 # Compatibility exports for React Query hooks
│       ├── hooks/                   # One hook module per resource
│       ├── language.tsx             # EN/NE language context
│       ├── providers.tsx            # QueryClientProvider wrapper
│       └── types.ts                 # Shared TypeScript types
│
├── control-plane/                   # Master control (governs all churches)
│   ├── backend/                     # Control plane API (Rust / Axum 0.8)
│   │   ├── Cargo.toml               # axum 0.8, sqlx 0.8, bcrypt, jsonwebtoken, rand
│   │   ├── migrations/
│   │   │   └── 001_control.sql      # control_admins + churches tables
│   │   └── src/
│   │       ├── main.rs              # Server, auto-create control DB, seed super-admin
│   │       ├── handlers.rs          # login, list/create/delete churches
│   │       ├── provision.rs         # Full provisioning pipeline (DB+storage+admin)
│   │       ├── auth.rs              # SuperAdmin extractor + JWT
│   │       ├── config.rs            # pg_super_url, church_migrations_dir, storage_root, ...
│   │       └── error.rs
│   └── nextjs/                      # Control plane UI
│       ├── package.json             # Next 16 + React 19
│       └── app/
│           ├── page.tsx             # Redirect/entry
│           ├── layout.tsx           # Root HTML shell
│           └── admin/page.tsx       # Church management dashboard
│
├── storage/                         # Per-church file uploads (gitignored)
│   └── <slug>/                      # one folder per church
│
└── config/
    └── tenants.json                 # Legacy/static tenant config, not used for DB resolution
```

---

## 8. Database tables

### Control plane DB (`churchnepal_control`)

| Table | Purpose |
|---|---|
| `control_admins` | Super-admin accounts (email, bcrypt hash, name) |
| `churches` | Registry of all provisioned churches (name, slug, db_name, storage_path, subdomain, status) |

### Per-church DB (`<slug>`)

Every church has its own database with the full schema. The migrations in
`backend/migrations/` (lexically sorted, `*.sql` only; a
`001_initial_schema.sql.disabled` file is skipped because it does not end in
`.sql`) are applied to each church DB at provisioning time.

**Migration integrity — verified.** All migration files run, in order, against a
fresh throwaway database with `ON_ERROR_STOP=1`. Both statement-by-statement and
per-file transaction passes complete with zero errors and produce **46 tables**.
Seed data is present after migration: `content_blocks` ≈ 70 rows, `people` ≈ 42
rows. The CRM tables — `people`, `households`, `tags`, `person_tags`,
`person_notes`, `groups`, `group_memberships` — are all present.

**The 46 tables:**

| Category | Tables |
|---|---|
| **Auth** | `users` |
| **CMS** | `content_blocks`, `settings` |
| **Content** | `sermons`, `ministries`, `events`, `leaders`, `gallery`, `testimonies`, `notices`, `members`, `service_times`, `services`, `verses`, `campaigns`, `blog_posts`, `portfolio`, `contact_info`, `team` |
| **CRM — People** | `people`, `households`, `tags`, `person_tags`, `person_notes` |
| **Groups** | `groups`, `group_memberships` |
| **Giving** | `donations`, `funds`, `recurring_donations`, `pledges`, `offerings`, `offering_items` |
| **Events / Attendance** | `event_rsvps`, `attendance` |
| **Comms** | `broadcasts`, `broadcast_recipients`, `newsletter_subscribers`, `contact_messages`, `forms`, `form_submissions` |
| **Volunteers** | `volunteer_teams`, `volunteer_shifts`, `volunteer_assignments` |
| **Admin / misc** | `todos`, `audit_log`, `member_applications` |

Alphabetical: `attendance`, `audit_log`, `blog_posts`, `broadcast_recipients`,
`broadcasts`, `campaigns`, `contact_info`, `contact_messages`,
`content_blocks`, `donations`, `event_rsvps`, `events`, `form_submissions`,
`forms`, `funds`, `gallery`, `group_memberships`, `groups`, `households`,
`leaders`, `member_applications`, `members`, `ministries`,
`newsletter_subscribers`, `notices`, `offering_items`, `offerings`, `people`,
`person_notes`, `person_tags`, `pledges`, `portfolio`, `recurring_donations`,
`sermons`, `service_times`, `services`, `settings`, `tags`, `team`,
`testimonies`, `todos`, `users`, `verses`, `volunteer_assignments`,
`volunteer_shifts`, `volunteer_teams`.

---

## 9. Tech stack details

### Backend (Rust)

- **Framework:** Axum 0.8 with tower-http CORS.
- **Database:** SQLx 0.8 (async) + PostgreSQL 16; multi-tenant via the `Db`
  extractor (per-request pool).
- **Auth:** jsonwebtoken (HS256, 24h) + bcrypt.
- **Payments:** eSewa + Khalti (reqwest for HTTP, hmac/sha2 for signature
  verification).
- **File uploads:** multipart (image-only, 10 MB cap) stored to
  `storage/<slug>/`.

### Frontend (Next.js)

- **Framework:** Next.js (App Router) + React 19.
- **UI:** shadcn/ui + Tailwind CSS + Radix primitives.
- **State:** @tanstack/react-query for server state.
- **HTTP:** axios with snake→camel interceptor + auto-bearer-token.
- **Styling:** CSS variables for theming (ThemeCustomizer writes to `settings`).
- **i18n:** Language context (EN/NE) via `lib/language.tsx`.
- **Animation:** framer-motion (homepage sections).

### Infrastructure

- **Database:** single PostgreSQL 16 instance, one database per church.
- **Reverse proxy:** Caddy (wildcard SSL, Host-based routing).
- **Cache:** Redis 7 (available for sessions / rate limiting).
- **Containerization:** Docker Compose for local dev.

---

## 10. Environment variables

### Church backend (`backend/.env`)

| Variable | Purpose |
|---|---|
| `PG_BASE_URL` | `postgres://user:pass@host:port` (no trailing DB name) |
| `DEFAULT_TENANT` | Fallback slug for localhost dev |
| `BASE_DOMAIN` | Apex domain (default `churchnepal.com`) |
| `JWT_SECRET` | HS256 signing key |
| `STORAGE_ROOT` | Path to `storage/` (defaults to `../storage`) |
| `PORT` | Listen port (default 3002) |

### Church frontend (`nextjs/.env.local`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | API origin (default: same hostname on :3002) |

### Control plane backend (`control-plane/backend/.env`)

| Variable | Purpose |
|---|---|
| `CONTROL_DATABASE_URL` | Connection to `churchnepal_control` DB |
| `PG_SUPER_URL` | Superuser connection (for `CREATE DATABASE`) |
| `JWT_SECRET` | **Separate** secret for control-plane tokens |
| `CHURCH_MIGRATIONS_DIR` | Path to `backend/migrations/` |
| `STORAGE_ROOT` | Path to `storage/` |
| `BASE_DOMAIN` | Apex domain |
| `SUPER_ADMIN_EMAIL` | Bootstrap super-admin email |
| `SUPER_ADMIN_PASSWORD` | Bootstrap super-admin password |

### Control plane UI (`control-plane/nextjs/.env.local`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Control plane API origin |

---

## 11. Key design decisions

1. **One process, many databases** — the church backend never starts a
   per-church server; tenant resolution happens per-request via middleware. One
   deploy serves all churches.
2. **Slug as universal key** — the church slug is the database name, storage
   folder, and subdomain label. No lookup table is needed to find a church's
   resources.
3. **Content blocks as CMS** — a single `content_blocks` table with JSONB
   `items` provides a flexible, headless CMS. Every editable string, image, and
   list is stored here, never hardcoded.
4. **`Db` extractor pattern** — handlers never receive `State<PgPool>`. The `Db`
   extractor pulls the tenant-resolved pool from request extensions, making every
   handler tenant-aware by default.
5. **Separate JWT secrets** — control plane and church app use different signing
   keys, so a church admin token cannot manage other churches.
6. **Migrations double as seed data** — SQL migrations include both schema and
   seed data (content blocks, dummy content), so a freshly provisioned church is
   a complete, demoable site.
7. **Injection-safe identifiers** — slugs are validated to `[a-z0-9]` before
   being interpolated into `CREATE DATABASE` / connection URLs; apostrophes in
   SQL literals are escaped as `''`.
