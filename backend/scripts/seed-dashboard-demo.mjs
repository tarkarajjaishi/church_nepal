#!/usr/bin/env node
/**
 * Seed + integration test for the Church Dashboard.
 *
 * The dashboard is pure aggregation, so the test seeds a known quantity of
 * source data and then asserts the aggregate agrees with it. That catches the
 * failure mode that matters here: a number that is plausible but wrong.
 *
 *   node scripts/seed-dashboard-demo.mjs
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const API = process.env.API || 'http://localhost:3002'
/**
 * Must be the database the API actually reads, or every assertion compares a
 * seed in one database against an aggregate from another and fails for the
 * wrong reason.
 *
 * A bare `localhost` host has no subdomain, so the tenant resolver falls back
 * to DEFAULT_TENANT (backend/.env) — grace_church_dev, not a church slug. To
 * test a specific tenant, point both at it:
 *   API=http://gracechurchkathmandu.localhost:3002 DB=gracechurchkathmandu node ...
 */
const DB = process.env.DB || 'grace_church_dev'
const CONTAINER = process.env.PG_CONTAINER || 'grace-church-postgres'
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
    throw e
  }
  return parsed
}

/**
 * Attendance and person dates have no admin write endpoints, so the seed goes
 * in through psql. The assertions still read through the HTTP API, so the
 * aggregate is verified end to end even though the fixture is not.
 */
function sql(statement) {
  return execFileSync(
    'docker',
    ['exec', '-i', CONTAINER, 'psql', '-U', 'postgres', '-d', DB, '-tAc', statement],
    { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }
  ).trim()
}

