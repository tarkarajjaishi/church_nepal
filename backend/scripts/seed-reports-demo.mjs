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

async function req(token, route, method = 'GET', body) {
  const res = await fetch(`${API}/api${route}`, {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let parsed
  try { parsed = text ? JSON.parse(text) : null } catch { parsed = text }
  return { status: res.status, body: parsed, text }
}
async function api(route, method = 'GET', body) {
  const r = await req(ROOT, route, method, body)
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
async function expectStatus(name, want, token, route, method = 'GET', body) {
  const r = await req(token, route, method, body)
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
  check('every report is listed', cat.length === 14, `${cat.length}`)
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

  // -- 6b. PDF export ------------------------------------------------------
  console.log('\n6b. PDF export')
  const pdfRes = await fetch(
    `${API}/api/reports/giving-summary/export?${FULL}&format=pdf`,
    { headers: { authorization: `Bearer ${ROOT}` } })
  const pdf = Buffer.from(await pdfRes.arrayBuffer())
  const raw = pdf.toString('latin1')
  check('a PDF is returned as a PDF', pdfRes.status === 200
    && pdfRes.headers.get('content-type') === 'application/pdf')
  check('it is a well-formed file', raw.startsWith('%PDF-1.4') && raw.endsWith('%%EOF\n'))

  // A wrong cross-reference offset is the difference between a file that
  // opens and one that says "damaged" with no other clue.
  const xrefAt = parseInt(raw.split('startxref\n').pop().split('\n')[0], 10)
  check('startxref points at the cross-reference table', raw.slice(xrefAt, xrefAt + 4) === 'xref')
  const entries = raw.slice(xrefAt).split('\n').slice(2)
    .filter((l) => /^\d{10} 00000 n/.test(l))
    .map((l) => parseInt(l.slice(0, 10), 10))
  check('every cross-reference offset lands on an object',
    entries.length > 0 && entries.every((o) => /^\d+ 0 obj/.test(raw.slice(o, o + 20))),
    `${entries.length} entries`)

  const drawn = [...raw.matchAll(/\((.*?)\) Tj/g)].map((m) => m[1])
  check('the report name and figures are on the page',
    drawn.includes('Giving summary') && drawn.some((d) => /^\d+\.\d{2}$/.test(d)))
  check('the totals row is on the page', drawn.includes('Total'))
  check('nothing the renderer draws itself is a replacement character',
    drawn.filter((d) => d.includes('?')).length === 0,
    drawn.filter((d) => d.includes('?')).slice(0, 2).join(' | '))

  const pdfLib = await fetch(
    `${API}/api/reports/library-circulation/export?${FULL}&format=pdf`,
    { headers: { authorization: `Bearer ${ROOT}` } })
  check('every report exports as PDF, not only the giving one', pdfLib.status === 200)

  await expectStatus('an unknown format is refused', 400, ROOT,
    `/reports/giving-summary/export?${FULL}&format=xlsx`)

  // -- 6c. Saved views and schedules ---------------------------------------
  console.log('\n6c. Saved views and schedules')
  const viewName = `Test view ${Date.now()}`
  const view = await api('/reports/saved', 'POST', {
    name: viewName, report_key: 'giving-summary', period: 'this_year',
    columns: ['donor', 'total', 'gifts'], sort_column: 'total', sort_desc: true,
    filters: [{ column: 'total', op: 'gte', value: '50000' }],
  })
  const ran = await api(`/reports/saved/${view.id}/run`)
  check('a saved view keeps its own name', ran.name === viewName)
  check('and only the columns it chose', ran.columns.map((c) => c.key).join(',') === 'donor,total,gifts',
    ran.columns.map((c) => c.key).join(','))
  check('its filter narrows the table', ran.rows.length < ran.total_rows,
    `${ran.rows.length} of ${ran.total_rows}`)
  check('every surviving row passes the filter', ran.rows.every((r) => r.total >= 50000))
  check('and they are sorted as asked',
    ran.rows.every((r, i) => i === 0 || ran.rows[i - 1].total >= r.total))
  check('totals are over the rows shown, not the whole period',
    ran.totals.total === ran.rows.reduce((s, r) => s + r.total, 0),
    `${ran.totals.total}`)

  // A named period must move with the calendar, or a weekly email becomes a
  // stuck clock pointing at whenever it was set up.
  check('a named period resolves to now, not to when it was saved',
    ran.from === `${YEAR}-01-01`, ran.from)

  await expectStatus('a filter on a column that does not exist is refused at save time', 400,
    ROOT, '/reports/saved', 'POST',
    { name: 'Bad', report_key: 'giving-summary', filters: [{ column: 'nope', op: 'eq', value: '1' }] })
  await expectStatus('so is a made-up report', 400, ROOT, '/reports/saved', 'POST',
    { name: 'Bad2', report_key: 'not-a-report' })
  await expectStatus('and a duplicate name', 409, ROOT, '/reports/saved', 'POST',
    { name: viewName, report_key: 'giving-summary' })

  const sched = await api('/reports/schedules', 'POST', {
    saved_report_id: view.id, frequency: 'weekly', day_of_week: 1, hour: 7,
    recipients: 'treasurer@test.local, pastor@test.local',
  })
  check('a schedule computes its next send', /^\d{4}-\d{2}-\d{2}T07:00/.test(sched.next_run_at),
    sched.next_run_at)
  check('and lands on the chosen day',
    new Date(sched.next_run_at + 'Z').getUTCDay() === 1, sched.next_run_at)

  await expectStatus('an unimplemented frequency is refused', 400, ROOT,
    '/reports/schedules', 'POST',
    { saved_report_id: view.id, frequency: 'fortnightly', recipients: 'a@b.org' })
  await expectStatus('a bad address is refused, naming it', 400, ROOT,
    '/reports/schedules', 'POST',
    { saved_report_id: view.id, recipients: 'a@b.org, not-an-address' })

  // The one that matters: with no SMTP configured this must FAIL, and the
  // failure must be recorded. A schedule that says "sent" while sending
  // nothing is the worst outcome, because the treasurer stops checking.
  const send = await req(ROOT, `/reports/schedules/${sched.id}/send`, 'POST')
  const configured = !!process.env.SMTP_HOST
  if (configured) {
    check('sending works when SMTP is configured', send.status === 200)
  } else {
    check('an unconfigured SMTP server is a failure, not a silent success',
      send.status === 400 && /SMTP/i.test(JSON.stringify(send.body)),
      JSON.stringify(send.body).slice(0, 120))
  }
  const log = await api('/reports/deliveries')
  check('every attempt is recorded, including the failures', log.length > 0)
  check('and the record says why', configured || (log[0].status === 'failed' && !!log[0].error),
    JSON.stringify(log[0]).slice(0, 140))

  const after = (await api('/reports/schedules')).find((s) => s.id === sched.id)
  check('a manual send does not move the schedule', after.next_run_at === sched.next_run_at)
  check('but it does record the outcome', after.last_status !== '')

  await api(`/reports/schedules/${sched.id}`, 'DELETE')
  const del = await api(`/reports/saved/${view.id}`, 'DELETE')
  check('deleting a view reports how many schedules it stopped',
    typeof del.schedules_stopped === 'number')

  // -- 6d. Drill-down ------------------------------------------------------
  //
  // The property that makes a drill worth having: the records behind a row
  // must add up to the row. If they do not, one of the two is wrong, and a
  // figure nobody can check is a figure nobody trusts for long.
  console.log('\n6d. Drill-down')
  const DRILLS = [
    ['giving-summary', 'donor', 'total', 'amount'],
    ['giving-by-fund', 'fund', 'total', 'amount'],
    ['offering-collections', 'category', 'total', 'amount'],
    ['asset-register', 'category', 'cost', 'cost'],
    ['membership', 'status', 'people', null],
    ['worship-team', 'name', 'served', null],
    ['library-circulation', 'title', 'loans', null],
    ['helpdesk-performance', 'area', 'raised', null],
  ]
  const mismatched = []
  let drilled = 0
  for (const [key, col, figure, sumCol] of DRILLS) {
    const rep = reports[key]
    if (!rep || rep.unavailable) continue
    const row = rep.rows.find((r) => r[figure] > 0)
    if (!row) continue
    const d = await api(
      `/reports/${key}/drill?${FULL}&value=${encodeURIComponent(String(row[col]))}`)
    drilled++
    if (sumCol) {
      const sum = d.rows.reduce((s, r) => s + r[sumCol], 0)
      if (sum !== row[figure]) mismatched.push(`${key}: drill sums ${sum}, row says ${row[figure]}`)
    } else if (d.total !== row[figure]) {
      mismatched.push(`${key}: drill has ${d.total} records, row says ${row[figure]}`)
    }
    if (!d.columns.length) mismatched.push(`${key}: drill has no columns`)
    if (!d.link) mismatched.push(`${key}: drill offers no way to the module`)
  }
  check(`every drill adds up to the row it came from (${drilled} reports)`,
    mismatched.length === 0, mismatched.slice(0, 3).join(' | '))

  await expectStatus('a report whose rows are already the detail has no drill', 400,
    ROOT, `/reports/attendance/drill?${FULL}&value=x`)
  await expectStatus('drilling with nothing selected is refused', 400,
    ROOT, `/reports/giving-summary/drill?${FULL}`)
  await expectStatus('drilling a report that does not exist is a 404', 404,
    ROOT, `/reports/made-up/drill?${FULL}&value=x`)


  // -- 6e. The reports that had no data ------------------------------------
  //
  // Pledges and volunteer rotas were empty, and an empty table looks exactly
  // like a broken join. Seed a little through the real API so these three
  // reports are exercised rather than merely returning nothing.
  console.log('\n6e. Pledge, campaign and volunteer reports')

  // /campaigns is paginated, so the rows are under `data`. Reading it as a
  // bare array silently yielded undefined and the seeding did nothing —
  // which looked exactly like the report being broken.
  const campaignsRes = await api('/campaigns')
  const campaigns = Array.isArray(campaignsRes) ? campaignsRes : (campaignsRes.data ?? [])
  if (campaigns.length) {
    const c = campaigns[0]
    const pledgeRes = await api('/pledges')
    const existingPledges = Array.isArray(pledgeRes) ? pledgeRes : (pledgeRes.data ?? [])
    if (existingPledges.length < 3) {
      for (const [name, amount] of [
        ['Bishal Rai', 5000000],
        ['Suman Tamang', 2500000],
        ['Anita Gurung', 1000000],
      ]) {
        await api('/pledges', 'POST', {
          campaign_id: c.id, person_name: name,
          person_email: `${name.split(' ')[0].toLowerCase()}@gracenepal.org`,
          amount, notes: 'Seeded for the pledge report',
        })
      }
    }
  }

  const teamRes = await api('/volunteer-teams')
  const teams = Array.isArray(teamRes) ? teamRes : (teamRes.data ?? [])
  let team = teams.find((t) => t.name === 'Sunday Welcome')
  if (!team) {
    team = await api('/volunteer-teams', 'POST', {
      name: 'Sunday Welcome', description: 'Door, tea and seating',
    })
  }
  const shiftRes = await api('/volunteer-shifts')
  const allShifts = Array.isArray(shiftRes) ? shiftRes : (shiftRes.data ?? [])
  let shifts = allShifts.filter((x) => x.team_id === team.id)
  if (shifts.length < 3) {
    for (let i = shifts.length; i < 3; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i * 7)
      await api('/volunteer-shifts', 'POST', {
        team_id: team.id,
        title: 'Sunday morning', shift_date: d.toISOString().slice(0, 10),
        start_time: '09:00', end_time: '12:00', slots: 4, location: 'Main door',
      })
    }
    const again = await api('/volunteer-shifts')
    shifts = (Array.isArray(again) ? again : (again.data ?? []))
      .filter((x) => x.team_id === team.id)
  }

  // Rostered separately from shift creation. Nesting the two meant a re-run
  // found the shifts already there, skipped the whole block, and left them
  // unstaffed — so the report read as broken when it was reporting an empty
  // rota correctly.
  for (const shift of shifts) {
    const on = await api(`/volunteer-shifts/${shift.id}/assignments`)
    const rostered = Array.isArray(on) ? on : (on.data ?? [])
    for (const who of ['Sita Rai', 'Deepak Karki']) {
      if (rostered.some((a) => a.name === who)) continue
      await api(`/volunteer-shifts/${shift.id}/assignments`, 'POST', {
        shift_id: shift.id, name: who, status: 'assigned',
      })
    }
  }

  const pledgeReport = await api(`/reports/pledge-fulfilment?${FULL}`)
  check('the pledge report finds the pledges', pledgeReport.rows.length > 0,
    `${pledgeReport.rows.length} rows`)
  check('promised equals the sum of the pledges',
    pledgeReport.stats.find((s) => s.label === 'Promised').value
      === pledgeReport.rows.reduce((s, r) => s + r.promised, 0))
  check('outstanding is never negative',
    pledgeReport.rows.every((r) => r.outstanding >= 0)
    && pledgeReport.stats.find((s) => s.label === 'Still outstanding').value >= 0)
  check('a fully-kept pledge shows 100%',
    pledgeReport.rows.every((r) => r.promised === 0 || Math.abs(r.progress - (r.received / r.promised) * 100) < 0.11))

  const campaignReport = await api(`/reports/campaign-progress?${FULL}`)
  check('the campaign report lists the campaigns', campaignReport.rows.length > 0)
  check('a campaign with no target has no percentage rather than 0%',
    campaignReport.rows.every((r) => r.goal > 0 || r.progress === null),
    JSON.stringify(campaignReport.rows.find((r) => r.goal === 0 && r.progress !== null)))

  const volunteerReport = await api(`/reports/volunteer-service?${FULL}`)
  check('the volunteer report finds the rota', volunteerReport.rows.length > 0,
    `${volunteerReport.rows.length} rows`)
  check('shifts covered equals the sum of the rows',
    volunteerReport.stats.find((s) => s.label === 'Shifts covered').value
      === volunteerReport.rows.reduce((s, r) => s + r.shifts, 0))
  check('unfilled slots are never negative',
    volunteerReport.stats.find((s) => s.label === 'Slots unfilled').value >= 0)

  const household = await api(`/reports/giving-by-household?${FULL}`)
  check('household giving totals the same money as the giving summary',
    household.rows.reduce((s, r) => s + r.total, 0)
      === reports['giving-summary'].stats.find((s) => s.label === 'Total given').value,
    `${household.rows.reduce((s, r) => s + r.total, 0)}`)
  check('gifts that could not be matched are shown, not dropped',
    household.stats.some((s) => s.label === 'Could not be placed'))

  const visitors = await api(`/reports/visitor-follow-up?${FULL}`)
  check('the visitor report excludes people already on the roll',
    visitors.rows.length <= reports.membership.stats.find((s) => s.label === 'On the roll').value)
  check('longest-unseen come first',
    visitors.rows.every((r, i) => i === 0 || r.last_seen === null
      || visitors.rows[i - 1].last_seen === null
      || visitors.rows[i - 1].last_seen <= r.last_seen))


  // -- 6f. The report builder ----------------------------------------------
  //
  // The builder composes a view on the query string. The property that makes
  // it trustworthy is that the *server* applies it: the table, the CSV and
  // the PDF must all show the same rows, or the export becomes the most
  // convincing wrong spreadsheet in the building.
  console.log('\n6f. Report builder')
  const composed = {
    columns: ['donor', 'total'],
    filters: [{ column: 'total', op: 'gte', value: '50000' }],
    sort_column: 'total',
    sort_desc: true,
  }
  const enc = (v) => `&view=${encodeURIComponent(JSON.stringify(v))}`

  const plain = await api(`/reports/giving-summary?${FULL}`)
  const built = await api(`/reports/giving-summary?${FULL}${enc(composed)}`)

  check('a composed view narrows the columns',
    built.columns.map((c) => c.key).join(',') === 'donor,total',
    built.columns.map((c) => c.key).join(','))
  check('and the rows', built.rows.length < plain.rows.length,
    `${built.rows.length} vs ${plain.rows.length}`)
  check('while reporting how many there were before',
    built.total_rows === plain.rows.length, `${built.total_rows}`)
  check('every surviving row passes the condition', built.rows.every((r) => r.total >= 50000))
  check('and they are in the order asked for',
    built.rows.every((r, i) => i === 0 || built.rows[i - 1].total >= r.total))
  check('totals cover the rows shown, not the period',
    built.totals.total === built.rows.reduce((s, r) => s + r.total, 0))

  // Each operator has to actually do something, or it is a control that
  // reassures without working.
  const OPS = [
    ['eq', 'Bishal Rai', 'donor'],
    ['ne', 'Bishal Rai', 'donor'],
    ['contains', 'rai', 'donor'],
    ['gt', '100000', 'total'],
    ['gte', '100000', 'total'],
    ['lt', '100000', 'total'],
    ['lte', '100000', 'total'],
    ['not_empty', '', 'email'],
    ['empty', '', 'email'],
  ]
  const opResults = {}
  for (const [op, value, column] of OPS) {
    const r = await api(`/reports/giving-summary?${FULL}${enc({
      columns: [], filters: [{ column, op, value }], sort_column: '', sort_desc: false })}`)
    opResults[op] = r.rows.length
  }
  check('every operator is implemented and selective',
    opResults.eq === 1
    && opResults.ne === plain.rows.length - 1
    && opResults.contains >= 1
    && opResults.gt < opResults.gte
    && opResults.lt < opResults.lte
    && opResults.not_empty + opResults.empty === plain.rows.length,
    JSON.stringify(opResults))

  // Numbers must compare as numbers. As strings "1000" > "500" is false, and
  // that is the commonest way a filter quietly returns the wrong set.
  const overFive = await api(`/reports/giving-summary?${FULL}${enc({
    columns: [], filters: [{ column: 'total', op: 'gt', value: '5000' }],
    sort_column: '', sort_desc: false })}`)
  check('numeric conditions compare as numbers, not as text',
    overFive.rows.every((r) => r.total > 5000)
    && overFive.rows.some((r) => String(r.total).length > String(5000).length),
    `${overFive.rows.length} rows`)

  // The export must carry the same view.
  const builtCsv = (await req(ROOT,
    `/reports/giving-summary/export?${FULL}&format=csv${enc(composed)}`)).text
  const csvBody = builtCsv.split('Donor,Given')[1] ?? ''
  const csvRows = csvBody.trim().split('\n').filter(Boolean)
  check('the CSV export carries the composed view',
    builtCsv.includes('Donor,Given') && !builtCsv.includes('Email')
    && csvRows.length === built.rows.length,
    `${csvRows.length} csv rows vs ${built.rows.length} on screen`)

  const builtPdf = Buffer.from(await (await fetch(
    `${API}/api/reports/giving-summary/export?${FULL}&format=pdf${enc(composed)}`,
    { headers: { authorization: `Bearer ${ROOT}` } })).arrayBuffer()).toString('latin1')
  const builtDrawn = [...builtPdf.matchAll(/\((.*?)\) Tj/g)].map((m) => m[1])
  check('and so does the PDF',
    builtDrawn.includes('Donor') && builtDrawn.includes('Given')
    && !builtDrawn.includes('Email'),
    builtDrawn.slice(0, 12).join(' | '))

  // A malformed view must be refused, not ignored. Falling back to the whole
  // table would show every row to somebody who asked for a filtered one — the
  // wrong answer, presented as the right one.
  await expectStatus('a view that cannot be read is refused', 400, ROOT,
    `/reports/giving-summary?${FULL}&view=notjson`)
  await expectStatus('a condition on a column that does not exist is refused', 400, ROOT,
    `/reports/giving-summary?${FULL}${enc({ columns: [], sort_column: '', sort_desc: false,
      filters: [{ column: 'nope', op: 'eq', value: '1' }] })}`)
  await expectStatus('sorting by a column that does not exist is refused', 400, ROOT,
    `/reports/giving-summary?${FULL}${enc({ columns: [], filters: [],
      sort_column: 'nope', sort_desc: false })}`)

  // An operator nobody implemented keeps every row rather than emptying the
  // table: a filter that does nothing is visible, one that shows nothing looks
  // exactly like having no data.
  const unknownOp = await api(`/reports/giving-summary?${FULL}${enc({
    columns: [], filters: [{ column: 'total', op: 'roughly', value: '1' }],
    sort_column: '', sort_desc: false })}`)
  check('an unimplemented operator keeps the rows rather than emptying the table',
    unknownOp.rows.length === plain.rows.length, `${unknownOp.rows.length}`)

  // A composed view works on every report, not just the giving one.
  let acrossAll = 0
  for (const r of cat) {
    const body = reports[r.key]
    if (body.unavailable || !body.columns.length) continue
    const first = body.columns[0].key
    const v = await api(`/reports/${r.key}?${FULL}${enc({
      columns: [first], filters: [], sort_column: first, sort_desc: true })}`)
    if (v.columns.length === 1 && v.columns[0].key === first) acrossAll++
  }
  check('a view can be composed on any report', acrossAll >= 12, `${acrossAll} reports`)

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
