#!/usr/bin/env node
/**
 * Stack watchdog.
 *
 * Checks that each service is doing its job, not merely holding a port open.
 * "Listening" is not health: the Bible reader returned 200 for weeks while
 * serving the wrong chapter, and /api/events returned 200 with an error body
 * after a missing migration.
 *
 * Usage:
 *   node scripts/watchdog.mjs             # one pass, exit 0/1
 *   node scripts/watchdog.mjs --watch     # re-check every 60s, print only changes
 *   node scripts/watchdog.mjs --json      # machine-readable single pass
 *
 * Exit code is the number of failing checks, capped at 250, so it can gate CI.
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const ENV_PATH = path.join(HERE, '..', 'backend', '.env')

const WATCH = process.argv.includes('--watch')
const JSON_OUT = process.argv.includes('--json')
const INTERVAL_MS = 60_000
const TIMEOUT_MS = 20_000

const CHURCH_API = process.env.CHURCH_API || 'http://localhost:3002'
const CHURCH_WEB = process.env.CHURCH_WEB || 'http://localhost:3005'
const CONTROL_API = process.env.CONTROL_API || 'http://localhost:3100'
const CONTROL_WEB = process.env.CONTROL_WEB || 'http://localhost:3200'

function adminToken() {
  try {
    const secret = (fs.readFileSync(ENV_PATH, 'utf8').match(/^JWT_SECRET=(.*)$/m) || [])[1]?.trim()
    if (!secret) return null
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
    const now = Math.floor(Date.now() / 1000)
    const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
      sub: 'watchdog', email: 'watchdog@local', role: 'admin',
      exp: now + 900, jti: crypto.randomUUID(), iat: now,
      last_active_at: now, pwd_changed_at: now - 86400,
    })}`
    return `${body}.${crypto.createHmac('sha256', secret).update(body).digest('base64url')}`
  } catch {
    return null
  }
}

const TOKEN = adminToken()

async function fetchJson(url, { auth = false } = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: auth && TOKEN ? { authorization: `Bearer ${TOKEN}` } : {},
    })
    const text = await res.text()
    let json = null
    try { json = text ? JSON.parse(text) : null } catch { /* not JSON */ }
    return { status: res.status, text, json }
  } finally {
    clearTimeout(t)
  }
}

/**
 * A check returns {ok, detail}. Anything that throws is a failure with the
 * message, so a check never silently passes because of a bug in itself.
 */
