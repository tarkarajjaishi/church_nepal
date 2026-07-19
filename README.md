<div align="center">

# ⛪ ChurchNepal

**A multi-tenant church website platform + CRM — one control panel, many isolated church sites.**

Create a complete website for any church in seconds: its own subdomain, its own database, and its own storage — all managed from a single master control.

[![CI](https://github.com/tarkarajjaishi/church_nepal/actions/workflows/ci.yml/badge.svg)](https://github.com/tarkarajjaishi/church_nepal/actions/workflows/ci.yml)
[![Release](https://github.com/tarkarajjaishi/church_nepal/actions/workflows/release.yml/badge.svg)](https://github.com/tarkarajjaishi/church_nepal/releases)
![Stack](https://img.shields.io/badge/stack-Next.js%20%2B%20Rust-black)
![License](https://img.shields.io/badge/license-Proprietary-lightgrey)

</div>

---

## Table of contents
- [What it is](#what-it-is)
- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Quick start (local)](#quick-start-local)
- [Provision a church](#provision-a-church)
- [Deployment](#deployment)
- [CI/CD, releases & packages](#cicd-releases--packages)
- [Documentation](#documentation)

---

## What it is

ChurchNepal is a **SaaS control plane** that provisions and governs many **independent church websites** from one place.

```
churchnepal.com                      →  Master Control  (create & manage churches)
gracechurch.churchnepal.com          →  a church site   (its own DB + storage)
hillsidechurch.churchnepal.com       →  another church  (its own DB + storage)
```

**Isolation by design:** one PostgreSQL instance, **one database per church**, and a **separate storage folder per church** — the database name, storage folder, and subdomain label are all the same slug (e.g. `gracechurch`), so a church's data never crosses with another's and is trivial to locate, back up, or delete.

---

## Features

### 🎛️ Master Control (`control-plane/`)
- **One-click provisioning** — type a church name → creates a subdomain, a dedicated Postgres database (migrated), a storage folder, and an **auto-generated admin login**.
- **Church registry** — list, open, and manage every church from one dashboard.
- **Super-admin auth** — JWT-secured owner login; the control DB + owner are seeded automatically on first run.
- **Lifecycle management** — create and delete churches (delete drops the DB + storage).
- **Marketing landing page** for churchnepal.com.

### ⛪ Church site (`backend/` + `nextjs/`)
Every provisioned church gets a full website that its own admins manage — no developers needed.

**Headless CMS**
- Every section (text, images, lists) is editable from the admin and stored in Postgres (`content_blocks`).
- Inline "pencil" editing on the live site for admins, plus a full admin editor.
- Drag-and-drop **section reorder** + show/hide, per page.
- **Media library** — upload, reuse, and pick images per church.
- **Theme customizer** — recolor the whole site live via CSS variables (admin-only).

**Public pages** — Home, About, Visit, Ministries, Sermons, Events, Gallery, Give, Contact, Prayer, Leadership, Groups, Live, and legal pages — all headless and multilingual-ready (EN/NE).

**CRM & church operations** (models + admin)
- **People** — profiles, households, members, status.
- **Giving** — funds, gifts, campaigns, pledges, eSewa/Khalti payment hooks, reports.
- **Groups & Events** — group membership, event RSVPs, service times.
- **Communication** — prayer requests, contact inbox, newsletter, notices/announcements, forms.

### 🔒 Per-tenant isolation
- **Separate database per church** — resolved per request from the subdomain (Host header → slug → DB pool).
- **Separate storage per church** — `storage/<slug>/`.
- Handlers use a tenant-aware `Db` extractor; adding a church never touches another's data.

---

## Architecture

```
                         ┌──────────────────────────────┐
   churchnepal.com ─────►│  Master Control              │
                         │  control-plane/nextjs (UI)   │
                         │  control-plane/backend (Rust)│──┐ provisions
                         └──────────────────────────────┘  │  (CREATE DATABASE,
                                                            │   run migrations,
                                                            │   mkdir storage,
                                                            ▼   seed admin)
   *.churchnepal.com ───►┌──────────────────────────────┐  ┌───────────────┐
   (per church)          │  Church app                  │  │ PostgreSQL     │
                         │  nextjs (UI)                 │  │  db: gracechurch│
   Host header ─────────►│  backend (Rust, multi-tenant)│─►│  db: hillside…  │
     resolves the slug   │  tenant middleware → DB pool │  └───────────────┘
                         └──────────────────────────────┘   storage/<slug>/
```

Reverse proxy (Caddy/nginx) routes the apex to the control plane and `*.churchnepal.com` to the church app, **preserving the Host header** so the backend can resolve the tenant. See **[ARCHITECTURE.md](ARCHITECTURE.md)** for the full data flow.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | **Next.js** (App Router), TypeScript, **shadcn/ui**, Tailwind CSS, Radix, TanStack Query, sonner |
| Backend | **Rust** — Axum 0.8, SQLx, JWT (jsonwebtoken), bcrypt |
| Database | **PostgreSQL** (one instance, one database per church) |
| Infra | Docker, Caddy/nginx (wildcard subdomains), GitHub Actions (CI/CD → GHCR) |

> **Stack rule:** the entire product is **Next.js + Rust only** — no other language for code, scripts, or tooling.

---

## Project structure

```
church_nepal/
├─ backend/                 # Church app API (Rust/Axum) — multi-tenant
│  ├─ src/tenant.rs         #   Host → slug → per-church DB pool + storage
│  ├─ src/handlers/         #   endpoints (use the `Db` extractor)
│  └─ migrations/           #   church schema — run into each new church DB
├─ nextjs/                  # Church app UI (Next.js)
├─ control-plane/
│  ├─ backend/              # Master control API (Rust) — provisions churches
│  └─ nextjs/               # Master control UI (churchnepal.com)
├─ storage/<slug>/          # Per-church uploads (git-ignored)
├─ Caddyfile                # Reverse proxy + wildcard TLS
└─ .github/workflows/       # CI + auto-release
```

---

## Quick start (local)

**Prerequisites:** Rust (stable), Node.js 20+, Docker (for Postgres), and optionally Bun.

**1. Start PostgreSQL** (one instance holds every church DB):
```bash
docker compose up -d postgres        # user postgres / password `password` / port 5432
```

**2. Master control** (auto-creates its control DB + owner on first run):
```bash
cd control-plane/backend
cp .env.example .env                 # then set SUPER_ADMIN_PASSWORD
cargo run                            # → http://localhost:3100

cd control-plane/nextjs
npm install && npm run dev           # → http://localhost:3200
```

**3. Church app** (serves every church):
```bash
cd backend  && cargo run             # → http://localhost:3002  (multi-tenant)
cd nextjs   && npm run dev            # → http://localhost:3000
```

| Component        | URL |
|------------------|-----|
| Master Control   | http://localhost:3200 |
| Church site      | http://localhost:3000 |
| Church API       | http://localhost:3002 |
| Control API      | http://localhost:3100 |

> **Test a church locally:** browsers resolve `*.localhost`, so open `http://gracechurch.localhost:3000` — the app serves that church's database automatically.

---

## Provision a church

1. Open **Master Control** (`/admin`), sign in as the owner.
2. Enter a church name → **Create church**.
3. It provisions everything and shows the **one-time admin credentials**:
   - Website: `https://<slug>.churchnepal.com`
   - Admin login: `admin@<slug>.churchnepal.com` + a generated password.
4. The church admin signs in at their site's `/admin` and starts editing.

Under the hood (`control-plane/backend/src/provision.rs`): name → slug → `CREATE DATABASE <slug>` → run church migrations → create `storage/<slug>/` → generate + seed a bcrypt admin → record in the control DB.

---

## Deployment

1. **DNS:** point `churchnepal.com` and a wildcard `*.churchnepal.com` at your server.
2. **Reverse proxy:** use the included **[`Caddyfile`](Caddyfile)** (apex → control, `*` → church app; Host preserved). Wildcard HTTPS uses a DNS-challenge cert.
3. **Frontends:** build each Next.js app; set `NEXT_PUBLIC_API_URL` to same-origin so the tenant Host header reaches the backend.
4. **Secrets:** strong `JWT_SECRET`, `SUPER_ADMIN_PASSWORD`, and a Postgres user with `CREATEDB` for the provisioner.

Full guide: **[MULTI_TENANT_SETUP.md](MULTI_TENANT_SETUP.md)**.

---

## CI/CD, releases & packages

GitHub Actions provides a production pipeline:

- **CI** (`ci.yml`) — on every push/PR: frontend build, Rust `cargo check`, Trivy security scan, and Docker image build.
- **Auto-release** (`release.yml`) — every push to `main` computes the next **semantic version**, tags it, and publishes a **GitHub Release** with notes:
  - `feat:` → minor · `fix:`/`chore:` → patch · `!`/`BREAKING CHANGE` → major.
- **Container images** are published to **GitHub Packages (GHCR)**:
  - `ghcr.io/tarkarajjaishi/church_nepal/api` (backend)
  - `ghcr.io/tarkarajjaishi/church_nepal/frontend` (church UI)

---

## Documentation

| Doc | Contents |
|-----|----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, data flow, tenant resolution |
| [MULTI_TENANT_SETUP.md](MULTI_TENANT_SETUP.md) | Running & deploying the multi-tenant platform |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Backend API endpoints |
| [ROADMAP.md](ROADMAP.md) | Feature backlog & phases |

---

<div align="center">

Built with **Next.js + Rust**. Developed by [Tarka Raj Jaishi](https://tarkarajjaishi.com.np/).

</div>
