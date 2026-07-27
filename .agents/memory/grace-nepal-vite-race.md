---
name: Grace Nepal Vite parallel-load race condition
description: How to prevent Vite dev-mode dep re-optimization races that crash pages with "Invalid hook call".
---

## Rule
Use `optimizeDeps.noDiscovery: true` + NO `server.warmup` + a complete `optimizeDeps.include` list. This prevents all runtime re-optimizations that cause chunk hash mismatches.

**Why:** When multiple pages load simultaneously in dev mode, Vite may trigger a temporary re-optimization pass (changing the browser hash mid-flight). Pages caught during this window load React from the new hash while other shared chunks still have the old hash, causing the `Cannot read properties of null (reading 'useState'/'useContext')` crash.

Two things were making this worse:
1. `server.warmup.clientFiles` — warming source files before the dep cache was fully settled triggered a secondary optimization pass even with `noDiscovery: true`.
2. Auto-discovered deps not in the `include` list — Vite would discover them at runtime and trigger a re-optimization.

**How to apply:**
- Set `optimizeDeps.noDiscovery: true` — prevents Vite from auto-discovering deps from source files at runtime.
- Remove all `server.warmup.clientFiles` — the warmup itself triggers optimization races on cold start.
- Add ALL packages to `optimizeDeps.include` — including auto-discovered ones (`@dnd-kit/core`, `@dnd-kit/sortable`, `@radix-ui/react-toast`, `react-day-picker`, `react-resizable-panels`, `web-vitals`). Find auto-discovered deps with: `python3 -c "import json; d=json.load(open('node_modules/.vite/deps/_metadata.json')); print([k for k in d.get('optimized',{}).keys()])"`.
- When clearing the cache (`rm -rf node_modules/.vite`), always restart the workflow and wait ~20s for the full 64-dep pre-bundle before testing (check dep count via the metadata file).
- Keep `resolve.dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client', 'motion/react']` as a safety net.
- The race still occurs when 4+ browser tabs load simultaneously — this is a fundamental Vite dev limitation. Pages always work when loaded individually or navigated to within the same tab.
- In production (built app), this race does not occur.
