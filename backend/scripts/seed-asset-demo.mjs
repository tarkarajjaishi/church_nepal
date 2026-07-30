#!/usr/bin/env node
/**
 * Seed + integration test for the Asset Management module.
 *
 * Registers a realistic church inventory, then exercises the things that go
 * wrong with physical assets: double check-out, overlapping reservations,
 * disposing something still on loan, and depreciation drifting.
 *
 *   node scripts/seed-asset-demo.mjs
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
  const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
    sub: 'seed', email: 'seed@local', role: 'admin',
    exp: now + 3600, jti: crypto.randomUUID(), iat: now,
    last_active_at: now, pwd_changed_at: now - 86400,
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
    const e = new Error(`${method} ${route} -> ${res.status} ${JSON.stringify(parsed)?.slice(0, 220)}`)
    e.status = res.status
    e.body = parsed
    throw e
  }
  return parsed
}

let passed = 0
const failures = []
function check(name, cond, detail = '') {
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

const rupees = (n) => n * 100
const iso = (d) => d.toISOString().slice(0, 10)
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d }
const yearsAgo = (n) => { const d = new Date(); d.setFullYear(d.getFullYear() - n); return d }

const INVENTORY = [
  { name: 'Yamaha Stage Piano P-125', slug: 'musical-instruments', cost: 145000, serial: 'YMH-P125-8842', manufacturer: 'Yamaha', model: 'P-125', years: 4, life: 10, reservable: true },
  { name: 'Shure SM58 Microphone (x4)', slug: 'microphones', cost: 42000, serial: 'SHR-SM58-1120', manufacturer: 'Shure', model: 'SM58', years: 2, life: 5, reservable: true },
  { name: 'Epson EB-2250U Projector', slug: 'projectors', cost: 210000, serial: 'EPS-2250-4417', manufacturer: 'Epson', model: 'EB-2250U', years: 3, life: 5, reservable: true, warrantyIn: 45 },
  { name: 'Behringer X32 Mixer', slug: 'mixers', cost: 320000, serial: 'BHR-X32-7781', manufacturer: 'Behringer', model: 'X32', years: 5, life: 8 },
  { name: 'Church Van — Toyota Hiace', slug: 'vehicles', cost: 4200000, serial: 'BA-2-KHA-3344', manufacturer: 'Toyota', model: 'Hiace', years: 6, life: 10, reservable: true },
  { name: 'Dell OptiPlex Office PC', slug: 'computers', cost: 95000, serial: 'DEL-OPT-2291', manufacturer: 'Dell', model: 'OptiPlex 7090', years: 4, life: 4 },
  { name: 'Canon EOS R50 Camera', slug: 'cameras', cost: 165000, serial: 'CAN-R50-6612', manufacturer: 'Canon', model: 'EOS R50', years: 1, life: 5, reservable: true, warrantyIn: 200 },
  { name: 'Honda 5kVA Generator', slug: 'generators', cost: 380000, serial: 'HND-5KVA-9903', manufacturer: 'Honda', model: 'EU50is', years: 7, life: 12 },
  { name: 'Plastic Chairs (set of 50)', slug: 'chairs', cost: 62500, manufacturer: 'Local', years: 3, life: 10, reservable: true },
  { name: 'Main Church Building', slug: 'buildings', cost: 28000000, years: 15, life: 40, method: 'none' },
]

async function main() {
  console.log('\nAsset Management — seed + integration test')
  console.log(`API: ${API}\n`)

  // 1. Categories
  console.log('1. Categories')
  const cats = await api('GET', '/asset-categories')
  check('26 categories seeded', cats.length >= 26, `${cats.length}`)
  check('categories carry a default useful life',
    cats.every((c) => c.default_useful_life_years > 0))
  check('some categories are reservable', cats.some((c) => c.is_reservable))
  check('buildings are not reservable',
    cats.find((c) => c.slug === 'buildings')?.is_reservable === false)
  const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c]))

  // 2. Supplier
  console.log('\n2. Suppliers')
  const existingSuppliers = await api('GET', '/suppliers')
  if (!existingSuppliers.some((s) => s.name === 'Kathmandu Audio House')) {
    await api('POST', '/suppliers', {
      name: 'Kathmandu Audio House', contact_person: 'Rajan Shrestha',
      phone: '01-4445566', email: 'sales@ktmaudio.com.np', address: 'New Road, Kathmandu',
    })
  }
  const suppliers = await api('GET', '/suppliers')
  check('supplier registered', suppliers.some((s) => s.name === 'Kathmandu Audio House'))
  await expectReject('duplicate supplier name rejected', 409, () =>
    api('POST', '/suppliers', { name: 'kathmandu audio house' })
  )
  const supplier = suppliers.find((s) => s.name === 'Kathmandu Audio House')

  // 3. Assets
  console.log('\n3. Asset register')
  const existing = await api('GET', '/assets?per_page=200')
  const have = new Map(existing.data.map((a) => [a.name, a]))
  const created = []
  for (const item of INVENTORY) {
    if (have.has(item.name)) { created.push(have.get(item.name)); continue }
    const res = await api('POST', '/assets', {
      name: item.name,
      category_id: bySlug[item.slug]?.id,
      serial_number: item.serial ?? '',
      manufacturer: item.manufacturer ?? '',
      model: item.model ?? '',
      purchase_date: iso(yearsAgo(item.years)),
      purchase_cost: rupees(item.cost),
      useful_life_years: item.life,
      depreciation_method: item.method ?? 'straight_line',
      supplier_id: supplier?.id,
      warranty_expires: item.warrantyIn ? iso(addDays(item.warrantyIn)) : null,
      building: 'Main Church',
      room: 'Sanctuary',
      condition: 'good',
      is_reservable: item.reservable ?? false,
    })
    created.push(res)
  }
  check('10 assets registered', created.length === 10, `${created.length}`)
  check('asset codes auto-generated', created.every((a) => !!(a.asset_code ?? a.assetCode)))

  const page = await api('GET', '/assets?per_page=200')
  const codes = new Set(page.data.map((a) => a.asset_code))
  check('asset codes are unique', codes.size === page.data.length,
    `${codes.size} of ${page.data.length}`)

  await expectReject('asset requires a name', 400, () => api('POST', '/assets', { name: '  ' }))
  await expectReject('negative cost rejected', 400, () =>
    api('POST', '/assets', { name: 'Bad', purchase_cost: -100 })
  )
  await expectReject('salvage above cost rejected', 400, () =>
    api('POST', '/assets', { name: 'Bad2', purchase_cost: 1000, salvage_value: 5000 })
  )
  await expectReject('duplicate serial number rejected', 409, () =>
    api('POST', '/assets', { name: 'Clone', serial_number: 'YMH-P125-8842' })
  )
  // Blank serials are normal and must not collide with each other.
  const blank1 = await api('POST', '/assets', { name: 'No Serial A', purchase_cost: rupees(100) })
  const blank2 = await api('POST', '/assets', { name: 'No Serial B', purchase_cost: rupees(100) })
  check('blank serial numbers do not clash', !!blank1.id && !!blank2.id)

  // 4. Depreciation
  console.log('\n4. Depreciation')
  const piano = page.data.find((a) => a.name.startsWith('Yamaha'))
  check('current value is below cost for an aged asset',
    piano.current_value < piano.purchase_cost,
    `${piano.current_value} vs ${piano.purchase_cost}`)
  check('depreciation adds up to the difference',
    piano.purchase_cost - piano.current_value === piano.accumulated_depreciation,
    `${piano.purchase_cost - piano.current_value} vs ${piano.accumulated_depreciation}`)
  // 4 of 10 years on straight line = 40% gone, allowing a month of rounding.
  const expectedPiano = piano.purchase_cost - Math.round(piano.purchase_cost * 0.4)
  check('straight-line value matches the expected share',
    Math.abs(piano.current_value - expectedPiano) < piano.purchase_cost * 0.02,
    `${piano.current_value} vs ~${expectedPiano}`)

  const pc = page.data.find((a) => a.name.startsWith('Dell'))
  check('an asset past its useful life is fully depreciated', pc.current_value === 0,
    `${pc.current_value}`)

  const building = page.data.find((a) => a.name.startsWith('Main Church Building'))
  check('method "none" does not depreciate',
    building.current_value === building.purchase_cost,
    `${building.current_value} vs ${building.purchase_cost}`)
  check('no asset ever has a negative value',
    page.data.every((a) => a.current_value >= 0))
  check('no current value exceeds its cost',
    page.data.every((a) => a.current_value <= a.purchase_cost))

  // 5. Check-out / return
  console.log('\n5. Assignments')
  const camera = page.data.find((a) => a.name.startsWith('Canon'))
  await api('POST', `/assets/${camera.id}/assign`, {
    assigned_to: 'Hari Sharma', department: 'Media', due_back: iso(addDays(3)),
    condition_out: 'excellent',
  })
  let detail = await api('GET', `/assets/${camera.id}`)
  check('asset marked assigned', detail.asset.status === 'assigned', detail.asset.status)
  check('holder shown on the asset', detail.asset.assigned_to === 'Hari Sharma',
    detail.asset.assigned_to)

  await expectReject('cannot check out something already out', 409, () =>
    api('POST', `/assets/${camera.id}/assign`, { assigned_to: 'Someone Else' })
  )
  await expectReject('check-out needs a recipient', 400, () =>
    api('POST', `/assets/${blank1.id}/assign`, { assigned_to: '   ' })
  )
  await expectReject('cannot dispose while checked out', 409, () =>
    api('POST', `/assets/${camera.id}/dispose/retired`, { reason: 'x' })
  )

  const openAssignment = detail.assignments.find((g) => !g.returned_at)
  await api('POST', `/asset-assignments/${openAssignment.id}/return`, { condition_in: 'fair' })
  detail = await api('GET', `/assets/${camera.id}`)
  check('asset available again after return', detail.asset.status === 'available', detail.asset.status)
  check('returned condition becomes the asset condition',
    detail.asset.condition === 'fair', detail.asset.condition)
  await expectReject('cannot return the same assignment twice', 409, () =>
    api('POST', `/asset-assignments/${openAssignment.id}/return`, {})
  )
  // Now that it is back, it can be checked out again.
  await api('POST', `/assets/${camera.id}/assign`, { assigned_to: 'Media Team' })
  const reDetail = await api('GET', `/assets/${camera.id}`)
  check('can be checked out again after return', reDetail.asset.status === 'assigned')
  await api('POST', `/asset-assignments/${reDetail.assignments.find((g) => !g.returned_at).id}/return`, {})

  // 6. Reservations — the exclusion constraint
  console.log('\n6. Reservations')
  const projector = page.data.find((a) => a.name.startsWith('Epson'))

  // Clear bookings left by an earlier run. Without this the exclusion
  // constraint correctly refuses the first booking below and the script dies
  // on its own guard working — a failure that reads like a bug and is not.
  // Cancelled through the API rather than deleted, so who booked what survives.
  const live = (await api('GET', '/asset-reservations')).filter(
    (r) => r.asset_id === projector.id && ['pending', 'approved', 'collected'].includes(r.status)
  )
  for (const r of live) {
    await api('POST', `/asset-reservations/${r.id}/cancelled`, {})
  }
  if (live.length) console.log(`  (cancelled ${live.length} booking(s) from a previous run)`)

  await api('POST', `/assets/${projector.id}/reserve`, {
    requested_by: 'Youth Ministry', purpose: 'Youth camp',
    starts_on: iso(addDays(10)), ends_on: iso(addDays(14)),
  })
  check('reservation created', true)

  await expectReject('overlapping reservation refused by the database', 409, () =>
    api('POST', `/assets/${projector.id}/reserve`, {
      requested_by: "Women's Fellowship", starts_on: iso(addDays(12)), ends_on: iso(addDays(16)),
    })
  )
  await expectReject('a booking starting the day another ends still clashes', 409, () =>
    api('POST', `/assets/${projector.id}/reserve`, {
      requested_by: 'Men Fellowship', starts_on: iso(addDays(14)), ends_on: iso(addDays(18)),
    })
  )
  // Adjacent, no overlap: allowed.
  await api('POST', `/assets/${projector.id}/reserve`, {
    requested_by: 'Men Fellowship', starts_on: iso(addDays(15)), ends_on: iso(addDays(18)),
  })
  check('adjacent reservation allowed', true)

  await expectReject('end before start rejected', 400, () =>
    api('POST', `/assets/${projector.id}/reserve`, {
      requested_by: 'X', starts_on: iso(addDays(30)), ends_on: iso(addDays(20)),
    })
  )
  const mixer = page.data.find((a) => a.name.startsWith('Behringer'))
  await expectReject('non-reservable asset cannot be reserved', 400, () =>
    api('POST', `/assets/${mixer.id}/reserve`, {
      requested_by: 'X', starts_on: iso(addDays(40)), ends_on: iso(addDays(41)),
    })
  )

  const reservations = await api('GET', '/asset-reservations')
  // Live ones only: the cleanup above leaves cancelled rows behind on a
  // re-run, and those are history, not the state under test.
  const mine = reservations.filter(
    (r) => r.asset_id === projector.id && !['cancelled', 'rejected', 'returned'].includes(r.status)
  )
  check('reservations listed for the asset', mine.length >= 2, `${mine.length}`)
  check('reservations start pending', mine.every((r) => ['pending', 'approved'].includes(r.status)))

  const pending = mine.find((r) => r.status === 'pending')
  await expectReject('rejection needs a reason', 400, () =>
    api('POST', `/asset-reservations/${pending.id}/rejected`, {})
  )
  await api('POST', `/asset-reservations/${pending.id}/approved`, {})
  const afterApprove = await api('GET', '/asset-reservations')
  check('reservation approved', afterApprove.find((r) => r.id === pending.id)?.status === 'approved')

  // Rejecting frees the slot — the constraint only covers live states.
  const second = mine.find((r) => r.id !== pending.id)
  await api('POST', `/asset-reservations/${second.id}/rejected`, { reason: 'Clashes with a wedding' })
  const freed = await api('POST', `/assets/${projector.id}/reserve`, {
    requested_by: 'Children Ministry', starts_on: second.starts_on, ends_on: second.ends_on,
  })
  check('a rejected reservation frees its slot', freed.reserved === true)
  await expectReject('a closed reservation cannot be re-decided', 409, () =>
    api('POST', `/asset-reservations/${second.id}/approved`, {})
  )
  await expectReject('unknown decision rejected', 400, () =>
    api('POST', `/asset-reservations/${pending.id}/maybe`, {})
  )

  // 7. Maintenance
  console.log('\n7. Maintenance')
  const generator = page.data.find((a) => a.name.startsWith('Honda'))
  // Created once, not once per run: a second Rs 4,500 service every time would
  // make the cost total climb and the assertion below fail on arithmetic that
  // is in fact correct.
  const genExisting = (await api('GET', `/assets/${generator.id}`)).maintenance
  if (!genExisting.some((m) => m.title === 'Annual service')) {
    await api('POST', `/assets/${generator.id}/maintenance`, {
      maintenance_kind: 'preventive', title: 'Annual service', technician: 'Ram Mechanic',
      performed_on: iso(addDays(-30)), cost: rupees(4500), next_due: iso(addDays(335)),
      condition_after: 'good', status: 'completed',
    })
  }
  if (!genExisting.some((m) => m.title === 'Load test')) {
    await api('POST', `/assets/${generator.id}/maintenance`, {
      maintenance_kind: 'inspection', title: 'Load test', scheduled_for: iso(addDays(14)),
    })
  }
  const genDetail = await api('GET', `/assets/${generator.id}`)
  check('maintenance history recorded', genDetail.maintenance.length >= 2,
    `${genDetail.maintenance.length}`)
  // Compared against the records themselves rather than a fixed figure: what
  // is being tested is that the server totals what it stored, and a hardcoded
  // number only tests how many times this script has run.
  const expectedCost = genDetail.maintenance
    .filter((m) => m.status === 'completed')
    .reduce((s, m) => s + m.cost, 0)
  check('maintenance cost totalled', genDetail.maintenance_cost_total === expectedCost,
    `${genDetail.maintenance_cost_total} vs ${expectedCost}`)
  check('and only counts work that was actually done',
    genDetail.maintenance.some((m) => m.status !== 'completed'))
  await expectReject('negative maintenance cost rejected', 400, () =>
    api('POST', `/assets/${generator.id}/maintenance`, { cost: -1 })
  )

  // An asset actively in for work should not read as available.
  const projectorMaint = await api('POST', `/assets/${blank2.id}/maintenance`, {
    title: 'Lamp replacement', status: 'in_progress', maintenance_kind: 'repair',
  })
  const inWork = await api('GET', `/assets/${blank2.id}`)
  check('asset in for work is marked maintenance', inWork.asset.status === 'maintenance',
    inWork.asset.status)

  const job = inWork.maintenance.find((m) => m.status === 'in_progress')
  await api('POST', `/asset-maintenance/${job.id}/complete`, {
    cost: rupees(2500), technician: 'Sita Tech', condition_after: 'excellent',
  })
  const done = await api('GET', `/assets/${blank2.id}`)
  check('completing work returns the asset to available', done.asset.status === 'available',
    done.asset.status)
  check('completion records the new condition', done.asset.condition === 'excellent',
    done.asset.condition)
  await expectReject('cannot complete the same job twice', 409, () =>
    api('POST', `/asset-maintenance/${job.id}/complete`, {})
  )

  // 8. Filters
  console.log('\n8. Filters & paging')
  const reservableOnly = await api('GET', '/assets?reservable=true&per_page=200')
  check('reservable filter is exact', reservableOnly.data.every((a) => a.is_reservable))
  const searched = await api('GET', '/assets?search=Yamaha&per_page=50')
  check('search matches manufacturer', searched.data.some((a) => a.name.includes('Yamaha')))
  const byStatus = await api('GET', '/assets?status=available&per_page=200')
  check('status filter is exact', byStatus.data.every((a) => a.status === 'available'))
  const expiring = await api('GET', '/assets?warranty=expiring&per_page=50')
  check('warranty filter finds the expiring projector',
    expiring.data.some((a) => a.name.startsWith('Epson')), `${expiring.data.length} rows`)
  check('warranty status computed on rows',
    expiring.data.every((a) => a.warranty_status === 'expiring'))

  const p1 = await api('GET', '/assets?per_page=5&page=1')
  const p2 = await api('GET', '/assets?per_page=5&page=2')
  check('paging returns distinct rows', !p1.data.some((r) => p2.data.some((s) => s.id === r.id)))
  check('filtered totals cover the whole set, not the page',
    p1.filtered_cost > p1.data.reduce((a, r) => a + r.purchase_cost, 0),
    `${p1.filtered_cost}`)
  check('filtered current value is at or below cost',
    p1.filtered_current_value <= p1.filtered_cost,
    `${p1.filtered_current_value} vs ${p1.filtered_cost}`)

  const inject = await api('GET', `/assets?search=${encodeURIComponent("'; DROP TABLE assets; --")}`)
  check('injection attempt returns nothing and does not error', inject.total === 0)
  const stillThere = await api('GET', '/assets?per_page=1')
  check('assets table survived injection attempt', stillThere.total > 0)

  // 9. Dashboard
  console.log('\n9. Dashboard')
  const dash = await api('GET', '/assets/dashboard')
  check('total assets counted', dash.total_assets > 0, `${dash.total_assets}`)
  check('portfolio value below cost', dash.total_current_value < dash.total_cost,
    `${dash.total_current_value} vs ${dash.total_cost}`)
  check('depreciation equals cost minus value',
    dash.total_cost - dash.total_current_value === dash.total_depreciation,
    `${dash.total_cost - dash.total_current_value} vs ${dash.total_depreciation}`)
  check('status breakdown present', dash.by_status.length > 0)
  check('category breakdown present', dash.by_category.length > 0)
  check('status counts sum to the register',
    dash.by_status.reduce((a, s) => a + s.count, 0) >= dash.total_assets)
  check('pending reservations counted', dash.pending_reservations >= 1, `${dash.pending_reservations}`)
  check('maintenance spend this year tracked', dash.maintenance_spend_year >= rupees(4500),
    `${dash.maintenance_spend_year}`)
  check('expiring warranties surfaced', dash.expiring_warranties.length >= 1,
    `${dash.expiring_warranties.length}`)
  check('upcoming maintenance surfaced', dash.upcoming_maintenance.length >= 1,
    `${dash.upcoming_maintenance.length}`)

  // 10. Disposal
  console.log('\n10. Disposal')
  await api('POST', `/assets/${blank1.id}/dispose/retired`, { reason: 'End of life' })
  const disposed = await api('GET', `/assets/${blank1.id}`)
  check('asset retired, not deleted', disposed.asset.status === 'retired', disposed.asset.status)
  await expectReject('unknown disposal status rejected', 400, () =>
    api('POST', `/assets/${blank2.id}/dispose/exploded`, {})
  )
  await expectReject('a retired asset cannot be checked out', 400, () =>
    api('POST', `/assets/${blank1.id}/assign`, { assigned_to: 'X' })
  )

  const fmt = (p) => `Rs ${(p / 100).toLocaleString('en-IN')}`
  console.log('\n--- Register ---')
  console.log(`  Assets            ${dash.total_assets}`)
  console.log(`  Purchase cost     ${fmt(dash.total_cost)}`)
  console.log(`  Current value     ${fmt(dash.total_current_value)}`)
  console.log(`  Depreciation      ${fmt(dash.total_depreciation)}`)
  console.log(`  Available         ${dash.available}`)
  console.log(`  Pending bookings  ${dash.pending_reservations}`)

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
