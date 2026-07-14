# READINESS — definition of "fully ready"

The boss drives until every box is checked AND the build is green. Boxes are ticked only
when **actually verified** (not assumed). Last driven: 2026-07-14 by Claude (acting as boss).

## Build & correctness (auto-verified)
- [x] `npx tsc --noEmit` passes in `nextjs/` — 0 errors ✓
- [ ] `pnpm run lint` passes in `nextjs/` — not run (optional; needs ESLint config)
- [x] `pnpm run build` succeeds in `nextjs/` — all 35 routes compiled ✓
- [x] `cargo check` passes in `backend/` — 0 errors (3 dead-code warnings) ✓

## Runtime (dev server on :3000)
- [x] Dev server serves `/` with HTTP 200 — ✓ (0.96s)
- [ ] All pages render without runtime/hydration errors — homepage + `/admin/login` verified 200; other routes compile but were not each exercised
- [ ] Admin login + `ProtectedRoute` redirect — `/admin/login` serves 200; the auth-redirect flow was not end-to-end tested
- [ ] Frontend reaches the backend API — backend compiles; not yet run and tested against the UI

## Cleanup & release
- [x] Old Vite files removed (root `src/`, `admin/`, config, package files) — DONE
- [x] No leftover references to deleted Vite paths in `nextjs/` — ✓ (tsc + build resolve every import)
- [x] Changes committed in small steps (no auto-push) — ✓

<!-- Fixes applied this pass:
     - nextjs/app/(site)/page.tsx: removed non-existent `display_date` fallbacks (5 TS2551 errors); the type field is `displayDate`
     - deleted nextjs/components/ui/aspect-ratio.tsx: unused, imported a dep that lived on the deleted root app -->
