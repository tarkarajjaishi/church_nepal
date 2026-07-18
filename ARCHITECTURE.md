# ChurchNepal Architecture

A multi-tenant church management platform that lets one master control site provision and govern dozens of independent church sites. Each church gets its own subdomain, Postgres database, and file storage — all routed through a single backend process.

---

## High-level architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DNS / Reverse Proxy                         │
│              Caddy (wildcard *.churchnepal.com)                     │
├──────────────────────┬──────────────────────────────────────────────┤
│  churchnepal.com     │  <slug>.churchnepal.com                     │
│  (control plane)     │  (church app)                               │
├──────────────────────┼──────────────────────────────────────────────┤
│ control-plane/nextjs │  nextjs/   (public site + admin)            │
│  :3200               │  :3000                                      │
├──────────────────────┼──────────────────────────────────────────────┤
│ control-plane/backend│  backend/   (multi-tenant Rust API)         │
│  :3100               │  :3002                                      │
├──────────────────────┼──────────────────────────────────────────────┤
│ churchnepal_control  │  <slug>     (one DB per church)             │
│ (single registry DB) │  (per-church DB)                            │
├──────────────────────┴──────────────────────────────────────────────┤
│                     PostgreSQL (single instance)                    │
│                    storage/<slug>/  (per-church files)              │
└─────────────────────────────────────────────────────────────────────┘
```

### Component overview

| Component | Path | Dev port | Stack |
|---|---|---|---|
| Master control UI | `control-plane/nextjs` | 3200 | Next.js (App Router) |
| Master control API | `control-plane/backend` | 3100 | Rust / Axum 0.8 |
| Church app UI | `nextjs` | 3000 | Next.js (App Router) + shadcn/ui + Tailwind |
| Church app API | `backend` | 3002 | Rust / Axum 0.8 + SQLx |
| PostgreSQL | Docker | 5432 | PostgreSQL 16 |

---

## Request / data flow

### 1. Tenant resolution (Host header → DB)

Every HTTP request to the church app backend carries a `Host` header. The tenant middleware (`backend/src/tenant.rs`) extracts the first DNS label and maps it to a Postgres database:

```
Host: gracechurchkathmandu.churchnepal.com
        ↓
subdomain_from_host() → "gracechurchkathmandu"
        ↓
pool_for("gracechurchkathmandu") → pg_base_url/gracechurchkathmandu
        ↓
req.extensions.insert(PgPool)   ← injected into every request
req.extensions.insert(TenantSlug("gracechurchkathmandu"))
```

**Key rules:**
- `slug == db name == storage folder == subdomain label`
- Slug validation: 3–63 chars, starts with lowercase letter, only `[a-z0-9_]`
- On `localhost` with no subdomain, falls back to `DEFAULT_TENANT` env var
- Pools are lazily opened and cached in a `Mutex<HashMap>`

### 2. Handler data access

Handlers do NOT use `State<PgPool>`. They extract the per-tenant pool via the `Db` extractor:

```rust
pub async fn list(Db(db): Db) -> Result<Json<Vec<Sermon>>, AppError> {
    let rows = sqlx::query_as::<_, Sermon>("SELECT * FROM sermons ORDER BY date DESC")
        .fetch_all(&*db).await?;
    Ok(Json(rows))
}
```

This makes every handler tenant-aware by default — no manual wiring needed.

### 3. Frontend API calls

The Next.js frontend discovers the API origin dynamically:

```typescript
// nextjs/lib/apiBase.ts
API_ORIGIN = NEXT_PUBLIC_API_URL || `${location.protocol}//${location.hostname}:3002`
```

When the browser is at `gracechurchkathmandu.localhost:3005`, it calls `gracechurchkathmandu.localhost:3002/api/...` — the same subdomain hits the tenant middleware, which resolves the correct database.

All API responses are snake_case (Postgres convention). A response interceptor converts them to camelCase on the client (`nextjs/lib/api.ts`).

---

## Tenant resolution flow (Mermaid)

```mermaid
sequenceDiagram
    participant Browser
    participant Caddy as Caddy (reverse proxy)
    participant Rust as Church Backend (:3002)
    participant TMW as Tenant Middleware
    participant DB as Postgres (<slug> DB)
    participant Storage as storage/<slug>/

    Browser->>Caddy: GET gracechurch. churchnepal.com/events
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

