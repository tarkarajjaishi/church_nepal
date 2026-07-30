#!/usr/bin/env node
/**
 * Seed + integration test for the Worship Management module.
 *
 * Plans two real services end to end: roster a band, build a running order
 * from the song library, schedule a rehearsal, then duplicate the plan for
 * next week. Asserts the behaviours that matter to a worship leader — most of
 * all that double-booking is refused.
 *
 *   node scripts/seed-worship-demo.mjs
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

const iso = (d) => d.toISOString().slice(0, 10)
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d }

const BAND = [
  { name: 'Prakash Thapa', voice_type: 'tenor', experience: 'advanced', is_leader: true, roles: ['worship-leader', 'acoustic-guitar'] },
  { name: 'Anita Rai', voice_type: 'soprano', experience: 'advanced', roles: ['lead-vocal'] },
  { name: 'Bishal Gurung', voice_type: 'none', experience: 'intermediate', roles: ['drums', 'percussion'] },
  { name: 'Sunita Adhikari', voice_type: 'alto', experience: 'intermediate', roles: ['keyboard', 'backing-vocal'] },
  { name: 'Dipak Lama', voice_type: 'bass', experience: 'beginner', roles: ['bass-guitar'] },
  { name: 'Kamala Magar', voice_type: 'none', experience: 'advanced', roles: ['sound-engineer'] },
  { name: 'Hari Sharma', voice_type: 'none', experience: 'intermediate', roles: ['projection-operator', 'livestream-operator'] },
]

const RUNNING_ORDER = [
  { item_kind: 'countdown', title: 'Countdown', planned_seconds: 300 },
  { item_kind: 'welcome', title: 'Welcome & Call to Worship', planned_seconds: 180 },
  { item_kind: 'prayer', title: 'Opening Prayer', planned_seconds: 120 },
  { song: 0, song_key: 'G', planned_seconds: 300 },
  { song: 1, song_key: 'D', planned_seconds: 280 },
  { item_kind: 'announcements', title: 'Announcements', planned_seconds: 240 },
  { item_kind: 'offering', title: 'Offering', planned_seconds: 300 },
  { item_kind: 'reading', title: 'Bible Reading — John 3', planned_seconds: 180 },
  { item_kind: 'sermon', title: 'Message', planned_seconds: 1800 },
  { song: 2, song_key: 'C', planned_seconds: 300 },
  { item_kind: 'dismissal', title: 'Benediction', planned_seconds: 120 },
]

async function main() {
  console.log('\nWorship Management — seed + integration test')
  console.log(`API: ${API}\n`)

  // 0. Clear services from previous runs.
  //
  // Without this the script is not re-runnable: the second run plans the same
  // people onto the same dates, and the double-booking guard correctly refuses
  // — which looks like a product bug but is the test tripping over itself.
  console.log('0. Clean previous run')
  const stale = await api('GET', '/worship/services')
  const seededNames = new Set([
    'Sunday Morning Worship', 'Sunday Evening Worship', 'Sunday Late Service',
  ])
  let removed = 0
  for (const s of stale) {
    if (seededNames.has(s.name)) {
      await api('DELETE', `/worship/services/${s.id}`)
      removed++
    }
  }
  console.log(`  removed ${removed} service(s) from earlier runs`)

  // 1. Roles
  console.log('\n1. Role catalogue')
  const roles = await api('GET', '/worship/roles')
  check('21 roles seeded', roles.length >= 21, `${roles.length}`)
  check('roles are categorised', new Set(roles.map((r) => r.category)).size >= 5,
    [...new Set(roles.map((r) => r.category))].join(','))
  const roleBySlug = Object.fromEntries(roles.map((r) => [r.slug, r]))

  // 2. Team
  console.log('\n2. Team roster')
  // Includes inactive members: step 11 deactivates one, so a second run would
  // otherwise find them "already there", leave them inactive, and fail the
  // active-count assertion for a reason that has nothing to do with the code.
  const existing = await api('GET', '/worship/members?active=false')
  const active = await api('GET', '/worship/members?active=true')
  for (const m of existing) {
    if (BAND.some((b) => b.name === m.name)) {
      await api('PUT', `/worship/members/${m.id}`, { name: m.name, is_active: true })
    }
  }
  if (existing.length) console.log(`  (reactivated ${existing.length} member(s) from a previous run)`)

  const have = new Map([...active, ...existing].map((m) => [m.name, m]))
  const members = []
  for (const b of BAND) {
    if (have.has(b.name)) { members.push(have.get(b.name)); continue }
    members.push(await api('POST', '/worship/members', {
      name: b.name,
      voice_type: b.voice_type,
      experience: b.experience,
      is_leader: b.is_leader ?? false,
      role_ids: b.roles.map((s) => roleBySlug[s].id),
    }))
  }
  check('7 team members', members.length === 7, `${members.length}`)
  check('multi-instrument members keep every role',
    members.find((m) => m.name === 'Bishal Gurung')?.roles.length === 2,
    JSON.stringify(members.find((m) => m.name === 'Bishal Gurung')?.roles))
  check('leader flagged', members.some((m) => m.is_leader))
  await expectReject('member requires a name', 400, () => api('POST', '/worship/members', { name: '  ' }))

  // Filtering by role must not truncate the member's other roles.
  const drummers = await api('GET', `/worship/members?role_id=${roleBySlug['drums'].id}`)
  check('role filter finds the drummer', drummers.some((m) => m.name === 'Bishal Gurung'))
  check('role filter does not hide their other roles',
    drummers.find((m) => m.name === 'Bishal Gurung')?.roles.length === 2,
    JSON.stringify(drummers.find((m) => m.name === 'Bishal Gurung')?.roles))

  // 3. Songs to build a setlist from
  console.log('\n3. Song library')
  const songPage = await api('GET', '/songs?per_page=10')
  check('songs available from the shared library', songPage.data.length >= 3, `${songPage.data.length}`)
  const songs = songPage.data.slice(0, 3)

  // 4. Service plan
  console.log('\n4. Service plan')
  const sunday = addDays(7)
  const service = await api('POST', '/worship/services', {
    name: 'Sunday Morning Worship',
    service_date: iso(sunday),
    start_time: '10:30',
    end_time: '12:00',
    theme: 'Grace Upon Grace',
    speaker: 'Pastor Daniel Shrestha',
    service_type: 'sunday',
    worship_leader: 'Prakash Thapa',
    status: 'planned',
  })
  check('service created', !!service.id)
  check('service keeps its theme', service.theme === 'Grace Upon Grace')
  await expectReject('end time must be after start', 400, () =>
    api('POST', '/worship/services', {
      name: 'Bad', service_date: iso(sunday), start_time: '11:00', end_time: '10:00',
    })
  )
  await expectReject('service requires a name', 400, () =>
    api('POST', '/worship/services', { name: '', service_date: iso(sunday) })
  )
  await expectReject('bad date rejected', 400, () =>
    api('POST', '/worship/services', { name: 'X', service_date: '07-2026-01' })
  )

  // 5. Running order (the setlist lives here)
  console.log('\n5. Running order')
  for (const item of RUNNING_ORDER) {
    const body = item.song !== undefined
      ? { song_id: songs[item.song].id, song_key: item.song_key, planned_seconds: item.planned_seconds, leader: 'Prakash Thapa' }
      : item
    await api('POST', `/worship/services/${service.id}/items`, body)
  }
  let plan = await api('GET', `/worship/services/${service.id}`)
  check('plan is explicitly nested, not flattened', !!plan.service && Array.isArray(plan.items),
    Object.keys(plan).join(','))
  check('11 items in the running order', plan.items.length === 11, `${plan.items.length}`)
  check('items are strictly ordered',
    plan.items.every((it, i) => i === 0 || it.sort_order > plan.items[i - 1].sort_order))
  check('song items auto-title from the song',
    plan.items.find((i) => i.song_id)?.title === songs[0].title,
    plan.items.find((i) => i.song_id)?.title)
  check('song items are typed as songs',
    plan.items.filter((i) => i.song_id).every((i) => i.item_kind === 'song'))
  check('per-service key override is stored',
    plan.items.find((i) => i.song_id)?.song_key === 'G',
    plan.items.find((i) => i.song_id)?.song_key)
  check('the song\'s own key is untouched',
    plan.items.find((i) => i.song_id)?.song_default_key === songs[0].song_key,
    `${plan.items.find((i) => i.song_id)?.song_default_key} vs ${songs[0].song_key}`)

  const expectedPlanned = RUNNING_ORDER.reduce((a, i) => a + i.planned_seconds, 0)
  check('planned total is summed server-side', plan.planned_seconds === expectedPlanned,
    `${plan.planned_seconds} vs ${expectedPlanned}`)
  check('actual total is zero before the service runs', plan.actual_seconds === 0,
    `${plan.actual_seconds}`)

  await expectReject('negative duration rejected', 400, () =>
    api('PUT', `/worship/items/${plan.items[0].id}`, { planned_seconds: -60 })
  )

  // Reorder: move the sermon to the front and back again.
  const ids = plan.items.map((i) => i.id)
  await api('PUT', `/worship/services/${service.id}/items/reorder`, { ids: [ids[8], ...ids.filter((_, i) => i !== 8)] })
  let reordered = await api('GET', `/worship/services/${service.id}`)
  check('reorder persists', reordered.items[0].item_kind === 'sermon', reordered.items[0].item_kind)
  await api('PUT', `/worship/services/${service.id}/items/reorder`, { ids })

  // Recording what actually happened must not overwrite the plan.
  await api('PUT', `/worship/items/${ids[8]}`, { actual_seconds: 2100 })
  plan = await api('GET', `/worship/services/${service.id}`)
  check('actual duration recorded separately from planned',
    plan.items.find((i) => i.id === ids[8])?.actual_seconds === 2100 &&
    plan.items.find((i) => i.id === ids[8])?.planned_seconds === 1800,
    `${plan.items.find((i) => i.id === ids[8])?.actual_seconds}/${plan.items.find((i) => i.id === ids[8])?.planned_seconds}`)

  // 6. Rostering
  console.log('\n6. Rostering')
  const roster = [
    ['Prakash Thapa', 'worship-leader'],
    ['Anita Rai', 'lead-vocal'],
    ['Bishal Gurung', 'drums'],
    ['Sunita Adhikari', 'keyboard'],
    ['Dipak Lama', 'bass-guitar'],
    ['Kamala Magar', 'sound-engineer'],
  ]
  for (const [name, slug] of roster) {
    await api('POST', `/worship/services/${service.id}/assign`, {
      member_id: members.find((m) => m.name === name).id,
      role_id: roleBySlug[slug].id,
    })
  }
  plan = await api('GET', `/worship/services/${service.id}`)
  check('6 people rostered', plan.team.length === 6, `${plan.team.length}`)
  check('assignments carry role names', plan.team.every((t) => !!t.role_name))
  check('assignments start as invited', plan.team.every((t) => t.status === 'invited'))

  // The same person CAN cover two roles in one service — normal in a small church.
  await api('POST', `/worship/services/${service.id}/assign`, {
    member_id: members.find((m) => m.name === 'Sunita Adhikari').id,
    role_id: roleBySlug['backing-vocal'].id,
  })
  plan = await api('GET', `/worship/services/${service.id}`)
  check('one person may cover two roles in a service', plan.team.length === 7, `${plan.team.length}`)

  const anitaAssignment = plan.team.find((t) => t.member_name === 'Anita Rai')
  await api('POST', `/worship/assignments/${anitaAssignment.id}/status/accepted`)
  plan = await api('GET', `/worship/services/${service.id}`)
  check('invitation can be accepted',
    plan.team.find((t) => t.id === anitaAssignment.id)?.status === 'accepted')
  await expectReject('unknown assignment status rejected', 400, () =>
    api('POST', `/worship/assignments/${anitaAssignment.id}/status/maybe`)
  )

  // 7. Double-booking — the check that earns its keep
  console.log('\n7. Double-booking')
  const second = await api('POST', '/worship/services', {
    name: 'Sunday Evening Worship',
    service_date: iso(sunday),
    start_time: '11:00',   // overlaps the 10:30-12:00 morning service
    end_time: '12:30',
    service_type: 'sunday',
  })
  await expectReject('overlapping roster refused', 409, () =>
    api('POST', `/worship/services/${second.id}/assign`, {
      member_id: members.find((m) => m.name === 'Bishal Gurung').id,
      role_id: roleBySlug['drums'].id,
    })
  )

  // A non-overlapping service the same day is fine.
  const evening = await api('POST', '/worship/services', {
    name: 'Sunday Late Service',
    service_date: iso(sunday),
    start_time: '17:00',
    end_time: '18:30',
    service_type: 'sunday',
  })
  const ok = await api('POST', `/worship/services/${evening.id}/assign`, {
    member_id: members.find((m) => m.name === 'Bishal Gurung').id,
    role_id: roleBySlug['drums'].id,
  })
  check('non-overlapping service same day is allowed', ok.assigned === true)

  // 8. Rehearsal
  console.log('\n8. Rehearsal')
  const rehearsal = await api('POST', '/worship/rehearsals', {
    title: 'Saturday Practice',
    service_id: service.id,
    rehearsal_date: iso(addDays(6)),
    start_time: '17:00',
    end_time: '19:00',
    location: 'Main Hall',
    agenda: 'Run the full set, work the transition into the last song',
  })
  check('rehearsal created', !!rehearsal.id)
  // 7 assignments but 6 distinct people — Sunita covers two roles. You invite
  // a person once, not once per instrument, so 6 is the correct count and the
  // handler's SELECT DISTINCT is right.
  check('rehearsal invites each rostered person once', rehearsal.invited_count === 6,
    `${rehearsal.invited_count}`)
  check('nobody is marked present before it happens', rehearsal.present_count === 0)
  await expectReject('rehearsal end before start rejected', 400, () =>
    api('POST', '/worship/rehearsals', {
      rehearsal_date: iso(addDays(6)), start_time: '19:00', end_time: '17:00',
    })
  )

  await api('POST', `/worship/rehearsals/${rehearsal.id}/attendance`, {
    member_id: members.find((m) => m.name === 'Anita Rai').id, status: 'present',
  })
  await api('POST', `/worship/rehearsals/${rehearsal.id}/attendance`, {
    member_id: members.find((m) => m.name === 'Dipak Lama').id, status: 'absent',
  })
  const rehearsals = await api('GET', '/worship/rehearsals')
  const r = rehearsals.find((x) => x.id === rehearsal.id)
  check('attendance recorded', r.present_count === 1, `${r.present_count}`)
  check('rehearsal links back to its service', r.service_name === 'Sunday Morning Worship',
    r.service_name)
  await expectReject('unknown attendance status rejected', 400, () =>
    api('POST', `/worship/rehearsals/${rehearsal.id}/attendance`, {
      member_id: members[0].id, status: 'maybe',
    })
  )

  // 9. Duplicate for next week
  console.log('\n9. Duplicate')
  const nextWeek = await api('POST', `/worship/services/${service.id}/duplicate`, {
    name: 'Sunday Morning Worship',
    service_date: iso(addDays(14)),
  })
  check('duplicate copies the running order', nextWeek.items.length === 11, `${nextWeek.items.length}`)
  check('duplicate copies the roster', nextWeek.team.length === 7, `${nextWeek.team.length}`)
  check('duplicate resets everyone to invited',
    nextWeek.team.every((t) => t.status === 'invited'))
  check('duplicate does NOT carry over actual durations',
    nextWeek.items.every((i) => i.actual_seconds === null),
    JSON.stringify(nextWeek.items.map((i) => i.actual_seconds).filter(Boolean)))
  check('duplicate starts as a draft', nextWeek.service.status === 'draft', nextWeek.service.status)
  check('duplicate keeps the planned durations', nextWeek.planned_seconds === expectedPlanned,
    `${nextWeek.planned_seconds} vs ${expectedPlanned}`)

  // 10. Dashboard
  console.log('\n10. Dashboard')
  const dash = await api('GET', '/worship/dashboard')
  check('upcoming services listed', dash.upcoming_services.length > 0, `${dash.upcoming_services.length}`)
  check('service rows carry counts',
    dash.upcoming_services.every((s) => typeof s.item_count === 'number' && typeof s.team_count === 'number'))
  check('planned seconds not inflated by the team join',
    dash.upcoming_services.find((s) => s.id === service.id)?.planned_seconds === expectedPlanned,
    `${dash.upcoming_services.find((s) => s.id === service.id)?.planned_seconds} vs ${expectedPlanned}`)
  check('next rehearsal surfaced', !!dash.next_rehearsal)
  check('active member count correct', dash.active_members === 7, `${dash.active_members}`)
  check('pending invites counted', dash.pending_invites > 0, `${dash.pending_invites}`)
  check('song usage tracked', dash.most_used_songs.length > 0, `${dash.most_used_songs.length}`)
  check('uncovered roles reported', Array.isArray(dash.uncovered_roles))
  check('a role nobody plays is flagged uncovered',
    dash.uncovered_roles.some((r) => r.role_name === 'Cello'),
    dash.uncovered_roles.map((r) => r.role_name).join(', '))
  check('a role that IS covered is not flagged',
    !dash.uncovered_roles.some((r) => r.role_name === 'Drums'))

  // 11. Deactivate rather than delete when history exists
  console.log('\n11. Member removal')
  const del = await api('DELETE', `/worship/members/${members.find((m) => m.name === 'Kamala Magar').id}`)
  check('rostered member is deactivated, not deleted', del.deactivated === true, JSON.stringify(del))
  const after = await api('GET', '/worship/members?active=false')
  check('deactivated member still exists', after.some((m) => m.name === 'Kamala Magar'))

  console.log('\n--- Seeded ---')
  const finalServices = await api('GET', '/worship/services')
  const finalMembers = await api('GET', '/worship/members')
  console.log(`  Services    ${finalServices.length}`)
  console.log(`  Members     ${finalMembers.length}`)
  console.log(`  Rehearsals  ${(await api('GET', '/worship/rehearsals')).length}`)
  console.log(`  Plan length ${Math.floor(expectedPlanned / 60)} minutes`)

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
