---
name: Grace Nepal motion/react dual-React fix
description: Root cause and fix for the Cannot read properties of null (reading useContext/useState) crash in the Grace Nepal Church app.
---

## Rule
Remove `motion/react` from any component on the critical site render path (imported by every page).

**Why:** Vite dev mode re-optimization changes `?v=` cache-buster hashes on shared chunks mid-session. Old modules reference old hash, new modules reference new hash — the browser treats them as different ES module instances, giving two React dispatchers. When components from different instances share a tree, `ReactCurrentDispatcher.current` becomes null → crash.

**How to apply:** The two files that were the root cause:
- `src/components/site/Reveal.tsx` — rewritten to use IntersectionObserver + CSS transitions (no motion/react)
- `src/components/site/HomepageSections.tsx` — all `motion.div` replaced with plain `div`

Admin-only files (`AdminNav.tsx`, `CrudListPage.tsx`, admin page files) still use `motion/react` safely because they're not on the site render path and load after the Vite cache is warm.