## Provisioning flow

When a super-admin creates a church from the control plane:

```mermaid
sequenceDiagram
    participant Admin as Super Admin
    participant UI as Control Plane UI (:3200)
    participant API as Control Plane API (:3100)
    participant PG as PostgreSQL (superuser)

    Admin->>UI: Enter church name "Grace Church"
    UI->>API: POST /api/churches { name: "Grace Church" }
    API->>API: slugify("Grace Church") → "gracechurch"
    API->>PG: CREATE DATABASE "gracechurch"
    API->>PG: Run backend/migrations/*.sql into "gracechurch"
    API->>API: mkdir storage/gracechurch/
    API->>PG: INSERT INTO users (admin@gracechurch.churchnepal.com, bcrypt hash)
    API->>PG: INSERT INTO churches (name, slug, db_name, storage_path, subdomain, admin_email)
    API-->>UI: { slug, subdomain, admin_email, admin_password (shown once) }
    UI-->>Admin: Display credentials
```

**Deprovisioning** (`provision.rs::deprovision`): terminates connections → `DROP DATABASE` → `rm -rf storage/<slug>/`.

---

## Auth (JWT)

Both apps use the same JWT pattern but with **separate secrets** (control-plane vs church app).

### Church app auth

- **Login:** `POST /api/auth/login` → validates bcrypt hash against `users` table → returns JWT (24h expiry)
- **Token:** `Authorization: Bearer <jwt>` header on all write endpoints
- **Extractors:** `AuthUser` (from `backend/src/auth.rs`) decodes the JWT and provides `user_id` + `email`
- **Claims:** `{ sub: user_id, email, exp }`

### Control plane auth

- **Login:** `POST /api/auth/login` → validates against `control_admins` table → returns JWT
- **Extractors:** `SuperAdmin` (from `control-plane/backend/src/auth.rs`) decodes JWT → `id` + `email`
- **Bootstrap:** On first startup, the super-admin is seeded from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` env vars

---

## Content Blocks CMS model

The CMS is built on a single `content_blocks` table that stores every editable piece of content across the site.

```sql
CREATE TABLE content_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key VARCHAR(255) UNIQUE NOT NULL,   -- e.g. "hero", "about_intro", "footer_columns"
    title TEXT NOT NULL DEFAULT '',
    subtitle TEXT,
    body TEXT,
    image TEXT,
    icon TEXT,
    items JSONB,           -- structured list data (nav items, footer columns, etc.)
    enabled BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**How it works:**
- Each homepage section, page block, and UI element maps to a `section_key`
- The `items` JSONB column holds structured data (arrays of objects for lists, nav items, footer columns, etc.)
- `enabled` controls visibility; `sort_order` controls display order
- Admin reorders via drag-and-drop → `PATCH /api/content-blocks/reorder`
- Public frontend reads via `GET /api/content-blocks/enabled` or `GET /api/content-blocks/key/<key>`
- `EditableBlock` component wraps inline editing with a pencil icon

**Example section keys:** `hero`, `service_times`, `ministries`, `events`, `sermons`, `testimonies`, `gallery`, `giving`, `verse_of_the_day`, `footer_columns`, `social_links`, `announcement_bar`

---

## Folder structure

