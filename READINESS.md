# READINESS — definition of "fully ready"

The boss/watchdog drives the worker until **every box below is checked AND
`health_check(level="full")` is all green**, then declares the app ready and stops.
Edit this list to match what "done" actually means for you — the boss works top to bottom.

## Build & correctness (auto-verified by health_check)
- [ ] `npx tsc --noEmit` passes in `nextjs/` (no type errors)
- [ ] `pnpm run lint` passes in `nextjs/`
- [ ] `pnpm run build` succeeds in `nextjs/` (production build, no errors)
- [ ] `cargo check` passes in `backend/`

## Runtime (dev server on :3000)
- [ ] Dev server serves `/` with HTTP 200
- [ ] All pages migrated from the old Vite app render without runtime/hydration errors
- [ ] Admin login works and `ProtectedRoute` redirects unauthenticated users to `/admin/login`
- [ ] Frontend reaches the backend API (no failed requests on key pages)

## Cleanup & release
- [ ] Old Vite files removed (root `src/`, `admin/`, config, package files) — DONE
- [ ] No leftover references to deleted Vite paths anywhere in `nextjs/`
- [ ] Changes committed in small steps (do NOT auto-push to production without review)

<!-- The boss ticks a box by changing "- [ ]" to "- [x]" after it verifies the item.
     Add or remove items freely; keep them concrete and checkable. -->
