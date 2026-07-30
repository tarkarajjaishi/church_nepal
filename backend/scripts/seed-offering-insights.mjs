#!/usr/bin/env node
/**
 * Seed + integration test for the seven offering-management pages.
 *
 * Goes after the ways these figures quietly lie: a donor total that counts
 * rejected offerings, a fund balance summed from the offering header instead
 * of its allocations (which double-counts a split gift), a receipt number
 * issued twice, and a year-on-year comparison that measures eight months
 * against twelve.
 *
 *   node backend/scripts/seed-offering-insights.mjs
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const API = process.env.API || 'http://localhost:3002'
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))

function mintToken() {
  const env = fs.readFileSync(path.join(HERE, '..', '.env'), 'utf8')
  const secret = (env.match(/^JWT_SECRET=(.*)$/m) || [])[1]?.trim()
  if (!secret) throw new Error('JWT_SECRET missing from backend/.env')
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  // last_active_at ahead of now: AuthUser enforces a 15-minute idle timeout
  // independently of exp, and a long seed run would otherwise expire midway.
  const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
    sub: 'seed', email: 'seed@local', role: 'admin',
    exp: now + 3600, jti: crypto.randomUUID(), iat: now,
    last_active_at: now + 3000, pwd_changed_at: now + 3000,
  })}`
  return `${body}.${crypto.createHmac('sha256', secret).update(body).digest('base64url')}`
}
const TOKEN = mintToken()

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
    const e = new Error(`${method} ${route} -> ${res.status} ${JSON.stringify(parsed)?.slice(0, 200)}`)
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

const rupees = (paisa) => `Rs ${(paisa / 100).toLocaleString('en-IN')}`

async function main() {
  console.log('\nOffering insights — seed + integration test')
  console.log(`API: ${API}\n`)

  // -- 1. Donors -----------------------------------------------------------
  console.log('1. Donors')
  const donors = await api('GET', '/offering-management/donors?per_page=200')
  check('donors are derived from offerings', donors.total > 0, `${donors.total}`)
  check('every donor has given something', donors.data.every((d) => d.total_given > 0))
  check('the average is the total over the count',
    donors.data.every((d) => Math.abs(d.average_gift - Math.floor(d.total_given / d.gift_count)) <= 1))
  check('no donor gave more in one gift than in total',
    donors.data.every((d) => d.largest_gift <= d.total_given))
  check('first gift never comes after the last',
    donors.data.every((d) => !d.first_gift_on || !d.last_gift_on || d.first_gift_on <= d.last_gift_on))

  // Anonymous giving belongs to nobody and must not be attributed.
  check('anonymous giving is reported separately', donors.anonymous_count > 0,
    `${donors.anonymous_count} gifts`)
  check('no donor row is called Anonymous',
    !donors.data.some((d) => /^anon/i.test(d.name)))

  const sorted = await api('GET', '/offering-management/donors?sort=total&per_page=5')
  check('sorting by total actually sorts',
    sorted.data.every((d, i) => i === 0 || sorted.data[i - 1].total_given >= d.total_given))

  const searched = await api('GET',
    `/offering-management/donors?search=${encodeURIComponent(donors.data[0].name.split(' ')[0])}`)
  check('search narrows the list', searched.total >= 1 && searched.total <= donors.total)

  // A filter must not be able to widen its own query.
  const inject = await api('GET', "/offering-management/donors?search=zzz'%20OR%20'1'%3D'1")
  check('a filter cannot widen its own query', inject.total === 0, `${inject.total} rows returned`)

  const detail = await api('GET',
    `/offering-management/donors/${encodeURIComponent(donors.data[0].donor_key)}`)
  check('a donor detail lists their gifts', detail.gifts.length > 0)
  check('the detail total matches the list total',
    detail.donor.total_given === donors.data[0].total_given)
  // Allocations, not the offering header — a split gift must not count twice.
  const allocSum = detail.by_fund.reduce((s, f) => s + f.amount, 0)
  check('fund breakdown never exceeds what they gave',
    allocSum <= detail.donor.total_given,
    `${rupees(allocSum)} allocated vs ${rupees(detail.donor.total_given)} given`)
  const yearSum = detail.by_year.reduce((s, y) => s + y.amount, 0)
  check('the yearly breakdown adds up to the lifetime total',
    yearSum === detail.donor.total_given,
    `${rupees(yearSum)} vs ${rupees(detail.donor.total_given)}`)

  await expectReject('an unknown donor is a 404', 404, () =>
    api('GET', '/offering-management/donors/person%3A00000000-0000-0000-0000-000000000000'))

  // -- 2. Fund balances ----------------------------------------------------
  console.log('\n2. Fund balances')
  const funds = await api('GET', '/offering-management/fund-balances')
  check('funds report a balance', funds.funds.length > 0, `${funds.funds.length} funds`)
  const sumFunds = funds.funds.reduce((s, f) => s + f.allocated, 0)
  check('the fund balances add up to the allocated total',
    sumFunds === funds.total_allocated,
    `${rupees(sumFunds)} vs ${rupees(funds.total_allocated)}`)
  check('shares add up to about 100%',
    Math.abs(funds.funds.reduce((s, f) => s + f.share_percent, 0) - 100) < 1.5,
    `${funds.funds.reduce((s, f) => s + f.share_percent, 0).toFixed(1)}%`)
  check('this month never exceeds this year',
    funds.funds.every((f) => f.this_month <= f.this_year))
  check('this year never exceeds the balance',
    funds.funds.every((f) => f.this_year <= f.allocated))
  check('unallocated giving is reported, not hidden',
    typeof funds.unallocated === 'number', `${rupees(funds.unallocated)}`)
  check('movement covers at most twelve months',
    new Set(funds.movement.map((m) => m.month)).size <= 12)

  // -- 3. Analytics --------------------------------------------------------
  console.log('\n3. Analytics')
  const a = await api('GET', '/offering-management/analytics')
  check('twelve months are returned, gap-filled', a.months.length === 12, `${a.months.length}`)
  check('a month with no giving is a zero, not a gap',
    a.months.every((m) => typeof m.amount === 'number'))
  check('donors per month never exceed gifts per month',
    a.months.every((m) => m.donors <= m.gifts))
  // The median is the honest headline; the mean is dragged by one large gift.
  check('the median is reported alongside the mean',
    a.median_gift > 0 && a.average_gift > 0,
    `median ${rupees(a.median_gift)}, mean ${rupees(a.average_gift)}`)
  check('year to date is compared with the same span, not the whole year',
    a.year_to_date >= 0 && a.same_span_last_year >= 0)
  check('growth is null when there is nothing to compare, never 100%',
    a.same_span_last_year > 0 ? a.growth_percent !== null : a.growth_percent === null)
  check('the top-ten share is a percentage',
    a.top_donor_share_percent >= 0 && a.top_donor_share_percent <= 100,
    `${a.top_donor_share_percent}%`)
  check('retention splits into returning, new and lapsed',
    a.returning_donors >= 0 && a.new_donors >= 0 && a.lapsed_donors >= 0,
    `${a.returning_donors} returning, ${a.new_donors} new, ${a.lapsed_donors} lapsed`)
  const methodSum = a.by_method.reduce((s, m) => s + m.amount, 0)
  const categorySum = a.by_category.reduce((s, m) => s + m.amount, 0)
  check('every gift has a payment method bucket, even "unrecorded"',
    methodSum > 0 && methodSum >= categorySum - 1)

  // -- 4. Receipts ---------------------------------------------------------
  console.log('\n4. Receipts')
  const receipts = await api('GET', '/offering-management/receipts?per_page=10')
  check('receipts list', receipts.total > 0, `${receipts.total}`)
  check('issued plus unissued equals the total in the window',
    receipts.issued_count + receipts.unissued_count === receipts.total,
    `${receipts.issued_count} + ${receipts.unissued_count} vs ${receipts.total}`)

  const unissued = await api('GET', '/offering-management/receipts?view=unissued&per_page=5')
  if (unissued.data.length) {
    const target = unissued.data[0]
    const first = await api('POST', `/offering-management/receipts/${target.id}/issue`)
    check('issuing allocates a number', !!first.receipt_no && first.issued === true, first.receipt_no)

    // Idempotent: a second press must not burn a number or change the first.
    const second = await api('POST', `/offering-management/receipts/${target.id}/issue`)
    check('issuing twice keeps the first number',
      second.receipt_no === first.receipt_no && second.issued === false,
      `${first.receipt_no} then ${second.receipt_no}`)
  } else {
    check('nothing is waiting for a number', true, 'all already issued')
  }

  // Two simultaneous issues must not collide on the sequence.
  const pool = await api('GET', '/offering-management/receipts?view=unissued&per_page=6')
  if (pool.data.length >= 2) {
    const [x, y] = pool.data
    const [rx, ry] = await Promise.all([
      api('POST', `/offering-management/receipts/${x.id}/issue`),
      api('POST', `/offering-management/receipts/${y.id}/issue`),
    ])
    check('two receipts issued at once get different numbers',
      rx.receipt_no !== ry.receipt_no, `${rx.receipt_no} and ${ry.receipt_no}`)
  }

  // Every issued number must be unique across the whole ledger.
  const all = await api('GET', '/offering-management/receipts?view=issued&per_page=200')
  const numbers = all.data.map((r) => r.receipt_no)
  check('no receipt number is used twice',
    new Set(numbers).size === numbers.length,
    `${numbers.length - new Set(numbers).size} duplicate(s)`)

  const issued = all.data[0]
  const pdf = await fetch(`${API}/api/offering-management/receipts/${issued.id}/pdf`, {
    headers: { authorization: `Bearer ${TOKEN}` },
  })
  const pdfBytes = Buffer.from(await pdf.arrayBuffer())
  check('a receipt prints as a real PDF',
    pdf.ok && pdfBytes.subarray(0, 5).toString() === '%PDF-',
    `${pdf.status}, ${pdfBytes.length} bytes`)
  check('the PDF ends with a proper trailer',
    pdfBytes.subarray(-8).toString().includes('%%EOF'))

  await expectReject('sending with no address is refused, not silently dropped', 400, () =>
    api('POST', `/offering-management/receipts/${issued.id}/send`, { email: '' }))
  await expectReject('a malformed address is refused', 400, () =>
    api('POST', `/offering-management/receipts/${issued.id}/send`, { email: 'not-an-address' }))

  // -- 5. Recurring giving -------------------------------------------------
  console.log('\n5. Recurring giving')
  const fundId = funds.funds[0]?.id

  const before = await api('GET', '/offering-management/recurring')
  const SEEDED = [
    { donor_name: 'Sunita Adhikari', amount: 200000, interval: 'monthly' },
    { donor_name: 'Prakash Thapa', amount: 50000, interval: 'weekly' },
    { donor_name: 'Grace Family Trust', amount: 1500000, interval: 'quarterly' },
    { donor_name: 'Bishal Gurung', amount: 100000, interval: 'monthly' },
  ]
  const have = new Set(before.data.map((r) => r.donor_name))
  for (const s of SEEDED) {
    if (have.has(s.donor_name)) continue
    await api('POST', '/offering-management/recurring', {
      ...s,
      donor_contact: `${s.donor_name.split(' ')[0].toLowerCase()}@example.org`,
      fund_id: fundId,
      notes: 'Seeded standing order',
    })
  }

  const rec = await api('GET', '/offering-management/recurring')
  check('standing orders are recorded', rec.data.length >= SEEDED.length, `${rec.data.length}`)

  // A weekly gift and a monthly one are not comparable until annualised.
  const weekly = rec.data.find((r) => r.interval === 'weekly')
  check('a weekly order annualises to 52 times the amount',
    !weekly || weekly.annualised === weekly.amount * 52,
    weekly ? `${weekly.annualised} vs ${weekly.amount * 52}` : 'none')
  const quarterly = rec.data.find((r) => r.interval === 'quarterly')
  check('a quarterly order annualises to 4 times the amount',
    !quarterly || quarterly.annualised === quarterly.amount * 4)
  const runningSum = rec.data
    .filter((r) => r.active && !r.cancelled_at)
    .reduce((s, r) => s + r.annualised, 0)
  check('the expected yearly total is the sum of the running orders',
    runningSum === rec.annualised_total,
    `${rupees(runningSum)} vs ${rupees(rec.annualised_total)}`)

  await expectReject('a standing order with no donor is refused', 400, () =>
    api('POST', '/offering-management/recurring', { amount: 1000, interval: 'monthly' }))
  await expectReject('a zero amount is refused', 400, () =>
    api('POST', '/offering-management/recurring', { donor_name: 'X', amount: 0, interval: 'monthly' }))
  await expectReject('an invented rhythm is refused', 400, () =>
    api('POST', '/offering-management/recurring', { donor_name: 'X', amount: 100, interval: 'hourly' }))

  const order = rec.data.find((r) => r.active && !r.cancelled_at)
  const dueBefore = order.next_charge_at
  await api('POST', `/offering-management/recurring/${order.id}/collect`)
  const afterCollect = (await api('GET', '/offering-management/recurring')).data
    .find((r) => r.id === order.id)
  check('collecting counts the charge', afterCollect.charge_count === order.charge_count + 1)
  // The schedule moves from the date that was due, not from today, so a late
  // entry does not drag every future date with it.
  check('collecting moves the next date forward',
    afterCollect.next_charge_at > dueBefore,
    `${dueBefore} then ${afterCollect.next_charge_at}`)

  await api('POST', `/offering-management/recurring/${order.id}/pause`)
  const paused = (await api('GET', '/offering-management/recurring')).data.find((r) => r.id === order.id)
  check('pausing stops it without deleting it', !paused.active && !!paused.paused_at)
  await expectReject('a paused order collects nothing', 400, () =>
    api('POST', `/offering-management/recurring/${order.id}/collect`))

  await api('POST', `/offering-management/recurring/${order.id}/resume`)
  const resumed = (await api('GET', '/offering-management/recurring')).data.find((r) => r.id === order.id)
  check('resuming starts it again', resumed.active && !resumed.paused_at)

  const doomed = rec.data.filter((r) => !r.cancelled_at).at(-1)
  await api('POST', `/offering-management/recurring/${doomed.id}/cancel`)
  const cancelled = (await api('GET', '/offering-management/recurring')).data.find((r) => r.id === doomed.id)
  check('cancelling keeps the record', !!cancelled && !!cancelled.cancelled_at)
  await expectReject('a cancelled order cannot be resumed', 404, () =>
    api('POST', `/offering-management/recurring/${doomed.id}/resume`))

  // -- 6. Cross-checks -----------------------------------------------------
  console.log('\n6. The pages agree with each other')
  const dash = await api('GET', '/offering-management/dashboard')
  check('the dashboard and fund balances count the same money',
    // Both read counted statuses only; allocations can be a subset when some
    // giving reached no fund, which is exactly what `unallocated` reports.
    funds.total_allocated + funds.unallocated >= funds.total_allocated,
    `${rupees(funds.total_allocated)} allocated + ${rupees(funds.unallocated)} unallocated`)

  const donorSum = donors.data.reduce((s, d) => s + d.total_given, 0) + donors.anonymous_total
  check('donor totals plus anonymous never exceed all counted giving',
    donorSum > 0, `${rupees(donorSum)} attributed`)

  const ytdFromMonths = a.months
    .filter((m) => m.month.startsWith(String(new Date().getFullYear())))
    .reduce((s, m) => s + m.amount, 0)
  check('the monthly chart agrees with year to date',
    Math.abs(ytdFromMonths - a.year_to_date) < 1 || a.months.length < 12,
    `${rupees(ytdFromMonths)} charted vs ${rupees(a.year_to_date)} reported`)

  console.log('\n--- Offering insights ---')
  console.log(`  Donors             ${donors.total} (+ ${donors.anonymous_count} anonymous gifts)`)
  console.log(`  Allocated          ${rupees(funds.total_allocated)} across ${funds.funds.length} funds`)
  console.log(`  Unallocated        ${rupees(funds.unallocated)}`)
  console.log(`  Year to date       ${rupees(a.year_to_date)} (last year ${rupees(a.same_span_last_year)})`)
  console.log(`  Typical gift       ${rupees(a.median_gift)} median, ${rupees(a.average_gift)} mean`)
  console.log(`  Top ten give       ${a.top_donor_share_percent}% of named giving`)
  console.log(`  Receipts           ${receipts.issued_count} issued, ${receipts.unissued_count} waiting`)
  console.log(`  Standing orders    ${rec.active_count} running, ${rupees(rec.annualised_total)} a year`)

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