```
FullProductionSetup-main/
├── ARCHITECTURE.md                  # This file
├── MULTI_TENANT_SETUP.md            # Setup guide
├── docker-compose.yml               # Postgres + Redis + app services
├── Caddyfile                        # Reverse proxy config
├── nginx.conf                       # Alternative reverse proxy
│
├── backend/                         # Church app API (Rust / Axum 0.8)
│   ├── Cargo.toml                   # axum 0.8, sqlx 0.8, jsonwebtoken, bcrypt, reqwest
│   ├── migrations/                  # 34 SQL files — schema + seeds + content blocks
│   │   ├── 001_init.sql             # Core tables: users, sermons, ministries, events, ...
│   │   ├── 006_seed_content_blocks.sql
│   │   ├── 028_create_people_crm.sql
│   │   ├── 030_all_remaining_features.sql
│   │   └── ...
│   └── src/
│       ├── main.rs                  # Axum server, tenant middleware, CORS
│       ├── tenant.rs                # TenantRegistry, subdomain resolution, Db extractor
│       ├── auth.rs                  # JWT creation, AuthUser extractor
│       ├── db.rs                    # Single-pool helper (legacy, superseded by tenant.rs)
│       ├── config.rs                # Env-based config
│       ├── error.rs                 # AppError → JSON response
│       ├── routes.rs                # All /api/* route definitions
│       ├── handlers/                # 40 handler modules (one per resource)
│       │   ├── auth.rs, users.rs, sermons.rs, ministries.rs, events.rs,
│       │   ├── people.rs, donations.rs, groups.rs, forms.rs, broadcasts.rs,
│       │   ├── content_blocks.rs, settings.rs, upload.rs, dashboard.rs,
│       │   ├── attendance.rs, volunteers.rs, pledges.rs, reports.rs, ...
│       ├── models/                  # 36 SQLx model structs
│       └── payment/                 # eSewa + Khalti integration
│           ├── esewa.rs
│           └── khalti.rs
│
├── nextjs/                          # Church app frontend (Next.js App Router)
│   ├── package.json                 # react, axios, @tanstack/react-query, sonner, framer-motion
│   ├── tailwind.config.ts
│   ├── app/
│   │   ├── layout.tsx               # Root layout (ThemeProvider, SiteThemeApplier)
│   │   ├── (site)/                  # Public pages (route group)
│   │   │   ├── layout.tsx           # Navbar + Footer + AnnouncementBar + FloatingButtons
│   │   │   ├── page.tsx             # Homepage
│   │   │   ├── about/, contact/, events/, gallery/, give/, groups/,
│   │   │   ├── leadership/, live/, ministries/, pastor/, prayer/,
│   │   │   ├── privacy/, sermons/, terms/, visit/, volunteer/, membership/
│   │   ├── admin/                   # Per-church admin (42 section routes)
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
│   │   ├── admin/                   # Admin components (Layout, AdminNav, ...)
│   │   ├── ui/                      # 47 shadcn/ui primitives (Button, Dialog, Table, ...)
│   │   ├── theme/                   # ThemeProvider, SiteThemeApplier, ThemeCustomizer
│   │   └── bible/                   # Bible components
│   └── lib/
│       ├── api.ts                   # Axios instance + snake→camel interceptor
│       ├── apiBase.ts               # Dynamic API origin (subdomain-aware)
│       ├── auth.tsx                 # AuthProvider, login/logout, token management
│       ├── hooks.ts                 # React Query hooks
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
│   │       ├── provision.rs         # Full provisioning pipeline
│   │       ├── auth.rs              # SuperAdmin extractor + JWT
│   │       ├── config.rs            # Config (pg_super_url, church_migrations_dir, ...)
│   │       └── error.rs
│   └── nextjs/                      # Control plane UI
│       └── app/admin/page.tsx       # Church management dashboard
│
├── storage/                         # Per-church file uploads (gitignored)
│   ├── gracechurchkathmandu/
│   └── ...
│
└── config/
    └── tenants.json                 # Tenant configuration
```

---

## Database tables

### Control plane DB (`churchnepal_control`)

| Table | Purpose |
|---|---|
| `control_admins` | Super-admin accounts (email, bcrypt hash, name) |
| `churches` | Registry of all provisioned churches (name, slug, db_name, storage_path, subdomain, status) |

### Per-church DB (`<slug>`)

Every church has its own database with the full schema. The migrations in `backend/migrations/` are applied to each church DB at provisioning time.

