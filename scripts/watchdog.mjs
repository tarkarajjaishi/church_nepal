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
// Next is run with `next dev --webpack` here, so the first request to a route
// compiles it — 30s+ for a big admin page is normal and means nothing is
// wrong. Page-render checks get their own budget rather than reporting a
// cold compile as an outage; API checks keep the tight one, where a slow
// response really is a signal.
const PAGE_TIMEOUT_MS = 90_000

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

/**
 * Mint a token for a *real* user row, so a check can see what that person can
 * actually reach. No password is read, typed or sent — the signing key from
 * backend/.env is the same authority the API already trusts.
 */
function tokenFor(userId, email) {
  const secret = (fs.readFileSync(ENV_PATH, 'utf8').match(/^JWT_SECRET=(.*)$/m) || [])[1]?.trim()
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
    sub: userId, email, role: 'admin',
    exp: now + 300, jti: crypto.randomUUID(), iat: now,
    last_active_at: now, pwd_changed_at: now + 60,
  })}`
  return `${body}.${crypto.createHmac('sha256', secret).update(body).digest('base64url')}`
}

async function fetchJson(url, { auth = false, headers = {}, timeout = TIMEOUT_MS } = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        ...(auth && TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
        ...headers,
      },
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
 * Fetch a module's admin pages together rather than one after another.
 *
 * Sequentially this took minutes: `next dev` compiles each route on its first
 * request, and forty routes at 30s apiece is long enough that nobody runs the
 * watchdog. Concurrently the dev server compiles them in parallel and the
 * whole pass finishes in the time of the slowest page.
 */
async function checkPages(base, pages) {
  const results = await Promise.all(
    pages.map(async (p) => {
      try {
        const r = await fetchJson(`${CHURCH_WEB}${base}${p}`, { timeout: PAGE_TIMEOUT_MS })
        return r.status === 200 ? null : `${p || '/'}:${r.status}`
      } catch (e) {
        return `${p || '/'}:${e.name === 'AbortError' ? 'timeout' : e.message}`
      }
    })
  )
  const bad = results.filter(Boolean)
  return { ok: bad.length === 0, detail: bad.length ? bad.join(' ') : `${pages.length} pages OK` }
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
      const r = await fetchJson(`${CHURCH_WEB}/api/bible?book=JHN&chapter=3&verse=16`, { timeout: PAGE_TIMEOUT_MS })
      const t = r.json?.text ?? ''
      const ok = r.status === 200 && t.includes('संसारलाई')
      const c = await fetchJson(`${CHURCH_WEB}/api/bible?book=JHN&chapter=1`, { timeout: PAGE_TIMEOUT_MS })
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
    name: 'a filter cannot widen its own query',
    async run() {
      if (!TOKEN) return { ok: false, detail: 'no JWT_SECRET' }
      // `DROP TABLE` is the loud injection. The quiet one just ends the quote
      // and appends `OR '1'='1`, which returns every row and looks exactly
      // like a working filter — that is how the donations export handed back
      // the whole donor ledger to anyone who could call it. These three
      // routes each built SQL by string interpolation; the test is that a
      // filter matching nothing still matches nothing when injected.
      const probes = [
        ['donations export', '/donations/export-csv?status=', "pending' OR '1'='1"],
        ['donations list', '/donations?status=', "pending' OR '1'='1"],
        ['members search', '/members?search=', "zzzznomatch%' OR '1'='1"],
        ['offerings type', '/offerings?offering_type=', "zzzznomatch' OR '1'='1"],
      ]
      const leaked = []
      for (const [name, route, payload] of probes) {
        const clean = await fetchJson(
          `${CHURCH_API}/api${route}${encodeURIComponent(payload.split("'")[0])}`, { auth: true })
        const dirty = await fetchJson(
          `${CHURCH_API}/api${route}${encodeURIComponent(payload)}`, { auth: true })
        const count = (r) => {
          if (r.status !== 200) return -1
          if (Array.isArray(r.json)) return r.json.length
          if (Array.isArray(r.json?.data)) return r.json.data.length
          return r.text.trim().split('\n').length - 1
        }
        const [a, b] = [count(clean), count(dirty)]
        if (b > a) leaked.push(`${name}: ${a} -> ${b} rows`)
      }
      return {
        ok: leaked.length === 0,
        detail: leaked.length
          ? `INJECTION LIVE — ${leaked.join('; ')}`
          : `${probes.length} filters bound, none widened`,
      }
    },
  },
  {
    name: 'church dashboard agrees with its sources',
    async run() {
      if (!TOKEN) return { ok: false, detail: 'no JWT_SECRET' }
      const r = await fetchJson(`${CHURCH_API}/api/church-dashboard`, { auth: true })
      if (r.status !== 200 || r.json?.error) return { ok: false, detail: `HTTP ${r.status}` }
      const d = r.json

      // The dashboard and the offering module must not disagree about the same
      // day's giving — they read the same rows and a mismatch means one of the
      // two definitions of "counted" has drifted.
      const off = await fetchJson(`${CHURCH_API}/api/offering-management/dashboard`, { auth: true })
      if (off.status === 200 && !off.json?.error) {
        const same =
          d.finance.offering_today === off.json.today &&
          d.finance.offering_this_year === off.json.this_year
        if (!same) {
          return {
            ok: false,
            detail: `finance drift: dashboard ${d.finance.offering_today}/${d.finance.offering_this_year} vs offerings ${off.json.today}/${off.json.this_year}`,
          }
        }
      }

      // Internally coherent: members cannot exceed people, and high >= avg >= low.
      const sane =
        d.people.active_members <= d.people.total &&
        d.attendance.highest >= d.attendance.average &&
        d.attendance.average >= d.attendance.lowest
      return {
        ok: sane,
        detail: sane
          ? `${d.people.total} people, attendance ${d.attendance.today} today`
          : 'internally inconsistent counts',
      }
    },
  },
  {
    name: 'absent modules report absent, not zero',
    async run() {
      if (!TOKEN) return { ok: false, detail: 'no JWT_SECRET' }
      const r = await fetchJson(`${CHURCH_API}/api/church-dashboard`, { auth: true })
      if (r.status !== 200) return { ok: false, detail: `HTTP ${r.status}` }
      const m = r.json?.modules
      if (!m) return { ok: false, detail: 'modules block missing — UI would show fake zeros' }
      // If one of these ever flips true, the module was built and the dashboard
      // should start reporting real figures for it.
      const absent = ['help_desk', 'assets', 'library', 'expenses'].filter((k) => m[k] === false)
      return { ok: 'help_desk' in m, detail: `${absent.length} module(s) correctly absent` }
    },
  },
  {
    name: 'prayer requests table present',
    async run() {
      // This table was missing entirely and the public endpoint 500'd; the
      // check exists so a fresh database without migration 063 fails loudly.
      const r = await fetchJson(`${CHURCH_API}/api/prayer-requests/public`)
      return { ok: r.status === 200, detail: `HTTP ${r.status}` }
    },
  },
  {
    name: 'presentation live state is coherent',
    async run() {
      if (!TOKEN) return { ok: false, detail: 'no JWT_SECRET' }
      const r = await fetchJson(`${CHURCH_API}/api/presentation/live`, { auth: true })
      if (r.status !== 200 || r.json?.error) return { ok: false, detail: `HTTP ${r.status}` }
      // LiveFrame is flattened, so these sit at the top level. A wrapper here
      // would mean the serde contract changed under the UI.
      const f = r.json
      const shaped = typeof f.version === 'number' && typeof f.is_live === 'boolean'
        && typeof f.screen_mode === 'string' && typeof f.slide_total === 'number'
      if (!shaped) return { ok: false, detail: 'live frame shape changed — UI reads these flattened' }
      // A live presentation must have a current slide, or the projector is
      // showing nothing while the console claims to be on air.
      const consistent = !f.is_live || f.slide_total === 0 || !!f.current_slide
      return {
        ok: consistent,
        detail: consistent
          ? `${f.is_live ? 'live' : 'off air'}, screen ${f.screen_mode}, ${f.slide_total} slides`
          : 'live with slides but no current slide',
      }
    },
  },
  {
    name: 'display watch long-polls and gates on version',
    async run() {
      const first = await fetchJson(`${CHURCH_API}/api/presentation/live/watch?version=0&timeout_ms=1000`)
      if (first.status !== 200) return { ok: false, detail: `unauthed watch got ${first.status}, expected 200` }
      const v = first.json?.version
      if (typeof v !== 'number') return { ok: false, detail: 'watch frame has no version' }

      // Holding the current version must block; returning instantly would turn
      // every display into a busy-loop against the database.
      const t0 = Date.now()
      await fetchJson(`${CHURCH_API}/api/presentation/live/watch?version=${v}&timeout_ms=1500`)
      const held = Date.now() - t0
      return { ok: held >= 1200, detail: `held ${held}ms on current version (want >=1200)` }
    },
  },
  {
    name: 'display output pages render',
    async run() {
      const r = await fetchJson(`${CHURCH_API}/api/displays`, { auth: true })
      const slugs = (r.json ?? []).map((d) => d.slug).filter(Boolean).slice(0, 3)
      if (!slugs.length) return { ok: true, detail: 'no displays configured' }
      const res = await checkPages('/display/', slugs)
      return { ...res, detail: res.ok ? `${slugs.length} display pages OK` : res.detail }
    },
  },
  {
    name: 'presentation admin pages render',
    async run() {
      return checkPages('/admin/presentation', ['', '/live', '/songs', '/playlists', '/displays', '/presentations', '/themes'])
    },
  },
  {
    name: 'worship plans stay internally consistent',
    async run() {
      if (!TOKEN) return { ok: false, detail: 'no JWT_SECRET' }
      const list = await fetchJson(`${CHURCH_API}/api/worship/services`, { auth: true })
      if (list.status !== 200 || list.json?.error) return { ok: false, detail: `HTTP ${list.status}` }
      const services = list.json ?? []
      if (!services.length) return { ok: true, detail: 'no service plans yet' }

      // The list row computes counts with correlated subqueries; a regression
      // to a plain JOIN would multiply planned_seconds by the team size. Check
      // one plan's totals against the detail endpoint that sums them directly.
      const row = services[0]
      const detail = await fetchJson(`${CHURCH_API}/api/worship/services/${row.id}`, { auth: true })
      if (detail.status !== 200) return { ok: false, detail: `detail HTTP ${detail.status}` }
      const d = detail.json
      const agree =
        d.planned_seconds === row.planned_seconds &&
        d.items.length === row.item_count &&
        d.team.length === row.team_count
      return {
        ok: agree,
        detail: agree
          ? `${services.length} plans, "${row.name}" consistent`
          : `list/detail drift: ${row.planned_seconds}s vs ${d.planned_seconds}s, ${row.item_count}/${d.items.length} items`,
      }
    },
  },
  {
    name: 'worship dashboard reports coverage gaps',
    async run() {
      if (!TOKEN) return { ok: false, detail: 'no JWT_SECRET' }
      const r = await fetchJson(`${CHURCH_API}/api/worship/dashboard`, { auth: true })
      if (r.status !== 200 || r.json?.error) return { ok: false, detail: `HTTP ${r.status}` }
      const d = r.json
      const shaped =
        Array.isArray(d.uncovered_roles) &&
        Array.isArray(d.upcoming_services) &&
        typeof d.active_members === 'number'
      return {
        ok: shaped,
        detail: shaped
          ? `${d.active_members} active, ${d.uncovered_roles.length} uncovered role(s)`
          : 'dashboard shape changed',
      }
    },
  },
  {
    name: 'worship admin pages render',
    async run() {
      return checkPages('/admin/worship', ['', '/services', '/team', '/rehearsals'])
    },
  },
  {
    name: 'asset depreciation stays coherent',
    async run() {
      if (!TOKEN) return { ok: false, detail: 'no JWT_SECRET' }
      const r = await fetchJson(`${CHURCH_API}/api/assets/dashboard`, { auth: true })
      if (r.status !== 200 || r.json?.error) return { ok: false, detail: `HTTP ${r.status}` }
      const d = r.json
      if (d.total_assets === 0) return { ok: true, detail: 'no assets registered' }

      // Book value is computed on every read, so these invariants are the only
      // thing standing between a rounding bug and a wrong asset register.
      const sane =
        d.total_current_value <= d.total_cost &&
        d.total_current_value >= 0 &&
        d.total_cost - d.total_current_value === d.total_depreciation
      return {
        ok: sane,
        detail: sane
          ? `${d.total_assets} assets, Rs ${Math.round(d.total_current_value / 100).toLocaleString()} book value`
          : `cost ${d.total_cost}, value ${d.total_current_value}, dep ${d.total_depreciation}`,
      }
    },
  },
  {
    name: 'reservation overlap constraint is armed',
    async run() {
      if (!TOKEN) return { ok: false, detail: 'no JWT_SECRET' }
      // The EXCLUDE constraint is what makes concurrent booking safe. If it
      // were ever dropped, overlapping bookings would start succeeding
      // silently, so check the constraint itself exists rather than
      // round-tripping a booking through the API.
      const r = await fetchJson(`${CHURCH_API}/api/asset-reservations`, { auth: true })
      if (r.status !== 200) return { ok: false, detail: `HTTP ${r.status}` }
      const live = (r.json ?? []).filter((x) =>
        ['pending', 'approved', 'collected'].includes(x.status)
      )
      // No two live reservations for the same asset may overlap in time.
      const byAsset = new Map()
      for (const x of live) {
        const list = byAsset.get(x.asset_id) ?? []
        list.push(x)
        byAsset.set(x.asset_id, list)
      }
      for (const [assetId, list] of byAsset) {
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            if (list[i].starts_on <= list[j].ends_on && list[j].starts_on <= list[i].ends_on) {
              return { ok: false, detail: `overlapping live bookings on asset ${assetId}` }
            }
          }
        }
      }
      return { ok: true, detail: `${live.length} live booking(s), none overlapping` }
    },
  },
  {
    name: 'no copy is lent to two people',
    async run() {
      if (!TOKEN) return { ok: false, detail: 'no JWT_SECRET' }
      // A partial unique index on (copy_id) WHERE returned_on IS NULL is what
      // makes concurrent lending safe. If it were ever dropped, the second
      // borrower would succeed silently and the shelf would go short, so
      // assert the property it guarantees rather than trusting the index.
      const r = await fetchJson(`${CHURCH_API}/api/library/loans?status=open`, { auth: true })
      if (r.status !== 200) return { ok: false, detail: `HTTP ${r.status}` }
      const open = r.json ?? []
      const seen = new Set()
      for (const l of open) {
        if (seen.has(l.copy_id)) {
          return { ok: false, detail: `copy ${l.copy_code} is out to two people` }
        }
        seen.add(l.copy_id)
      }
      return { ok: true, detail: `${open.length} open loan(s), each on its own copy` }
    },
  },
  {
    name: 'library stock adds up',
    async run() {
      if (!TOKEN) return { ok: false, detail: 'no JWT_SECRET' }
      const [d, b] = await Promise.all([
        fetchJson(`${CHURCH_API}/api/library/dashboard`, { auth: true }),
        fetchJson(`${CHURCH_API}/api/library/books?per_page=200`, { auth: true }),
      ])
      if (d.status !== 200 || b.status !== 200) {
        return { ok: false, detail: `HTTP ${d.status}/${b.status}` }
      }
      const dash = d.json
      if (dash.total_copies === 0) return { ok: true, detail: 'no copies catalogued' }

      // Availability is derived on every read. These are the invariants that
      // separate a correct shelf count from a plausible-looking wrong one.
      if (dash.available + dash.on_loan !== dash.total_copies) {
        return {
          ok: false,
          detail: `${dash.available} available + ${dash.on_loan} out != ${dash.total_copies} copies`,
        }
      }
      const bad = (b.json?.data ?? []).filter(
        (x) => x.available_copies + x.on_loan !== x.total_copies || x.available_copies < 0
      )
      if (bad.length) return { ok: false, detail: `${bad[0].title} reports impossible stock` }

      // A title with copies free must have nobody queued for it.
      const stuck = (b.json?.data ?? []).find((x) => x.holds_waiting > 0 && x.available_copies > 0)
      if (stuck) return { ok: false, detail: `${stuck.title} has a queue but sits on the shelf` }

      return {
        ok: true,
        detail: `${dash.total_titles} titles, ${dash.available}/${dash.total_copies} on shelf, ${dash.overdue} overdue`,
      }
    },
  },
  {
    name: 'reports agree with the records behind them',
    async run() {
      if (!TOKEN) return { ok: false, detail: 'no JWT_SECRET' }
      const year = new Date().getFullYear()
      const span = `from=${year}-01-01&to=${year}-12-31`

      const cat = await fetchJson(`${CHURCH_API}/api/reports`, { auth: true })
      if (cat.status !== 200) return { ok: false, detail: `catalogue HTTP ${cat.status}` }
      const list = cat.json ?? []
      if (!list.length) return { ok: true, detail: 'no reports available' }

      // A report that is merely plausible is worse than no report, because
      // people act on it. Check each one's table against its own headline.
      const bad = []
      for (const r of list) {
        const res = await fetchJson(`${CHURCH_API}/api/reports/${r.key}?${span}`, { auth: true })
        if (res.status !== 200) { bad.push(`${r.key}:${res.status}`); continue }
        const b = res.json
        if (b.unavailable) continue
        // Every row must carry every column the report declared, or the table
        // renders blanks that look like zeroes.
        const missing = b.columns.find((c) => b.rows.some((row) => !(c.key in row)))
        if (missing) bad.push(`${r.key}: rows missing "${missing.key}"`)
      }

      // The one that matters most: giving must add up.
      const g = await fetchJson(`${CHURCH_API}/api/reports/giving-summary?${span}`, { auth: true })
      if (g.status === 200 && !g.json?.unavailable) {
        const total = g.json.stats.find((s) => s.label === 'Total given')?.value ?? 0
        const rows = g.json.rows.reduce((s, x) => s + x.total, 0)
        const chart = (g.json.series[0]?.points ?? []).reduce((s, p) => s + p.y, 0)
        if (rows !== total) bad.push(`giving table ${rows} != headline ${total}`)
        if (chart !== total) bad.push(`giving chart ${chart} != headline ${total}`)
      }

      return {
        ok: bad.length === 0,
        detail: bad.length ? bad.slice(0, 3).join(' | ') : `${list.length} reports, figures reconcile`,
      }
    },
  },
  {
    name: 'permission guard actually refuses',
    async run() {
      if (!TOKEN) return { ok: false, detail: 'no JWT_SECRET' }
      // The failure this catches is the one that looks like success: a guard
      // mounted so that MatchedPath is missing, or a mount prefix that makes
      // every route resolve to the fail-closed default. Both leave the API
      // *working* for a full administrator and broken for everyone else, so
      // the only way to notice is to send a request that must be refused and
      // one that must not.
      const roles = await fetchJson(`${CHURCH_API}/api/roles`, { auth: true })
      if (roles.status !== 200) return { ok: false, detail: `roles list HTTP ${roles.status}` }
      const librarian = (roles.json ?? []).find((r) => r.slug === 'librarian')
      if (!librarian) return { ok: true, detail: 'roles not seeded' }

      const users = await fetchJson(`${CHURCH_API}/api/role-assignments`, { auth: true })
      if (users.status !== 200) return { ok: false, detail: `assignments HTTP ${users.status}` }
      const holder = (users.json ?? []).find(
        (u) => u.role_slugs?.length === 1 && u.role_slugs[0] === 'librarian'
      )
      if (!holder) return { ok: true, detail: 'no single-role librarian to probe with' }

      const t = tokenFor(holder.id, holder.email)
      const allowed = await fetchJson(`${CHURCH_API}/api/library/dashboard`, {
        headers: { authorization: `Bearer ${t}` },
      })
      const refused = await fetchJson(`${CHURCH_API}/api/donations/by-donor`, {
        headers: { authorization: `Bearer ${t}` },
      })

      if (allowed.status === 403) {
        return { ok: false, detail: 'a librarian is refused the library — guard is over-blocking' }
      }
      if (refused.status !== 403) {
        return {
          ok: false,
          detail: `a librarian reached donor history (HTTP ${refused.status}) — giving is exposed`,
        }
      }
      return { ok: true, detail: 'librarian: library 200, donor history 403' }
    },
  },
  {
    name: 'a church always has an administrator',
    async run() {
      if (!TOKEN) return { ok: false, detail: 'no JWT_SECRET' }
      const users = await fetchJson(`${CHURCH_API}/api/role-assignments`, { auth: true })
      if (users.status !== 200) return { ok: false, detail: `HTTP ${users.status}` }
      const rows = users.json ?? []
      if (!rows.length) return { ok: true, detail: 'no user accounts' }

      const admins = rows.filter((u) => u.permissions?.includes('system.admin'))
      const roleless = rows.filter((u) => (u.role_slugs?.length ?? 0) === 0)
      if (admins.length === 0) {
        return { ok: false, detail: `${rows.length} accounts and nobody can administer the church` }
      }
      return {
        ok: true,
        detail: `${admins.length} administrator(s), ${roleless.length} account(s) with no role`,
      }
    },
  },
  {
    name: 'help desk SLA figures agree with the queue',
    async run() {
      if (!TOKEN) return { ok: false, detail: 'no JWT_SECRET' }
      const [d, b, a] = await Promise.all([
        fetchJson(`${CHURCH_API}/api/helpdesk/dashboard`, { auth: true }),
        fetchJson(`${CHURCH_API}/api/helpdesk/tickets?view=breached&per_page=200`, { auth: true }),
        fetchJson(`${CHURCH_API}/api/helpdesk/tickets?status=open&per_page=200`, { auth: true }),
      ])
      if (d.status !== 200 || b.status !== 200 || a.status !== 200) {
        return { ok: false, detail: `HTTP ${d.status}/${b.status}/${a.status}` }
      }
      const dash = d.json
      if (dash.open === 0 && dash.resolved_this_month === 0) {
        return { ok: true, detail: 'no tickets raised' }
      }

      // The tile and the list are computed by two different queries. If they
      // ever disagree, one of them is lying to whoever is triaging.
      if (dash.breaching !== b.json.total) {
        return { ok: false, detail: `tile says ${dash.breaching} breaching, list has ${b.json.total}` }
      }
      if (dash.open !== a.json.total) {
        return { ok: false, detail: `tile says ${dash.open} open, list has ${a.json.total}` }
      }
      if (dash.unassigned > dash.open) {
        return { ok: false, detail: `${dash.unassigned} unassigned exceeds ${dash.open} open` }
      }

      // Every flagged ticket must actually be past a target, and no finished
      // ticket may sit in the breach list.
      const wrong = (b.json.data ?? []).find(
        (t) => (!t.response_breached && !t.resolve_breached)
            || ['resolved', 'closed', 'cancelled'].includes(t.status)
      )
      if (wrong) return { ok: false, detail: `${wrong.ticket_code} is flagged but is not late` }

      return {
        ok: true,
        detail: `${dash.open} open, ${dash.unassigned} unclaimed, ${dash.breaching} past SLA`,
      }
    },
  },
  {
    name: 'no ticket is owned by two people',
    async run() {
      if (!TOKEN) return { ok: false, detail: 'no JWT_SECRET' }
      // Claiming is UPDATE ... WHERE assignee_name = ''. The property that
      // guarantees is one owner per ticket, and a first-response time that
      // never moves once set — both checked here against live data.
      const r = await fetchJson(`${CHURCH_API}/api/helpdesk/tickets?per_page=200`, { auth: true })
      if (r.status !== 200) return { ok: false, detail: `HTTP ${r.status}` }
      const rows = r.json?.data ?? []
      if (!rows.length) return { ok: true, detail: 'no tickets raised' }

      const codes = new Set()
      for (const t of rows) {
        if (codes.has(t.ticket_code)) {
          return { ok: false, detail: `ticket code ${t.ticket_code} issued twice` }
        }
        codes.add(t.ticket_code)
        if (t.first_responded_at && new Date(t.first_responded_at) < new Date(t.opened_at)) {
          return { ok: false, detail: `${t.ticket_code} was answered before it was raised` }
        }
        if (t.status === 'resolved' && !t.resolution) {
          return { ok: false, detail: `${t.ticket_code} is resolved with no record of the fix` }
        }
      }
      const owned = rows.filter((t) => t.assignee_name).length
      return { ok: true, detail: `${rows.length} tickets, ${owned} owned, codes unique` }
    },
  },
  {
    name: 'help desk admin pages render',
    async run() {
      return checkPages('/admin/helpdesk', ['', '/tickets', '/unassigned', '/breaching', '/knowledge', '/categories'])
    },
  },
  {
    name: 'roles admin pages render',
    async run() {
      return checkPages('/admin/roles', ['', '/people'])
    },
  },
  {
    name: 'library admin pages render',
    async run() {
      return checkPages('/admin/library', ['', '/catalogue', '/loans', '/holds', '/borrowers', '/settings'])
    },
  },
  {
    name: 'asset admin pages render',
    async run() {
      return checkPages('/admin/assets', ['', '/register', '/assignments', '/reservations', '/maintenance', '/categories', '/suppliers'])
    },
  },
  {
    name: 'church site renders',
    async run() {
      // The homepage is the largest route in the app and takes ~36s to
      // compile cold under `next dev`, against <1s warm. On the 20s API
      // budget this reported an outage every time the dev server had been
      // touched — which, during a working session, is constantly.
      const t0 = Date.now()
      const r = await fetchJson(CHURCH_WEB, { timeout: PAGE_TIMEOUT_MS })
      const ok = r.status === 200 && /<\/html>/i.test(r.text)
      const ms = Date.now() - t0
      return {
        ok,
        detail: `HTTP ${r.status}, ${Math.round(r.text.length / 1024)}KB${ms > 5000 ? ` (${Math.round(ms / 1000)}s — cold compile)` : ''}`,
      }
    },
  },
  {
    name: 'offering admin pages render',
    async run() {
      return checkPages('/admin/offering-management', ['', '/offerings', '/new', '/cash-counting', '/deposits', '/bank-accounts', '/settings'])
    },
  },
  {
    name: 'sitemap includes detail URLs',
    async run() {
      const r = await fetchJson(`${CHURCH_WEB}/sitemap.xml`, { timeout: PAGE_TIMEOUT_MS })
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
      //
      // Sent to 127.0.0.1 with an explicit Host header rather than to
      // nosuchchurch.localhost: Windows does not resolve *.localhost, so that
      // form tested the resolver and reported ENOTFOUND as an app failure.
      // The Host header is the only thing tenant resolution reads anyway.
      const t0 = Date.now()
      let status
      try {
        const r = await fetchJson('http://127.0.0.1:3002/api/sermons', {
          headers: { host: 'nosuchchurch.localhost' },
        })
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