const CHECKS = [
  {
    name: 'church API up',
    async run() {
      const r = await fetchJson(`${CHURCH_API}/api/sermons`)
      return { ok: r.status === 200 && Array.isArray(r.json?.data ?? r.json), detail: `HTTP ${r.status}` }
    },
  },
  {
    // 200 with an {"error": ...} body is the failure mode a status-only probe
    // misses. Check the body shape, not just the code.
    name: 'church API returns data, not an error body',
    async run() {
      const bad = []
      for (const p of ['/api/sermons', '/api/events', '/api/ministries', '/api/verses', '/api/funds']) {
        const r = await fetchJson(`${CHURCH_API}${p}`)
        if (r.status !== 200 || r.json?.error) bad.push(`${p}:${r.status}${r.json?.error ? ' err' : ''}`)
      }
      return { ok: bad.length === 0, detail: bad.length ? bad.join(' ') : '5 endpoints clean' }
    },
  },
  {
    name: 'Bible chapter mapping correct',
    async run() {
      // John 3:16 must be "For God so loved the world", not John 2:16. This is
      // the off-by-one that shipped once; it is cheap to keep asserting.
      const r = await fetchJson(`${CHURCH_WEB}/api/bible?book=JHN&chapter=3&verse=16`)
      const t = r.json?.text ?? ''
      const ok = r.status === 200 && t.includes('संसारलाई')
      const c = await fetchJson(`${CHURCH_WEB}/api/bible?book=JHN&chapter=1`)
      const chapters = c.json?.totalChapters
      return {
        ok: ok && chapters === 21,
        detail: ok ? `John has ${chapters} chapters (expect 21)` : `John 3:16 text unexpected (HTTP ${r.status})`,
      }
    },
  },
  {
    name: 'offering module API authed + functional',
    async run() {
      if (!TOKEN) return { ok: false, detail: 'no JWT_SECRET, cannot check' }
      const unauth = await fetchJson(`${CHURCH_API}/api/offering-management/dashboard`)
      if (unauth.status !== 401) return { ok: false, detail: `unauthed request got ${unauth.status}, expected 401` }

      const d = await fetchJson(`${CHURCH_API}/api/offering-management/dashboard`, { auth: true })
      if (d.status !== 200 || d.json?.error) return { ok: false, detail: `dashboard HTTP ${d.status}` }

      // Period cards must nest. This is the inconsistency the seed test caught.
      //
      // Keys are snake_case here: the camelCase conversion lives in the browser
      // client (nextjs/lib/api.ts), not in the API itself, so a raw fetch sees
      // the wire format. Reading camelCase here silently yielded undefined and
      // made this check "fail" for the wrong reason.
      const {
        today,
        this_week: week,
        this_month: month,
        this_year: year,
        cash_giving: cash,
        online_giving: online,
      } = d.json
      const nums = [today, week, month, year, cash, online]
      if (nums.some((n) => typeof n !== 'number')) {
        return { ok: false, detail: `dashboard shape unexpected: ${JSON.stringify(nums)}` }
      }
      const nested = today <= week && week <= month && month <= year
      const split = cash + online <= year
      return {
        ok: nested && split,
        detail:
          nested && split
            ? `year Rs ${Math.round(year / 100).toLocaleString()} consistent`
            : `inconsistent: ${today}/${week}/${month}/${year} cash+online=${cash + online}`,
      }
    },
  },
  {
    name: 'offering table paginates and filters',
    async run() {
      if (!TOKEN) return { ok: false, detail: 'no JWT_SECRET' }
      const r = await fetchJson(`${CHURCH_API}/api/offering-management/offerings?per_page=5&status=approved`, { auth: true })
      if (r.status !== 200) return { ok: false, detail: `HTTP ${r.status}` }
      const rows = r.json?.data ?? []
      const exact = rows.every((x) => x.status === 'approved')
      return { ok: exact, detail: exact ? `${r.json.total} approved records` : 'status filter leaked other statuses' }
    },
  },
  {
    name: 'SQL injection through filters is inert',
    async run() {
      if (!TOKEN) return { ok: false, detail: 'no JWT_SECRET' }
      const evil = encodeURIComponent("'; DROP TABLE offerings; --")
      const r = await fetchJson(`${CHURCH_API}/api/offering-management/offerings?search=${evil}`, { auth: true })
      const after = await fetchJson(`${CHURCH_API}/api/offering-management/offerings?per_page=1`, { auth: true })
      const ok = r.status === 200 && (after.json?.total ?? 0) > 0
      return { ok, detail: ok ? 'table intact after injection attempt' : 'TABLE MAY BE GONE — investigate now' }
    },
  },
  {
    name: 'church site renders',
    async run() {
      const r = await fetchJson(CHURCH_WEB)
      const ok = r.status === 200 && /<\/html>/i.test(r.text)
      return { ok, detail: `HTTP ${r.status}, ${Math.round(r.text.length / 1024)}KB` }
    },
  },
  {
    name: 'offering admin pages render',
    async run() {
      const pages = ['', '/offerings', '/new', '/cash-counting', '/deposits', '/bank-accounts', '/settings']
      const bad = []
      for (const p of pages) {
        const r = await fetchJson(`${CHURCH_WEB}/admin/offering-management${p}`)
        if (r.status !== 200) bad.push(`${p || '/'}:${r.status}`)
      }
      return { ok: bad.length === 0, detail: bad.length ? bad.join(' ') : `${pages.length} pages OK` }
    },
  },
  {
    name: 'sitemap includes detail URLs',
    async run() {
      const r = await fetchJson(`${CHURCH_WEB}/sitemap.xml`)
      const details = (r.text.match(/<loc>[^<]*\/(sermons|events|ministries)\/[^<]+<\/loc>/g) || []).length
      return { ok: r.status === 200 && details > 0, detail: `${details} detail URLs` }
    },
  },
  {
    name: 'control plane up',
    async run() {
      const r = await fetchJson(`${CONTROL_API}/api/churches`)
      // 401 is healthy here — the endpoint requires auth.
      return { ok: r.status === 401 || r.status === 200, detail: `HTTP ${r.status}` }
    },
  },
  {
    name: 'control plane UI renders',
    async run() {
      const r = await fetchJson(CONTROL_WEB)
      return { ok: r.status === 200, detail: `HTTP ${r.status}` }
    },
  },
  {
    name: 'unknown tenant fails fast',
    async run() {
      // A bogus subdomain once exhausted the pool and 500'd every tenant.
      // It must 404 quickly instead.
      const t0 = Date.now()
      let status
      try {
        const r = await fetchJson('http://nosuchchurch.localhost:3002/api/sermons')
        status = r.status
      } catch (e) {
        return { ok: false, detail: `request failed: ${e.message}` }
      }
      const ms = Date.now() - t0
      const ok = status === 404 && ms < 5000
      return { ok, detail: `HTTP ${status} in ${ms}ms (want 404 under 5s)` }
    },
  },
]

async function runAll() {
  const results = []
  for (const c of CHECKS) {
    try {
      const r = await c.run()
      results.push({ name: c.name, ...r })
    } catch (e) {
      results.push({ name: c.name, ok: false, detail: e.message.slice(0, 120) })
    }
  }
  return results
}

function render(results) {
  const failed = results.filter((r) => !r.ok)
  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19)
  console.log(`\n[${stamp}] ${results.length - failed.length}/${results.length} healthy`)
  for (const r of results) {
    console.log(`  ${r.ok ? 'OK  ' : 'FAIL'}  ${r.name.padEnd(46)} ${r.detail ?? ''}`)
  }
  return failed
}

async function once() {
  const results = await runAll()
  if (JSON_OUT) {
    console.log(JSON.stringify({ at: new Date().toISOString(), results }, null, 2))
    return results.filter((r) => !r.ok).length
  }
  return render(results).length
}

if (WATCH) {
  // Print the first pass in full, then only report transitions so a long watch
  // does not bury a real change in noise.
  let prev = null
  const tick = async () => {
    const results = await runAll()
    const key = results.map((r) => `${r.name}=${r.ok}`).join('|')
    if (key !== prev) {
      render(results)
      prev = key
    }
  }
  await tick()
  setInterval(tick, INTERVAL_MS)
} else {
  process.exit(Math.min(await once(), 250))
}
