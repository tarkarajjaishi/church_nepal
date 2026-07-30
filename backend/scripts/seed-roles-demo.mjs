#!/usr/bin/env node
/**
 * Seed + integration test for roles and permissions.
 *
 * This is the one module where "it returned 200" is the wrong thing to check.
 * Every assertion here is about what a user *cannot* reach: the librarian who
 * must not read donor history, the finance officer who must not edit the
 * website, the viewer who must not change anything at all.
 *
 * It creates one real user per role, signs in as each, and walks the whole
 * permission matrix — every role against every module, asserting 200 where
 * the role allows it and 403 where it does not.
 *
 *   node backend/scripts/seed-roles-demo.mjs
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const API = process.env.API || 'http://localhost:3002'
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const ENV = fs.readFileSync(path.join(HERE, '..', '.env'), 'utf8')
const SECRET = (ENV.match(/^JWT_SECRET=(.*)$/m) || [])[1]?.trim()
if (!SECRET) throw new Error('JWT_SECRET missing from backend/.env')

/**
 * Mint a token for a real user row.
 *
 * Signing tokens directly rather than posting to /auth/login on purpose: no
 * password is ever typed, stored or transmitted by this script, and the test
 * users below have no usable password hash at all.
 */
function tokenFor({ id, email, role = 'admin' }) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
    sub: id, email, role,
    exp: now + 3600, jti: crypto.randomUUID(), iat: now,
    last_active_at: now, pwd_changed_at: now + 60,
  })}`
  return `${body}.${crypto.createHmac('sha256', SECRET).update(body).digest('base64url')}`
}

// The synthetic token the other seeds and the watchdog use: no user row, so
// the signed claim governs. Used here to set everything up.
const ROOT = tokenFor({ id: 'seed', email: 'seed@local' })

async function req(token, method, route, body) {
  const res = await fetch(`${API}/api${route}`, {
    method,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let parsed
  try { parsed = text ? JSON.parse(text) : null } catch { parsed = text }
  return { status: res.status, body: parsed }
}

async function api(method, route, body) {
  const r = await req(ROOT, method, route, body)
  if (r.status >= 400) {
    const e = new Error(`${method} ${route} -> ${r.status} ${JSON.stringify(r.body)?.slice(0, 200)}`)
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
async function expectStatus(name, want, token, method, route, body) {
  const r = await req(token, method, route, body)
  // A 429 is neither a grant nor a refusal. Counting it either way would let a
  // real permission bug hide behind the rate limiter, so it fails loudly.
  if (r.status === 429) {
    failures.push(`${name} — rate limited, result unknown`)
    console.log(`  FAIL  ${name} — rate limited, result unknown`)
    return r
  }
  const ok = r.status === want
  if (ok) passed++
  else failures.push(`${name} — wanted ${want}, got ${r.status}`)
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : ` — wanted ${want}, got ${r.status}`}`)
  return r
}

/**
 * One probe per module: a route that module owns, and the permission it needs.
 * Read-only probes so running the matrix changes nothing.
 */
const PROBES = [
  { module: 'Overview',      perm: 'dashboard.view',       route: '/church-dashboard' },
  { module: 'Website',       perm: 'content.manage',       route: '/uploads' },
  { module: 'Settings',      perm: 'settings.manage',      route: '/settings/theme/draft' },
  { module: 'People',        perm: 'people.view',          route: '/people' },
  { module: 'Giving',        perm: 'giving.view',          route: '/donations/stats' },
  { module: 'Worship',       perm: 'worship.manage',       route: '/worship/dashboard' },
  { module: 'Presentation',  perm: 'presentation.manage',  route: '/presentation/dashboard' },
  { module: 'Assets',        perm: 'assets.manage',        route: '/assets/dashboard' },
  { module: 'Library',       perm: 'library.manage',       route: '/library/dashboard' },
  { module: 'Help Desk',     perm: 'helpdesk.manage',      route: '/helpdesk/dashboard' },
  { module: 'Communication', perm: 'communication.manage', route: '/broadcasts' },
  { module: 'Users & roles', perm: 'users.manage',         route: '/roles' },
  { module: 'Audit log',     perm: 'audit.view',           route: '/audit-log' },
]

