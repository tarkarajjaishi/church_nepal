# Church CRM SaaS — Full Backlog (boss works this top-to-bottom)

**Stack rule (non-negotiable):** Next.js frontend, Rust (Axum + SQLx + Postgres) backend. No other language, ever — not for code, scripts, config, or tooling.
**Every feature ships HEADLESS + NO HARDCODE:** all its text/images/settings editable, toggleable, and reorderable from the admin, stored in the DB.
**One bounded task per round, verified in a running app** (load the page / hit the endpoint), not just that it builds.
**"Clone one site -> many"** = theme + layout presets + the CMS. NOT hand-built copies. Do NOT build 10 separate homepages; build a preset/template system (Phase 0.5) that yields many looks from one codebase.

---

## PHASE 0 — Headless CMS foundation (finish first; makes the whole thing a reusable template)
1. **Nested-items editor** *(in progress)* — in the homepage EditableBlock pen AND the admin content-block editor, edit a block's `items` array: add / remove / reorder / edit each item's fields. Save via `PUT /content-blocks/{id}`. Unlocks every list section site-wide.
2. **Every page -> content_blocks** — convert /about, /visit, /pastor, /leadership, /prayer, /give, /ministries, /sermons, /events, /gallery, /contact so every section (text, images, and list items) reads from `content_blocks` and is wrapped in `EditableBlock`. Zero hardcoded content, incl. `lib/data.ts`. One page per round.
3. **Section order + visibility from admin** — drag-reorder and show/hide every section of every page from `/admin/content-blocks` (sort_order + enabled already exist; make it drag-and-drop and page-scoped).
4. **Media library** — upload/list/reuse images from the admin (backend already has `/upload`); pick images in the content-block editor instead of pasting URLs.

## PHASE 0.5 — Cloneable looks (this is the "10 designs / which admin applies to home" ask, done right)
5. **Theme + layout presets** — a preset = { name, primaryColor, heading/body font, homepage layout variant }. Store as settings `theme_preset` + `homepage_layout`. Apply color/fonts via CSS vars (reuse the master-theme bridge); apply layout by branching homepage section order/style on the setting. Ship 6+ named presets, picked from the Theme Customizer, applied live site-wide. One codebase, many looks.

## PHASE 1 — People (CRM core)
6. **People/Households** — person profiles (name, contact, photo, custom fields), households/families, member status (visitor/regular/member/inactive). Extend the existing members module.
7. **Tags & lists** — tag people, build filtered lists (e.g., "first-time visitors", "small-group leaders").
8. **Notes & timeline** — per-person notes/interactions; duplicate-merge.

## PHASE 2 — Giving
9. **Funds + gifts** — funds, one-time + recurring gifts, link to people. eSewa/Khalti already wired.
10. **Pledges/campaigns** — pledge to a campaign, track progress (campaigns partly exist).
11. **Statements + dashboard** — giving statements/receipts (printable), giving dashboard by fund/person/period.

## PHASE 3 — Groups, Events, Attendance
12. **Groups/ministries membership** — link people <-> ministries, group leaders.
13. **Event registration** — RSVP/registration + capacity for events.
14. **Attendance & check-in** — service + event attendance, child check-in with security tags, attendance reports.

## PHASE 4 — Communication & engagement
15. **Email/SMS broadcast** — send to lists/groups, templates, scheduled sends (newsletter subscribe already exists).
16. **Prayer requests** — public intake -> admin queue -> assign -> follow-up -> mark answered.
17. **Forms builder** — connect card / volunteer signup forms -> auto-tag & route submissions.

## PHASE 5 — Operations & multi-site
18. **Volunteer scheduling** — teams, roles, availability, rota.
19. **Roles & permissions** — beyond the single `admin` role; audit log.
20. **Reporting** — attendance/giving/growth analytics dashboard.
21. **Multi-tenant (only when >=3 real churches)** — `tenants` table, host/subdomain resolution (Axum middleware), `tenant_id` on content tables + scoped queries + scoped admin. Do NOT build speculatively.

---

## Do NOT build
- 10 hand-built homepage/admin designs (Phase 0.5 presets cover it).
- Multi-tenant plumbing before multiple real churches exist.
- Anything in a language other than Next.js/Rust.

## Execution / revive notes
- Revive stack: Postgres runs in **Docker** (not the Windows service) -> `docker ps` to confirm the postgres container is up (start it via its compose/`docker start` if not) -> backend `backend/target/release/grace-church-backend.exe` -> frontend `bun --bun next dev --port 3000 --webpack`.
- Loop = `boss.bat` + `worker.bat` (via `run_boss.ps1` / `run_worker.ps1`). Steer with `tell-boss.bat`; Claude steers via `.bridge/claude_msg.txt`.
- Testing cadence: ~hourly, run `cargo build`+`cargo test` and `bun run build`+`typecheck`+`lint`; when the stack is up, curl endpoints + load pages. Fix regressions before new features.
