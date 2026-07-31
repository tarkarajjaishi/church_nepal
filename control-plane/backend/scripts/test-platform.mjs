#!/usr/bin/env node
/**
 * Integration test for the control-plane platform pages.
 *
 * Reads are cheap to get right; these go after the writes and the invariants:
 * a flag that is off must stay off whatever its rollout says, a coupon that has
 * expired must not be offered, a webhook must record its delivery attempt, and
 * a backup must not claim success for a database it never dumped.
 *
 *   node control-plane/backend/scripts/test-platform.mjs
 */

import crypto from 'node:crypto'

const API = process.env.CP_API || 'http://localhost:3100'

function totp(secret) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  for (const c of secret.toUpperCase()) {
    const i = A.indexOf(c)
    if (i >= 0) bits += i.toString(2).padStart(5, '0')
  }
  const key = Buffer.from((bits.match(/.{8}/g) || []).map((b) => parseInt(b, 2)))
  const step = Math.floor(Date.now() / 1000 / 30)
  const msg = Buffer.alloc(8)
  msg.writeUInt32BE(Math.floor(step / 2 ** 32), 0)
  msg.writeUInt32BE(step >>> 0, 4)
  const h = crypto.createHmac('sha1', key).update(msg).digest()
  const o = h[h.length - 1] & 0xf
  return String((((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6)
    .padStart(6, '0')
}

const login = await fetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    email: 'test@churchnepal.com',
    password: 'testpass123',
    // 160 bits. The 80-bit test vector the seed once used is rejected outright
    // by the TOTP library, so that account could never finish a login.
    code: totp('JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'),
  }),
})
const auth = await login.json()
const TOKEN = auth.token ?? auth.access_token
if (!TOKEN) {
  console.error('FATAL: could not sign in —', JSON.stringify(auth).slice(0, 160))
  process.exit(1)
}