let passed = 0
const failures = []
function check(name, cond, detail = '') {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

const SERVICES = ['Sunday First Service', 'Sunday Second Service', 'Wednesday Prayer']

async function main() {
  console.log('\nChurch Dashboard — seed + integration test')
  console.log(`API: ${API}  DB: ${DB}\n`)

  // 1. Birthdays and anniversaries today
  console.log('1. Birthdays & anniversaries')
  // Clear any previous run so counts are deterministic on re-run.
  sql(`UPDATE people SET date_of_birth = NULL, anniversary = NULL`)

  // Three people with a birthday today, two with an anniversary today, and
  // one with a birthday tomorrow to prove the match is exact and not a range.
  sql(`
    WITH picked AS (SELECT id, row_number() OVER (ORDER BY created_at) rn FROM people WHERE enabled LIMIT 6)
    UPDATE people p SET
      date_of_birth = CASE
        WHEN picked.rn <= 3 THEN (CURRENT_DATE - INTERVAL '30 years')::date
        WHEN picked.rn = 4 THEN (CURRENT_DATE + INTERVAL '1 day' - INTERVAL '25 years')::date
      END,
      anniversary = CASE WHEN picked.rn IN (5,6) THEN (CURRENT_DATE - INTERVAL '10 years')::date END
    FROM picked WHERE p.id = picked.id`)

  const withBirthdayToday = Number(sql(`
    SELECT COUNT(*) FROM people WHERE enabled AND date_of_birth IS NOT NULL
      AND EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(DAY FROM date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE)`))
  console.log(`  seeded ${withBirthdayToday} birthday(s) today, 2 anniversaries, 1 birthday tomorrow`)

  // 2. Attendance across 10 past services
  console.log('\n2. Attendance')
  sql(`DELETE FROM attendance WHERE name LIKE 'Seed %'`)
  let expectedTotal = 0
  const perService = []
  for (let i = 9; i >= 0; i--) {
    const count = 40 + ((9 - i) * 3) // rising, so growth is provably positive
    const service = SERVICES[i % SERVICES.length]
    const values = Array.from({ length: count }, (_, n) =>
      `(gen_random_uuid(), NULL, NULL, 'Seed Attendee ${n}', (CURRENT_DATE - INTERVAL '${i * 7} days')::date, ${sqlStr(service)}, NOW())`
    ).join(',')
    sql(`INSERT INTO attendance (id, event_id, person_id, name, service_date, service_name, checked_in_at) VALUES ${values}`)
    perService.push({ daysAgo: i * 7, count, service })
    expectedTotal += count
  }
  console.log(`  seeded ${expectedTotal} attendance rows across 10 services`)

  const todayCount = perService.find((s) => s.daysAgo === 0)?.count ?? 0

  // 3. A task that is overdue, so the overdue path is exercised
  console.log('\n3. Tasks')
  sql(`DELETE FROM todos WHERE title LIKE 'Seed %'`)
  sql(`INSERT INTO todos (title, description, priority, status, due_date)
       VALUES ('Seed overdue task', 'from seed', 'high', 'todo', (CURRENT_DATE - INTERVAL '3 days')::date),
              ('Seed task due today', 'from seed', 'medium', 'todo', CURRENT_DATE),
              ('Seed future task', 'from seed', 'low', 'todo', (CURRENT_DATE + INTERVAL '5 days')::date)`)

  // 4. Read the aggregate back and check it agrees
  console.log('\n4. Dashboard aggregate')
  const d = await api('GET', '/church-dashboard')

  check('birthdays today match the seed', d.birthdays_today.length === withBirthdayToday,
    `${d.birthdays_today.length} vs ${withBirthdayToday}`)
  check('tomorrow\'s birthday is NOT counted today', d.birthdays_today.length === 3,
    `${d.birthdays_today.length}`)
  check('anniversaries today match the seed', d.anniversaries_today.length === 2,
    `${d.anniversaries_today.length}`)
  check('birthday entries carry an age', d.birthdays_today.every((b) => !!b.detail))

  check('attendance today matches the seed', d.attendance.today === todayCount,
    `${d.attendance.today} vs ${todayCount}`)
  check('attendance this month <= this week is false (week <= month)',
    d.attendance.this_week <= d.attendance.this_month,
    `week ${d.attendance.this_week}, month ${d.attendance.this_month}`)
  check('highest >= average >= lowest',
    d.attendance.highest >= d.attendance.average && d.attendance.average >= d.attendance.lowest,
    `${d.attendance.lowest}/${d.attendance.average}/${d.attendance.highest}`)
  check('highest matches the largest seeded service', d.attendance.highest === 67,
    `${d.attendance.highest}`)
  // Attendance was seeded strictly rising, so growth must be positive.
  check('rising attendance yields positive growth', d.attendance.growth_pct > 0,
    `${d.attendance.growth_pct}%`)
  check('weekly trend has points', d.attendance.weekly_trend.length > 0,
    `${d.attendance.weekly_trend.length}`)
  check('by-service breakdown covers the seeded services',
    d.attendance.by_service.length >= 3, `${d.attendance.by_service.length}`)

  check('overdue task counted', d.tasks.overdue >= 1, `${d.tasks.overdue}`)
  check('task due today counted', d.tasks.due_today >= 1, `${d.tasks.due_today}`)
  check('open tasks >= 3', d.tasks.open >= 3, `${d.tasks.open}`)
  check('overdue tasks sort first', d.tasks.items[0]?.title === 'Seed overdue task',
    d.tasks.items[0]?.title)

  // 5. Finance must agree with the Offering module, not drift from it
  console.log('\n5. Cross-module consistency')
  const off = await api('GET', '/offering-management/dashboard')
  check('offering today matches the offering module',
    d.finance.offering_today === off.today, `${d.finance.offering_today} vs ${off.today}`)
  check('offering this month matches the offering module',
    d.finance.offering_this_month === off.this_month,
    `${d.finance.offering_this_month} vs ${off.this_month}`)
  check('offering this year matches the offering module',
    d.finance.offering_this_year === off.this_year,
    `${d.finance.offering_this_year} vs ${off.this_year}`)
  check('pending deposits match the offering module',
    d.finance.pending_deposits === off.pending_deposits,
    `${d.finance.pending_deposits} vs ${off.pending_deposits}`)

  // 6. People counts must agree with the people table
  console.log('\n6. People')
  const realTotal = Number(sql(`SELECT COUNT(*) FROM people WHERE enabled`))
  const realMembers = Number(sql(`SELECT COUNT(*) FROM people WHERE enabled AND member_status='member'`))
  check('total people matches the table', d.people.total === realTotal, `${d.people.total} vs ${realTotal}`)
  check('active members matches the table', d.people.active_members === realMembers,
    `${d.people.active_members} vs ${realMembers}`)
  check('members do not exceed total', d.people.active_members <= d.people.total)

  // 7. Absent modules must be reported absent, never as zero
  console.log('\n7. Module honesty')
  check('help desk reported absent', d.modules.help_desk === false)
  check('assets reported absent', d.modules.assets === false)
  check('library reported absent', d.modules.library === false)
  check('expenses reported absent', d.modules.expenses === false)
  check('offerings reported present', d.modules.offerings === true)
  check('presentation reported present', d.modules.presentation === true)

  // 8. Activity feed
  console.log('\n8. Activity feed')
  check('activity feed has items', d.activity.length > 0, `${d.activity.length}`)
  check('activity is newest first',
    d.activity.every((x, i) => i === 0 || d.activity[i - 1].at >= x.at))
  check('activity is capped at 20', d.activity.length <= 20, `${d.activity.length}`)
  check('activity items carry a kind', d.activity.every((x) => !!x.kind))

  // 9. Prayer requests — the table this run repaired
  console.log('\n9. Prayer requests')
  const prayerCount = Number(sql(`SELECT COUNT(*) FROM prayer_requests WHERE status='pending'`))
  check('prayer pending matches the table', d.care.prayer_pending === prayerCount,
    `${d.care.prayer_pending} vs ${prayerCount}`)
  const pub = await fetch(`${API}/api/prayer-requests/public`)
  check('public prayer endpoint no longer 500s', pub.status === 200, `HTTP ${pub.status}`)

  console.log('\n--- Dashboard now shows ---')
  console.log(`  Attendance today   ${d.attendance.today}`)
  console.log(`  Growth             ${d.attendance.growth_pct}%`)
  console.log(`  Average / High / Low  ${d.attendance.average} / ${d.attendance.highest} / ${d.attendance.lowest}`)
  console.log(`  People             ${d.people.total} (${d.people.active_members} members, ${d.people.visitors} visitors)`)
  console.log(`  Birthdays today    ${d.birthdays_today.length}`)
  console.log(`  Offering this year Rs ${(d.finance.offering_this_year / 100).toLocaleString('en-IN')}`)
  console.log(`  Open tasks         ${d.tasks.open} (${d.tasks.overdue} overdue)`)
  console.log(`  Activity items     ${d.activity.length}`)

  console.log(`\n${passed} passed, ${failures.length} failed`)
  if (failures.length) {
    console.log('\nFailures:')
    failures.forEach((f) => console.log(`  - ${f}`))
    process.exit(1)
  }
  console.log('All checks passed.\n')
}

/** Single-quote a string for inline SQL. Seed data only, never user input. */
function sqlStr(s) {
  return `'${String(s).replace(/'/g, "''")}'`
}

main().catch((e) => {
  console.error(`\nFATAL: ${e.message}`)
  process.exit(1)
})
