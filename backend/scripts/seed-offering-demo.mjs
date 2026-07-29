#!/usr/bin/env node
/**
 * Seed + integration test for the Offering Management module.
 *
 * Drives the real HTTP API rather than writing SQL, so it doubles as an
 * end-to-end test: if a handler regresses, seeding fails loudly instead of
 * quietly producing bad rows.
 *
 * Usage:
 *   node scripts/seed-offering-demo.mjs                  # against localhost:3002
 *   API=http://gracechurchkathmandu.localhost:3002 node scripts/seed-offering-demo.mjs
 *
 * The token is minted from backend/.env's JWT_SECRET so no password is needed.
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const API = process.env.API || 'http://localhost:3002'
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const ENV_PATH = path.join(HERE, '..', '.env')

// --- auth -------------------------------------------------------------------

function mintToken() {
  const env = fs.readFileSync(ENV_PATH, 'utf8')
  const secret = (env.match(/^JWT_SECRET=(.*)$/m) || [])[1]?.trim()
  if (!secret) throw new Error('JWT_SECRET missing from backend/.env')
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
    sub: 'seed-script',
    email: 'seed@local',
    role: 'admin',
    exp: now + 3600,
    jti: crypto.randomUUID(),
    iat: now,
    last_active_at: now,
    pwd_changed_at: now - 86400,
  })}`
  return `${body}.${crypto.createHmac('sha256', secret).update(body).digest('base64url')}`
}

const TOKEN = mintToken()

async function api(method, route, body) {
  const res = await fetch(`${API}/api${route}`, {
    method,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${TOKEN}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let parsed
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = text
  }
  if (!res.ok) {
    const err = new Error(
      `${method} ${route} -> ${res.status} ${JSON.stringify(parsed)?.slice(0, 300)}`
    )
    err.status = res.status
    err.body = parsed
    throw err
  }
  return parsed
}

// --- assertions -------------------------------------------------------------

let passed = 0
const failures = []

function check(name, condition, detail = '') {
  if (condition) {
    passed++
    console.log(`  PASS  ${name}`)
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`)
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

/** Assert a call is rejected, i.e. validation actually bites. */
async function expectReject(name, expectStatus, fn) {
  try {
    await fn()
    failures.push(`${name} — expected ${expectStatus}, call succeeded`)
    console.log(`  FAIL  ${name} — expected ${expectStatus}, call succeeded`)
  } catch (e) {
    const ok = e.status === expectStatus
    if (ok) passed++
    else failures.push(`${name} — expected ${expectStatus}, got ${e.status}`)
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : ` — expected ${expectStatus}, got ${e.status}`}`
    )
  }
}

// --- deterministic pseudo-random so reruns are comparable -------------------

let seed = 1337
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const between = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1))

const rupees = (n) => n * 100 // minor units (paisa)
const fmt = (paisa) =>
  `Rs ${(paisa / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

// ---------------------------------------------------------------------------

const SERVICES = [
  'Sunday First Service',
  'Sunday Second Service',
  'Wednesday Prayer',
  'Friday Youth Service',
  'Saturday Fellowship',
]
const METHODS = [
  'cash', 'cash', 'cash', 'cash',
  'bank_transfer', 'esewa', 'khalti', 'qr', 'card', 'cheque', 'fonepay', 'connectips',
]
const DONORS = [
  'Ram Bahadur Shrestha', 'Sita Kumari Tamang', 'Bishal Gurung', 'Anita Rai',
  'Prakash Thapa', 'Kamala Magar', 'Dipak Lama', 'Sunita Adhikari',
  'Hari Prasad Sharma', 'Gita Devi Poudel', 'Suresh Bhattarai', 'Nirmala K.C.',
]

async function main() {
  console.log(`\nOffering Management — seed + integration test`)
  console.log(`API: ${API}\n`)

  // 1. Categories should already exist from migration 061.
  console.log('1. Categories')
  const categories = await api('GET', '/offering-categories')
  check('18 seeded categories present', categories.length >= 18, `got ${categories.length}`)
  check('every category has a colour', categories.every((c) => /^#[0-9a-f]{6}$/i.test(c.color)))
  check('every category has an icon', categories.every((c) => c.icon?.length > 0))
  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c]))

  // 2. Bank accounts
  console.log('\n2. Bank accounts')
  const wantAccounts = [
    { bank_name: 'Nabil Bank', account_name: 'Grace Church Main', account_number: '01234567890123', branch: 'Durbar Marg', opening_balance: rupees(250000) },
    { bank_name: 'Global IME Bank', account_name: 'Grace Church Building Fund', account_number: '98765432109876', branch: 'Lazimpat', opening_balance: rupees(1200000) },
    { bank_name: 'Nepal Investment Bank', account_name: 'Grace Church Missions', account_number: '55554444333322', branch: 'Baneshwor', opening_balance: rupees(80000) },
  ]
  const existingAccounts = await api('GET', '/bank-accounts')
  const accounts = [...existingAccounts]
  for (const a of wantAccounts) {
    if (existingAccounts.some((e) => e.account_number === a.account_number)) continue
    accounts.push(await api('POST', '/bank-accounts', a))
  }
  check('at least 3 bank accounts', accounts.length >= 3, `got ${accounts.length}`)
  await expectReject('duplicate account number rejected', 409, () =>
    api('POST', '/bank-accounts', wantAccounts[0])
  )
  await expectReject('bank account requires a name', 400, () =>
    api('POST', '/bank-accounts', { bank_name: '  ', account_number: '123' })
  )

  // 3. Fund allocation rules — the 50/20/15/10/5 split from the spec.
  console.log('\n3. Fund allocation rules')
  const funds = await api('GET', '/funds')
  check('funds exist to allocate into', funds.length > 0, `got ${funds.length}`)
  if (funds.length >= 5 && bySlug['sunday-offering']) {
    const split = [5000, 2000, 1500, 1000, 500] // bps, sums to 10000
    const rules = split.map((bps, i) => ({ fund_id: funds[i].id, percentage_bps: bps }))
    const saved = await api('PUT', `/offering-categories/${bySlug['sunday-offering'].id}/allocations`, { rules })
    check('5-way allocation saved', saved.length === 5, `got ${saved.length}`)
    check('allocation percentages sum to 100%', saved.reduce((a, r) => a + r.percentage_bps, 0) === 10000)
    await expectReject('allocation not summing to 100% rejected', 400, () =>
      api('PUT', `/offering-categories/${bySlug['sunday-offering'].id}/allocations`, {
        rules: [{ fund_id: funds[0].id, percentage_bps: 7000 }],
      })
    )
  } else {
    console.log('  SKIP  allocation split (needs >=5 funds)')
  }

  // 4. Offerings across 12 months
  console.log('\n4. Offerings')
  const catPool = categories.filter((c) => c.is_active).slice(0, 12)
  const created = []
  const today = new Date()

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const perMonth = between(6, 11)
    for (let n = 0; n < perMonth; n++) {
      const d = new Date(today.getFullYear(), today.getMonth() - monthsAgo, between(1, 28))
      if (d > today) continue
      const method = pick(METHODS)
      const anonymous = rand() < 0.12
      const cat = pick(catPool)
      const amount = rupees(pick([500, 1000, 1500, 2000, 2500, 5000, 7500, 10000, 15000, 25000]))
      const body = {
        service_date: d.toISOString().slice(0, 10),
        service_time: pick(['08:00', '10:30', '17:00', '19:00']),
        service_name: pick(SERVICES),
        category_id: cat.id,
        donor_name: anonymous ? '' : pick(DONORS),
        is_anonymous: anonymous,
        giver_type: pick(['member', 'member', 'member', 'visitor', 'guest']),
        total_amount: amount,
        currency: 'NPR',
        payment_method: method,
        reference_no: method === 'cash' ? '' : `TXN${between(100000, 999999)}`,
        notes: rand() < 0.2 ? 'Recorded during counting session' : '',
        submit: true,
      }
      created.push(await api('POST', '/offering-management/offerings/create', body))
    }
  }
  console.log(`  seeded ${created.length} offerings`)
  check('all seeded offerings got a receipt number', created.every((o) => !!o.receipt_no))
  const receiptNos = new Set(created.map((o) => o.receipt_no))
  check('receipt numbers are unique', receiptNos.size === created.length,
    `${receiptNos.size} unique of ${created.length}`)

  await expectReject('zero amount rejected', 400, () =>
    api('POST', '/offering-management/offerings/create', {
      service_date: '2026-01-01', total_amount: 0,
    })
  )
  await expectReject('bad date rejected', 400, () =>
    api('POST', '/offering-management/offerings/create', {
      service_date: '01-01-2026', total_amount: 1000,
    })
  )

  // A draft must NOT get a receipt number.
  const draft = await api('POST', '/offering-management/offerings/create', {
    service_date: today.toISOString().slice(0, 10),
    total_amount: rupees(1234),
    category_id: catPool[0].id,
    submit: false,
  })
  check('draft has no receipt number', !draft.receipt_no)
  check('draft status is draft', draft.status === 'draft')
  await expectReject('draft cannot be approved', 400, () =>
    api('POST', `/offering-management/offerings/${draft.id}/approve`, {})
  )

  // 5. Approvals
  console.log('\n5. Approval workflow')
  const toApprove = created.slice(0, Math.floor(created.length * 0.8)).map((o) => o.id)
  const bulk = await api('POST', '/offering-management/offerings/bulk-approve', { ids: toApprove })
  check('bulk approve reports counts', bulk.approved === toApprove.length,
    `approved ${bulk.approved} of ${toApprove.length}`)
  const second = await api('POST', '/offering-management/offerings/bulk-approve', { ids: toApprove })
  check('re-approving is a no-op (idempotent)', second.approved === 0, `approved ${second.approved}`)
  await expectReject('approved offering cannot be re-approved singly', 409, () =>
    api('POST', `/offering-management/offerings/${toApprove[0]}/approve`, {})
  )
  await expectReject('rejection requires a reason', 400, () =>
    api('POST', `/offering-management/offerings/${created.at(-1).id}/reject`, { reason: '   ' })
  )
  const rejected = await api('POST', `/offering-management/offerings/${created.at(-1).id}/reject`, {
    reason: 'Duplicate entry — same envelope counted twice',
  })
  check('offering rejected with reason', rejected.status === 'rejected')

  // 6. Cash counting
  console.log('\n6. Cash counting')
  const DENOMS = [
    [rupees(1000), 'Rs 1000'], [rupees(500), 'Rs 500'], [rupees(100), 'Rs 100'],
    [rupees(50), 'Rs 50'], [rupees(25), 'Rs 25'], [rupees(20), 'Rs 20'],
    [rupees(10), 'Rs 10'], [rupees(5), 'Rs 5'], [rupees(2), 'Rs 2'], [rupees(1), 'Rs 1'],
  ]
  const lines = DENOMS.map(([denom, label]) => ({
    denomination: denom, label, quantity: between(0, 30), counted_by: 'one',
  }))
  const expectedCountedTotal = lines.reduce((a, l) => a + l.denomination * l.quantity, 0)

  // Balanced count: expected matches the tally exactly.
  const balanced = await api('POST', '/cash-counts', {
    count_date: today.toISOString().slice(0, 10),
    service_name: 'Sunday First Service',
    counter_one: 'Ram Bahadur Shrestha',
    counter_two: 'Sita Kumari Tamang',
    supervisor: 'Pastor Daniel',
    expected_total: expectedCountedTotal,
    lines,
  })
  check('counted total computed server-side', balanced.counted_total === expectedCountedTotal,
    `${balanced.counted_total} vs ${expectedCountedTotal}`)
  check('balanced count has zero variance', balanced.variance === 0, `variance ${balanced.variance}`)
  const approvedCount = await api('POST', `/cash-counts/${balanced.id}/approve`, {})
  check('balanced count approves', approvedCount.status === 'approved')
  check('approved count is locked', approvedCount.is_locked === true)
  await expectReject('locked count cannot be re-approved', 409, () =>
    api('POST', `/cash-counts/${balanced.id}/approve`, {})
  )

  // Short count: variance must block approval until explained.
  const shortLines = [{ denomination: rupees(500), label: 'Rs 500', quantity: 10, counted_by: 'one' }]
  const short = await api('POST', '/cash-counts', {
    service_name: 'Sunday Second Service',
    counter_one: 'Bishal Gurung',
    supervisor: 'Pastor Daniel',
    expected_total: rupees(6000),
    lines: shortLines,
  })
  check('variance detected', short.variance === rupees(5000) - rupees(6000),
    `variance ${short.variance}`)
  await expectReject('unexplained variance blocks approval', 400, () =>
    api('POST', `/cash-counts/${short.id}/approve`, {})
  )
  const explained = await api('POST', '/cash-counts', {
    service_name: 'Sunday Second Service (recount)',
    counter_one: 'Bishal Gurung',
    supervisor: 'Pastor Daniel',
    expected_total: rupees(6000),
    variance_reason: 'One envelope was misplaced and recovered after the count',
    lines: shortLines,
  })
  const explainedApproved = await api('POST', `/cash-counts/${explained.id}/approve`, {})
  check('explained variance can be approved', explainedApproved.status === 'approved')
  await expectReject('negative quantity rejected', 400, () =>
    api('POST', '/cash-counts', { lines: [{ denomination: rupees(100), quantity: -5 }] })
  )

  // 7. Deposits
  console.log('\n7. Deposits')
  const mainAccount = accounts[0]
  const beforeBalance = (await api('GET', '/bank-accounts')).find((a) => a.id === mainAccount.id).current_balance
  const cashOfferings = created.slice(0, 5).map((o) => o.id)
  const deposit = await api('POST', '/deposits', {
    deposit_date: today.toISOString().slice(0, 10),
    bank_account_id: mainAccount.id,
    reference_no: `DEP${between(10000, 99999)}`,
    deposited_by: 'Treasurer Joseph',
    offering_ids: cashOfferings,
    notes: 'Sunday cash banked Monday morning',
  })
  check('deposit amount derived from attached offerings', deposit.amount > 0, `amount ${deposit.amount}`)
  check('deposit starts pending', deposit.status === 'pending')

  const verified = await api('POST', `/deposits/${deposit.id}/verify`, {})
  check('deposit verifies', verified.status === 'verified')
  const afterBalance = (await api('GET', '/bank-accounts')).find((a) => a.id === mainAccount.id).current_balance
  check('bank balance credited exactly once on verify',
    afterBalance === beforeBalance + verified.amount,
    `${beforeBalance} + ${verified.amount} != ${afterBalance}`)
  await expectReject('verified deposit cannot be re-verified', 409, () =>
    api('POST', `/deposits/${deposit.id}/verify`, {})
  )
  const balanceAfterRetry = (await api('GET', '/bank-accounts')).find((a) => a.id === mainAccount.id).current_balance
  check('failed re-verify did not double-credit', balanceAfterRetry === afterBalance)

  // A second, unverified deposit so "pending deposits" is non-zero on the dashboard.
  await api('POST', '/deposits', {
    bank_account_id: accounts[1]?.id ?? mainAccount.id,
    reference_no: `DEP${between(10000, 99999)}`,
    amount: rupees(45000),
    deposited_by: 'Treasurer Joseph',
    notes: 'Building fund cash awaiting bank run',
  })
  await expectReject('rejecting a deposit needs a reason', 400, () =>
    api('POST', `/deposits/${deposit.id}/status/rejected`, {})
  )
  await expectReject('invalid deposit status rejected', 400, () =>
    api('POST', `/deposits/${deposit.id}/status/banana`, { reason: 'x' })
  )

  // 8. Dashboard consistency
  console.log('\n8. Dashboard')
  const dash = await api('GET', '/offering-management/dashboard')
  check('year total is positive', dash.this_year > 0, `${dash.this_year}`)
  check('month total <= year total', dash.this_month <= dash.this_year)
  check('week total <= month total', dash.this_week <= dash.this_month)
  check('today <= week total', dash.today <= dash.this_week)
  check('cash + online <= year total',
    dash.cash_giving + dash.online_giving <= dash.this_year,
    `${dash.cash_giving} + ${dash.online_giving} vs ${dash.this_year}`)
  check('monthly trend has points', dash.monthly_trend.length > 0)
  check('category breakdown has points', dash.by_category.length > 0)
  check('payment breakdown has points', dash.by_payment_method.length > 0)
  check('pending deposits reported', dash.pending_deposit_count >= 1,
    `${dash.pending_deposit_count}`)
  check('donor count is positive', dash.total_donors > 0, `${dash.total_donors}`)

  // Category breakdown must reconcile with the filtered table total.
  const catSum = dash.by_category.reduce((a, c) => a + c.amount, 0)
  const yearPage = await api(
    'GET',
    `/offering-management/offerings?from_date=${today.getFullYear()}-01-01&per_page=1`
  )
  check('category breakdown reconciles with year-to-date table total',
    catSum <= yearPage.filtered_total,
    `breakdown ${catSum} vs table ${yearPage.filtered_total}`)

  // 9. Filtering and paging
  console.log('\n9. Filtering & paging')
  const p1 = await api('GET', '/offering-management/offerings?per_page=10&page=1')
  const p2 = await api('GET', '/offering-management/offerings?per_page=10&page=2')
  check('paging returns distinct rows',
    !p1.data.some((r) => p2.data.some((s) => s.id === r.id)))
  check('total_pages matches total', p1.total_pages === Math.ceil(p1.total / 10))

  const cashOnly = await api('GET', '/offering-management/offerings?payment_method=cash&per_page=200')
  check('payment_method filter is exact',
    cashOnly.data.every((r) => r.payment_method === 'cash'), `${cashOnly.data.length} rows`)

  const approvedOnly = await api('GET', '/offering-management/offerings?status=approved&per_page=200')
  check('status filter is exact', approvedOnly.data.every((r) => r.status === 'approved'))

  const big = await api('GET', `/offering-management/offerings?min_amount=${rupees(10000)}&per_page=200`)
  check('min_amount filter respected', big.data.every((r) => r.total_amount >= rupees(10000)))

  const named = await api('GET', '/offering-management/offerings?donor=Sita&per_page=200')
  check('donor filter matches partial names',
    named.data.every((r) => /sita/i.test(r.donor_name)), `${named.data.length} rows`)

  const searched = await api('GET', '/offering-management/offerings?search=TXN&per_page=200')
  check('search hits reference numbers', searched.data.length > 0, `${searched.data.length} rows`)

  // SQL injection attempt must be treated as a literal, not executed.
  const inject = await api(
    'GET',
    `/offering-management/offerings?search=${encodeURIComponent("'; DROP TABLE offerings; --")}`
  )
  check('injection attempt returns no rows and does not error', inject.total === 0)
  const stillThere = await api('GET', '/offering-management/offerings?per_page=1')
  check('offerings table survived injection attempt', stillThere.total > 0)

  const sorted = await api('GET', '/offering-management/offerings?sort=amount&dir=desc&per_page=20')
  const amounts = sorted.data.map((r) => r.total_amount)
  check('sort by amount desc is ordered',
    amounts.every((v, i) => i === 0 || amounts[i - 1] >= v))

  const badSort = await api('GET', '/offering-management/offerings?sort=;DROP&per_page=5')
  check('unknown sort column falls back safely', badSort.data.length > 0)

  // 10. Anonymity
  console.log('\n10. Anonymous giving')
  const anon = await api('POST', '/offering-management/offerings/create', {
    service_date: today.toISOString().slice(0, 10),
    total_amount: rupees(9000),
    category_id: catPool[0].id,
    is_anonymous: true,
    donor_name: 'Should Be Stripped',
    submit: true,
  })
  const anonRow = (await api('GET', `/offering-management/offerings?search=${anon.receipt_no}`)).data[0]
  check('anonymous offering stores no donor name', anonRow && anonRow.donor_name === '',
    `got "${anonRow?.donor_name}"`)
  check('anonymous flag persisted', anonRow?.is_anonymous === true)

  // --- summary --------------------------------------------------------------
  const finalDash = await api('GET', '/offering-management/dashboard')
  console.log('\n--- Seeded totals ---')
  console.log(`  This year      ${fmt(finalDash.this_year)}`)
  console.log(`  This month     ${fmt(finalDash.this_month)}`)
  console.log(`  Cash           ${fmt(finalDash.cash_giving)}`)
  console.log(`  Online         ${fmt(finalDash.online_giving)}`)
  console.log(`  Donors         ${finalDash.total_donors}`)
  console.log(`  Pending approval ${finalDash.pending_approval_count}`)
  console.log(`  Pending deposits ${finalDash.pending_deposit_count} (${fmt(finalDash.pending_deposits)})`)

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