| Category | Tables |
|---|---|
| **Auth** | `users` |
| **CMS** | `content_blocks`, `settings` |
| **Content** | `sermons`, `ministries`, `events`, `leaders`, `gallery`, `testimonies`, `notices`, `members`, `service_times`, `verses`, `campaigns`, `blog_posts`, `portfolio`, `contact_info` |
| **CRM** | `people`, `households`, `tags`, `people_tags`, `person_notes` |
| **Giving** | `donations`, `funds`, `recurring_donations`, `pledges`, `offerings` |
| **Groups** | `groups`, `group_members` |
| **Events** | `event_rsvps`, `attendance` |
| **Comms** | `broadcasts`, `newsletter_subscribers`, `contact_messages`, `forms`, `form_submissions` |
| **Volunteers** | `volunteer_teams`, `volunteer_shifts`, `volunteer_assignments` |
| **Admin** | `todos`, `audit_log`, `member_applications` |

---

## Tech stack details

### Backend (Rust)

- **Framework:** Axum 0.8 with tower-http CORS
- **Database:** SQLx 0.8 (async, compile-time checked queries) + PostgreSQL 16
- **Auth:** jsonwebtoken (HS256, 24h expiry) + bcrypt password hashing
- **Payments:** eSewa + Khalti (reqwest for HTTP, hmac/sha2 for signature verification)
- **File uploads:** multer for multipart, stored to `storage/<slug>/`

### Frontend (Next.js)

- **Framework:** Next.js (App Router)
- **UI:** shadcn/ui (47 components) + Tailwind CSS + Radix primitives
- **State:** @tanstack/react-query for server state
- **HTTP:** axios with snake→camel interceptor + auto-bearer-token
- **Styling:** CSS variables for theming (ThemeCustomizer writes to settings table)
- **i18n:** Language context (EN/NE) via `lib/language.tsx`
- **Animation:** framer-motion (homepage sections)

### Infrastructure

- **Database:** Single PostgreSQL 16 instance, one database per church
- **Reverse proxy:** Caddy (wildcard SSL, Host-based routing)
- **Cache:** Redis 7 (optional, available for sessions/rate limiting)
- **Containerization:** Docker Compose for local dev

---

## Environment variables

### Church backend (`backend/.env`)

| Variable | Purpose |
|---|---|
| `PG_BASE_URL` | `postgres://user:pass@host:port` (no trailing DB name) |
| `DEFAULT_TENANT` | Fallback slug for localhost dev |
| `BASE_DOMAIN` | Apex domain (default: `churchnepal.com`) |
| `JWT_SECRET` | HS256 signing key |
| `PORT` | Listen port (default: 3002) |

### Church frontend (`nextjs/.env.local`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | API origin (default: same hostname on :3002) |

### Control plane backend (`control-plane/backend/.env`)

| Variable | Purpose |
|---|---|
| `CONTROL_DATABASE_URL` | Connection to `churchnepal_control` DB |
| `PG_SUPER_URL` | Superuser connection (for CREATE DATABASE) |
| `JWT_SECRET` | Separate secret for control-plane tokens |
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

## Key design decisions

1. **One process, many databases** — the church backend never starts a per-church server; tenant resolution happens per-request via the middleware. This keeps ops simple (one deploy serves all churches).

2. **Slug as universal key** — the church slug is the database name, storage folder, and subdomain label. No lookup table needed to find a church's resources.

3. **Content blocks as CMS** — a single `content_blocks` table with JSONB `items` provides a flexible, headless CMS. Every editable string, image, and list on the public site is stored here, not hardcoded.

4. **Db extractor pattern** — handlers never receive a `State<PgPool>`. The `Db` extractor pulls the tenant-resolved pool from request extensions, making every handler tenant-aware by default.

5. **Separate JWT secrets** — the control plane and church app use different signing keys, so a church admin token cannot be used to manage other churches.

6. **Migrations as seed data** — SQL migrations include both schema and seed data (content blocks, dummy content), so a freshly provisioned church has a complete demo site.
