# ChurchNepal — Project Overview

> A one-page explanation of **what this project is**, **what it's for**, and **how it is controlled**.
> For setup/usage see the [README](../README.md); for internals see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 1. What this project is

ChurchNepal is a **multi-tenant church website platform (SaaS) with a built-in CRM.**

Instead of building a separate website for every church, ChurchNepal is **one codebase that runs many church sites** — each church gets its own website, its own admin, its own database, and its own file storage, all created and governed from a single master control panel.

```
churchnepal.com                       →  Master Control (the "owner" panel)
gracechurch.churchnepal.com           →  Grace Church's site  (own DB + storage)
hillsidechurch.churchnepal.com        →  Hillside Church's site (own DB + storage)
… and so on, unlimited churches
```

### What each church gets
- A complete public website (home, about, ministries, sermons, events, gallery, giving, contact, prayer, groups, live, …).
- A **headless CMS** — every piece of text and every image is editable from the admin; nothing is hardcoded.
- A **CRM** — people & households, giving (funds, gifts, campaigns, online payments), groups & events, and communication (prayer requests, contact inbox, newsletter, forms).
- Its **own admin login**, generated automatically when the church is created.

---

## 2. The objective

**Clone one platform into many independent church sites — without building or copying code for each one.**

The goals, in order of priority:

1. **Isolation** — every church's data (members, giving, content, uploads) is *physically separate* from every other church's. A church can be backed up, exported, or deleted on its own, and one church can never see another's data.
2. **Self-service for churches** — a non-technical church admin can run their entire website and CRM from the admin panel. No developers, no code.
3. **Central governance** — the platform owner provisions, oversees, and manages every church from one place.
4. **Reusability** — new looks come from **themes and templates**, not hand-built copies. One codebase, many appearances.
5. **Stack discipline** — the whole product is **Next.js (frontend) + Rust (backend) only**, for a fast, modern, secure, maintainable system.

---

## 3. How it is controlled

Control happens at **two levels**: the **platform owner** governs all churches, and each **church admin** governs their own site.

### Level 1 — the Master Control (platform owner)
The owner uses the **control plane** (`control-plane/`) at `churchnepal.com` to govern the whole platform.

| Action | What happens |
|--------|--------------|
| **Create a church** | Enter a name → the system generates a slug and **automatically** creates a subdomain, a dedicated Postgres **database**, a **storage folder**, runs all migrations, and seeds an **admin login** (shown once). |
| **Manage churches** | List every church, open its site/admin, see its details. |
| **Remove a church** | Deletes its database and storage (fully removes the tenant). |
| **Owner security** | The owner signs in with a JWT-protected super-admin account, seeded on first run. |

The owner never edits a church's content directly — they **grant access** (the auto-generated admin login) and oversee the fleet.

### Level 2 — the Church Admin (per church)
Each church's admins control **only their own site**, from that site's `/admin`:
- Edit every section, page, image, and setting (headless CMS).
- Reorder / show / hide sections; pick images from their media library; recolor the site with the theme customizer.
- Manage their people, giving, groups, events, and communications (CRM).

Their reach stops at their own database — enforced automatically by the backend.

### How the isolation is enforced (the control mechanism)
The rule is simple and consistent: **the church's slug is its database name, its storage folder, and its subdomain label** (e.g. `gracechurch`).

```
Request to  gracechurch.churchnepal.com
      │
      ▼
Reverse proxy keeps the Host header
      │
      ▼
Church backend reads the subdomain  →  "gracechurch"
      │
      ├─►  connects to database  gracechurch
      └─►  reads/writes storage  storage/gracechurch/
```

So every request is routed to the correct church's data by its subdomain — no shared tables, no cross-tenant access. Adding or removing a church never touches any other church.

---

## 4. In one sentence

**ChurchNepal lets one owner spin up and govern unlimited fully-isolated church websites + CRMs from a single control panel, while each church self-manages its own site — one Next.js + Rust codebase, one database per church.**
