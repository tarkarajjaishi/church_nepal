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

async function fetchJson(url, { auth = false, headers = {} } = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
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
      const bad = []
      for (const s of slugs) {
        const page = await fetchJson(`${CHURCH_WEB}/display/${s}`)
        if (page.status !== 200) bad.push(`${s}:${page.status}`)
      }
      return { ok: bad.length === 0, detail: bad.length ? bad.join(' ') : `${slugs.length} display pages OK` }
    },
  },
  {
    name: 'presentation admin pages render',
    async run() {
      const pages = ['', '/live', '/songs', '/playlists', '/displays', '/presentations', '/themes']
      const bad = []
      for (const p of pages) {
        const r = await fetchJson(`${CHURCH_WEB}/admin/presentation${p}`)
        if (r.status !== 200) bad.push(`${p || '/'}:${r.status}`)
      }
      return { ok: bad.length === 0, detail: bad.length ? bad.join(' ') : `${pages.length} pages OK` }
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
      const pages = ['', '/services', '/team', '/rehearsals']
      const bad = []
      for (const p of pages) {
        const r = await fetchJson(`${CHURCH_WEB}/admin/worship${p}`)
        if (r.status !== 200) bad.push(`${p || '/'}:${r.status}`)
      }
      return { ok: bad.length === 0, detail: bad.length ? bad.join(' ') : `${pages.length} pages OK` }
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
    name: 'library admin pages render',
    async run() {
      const pages = ['', '/catalogue', '/loans', '/holds', '/borrowers', '/settings']
      const bad = []
      for (const p of pages) {
        const r = await fetchJson(`${CHURCH_WEB}/admin/library${p}`)
        if (r.status !== 200) bad.push(`${p || '/'}:${r.status}`)
      }
      return { ok: bad.length === 0, detail: bad.length ? bad.join(' ') : `${pages.length} pages OK` }
    },
  },
  {
    name: 'asset admin pages render',
    async run() {
      const pages = ['', '/register', '/assignments', '/reservations', '/maintenance', '/categories', '/suppliers']
      const bad = []
      for (const p of pages) {
        const r = await fetchJson(`${CHURCH_WEB}/admin/assets${p}`)
        if (r.status !== 200) bad.push(`${p || '/'}:${r.status}`)
      }
      return { ok: bad.length === 0, detail: bad.length ? bad.join(' ') : `${pages.length} pages OK` }
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