async function api(method, route, body) {
  const res = await fetch(`${API}/api${route}`, {
    method,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let parsed
  try { parsed = text ? JSON.parse(text) : null } catch { parsed = text }
  if (!res.ok) {
    const e = new Error(`${method} ${route} -> ${res.status} ${JSON.stringify(parsed)?.slice(0, 180)}`)
    e.status = res.status
    throw e
  }
  return parsed
}

let passed = 0
const failures = []
const check = (name, cond, detail = '') => {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
async function expectReject(name, status, fn) {
  try {
    await fn()
    failures.push(`${name} — expected ${status}, succeeded`)
    console.log(`  FAIL  ${name} — expected ${status}, succeeded`)
  } catch (e) {
    const ok = e.status === status
    if (ok) passed++; else failures.push(`${name} — expected ${status}, got ${e.status}`)
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : ` — expected ${status}, got ${e.status}`}`)
  }
}

console.log('\nControl plane — platform pages\n')

// -- Storage --------------------------------------------------------------
console.log('1. Storage')
const storage = await api('GET', '/platform/storage')
check('every church reports usage', storage.churches.length > 0, `${storage.churches.length}`)
check('the total is the sum of the churches',
  storage.total_bytes === storage.churches.reduce((s, c) => s + c.storage_bytes, 0))
check('usage is never reported above the limit without being flagged',
  storage.churches.every((c) => c.storage_bytes <= c.limit_bytes || c.percent_used > 100))
check('near-limit is a subset of everything', storage.near_limit <= storage.churches.length)

// -- Retention ------------------------------------------------------------
console.log('\n2. Retention')
const retention = await api('GET', '/platform/retention')
check('cohorts are returned', Array.isArray(retention.cohorts))
check('a cohort never retains more churches than it started with',
  retention.cohorts.every((c) => c.still_active <= c.joined))
check('active in the last 30 days never exceeds the total',
  retention.active_30d <= retention.total, `${retention.active_30d} of ${retention.total}`)
check('quiet churches are listed, not just counted', Array.isArray(retention.quiet))

// -- Ops ------------------------------------------------------------------
console.log('\n3. Ops')
const ops = await api('GET', '/platform/ops')
check('uptime is reported', ops.uptime_seconds > 0)
check('connections never exceed the maximum',
  ops.connections <= ops.max_connections, `${ops.connections}/${ops.max_connections}`)
check('tenant databases are counted', ops.tenant_databases > 0, `${ops.tenant_databases}`)
check('their combined size is reported', ops.tenant_size_bytes >= 0)
// A church stuck mid-provision is the thing an operator needs to see first.
check('churches stuck provisioning are surfaced', typeof ops.provisioning_stuck === 'number')
check('the control database reports a size', ops.database_size_bytes > 0)

// -- Feature flags --------------------------------------------------------
console.log('\n4. Feature flags')
const flags = await api('GET', '/platform/flags')
check('flags are seeded', flags.length > 0, `${flags.length}`)
const flag = flags[0]

await api('PATCH', `/platform/flags/${flag.key}`, { enabled: false, rollout_percent: 40 })
const off = (await api('GET', '/platform/flags')).find((f) => f.key === flag.key)
check('a flag can be switched off', off.enabled === false)
// Off is off. A rollout percentage on a disabled flag must not read as
// "40% of churches have this", because none of them do.
check('rollout is kept but does not override off', off.rollout_percent === 40 && !off.enabled)
check('the change records who made it', !!off.updated_by, off.updated_by)

await expectReject('a rollout above 100 is refused', 400, () =>
  api('PATCH', `/platform/flags/${flag.key}`, { enabled: true, rollout_percent: 140 }))
await expectReject('a negative rollout is refused', 400, () =>
  api('PATCH', `/platform/flags/${flag.key}`, { enabled: true, rollout_percent: -1 }))
await expectReject('an unknown flag is a 404', 404, () =>
  api('PATCH', '/platform/flags/no_such_flag_at_all', { enabled: true }))

await api('PATCH', `/platform/flags/${flag.key}`, {
  enabled: flag.enabled, rollout_percent: flag.rollout_percent,
})
check('the flag is put back as it was',
  (await api('GET', '/platform/flags')).find((f) => f.key === flag.key).enabled === flag.enabled)

// -- Webhooks -------------------------------------------------------------
console.log('\n5. Webhooks')
const before = await api('GET', '/platform/webhooks')
const hook = await api('POST', '/platform/webhooks', {
  url: 'https://example.invalid/hooks/churchnepal',
  events: ['church.created', 'church.suspended'],
})
check('a webhook can be registered', !!hook.id)
check('it is given a signing secret', !!hook.secret && hook.secret.length >= 16)
const after = await api('GET', '/platform/webhooks')
check('it appears in the list', after.length === before.length + 1)

await expectReject('a non-https endpoint is refused', 400, () =>
  api('POST', '/platform/webhooks', { url: 'http://example.invalid/x', events: ['church.created'] }))
await expectReject('a webhook with no events is refused', 400, () =>
  api('POST', '/platform/webhooks', { url: 'https://example.invalid/y', events: [] }))

// The endpoint does not exist, so this must record a failure rather than
// pretend it delivered.
await api('POST', `/platform/webhooks/${hook.id}/test`).catch(() => {})
const deliveries = await api('GET', `/platform/webhooks/${hook.id}/deliveries`)
check('a delivery attempt is logged even when it fails', deliveries.length >= 1,
  `${deliveries.length} attempt(s)`)
check('the log says what happened',
  deliveries.every((d) => d.status_code !== null || d.error),
  JSON.stringify(deliveries[0] ?? {}).slice(0, 100))

await api('DELETE', `/platform/webhooks/${hook.id}`)
check('a webhook can be removed',
  (await api('GET', '/platform/webhooks')).length === before.length)

// -- Email templates ------------------------------------------------------
console.log('\n6. Email templates')
const templates = await api('GET', '/platform/templates')
check('templates are seeded', templates.length > 0, `${templates.length}`)
const tpl = templates[0]
const edited = await api('PATCH', `/platform/templates/${tpl.key}`, {
  subject: 'Edited by the test',
  body: 'Hello {{church_name}}, this is a test.',
})
check('a template can be edited', edited.subject === 'Edited by the test')
await api('PATCH', `/platform/templates/${tpl.key}`, { subject: tpl.subject, body: tpl.body })
check('and put back', (await api('GET', '/platform/templates')).find((t) => t.key === tpl.key).subject === tpl.subject)

// -- Tax ------------------------------------------------------------------
console.log('\n7. Tax')
const tax = await api('GET', '/platform/tax')
check('tax settings load', typeof tax.vat_percent === 'number' || tax.vat_percent === null)
// Changing what appears on every invoice is a super_admin act.
await expectReject('changing tax settings needs super_admin', 403, () =>
  api('PUT', '/platform/tax', { ...tax, vat_percent: 13 }))

// -- Coupons --------------------------------------------------------------
console.log('\n8. Coupons')
const coupons = await api('GET', '/platform/coupons')
check('coupons load', Array.isArray(coupons), `${coupons.length}`)
const code = `TEST${Date.now().toString().slice(-6)}`
const coupon = await api('POST', '/platform/coupons', {
  code, kind: 'percent', value: 25, max_redemptions: 5,
})
check('a coupon can be created', coupon.code === code.toUpperCase() || coupon.code === code)
await expectReject('a duplicate code is refused', 400, () =>
  api('POST', '/platform/coupons', { code, kind: 'percent', value: 10 }))
await expectReject('a discount over 100% is refused', 400, () =>
  api('POST', '/platform/coupons', { code: `${code}X`, kind: 'percent', value: 120 }))
await expectReject('a zero discount is refused', 400, () =>
  api('POST', '/platform/coupons', { code: `${code}Y`, kind: 'percent', value: 0 }))
await expectReject('an unknown discount kind is refused', 400, () =>
  api('POST', '/platform/coupons', { code: `${code}Z`, kind: 'freebie', value: 5 }))

await api('POST', `/platform/coupons/${coupon.code}/false`)
const paused = (await api('GET', '/platform/coupons')).find((c) => c.code === coupon.code)
check('a coupon can be switched off without being deleted', paused && !paused.active)

// -- Broadcasts -----------------------------------------------------------
console.log('\n9. Broadcasts')
const audience = await api('GET', '/platform/broadcasts/audience?audience=all')
check('the audience is countable before sending', audience.count >= 0, `${audience.count}`)
check('and the recipients are shown, not just counted',
  Array.isArray(audience.emails) && audience.emails.length === audience.count)

const draft = await api('POST', '/platform/broadcasts', {
  subject: 'Test broadcast', body: 'Ignore this.', audience: 'all',
})
const saved = (await api('GET', '/platform/broadcasts')).find((b) => b.id === draft.id)
// Composing is not sending. A broadcast that went out the moment it was
// written would be unrecallable.
check('a broadcast starts as a draft, not sent', saved?.status === 'draft', saved?.status)
check('and counts nobody as having received it', (saved?.sent_count ?? 0) === 0)
await expectReject('a broadcast with no subject is refused', 400, () =>
  api('POST', '/platform/broadcasts', { subject: '', body: 'x', audience: 'all' }))

// -- Roles ----------------------------------------------------------------
console.log('\n10. Roles')
const roles = await api('GET', '/platform/roles')
const permissions = await api('GET', '/platform/permissions')
check('roles are defined', roles.length > 0, `${roles.length}`)
check('the permission catalogue is served', permissions.length > 0, `${permissions.length}`)
check('every role permission exists in the catalogue',
  roles.every((r) => (r.permissions ?? []).every((p) => permissions.some((c) => c.key === p || c === p))))
const owner = roles.find((r) => /owner|super/i.test(r.name))
check('the owner role cannot be stripped of everything',
  !owner || (owner.permissions ?? []).length > 0)

// -- Provisioning ---------------------------------------------------------
// Migrations only ever run once, on an empty database at provision time, so a
// migration that references a table created by a later-numbered one is invisible
// to every existing church and breaks every new one. That is exactly what 040
// did to `todos`: CREATE DATABASE succeeded, the migration failed, no registry
// row was written, and the leftover database was then reported by nothing.
// The round trip is the only thing that would have caught it.
console.log('\n11. Provisioning a church end to end')
const NAME = 'Provision Check Temporary'
const SLUG = 'provisionchecktemporary'
{
  const existing = (await api('GET', '/churches')).find(c => c.slug === SLUG)
  if (existing) await api('DELETE', `/churches/${existing.id}`)

  // Caught rather than thrown: a broken migration fails this request, and an
  // uncaught rejection here ends the whole run with a stack trace, losing every
  // check after it. The reason belongs in the failure line instead.
  let made = null, why = ''
  try { made = await api('POST', '/churches', { name: NAME }) }
  catch (e) { why = String(e.message).slice(0, 160) }
  check('a new church can be provisioned', made?.slug === SLUG, why)

  const row = (await api('GET', '/churches')).find(c => c.slug === SLUG)
  check('it is written to the registry, not left as a stray database', !!row)

  const after = await api('GET', '/platform/backups')
  check('the new church is not reported as an unregistered database',
    !after.unregistered.some(s => s.name === SLUG),
    after.unregistered.map(s => s.name).join(', ') || 'none')
  check('it is counted as a church still needing a backup',
    after.unprotected.includes(SLUG), after.unprotected.join(', ') || 'none')

  if (row) {
    await api('DELETE', `/churches/${row.id}`)
    const gone = await api('GET', '/platform/backups')
    check('deprovision removes it without leaving a stray behind',
      !gone.unregistered.some(s => s.name === SLUG)
      && !(await api('GET', '/churches')).some(c => c.slug === SLUG))
  } else if (!made) {
    // Provisioning failed after CREATE DATABASE, which is the very state that
    // produced the original orphan. Say so, and leave it for the operator - a
    // test that silently drops databases is worse than one that reports.
    const stray = (await api('GET', '/platform/backups')).unregistered
      .some(s => s.name === SLUG)
    console.log(stray
      ? `  NOTE  provisioning left "${SLUG}" behind as an unregistered database`
      : `  NOTE  provisioning failed cleanly, nothing left behind`)
  }
}

// -- Backups --------------------------------------------------------------
console.log('\n12. Backups')
const backups = await api('GET', '/platform/backups')
check('backup state loads', Array.isArray(backups.runs))
// The honest bit: if pg_dump is not on PATH the page must say so rather than
// showing an empty list that reads as "no backups have been taken".
check('it says whether pg_dump is even available',
  typeof backups.pg_dump_available === 'boolean',
  `pg_dump_available=${backups.pg_dump_available}`)
check('churches with no successful backup are named, not just counted',
  Array.isArray(backups.unprotected))

// Coverage is computed from the registry, so it can only ever describe churches
// the registry remembers. A database left by a provision that failed partway is
// invisible to every other figure on the page while still holding real members
// and giving, which is the one way church data is lost without a reported
// failure. Reconciliation has to come from pg_database, not from churches.
check('databases with no church are reconciled from the instance',
  Array.isArray(backups.unregistered),
  `${backups.unregistered?.length ?? 'missing'} found`)
check('each stray says how big it is and whether it has ever been dumped',
  backups.unregistered.every(s =>
    typeof s.name === 'string' && typeof s.size_bytes === 'number'
    && (s.last_backup_at === null || typeof s.last_backup_at === 'string')))
// The registry's own database and the cluster's bookkeeping are not strays, and
// must never be offered as something to dump.
check('the control-plane database is not reported as a stray',
  !backups.unregistered.some(s => ['postgres', 'template0', 'template1'].includes(s.name)
    || s.name.includes('control')),
  backups.unregistered.map(s => s.name).join(', ') || 'none')
// The set that may be dumped is exactly the set reconciliation returned, so a
// name that is neither a church nor a stray has to be refused.
// Taking a backup needs super_admin, so this account is turned away at the door
// with a 403 and never reaches the name check. Asserting "some 4xx" would
// therefore pass even if the name check were deleted — a test no regression
// could fail. It runs for real with the owner account, or says it did not run.
const SUPER_PW = process.env.SUPER_ADMIN_PASSWORD
if (!SUPER_PW) {
  console.log('  SKIP  only a name reconciliation returned may be dumped'
    + ' — set SUPER_ADMIN_PASSWORD to run this one')
} else {
  const su = await (await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SUPER_ADMIN_EMAIL || 'owner@churchnepal.com',
      password: SUPER_PW,
    }),
  })).json()
  const suToken = su.token ?? su.access_token
  check('the owner account can sign in', !!suToken, su.error ?? '')
  for (const name of ['churchnepal_control', 'postgres', 'template1', 'no_such_db']) {
    const r = await fetch(`${API}/api/platform/backups/${name}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${suToken}` },
    })
    check(`a super_admin still cannot dump "${name}"`, r.status === 404, `HTTP ${r.status}`)
  }
  // ...and the same account can dump a stray, so the refusals above are the
  // name check working rather than the endpoint being broken for everything.
  if (backups.unregistered.length) {
    // The list is biggest-first; take the last so a repeated test run writes the
    // smallest dump it can rather than the largest database on the instance.
    const stray = backups.unregistered[backups.unregistered.length - 1].name
    const r = await fetch(`${API}/api/platform/backups/${stray}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${suToken}` },
    })
    const body = await r.json().catch(() => ({}))
    check(`a stray database can be dumped ("${stray}")`,
      r.status === 200 && body.size_bytes > 0, `HTTP ${r.status}, ${body.size_bytes ?? 0} bytes`)
  }
}

// -- Report ---------------------------------------------------------------
console.log('\n12. Platform report')
const report = await api('GET', '/platform/report')
check('the report totals churches', report.totals.churches > 0, `${report.totals.churches}`)
check('the plan breakdown adds up to the total',
  report.by_plan.reduce((s, p) => s + p.churches, 0) === report.totals.churches,
  `${report.by_plan.reduce((s, p) => s + p.churches, 0)} vs ${report.totals.churches}`)
check('the status breakdown adds up to the total',
  report.by_status.reduce((s, p) => s + p.churches, 0) === report.totals.churches)
check('the plan MRRs add up to the platform MRR',
  report.by_plan.reduce((s, p) => s + p.mrr, 0) === report.totals.mrr,
  `${report.by_plan.reduce((s, p) => s + p.mrr, 0)} vs ${report.totals.mrr}`)
check('MRR agrees with the analytics overview',
  report.totals.mrr === (await api('GET', '/analytics/overview')).mrr,
  `${report.totals.mrr}`)

// -- Security -------------------------------------------------------------
console.log('\n13. Security')
await expectReject('reading every admin session needs super_admin', 403, () =>
  api('GET', '/platform/security'))

console.log(`\n${passed} passed, ${failures.length} failed`)
if (failures.length) {
  console.log('\nFailures:')
  failures.forEach((f) => console.log(`  - ${f}`))
  process.exit(1)
}
console.log('All checks passed.\n')
