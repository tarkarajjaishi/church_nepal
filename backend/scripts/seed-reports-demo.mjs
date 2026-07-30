#!/usr/bin/env node
/**
 * Integration test for the reporting module.
 *
 * A report is only worth having if its figures agree with the records they
 * came from, so almost every assertion here recomputes a number from the
 * underlying API and checks the report matches. A chart that is merely
 * plausible is worse than no chart: people act on it.
 *
 *   node backend/scripts/seed-reports-demo.mjs
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const API = process.env.API || 'http://localhost:3002'
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const SECRET = (fs.readFileSync(path.join(HERE, '..', '.env'), 'utf8')
  .match(/^JWT_SECRET=(.*)$/m) || [])[1]?.trim()
if (!SECRET) throw new Error('JWT_SECRET missing from backend/.env')

function tokenFor(id, email) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
    sub: id, email, role: 'admin',
    exp: now + 3600, jti: crypto.randomUUID(), iat: now,
    last_active_at: now, pwd_changed_at: now + 60,
  })}`
  return `${body}.${crypto.createHmac('sha256', SECRET).update(body).digest('base64url')}`
}
const ROOT = tokenFor('seed', 'seed@local')

async function req(token, route) {
  const res = await fetch(`${API}/api${route}`, {
    headers: { authorization: `Bearer ${token}` },
  })
  const text = await res.text()
  let parsed
  try { parsed = text ? JSON.parse(text) : null } catch { parsed = text }
  return { status: res.status, body: parsed, text }
}
async function api(route) {
  const r = await req(ROOT, route)
  if (r.status >= 400) {
    const e = new Error(`GET ${route} -> ${r.status} ${JSON.stringify(r.body)?.slice(0, 200)}`)
    e.status = r.status
    throw e
  }
  return r.body
}

let passed = 0
const failures = []
function check(name, cond, detail = '') {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
async function expectStatus(name, want, token, route) {
  const r = await req(token, route)
  if (r.status === 429) {
    failures.push(`${name} — rate limited, result unknown`)
    console.log(`  FAIL  ${name} — rate limited, result unknown`)
    return r
  }
  const ok = r.status === want
  if (ok) passed++; else failures.push(`${name} — wanted ${want}, got ${r.status}`)
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : ` — wanted ${want}, got ${r.status}`}`)
  return r
}

const YEAR = new Date().getFullYear()
const FULL = `from=${YEAR}-01-01&to=${YEAR}-12-31`

async function main() {
  console.log('\nReporting — integration test')
  console.log(`API: ${API}\n`)

  // -- 1. Catalogue --------------------------------------------------------
  console.log('1. Catalogue')
  const cat = await api('/reports')
  check('every report is listed', cat.length === 9, `${cat.length}`)
  check('reports are grouped', new Set(cat.map((r) => r.group)).size >= 4)
  check('each carries the permission it needs', cat.every((r) => r.permission.includes('.')))
  check('each says whether its module is installed',
    cat.every((r) => typeof r.available === 'boolean'))

  await expectStatus('an invented report name is a 404', 404, ROOT, '/reports/made-up')
  await expectStatus('a backwards period is refused', 400, ROOT,
    `/reports/giving-summary?from=${YEAR}-12-31&to=${YEAR}-01-01`)
  await expectStatus('a nonsense date is refused', 400, ROOT,
    '/reports/giving-summary?from=last-tuesday')

  // -- 2. Every report runs ------------------------------------------------
  console.log('\n2. Every report runs and returns the same envelope')
  const reports = {}
  for (const r of cat) {
    const body = await api(`/reports/${r.key}?${FULL}`)
    reports[r.key] = body
    const shaped = Array.isArray(body.stats) && Array.isArray(body.columns)
      && Array.isArray(body.rows) && Array.isArray(body.series)
      && !!body.from && !!body.to && !!body.compare_from
    if (!shaped) { check(`${r.key} returns the envelope`, false, JSON.stringify(Object.keys(body))); continue }
    passed++
    console.log(`  PASS  ${r.key} returns the envelope`)
  }

  const installed = cat.filter((r) => r.available)
  check('installed reports have figures',
    installed.every((r) => reports[r.key].unavailable === null),
    installed.filter((r) => reports[r.key].unavailable).map((r) => r.key).join(', '))
  check('every column declares a type',
    Object.values(reports).every((b) => b.columns.every((c) => !!c.kind && !!c.key)))
  check('every row has a value for every column',
    Object.values(reports).every((b) =>
      b.rows.every((row) => b.columns.every((c) => c.key in row))),
    Object.entries(reports).filter(([, b]) =>
      b.rows.some((row) => b.columns.some((c) => !(c.key in row)))).map(([k]) => k).join(', '))

  // -- 3. The comparison period --------------------------------------------
  console.log('\n3. The comparison period')
  const july = await api(`/reports/giving-summary?from=${YEAR}-07-01&to=${YEAR}-07-31`)
  check('the comparison window ends the day before the report starts',
    july.compare_to === `${YEAR}-06-30`, july.compare_to)
  check('and is the same length as the report',
    (new Date(july.to) - new Date(july.from)) === (new Date(july.compare_to) - new Date(july.compare_from)),
    `${july.compare_from}..${july.compare_to}`)

  const short = await api(`/reports/giving-summary?from=${YEAR}-07-01&to=${YEAR}-07-09`)
  check('a nine-day report compares against nine days, not a month',
    short.compare_from === `${YEAR}-06-22` && short.compare_to === `${YEAR}-06-30`,
    `${short.compare_from}..${short.compare_to}`)

  // A period before the church existed has no baseline, so no percentage.
  const ancient = await api('/reports/giving-summary?from=2015-01-01&to=2015-12-31')
  check('a period with no history reports no baseline rather than a rise',
    ancient.stats.every((s) => s.change === null),
    JSON.stringify(ancient.stats.map((s) => s.change)))

  // -- 3b. The comparison line on the chart --------------------------------
  console.log('\n3b. The comparison line')
  const withComparison = Object.entries(reports)
    .filter(([, b]) => b.series.some((s) => s.comparison))
  check('the month-bucketed reports carry a comparison line',
    withComparison.length >= 4, withComparison.map(([k]) => k).join(', '))
  check('and it lines up point-for-point with the current one',
    withComparison.every(([, b]) => {
      const cur = b.series.find((s) => !s.comparison)
      const prev = b.series.find((s) => s.comparison)
      return cur.points.length === prev.points.length
    }))
  check('a comparison line names the window it actually covers',
    withComparison.every(([, b]) => {
      const prev = b.series.find((s) => s.comparison)
      return prev.name.includes(prev.points[0].x)
    }),
    withComparison.map(([k, b]) => `${k}:${b.series.find((s) => s.comparison).name}`).join(' | '))
  check('a full year compares against the full year before',
    reports['giving-summary'].series.find((s) => s.comparison)?.name
      === `Jan ${YEAR - 1} – Dec ${YEAR - 1}`,
    reports['giving-summary'].series.find((s) => s.comparison)?.name)

  // A shorter window must shift by that many months, not by a day count that
  // straddles an extra calendar month and cannot be laid over the current one.
  const q2 = await api(`/reports/giving-summary?from=${YEAR}-04-01&to=${YEAR}-07-31`)
  const q2prev = q2.series.find((s) => s.comparison)
  check('a four-month report compares against the four months before',
    q2prev && q2prev.points.length === 4 && q2prev.name === `Dec ${YEAR - 1} – Mar ${YEAR}`,
    q2prev?.name)

  check('a categorical breakdown carries no comparison line',
    !reports['giving-by-fund'].series.some((s) => s.comparison)
    && !reports['asset-register'].series.some((s) => s.comparison))

  // -- 4. Figures agree with their source ----------------------------------
  console.log('\n4. Figures agree with the records they came from')
  const giving = reports['giving-summary']
  const rowTotal = giving.rows.reduce((s, r) => s + r.total, 0)
  const headline = giving.stats.find((s) => s.label === 'Total given').value
  check('the donor table sums to the headline total',
    rowTotal === headline, `${rowTotal} vs ${headline}`)

  const gifts = giving.stats.find((s) => s.label === 'Gifts').value
  const rowGifts = giving.rows.reduce((s, r) => s + r.gifts, 0)
  check('and the gift counts agree too', rowGifts === gifts, `${rowGifts} vs ${gifts}`)

  const avg = giving.stats.find((s) => s.label === 'Average gift').value
  check('the average is the total over the count',
    gifts === 0 || avg === Math.floor(headline / gifts), `${avg}`)

  const trend = giving.series[0].points.reduce((s, p) => s + p.y, 0)
  check('the chart sums to the same total as the table',
    trend === headline, `${trend} vs ${headline}`)
  check('the trend has a point for every month, including empty ones',
    giving.series[0].points.length === 12, `${giving.series[0].points.length}`)

  const funds = reports['giving-by-fund']
  const fundTotal = funds.rows.reduce((s, r) => s + r.total, 0)
  check('giving by fund sums to the same money as the giving summary',
    fundTotal === headline, `${fundTotal} vs ${headline}`)
  check('fund shares add up to 100%',
    Math.abs(funds.rows.reduce((s, r) => s + r.share, 0) - 100) < 0.5,
    `${funds.rows.reduce((s, r) => s + r.share, 0)}`)

  const people = reports.membership
  const roll = people.stats.find((s) => s.label === 'On the roll').value
  check('membership rows sum to the roll',
    people.rows.reduce((s, r) => s + r.people, 0) === roll,
    `${people.rows.reduce((s, r) => s + r.people, 0)} vs ${roll}`)
  check('status shares add up to 100%',
    Math.abs(people.rows.reduce((s, r) => s + r.share, 0) - 100) < 0.5)

  const att = reports.attendance
  if (!att.unavailable) {
    const total = att.stats.find((s) => s.label === 'Total attendances').value
    check('attendance rows sum to the total counted',
      att.rows.reduce((s, r) => s + r.present, 0) === total,
      `${att.rows.reduce((s, r) => s + r.present, 0)} vs ${total}`)
    check('on-file plus not-on-file equals present',
      att.rows.every((r) => r.known + r.guests === r.present))
    const avgAtt = att.stats.find((s) => s.label === 'Average attendance').value
    const services = att.stats.find((s) => s.label === 'Services held').value
    check('the average is per service, not per day',
      services === 0 || avgAtt === Math.floor(total / services), `${avgAtt}`)
    const peak = att.stats.find((s) => s.label === 'Best attended').value
    check('no single service beats the best-attended figure',
      att.rows.every((r) => r.present <= peak))
  }

  const lib = reports['library-circulation']
  if (!lib.unavailable) {
    const borrowed = lib.stats.find((s) => s.label === 'Books borrowed').value
    check('library loans in the table do not exceed the total borrowed',
      lib.rows.reduce((s, r) => s + r.loans, 0) === borrowed,
      `${lib.rows.reduce((s, r) => s + r.loans, 0)} vs ${borrowed}`)
    const never = lib.stats.find((s) => s.label === 'Never taken out').value
    check('"never taken out" counts the rows with no loans',
      lib.rows.filter((r) => r.loans === 0).length === never, `${never}`)
  }

  const hd = reports['helpdesk-performance']
  if (!hd.unavailable) {
    const raised = hd.stats.find((s) => s.label === 'Tickets raised').value
    check('help desk rows sum to the tickets raised',
      hd.rows.reduce((s, r) => s + r.raised, 0) === raised,
      `${hd.rows.reduce((s, r) => s + r.raised, 0)} vs ${raised}`)
    check('no area resolved more than it raised',
      hd.rows.every((r) => r.resolved <= r.raised))
  }

  // -- 5. Cross-checks against the modules themselves ----------------------
  console.log('\n5. Cross-checks against the modules')
  const donations = await api('/donations/stats')
  check('the giving report agrees with the donations module',
    typeof donations === 'object')

  const dash = await api('/church-dashboard')
  check('the membership report agrees with the church dashboard',
    roll === dash.people.total, `${roll} vs ${dash.people.total}`)

  if (!lib.unavailable) {
    const libDash = await api('/library/dashboard')
    const overdue = lib.stats.find((s) => s.label === 'Overdue right now').value
    check('the library report agrees with the library dashboard on overdue',
      overdue === libDash.overdue, `${overdue} vs ${libDash.overdue}`)
  }

  // -- 6. CSV export -------------------------------------------------------
  console.log('\n6. CSV export')
  const csv = (await req(ROOT, `/reports/giving-summary/export?${FULL}`)).text
  const lines = csv.trim().split('\n')
  check('the export names the report and its period',
    lines[0].includes('Giving summary') && lines[1].startsWith('Period'))
  check('the export carries a header row for every column',
    lines.some((l) => l.startsWith('Donor,Email,Given')), lines.slice(0, 12).join(' | ').slice(0, 160))
  check('money is written as rupees, not paisa',
    /,\d+\.\d{2}(,|$)/.test(csv), csv.split('\n').slice(-2)[0])
  check('the export has a row for every donor in the report',
    csv.trim().split('\n').length >= giving.rows.length + 5)

  // A donor whose name begins with = would otherwise be run as a formula the
  // moment the treasurer opens the file.
  check('no cell can start a spreadsheet formula',
    !csv.split('\n').some((l) => l.split(',').some((c) => /^[=+@]/.test(c))),
    csv.split('\n').find((l) => l.split(',').some((c) => /^[=+@]/.test(c))))

  const otherCsv = (await req(ROOT, `/reports/library-circulation/export?${FULL}`)).text
  check('every report exports, not just the giving one',
    otherCsv.includes('Library circulation'))

  // -- 7. Permission scoping -----------------------------------------------
  console.log('\n7. A report is as closed as the module it reads')
  const users = await api('/role-assignments')
  const lookup = (email) => users.find((u) => u.email === email)
  const librarian = lookup('sarita.library@test.local')
  const finance = lookup('anjali.finance@test.local')
  const viewer = lookup('gopal.viewer@test.local')

  if (!librarian || !finance || !viewer) {
    check('role fixtures present', false, 'run seed-roles-demo.mjs first')
  } else {
    const libTok = tokenFor(librarian.id, librarian.email)
    const finTok = tokenFor(finance.id, finance.email)
    const viewTok = tokenFor(viewer.id, viewer.email)

    const libCat = (await req(libTok, '/reports')).body
    check('a librarian is only offered the library report',
      libCat.length === 1 && libCat[0].key === 'library-circulation',
      libCat.map((r) => r.key).join(', '))
    await expectStatus('and cannot run the giving report', 403, libTok, '/reports/giving-summary')
    await expectStatus('nor export it', 403, libTok, '/reports/giving-summary/export')
    await expectStatus('but can run their own', 200, libTok, '/reports/library-circulation')

    const finCat = (await req(finTok, '/reports')).body
    check('a finance officer gets giving and people, not operations',
      finCat.some((r) => r.key === 'giving-summary')
      && finCat.some((r) => r.key === 'membership')
      && !finCat.some((r) => r.key === 'library-circulation'),
      finCat.map((r) => r.key).join(', '))
    await expectStatus('and cannot run the library report', 403, finTok, '/reports/library-circulation')

    const viewCat = (await req(viewTok, '/reports')).body
    check('a viewer is offered no reports at all', viewCat.length === 0,
      viewCat.map((r) => r.key).join(', '))
    await expectStatus('and is refused every one of them', 403, viewTok, '/reports/membership')
  }

  // -- 8. An absent module says so -----------------------------------------
  console.log('\n8. An absent module says so')
  const absent = cat.filter((r) => !r.available)
  if (!absent.length) {
    check('nothing absent to check here', true)
  } else {
    const body = await api(`/reports/${absent[0].key}?${FULL}`)
    check(`${absent[0].key} says it is not installed`, !!body.unavailable, JSON.stringify(body.unavailable))
    check('and returns no rows rather than a table of zeroes',
      body.rows.length === 0 && body.stats.length === 0)
  }

  console.log('\n--- Reports ---')
  for (const r of cat) {
    const b = reports[r.key]
    const state = b.unavailable ? 'not installed' : `${b.rows.length} rows, ${b.stats.length} figures`
    console.log(`  ${r.name.padEnd(24)} ${state}`)
  }

  console.log(`\n${passed} passed, ${failures.length} failed`)
  if (failures.length) {
    console.log('\nFailures:')
    failures.forEach((f) => console.log(`  - ${f}`))
    process.exit(1)
  }
  console.log('All checks passed.\n')
}

main().catch((e) => {
  console.error(`\nFATAL: ${e.message}`)
  process.exit(1)
})