// A real church team. Each becomes a user row holding exactly one role.
const STAFF = [
  { slug: 'administrator',        name: 'Daniel Shrestha', email: 'daniel.admin@test.local' },
  { slug: 'pastor',               name: 'Samuel Rai',      email: 'samuel.pastor@test.local' },
  { slug: 'finance-officer',      name: 'Anjali Karki',    email: 'anjali.finance@test.local' },
  { slug: 'worship-leader',       name: 'Prakash Thapa',   email: 'prakash.worship@test.local' },
  { slug: 'media-tech',           name: 'Bikash Tamang',   email: 'bikash.media@test.local' },
  { slug: 'librarian',            name: 'Sarita Gurung',   email: 'sarita.library@test.local' },
  { slug: 'facilities',           name: 'Deepak Magar',    email: 'deepak.facilities@test.local' },
  { slug: 'communications',       name: 'Maya Rai',        email: 'maya.comms@test.local' },
  { slug: 'volunteer-coordinator',name: 'Sita Limbu',      email: 'sita.volunteers@test.local' },
  { slug: 'viewer',               name: 'Gopal Shrestha',  email: 'gopal.viewer@test.local' },
]

/** Mirrors src/permissions.rs — manage implies view, system.admin implies all. */
function allows(held, needed) {
  if (held.includes('system.admin') || held.includes(needed)) return true
  if (needed === 'people.view') return held.includes('people.manage')
  if (needed === 'giving.view') return held.includes('giving.manage')
  return false
}

async function main() {
  console.log('\nRoles & permissions — seed + integration test')
  console.log(`API: ${API}\n`)

  // -- 1. The catalogue ----------------------------------------------------
  console.log('1. Permission catalogue')
  const cat = await api('GET', '/permissions')
  check('catalogue seeded', cat.length >= 16, `${cat.length}`)
  check('every listed permission is actually checked by the code',
    cat.every((p) => p.enforced),
    cat.filter((p) => !p.enforced).map((p) => p.code).join(', '))
  check('permissions are grouped for the UI', new Set(cat.map((p) => p.module)).size >= 5)

  const roles = await api('GET', '/roles')
  check('roles seeded', roles.length >= 10, `${roles.length}`)
  const bySlug = Object.fromEntries(roles.map((r) => [r.slug, r]))
  check('administrator holds the unrestricted permission',
    bySlug.administrator.permissions.includes('system.admin'))
  check('viewer holds nothing but the overview',
    JSON.stringify(bySlug.viewer.permissions) === JSON.stringify(['dashboard.view']),
    JSON.stringify(bySlug.viewer.permissions))
  check('the librarian cannot see giving',
    !bySlug.librarian.permissions.some((p) => p.startsWith('giving.')))
  check('the finance officer cannot edit the website',
    !bySlug['finance-officer'].permissions.includes('content.manage'))

  await expectStatus('a made-up permission cannot be granted', 400, ROOT,
    'PUT', `/roles/${bySlug.viewer.id}/permissions`, { permissions: ['giving.everything'] })
  await expectStatus('a built-in role cannot be deleted', 400, ROOT,
    'DELETE', `/roles/${bySlug.viewer.id}`)

  // -- 2. Real users, one per role -----------------------------------------
  console.log('\n2. Staff accounts')
  const existing = await api('GET', '/role-assignments')
  const byEmail = Object.fromEntries(existing.map((u) => [u.email, u]))

  for (const s of STAFF) {
    if (!byEmail[s.email]) {
      await api('POST', '/users', {
        email: s.email, name: s.name, role: 'admin',
        // Never a real credential: a random value nobody holds, so these
        // accounts can only be reached by a signed token in this script.
        password: `Test!${crypto.randomUUID()}`,
      })
    }
  }
  const users = await api('GET', '/role-assignments')
  const staff = Object.fromEntries(users.map((u) => [u.email, u]))
  check('every staff account exists', STAFF.every((s) => staff[s.email]))

  for (const s of STAFF) {
    await api('PUT', `/role-assignments/${staff[s.email].id}`, {
      role_ids: [bySlug[s.slug].id],
    })
  }
  const assigned = await api('GET', '/role-assignments')
  const withRoles = Object.fromEntries(assigned.map((u) => [u.email, u]))
  check('every staff account holds exactly its role',
    STAFF.every((s) => withRoles[s.email].role_slugs.length === 1
                    && withRoles[s.email].role_slugs[0] === s.slug))
  check('permissions are resolved from the role, not stored on the user',
    withRoles['sarita.library@test.local'].permissions.includes('library.manage')
    && !withRoles['sarita.library@test.local'].permissions.includes('giving.view'))

  await expectStatus('a role that does not exist cannot be assigned', 400, ROOT,
    'PUT', `/role-assignments/${staff['gopal.viewer@test.local'].id}`,
    { role_ids: ['00000000-0000-0000-0000-000000000000'] })

  // -- 3. Each user reports their own access -------------------------------
  console.log('\n3. Self-reported access')
  const tokens = {}
  for (const s of STAFF) {
    tokens[s.slug] = tokenFor({ id: withRoles[s.email].id, email: s.email })
  }
  const libAccess = (await req(tokens.librarian, 'GET', '/auth/access')).body
  check('a user can read their own access', libAccess.permissions.includes('library.manage'))
  check('and is told which roles produced it', libAccess.roles.includes('Librarian'))
  check('a managed user is not flagged unmanaged', libAccess.unmanaged === false)
  const rootAccess = (await req(ROOT, 'GET', '/auth/access')).body
  check('a hand-minted token is flagged as unmanaged', rootAccess.unmanaged === true)

  // -- 4. The whole matrix -------------------------------------------------
  console.log('\n4. Permission matrix — every role against every module')
  let allowed = 0
  let denied = 0
  const wrong = []
  for (const s of STAFF) {
    const held = bySlug[s.slug].permissions
    for (const probe of PROBES) {
      const shouldPass = allows(held, probe.perm)
      const r = await req(tokens[s.slug], 'GET', probe.route)
      // 404 is fine on a probe route with no data; it still proves the guard
      // let the request through to the handler. 429 proves nothing at all, and
      // must never be read as "allowed" — that would turn the rate limiter
      // into a way for a permission bug to pass this test.
      if (r.status === 429) {
        wrong.push(`${s.slug} -> ${probe.module}: rate limited, result unknown`)
        continue
      }
      const got = r.status === 403 ? 'denied' : 'allowed'
      const want = shouldPass ? 'allowed' : 'denied'
      if (got !== want) wrong.push(`${s.slug} -> ${probe.module}: ${got}, expected ${want} (HTTP ${r.status})`)
      if (shouldPass) allowed++; else denied++
    }
  }
  check(`matrix holds (${allowed} allowed, ${denied} denied across ${STAFF.length}x${PROBES.length})`,
    wrong.length === 0, wrong.slice(0, 5).join(' | '))

  // -- 5. The refusals that matter -----------------------------------------
  console.log('\n5. The refusals that matter')
  await expectStatus('the librarian cannot read donor history', 403,
    tokens.librarian, 'GET', '/donations/by-donor')
  await expectStatus('the librarian cannot export donations', 403,
    tokens.librarian, 'GET', '/donations/export-csv')
  await expectStatus('the librarian cannot read the member list', 403,
    tokens.librarian, 'GET', '/people')
  await expectStatus('the finance officer cannot publish a sermon', 403,
    tokens['finance-officer'], 'POST', '/sermons', { title: 'Should never exist' })
  await expectStatus('the worship leader cannot see the giving dashboard', 403,
    tokens['worship-leader'], 'GET', '/offering-management/dashboard')
  await expectStatus('the viewer cannot change a setting', 403,
    tokens.viewer, 'PUT', '/settings/site_title', { value: 'Hacked' })
  await expectStatus('the viewer cannot raise a help desk ticket', 403,
    tokens.viewer, 'POST', '/helpdesk/tickets', { subject: 'x', reporter_name: 'y' })
  await expectStatus('nobody but an administrator can hand out roles', 403,
    tokens.pastor, 'GET', '/roles')
  await expectStatus('and cannot assign one either', 403,
    tokens.pastor, 'PUT', `/role-assignments/${withRoles['gopal.viewer@test.local'].id}`,
    { role_ids: [bySlug.administrator.id] })

  // The one that would undo everything: granting yourself the missing rights.
  await expectStatus('a librarian cannot promote herself', 403,
    tokens.librarian, 'PUT', `/role-assignments/${withRoles['sarita.library@test.local'].id}`,
    { role_ids: [bySlug.administrator.id] })
  const stillLibrarian = (await req(tokens.librarian, 'GET', '/auth/access')).body
  check('and is still only a librarian afterwards',
    stillLibrarian.permissions.length === bySlug.librarian.permissions.length)

  // -- 6. What each role can still do --------------------------------------
  console.log('\n6. Each role can still do its job')
  await expectStatus('the librarian runs the library', 200,
    tokens.librarian, 'GET', '/library/dashboard')
  await expectStatus('the finance officer reads giving', 200,
    tokens['finance-officer'], 'GET', '/offering-management/dashboard')
  await expectStatus('and sees the offering register', 200,
    tokens['finance-officer'], 'GET', '/offering-management/offerings?per_page=1')
  await expectStatus('the worship leader plans a service', 200,
    tokens['worship-leader'], 'GET', '/worship/dashboard')
  await expectStatus('the media tech runs the screens', 200,
    tokens['media-tech'], 'GET', '/presentation/dashboard')
  await expectStatus('and works the help desk', 200,
    tokens['media-tech'], 'GET', '/helpdesk/dashboard')
  await expectStatus('facilities manage equipment', 200,
    tokens.facilities, 'GET', '/assets/dashboard')
  await expectStatus('communications edit the website', 200,
    tokens.communications, 'GET', '/uploads')
  await expectStatus('the coordinator sees people', 200,
    tokens['volunteer-coordinator'], 'GET', '/people')
  await expectStatus('the viewer sees the overview', 200,
    tokens.viewer, 'GET', '/church-dashboard')
  await expectStatus('the administrator sees everything', 200,
    tokens.administrator, 'GET', '/donations/stats')

  // -- 7. Manage implies view, view never implies manage -------------------
  console.log('\n7. Manage implies view')
  const financePerms = bySlug['finance-officer'].permissions
  check('the finance officer holds giving.manage', financePerms.includes('giving.manage'))
  await expectStatus('and can therefore read giving', 200,
    tokens['finance-officer'], 'GET', '/donations/stats')
  check('the coordinator holds people.manage but no giving permission',
    bySlug['volunteer-coordinator'].permissions.includes('people.manage')
    && !bySlug['volunteer-coordinator'].permissions.some((p) => p.startsWith('giving.')))
  await expectStatus('so cannot read giving at all', 403,
    tokens['volunteer-coordinator'], 'GET', '/donations/stats')

  // -- 8. Changing a role takes effect at once -----------------------------
  console.log('\n8. A permission change is felt immediately')
  const custom = (await api('GET', '/roles')).find((r) => r.slug === 'test-temporary-role')
  const tempId = custom
    ? custom.id
    : (await api('POST', '/roles', {
        name: 'Test Temporary Role',
        description: 'Created by the roles integration test.',
        permissions: ['dashboard.view'],
      })).id

  const guinea = staff['gopal.viewer@test.local']
  await api('PUT', `/role-assignments/${guinea.id}`, { role_ids: [tempId] })
  // The user row was touched, so the old token is refused — that is the point.
  const fresh = tokenFor({ id: guinea.id, email: guinea.email })
  await expectStatus('the temporary role cannot reach the library', 403,
    fresh, 'GET', '/library/dashboard')

  await api('PUT', `/roles/${tempId}/permissions`, {
    permissions: ['dashboard.view', 'library.manage'],
  })
  const afterGrant = tokenFor({ id: guinea.id, email: guinea.email })
  await expectStatus('granting library.manage works without a new sign-in flow', 200,
    afterGrant, 'GET', '/library/dashboard')

  await api('PUT', `/roles/${tempId}/permissions`, { permissions: ['dashboard.view'] })
  const afterRevoke = tokenFor({ id: guinea.id, email: guinea.email })
  await expectStatus('and revoking it takes effect just as fast', 403,
    afterRevoke, 'GET', '/library/dashboard')

  // Put the guinea pig back and clean up.
  await api('PUT', `/role-assignments/${guinea.id}`, { role_ids: [bySlug.viewer.id] })
  await expectStatus('a role nobody holds can be deleted', 200, ROOT, 'DELETE', `/roles/${tempId}`)
  await expectStatus('a built-in role still cannot be', 400, ROOT, 'DELETE', `/roles/${bySlug.viewer.id}`)
  // Built-in roles are refused before the holder check even runs, so this
  // needs a custom role that somebody actually holds.
  const heldId = (await api('POST', '/roles', {
    name: 'Test Held Role', permissions: ['dashboard.view'],
  })).id
  await api('PUT', `/role-assignments/${guinea.id}`, { role_ids: [heldId] })
  await expectStatus('a role someone holds cannot be deleted', 409, ROOT, 'DELETE', `/roles/${heldId}`)
  await api('PUT', `/role-assignments/${guinea.id}`, { role_ids: [bySlug.viewer.id] })
  await expectStatus('once nobody holds it, it can be', 200, ROOT, 'DELETE', `/roles/${heldId}`)

  // -- 9. Nobody can lock the church out -----------------------------------
  console.log('\n9. The church cannot be locked out')
  const admins = (await api('GET', '/role-assignments'))
    .filter((u) => u.role_slugs.includes('administrator'))
  check('at least one administrator exists', admins.length >= 1, `${admins.length}`)

  // Strip every administrator but one, then try to strip the last.
  for (const a of admins.slice(1)) {
    await api('PUT', `/role-assignments/${a.id}`, { role_ids: [bySlug.viewer.id] })
  }
  const last = (await api('GET', '/role-assignments'))
    .filter((u) => u.role_slugs.includes('administrator'))
  check('exactly one administrator is left', last.length === 1, `${last.length}`)
  await expectStatus('the last administrator cannot be demoted', 409, ROOT,
    'PUT', `/role-assignments/${last[0].id}`, { role_ids: [bySlug.viewer.id] })
  const stillThere = (await api('GET', '/role-assignments'))
    .filter((u) => u.role_slugs.includes('administrator'))
  check('and is still an administrator after the attempt', stillThere.length === 1)

  // Restore the ones demoted above so the script is re-runnable.
  for (const a of admins.slice(1)) {
    await api('PUT', `/role-assignments/${a.id}`, { role_ids: [bySlug.administrator.id] })
  }

  // The Administrator role itself must survive being emptied.
  await api('PUT', `/roles/${bySlug.administrator.id}/permissions`, { permissions: [] })
  const adminAfter = (await api('GET', '/roles')).find((r) => r.slug === 'administrator')
  check('the administrator role keeps unrestricted access however it is saved',
    adminAfter.permissions.includes('system.admin'),
    JSON.stringify(adminAfter.permissions))

  // -- 10. Unmapped routes fail closed -------------------------------------
  console.log('\n10. Anything uncategorised is administrator-only')
  // /webhooks needs audit.view; the librarian must not reach it.
  await expectStatus('the librarian cannot read webhook deliveries', 403,
    tokens.librarian, 'GET', '/webhooks')
  await expectStatus('but the pastor can, holding audit.view', 200,
    tokens.pastor, 'GET', '/audit-log')

  console.log('\n--- Access summary ---')
  for (const s of STAFF) {
    const perms = bySlug[s.slug].permissions
    const label = perms.includes('system.admin') ? 'everything' : `${perms.length} permission(s)`
    console.log(`  ${bySlug[s.slug].name.padEnd(22)} ${label}`)
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
