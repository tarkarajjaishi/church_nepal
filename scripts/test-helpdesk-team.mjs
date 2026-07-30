/**
 * Exercises the help desk team features against the running stack with real
 * rows: watchers, duplicate merge, canned replies, article suggestions and
 * bulk actions.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import { execSync } from 'node:child_process'

const API = 'http://localhost:3002'
const ENV_PATH = 'backend/.env'

function tokenFor(userId, email) {
  const secret = (fs.readFileSync(ENV_PATH, 'utf8').match(/^JWT_SECRET=(.*)$/m) || [])[1]?.trim()
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
    sub: userId, email, role: 'admin',
    exp: now + 900, jti: crypto.randomUUID(), iat: now,
    last_active_at: now, pwd_changed_at: now + 60,
  })}`
  return `${body}.${crypto.createHmac('sha256', secret).update(body).digest('base64url')}`
}

// psql is not on PATH on this machine; Postgres runs in a container.
const psql = (sql) =>
  execSync(
    `docker exec grace-church-postgres psql -U postgres -d grace_church_dev -tAc "${sql.replace(/"/g, '\\"')}"`,
    { encoding: 'utf8' },
  ).trim()

const [uid, uemail] = psql('SELECT id || \'|\' || email FROM users LIMIT 1').split('|')
const AUTH = { authorization: `Bearer ${tokenFor(uid, uemail)}`, 'content-type': 'application/json' }

const call = async (method, path, body, headers = AUTH) => {
  const r = await fetch(`${API}/api${path}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  })
  const t = await r.text()
  let v; try { v = JSON.parse(t) } catch { v = t }
  return [r.status, v]
}

let pass = 0, fail = 0
const check = (name, ok, detail = '') => {
  if (ok) { pass++; console.log(`  ok   ${name}`) }
  else { fail++; console.log(`  FAIL ${name} ${detail}`) }
}

const report = async (subject) => {
  const r = await fetch(`${API}/api/support/report`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      subject, reporter_name: 'Sita Thapa', reporter_contact: 'sita@example.org',
      body: 'Noticed it after the evening service.',
    }),
  })
  return r.json()
}

console.log('\nWatchers')
{
  const t = await report('The side door will not latch')
  const id = psql(`SELECT id FROM helpdesk_tickets WHERE public_token = '${t.token}'`)

  check('add a watcher', (await call('POST', `/helpdesk/tickets/${id}/watchers`, { email: 'Warden@Example.org', name: 'Bikash' }))[0] === 200)
  const stored = psql(`SELECT email FROM helpdesk_watchers WHERE ticket_id = '${id}'`)
  check('stored lowercased', stored === 'warden@example.org', `got ${stored}`)

  const [, again] = await call('POST', `/helpdesk/tickets/${id}/watchers`, { email: 'WARDEN@example.org' })
  check('same person twice adds one row', again.added === false && psql(`SELECT count(*) FROM helpdesk_watchers WHERE ticket_id = '${id}'`) === '1')

  const [bad] = await call('POST', `/helpdesk/tickets/${id}/watchers`, { email: 'not-an-email' })
  check('rejects a non-address', bad === 400)

  const [, detail] = await call('GET', `/helpdesk/tickets/${id}`)
  check('watcher shows on the ticket', detail.watchers?.length === 1)

  check('remove a watcher', (await call('DELETE', `/helpdesk/tickets/${id}/watchers/warden@example.org`))[0] === 200)
  check('gone', psql(`SELECT count(*) FROM helpdesk_watchers WHERE ticket_id = '${id}'`) === '0')
}

console.log('\nDuplicate merge')
{
  const a = await report('Light out over the back pews')
  const b = await report('Back of the church is dark')
  const idA = psql(`SELECT id FROM helpdesk_tickets WHERE public_token = '${a.token}'`)
  const idB = psql(`SELECT id FROM helpdesk_tickets WHERE public_token = '${b.token}'`)

  // A photo on the duplicate should follow the fault, not the ticket.
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000002000100ffff03000006000557bfabd40000000049454e44ae426082', 'hex')
  const bd = '----m' + Date.now()
  await fetch(`${API}/api/support/${b.token}/attach`, {
    method: 'POST', headers: { 'content-type': `multipart/form-data; boundary=${bd}` },
    body: Buffer.concat([
      Buffer.from(`--${bd}\r\nContent-Disposition: form-data; name="file"; filename="dark.png"\r\nContent-Type: image/png\r\n\r\n`),
      png, Buffer.from(`\r\n--${bd}--\r\n`)]),
  })

  const [st, res] = await call('POST', `/helpdesk/tickets/${idB}/merge`, { into: idA })
  check('merge succeeds', st === 200, JSON.stringify(res))
  check('duplicate is closed', psql(`SELECT status FROM helpdesk_tickets WHERE id = '${idB}'`) === 'closed')
  check('duplicate points at the original', psql(`SELECT merged_into FROM helpdesk_tickets WHERE id = '${idB}'`) === idA)
  check('the photo moved to the surviving ticket',
    psql(`SELECT count(*) FROM helpdesk_attachments WHERE ticket_id = '${idA}'`) === '1')
  check('the duplicate reporter now watches the original',
    psql(`SELECT count(*) FROM helpdesk_watchers WHERE ticket_id = '${idA}' AND email = 'sita@example.org'`) === '1')

  const [, detail] = await call('GET', `/helpdesk/tickets/${idA}`)
  check('the original lists its duplicates', detail.duplicates?.length === 1)

  const [self] = await call('POST', `/helpdesk/tickets/${idA}/merge`, { into: idA })
  check('cannot merge into itself', self === 400)

  const [twice] = await call('POST', `/helpdesk/tickets/${idB}/merge`, { into: idA })
  check('cannot merge twice', twice === 400)

  const c = await report('Still dark at the back')
  const idC = psql(`SELECT id FROM helpdesk_tickets WHERE public_token = '${c.token}'`)
  const [chain] = await call('POST', `/helpdesk/tickets/${idC}/merge`, { into: idB })
  check('refuses to build a chain of duplicates', chain === 400)

  // The reporter of the duplicate can still see where it went.
  const tracked = await (await fetch(`${API}/api/support/${b.token}`)).json()
  check('the duplicate reporter still sees their ticket', tracked.ticket_code?.length > 0)
}

console.log('\nCanned replies')
{
  const [st, list] = await call('GET', '/helpdesk/replies')
  check('canned replies load', st === 200 && list.length >= 5, `${list.length ?? 0}`)
  const first = list[0]
  await call('POST', `/helpdesk/replies/${first.id}/used`)
  const [, after] = await call('GET', '/helpdesk/replies')
  const used = after.find((r) => r.id === first.id)
  check('a use is counted', used.useCount === first.useCount + 1 || used.use_count === first.use_count + 1)
  check('most used sorts first', after[0].id === used.id || after[0].useCount >= used.useCount)
}

console.log('\nArticle suggestions')
{
  const [st, hits] = await call('GET', '/helpdesk/suggest?q=' + encodeURIComponent('how do I book the hall'))
  check('suggest responds', st === 200, JSON.stringify(hits).slice(0, 120))
  check('suggest returns at most five', Array.isArray(hits) && hits.length <= 5)
  const [, none] = await call('GET', '/helpdesk/suggest?q=a b c')
  check('words too short to mean anything return nothing', none.length === 0)
  const [, empty] = await call('GET', '/helpdesk/suggest?q=')
  check('an empty query returns nothing', empty.length === 0)
}

console.log('\nBulk actions')
{
  const ids = []
  for (const s of ['Chair leg loose', 'Notice board falling', 'Gate squeaks']) {
    const t = await report(s)
    ids.push(psql(`SELECT id FROM helpdesk_tickets WHERE public_token = '${t.token}'`))
  }

  const [st, res] = await call('POST', '/helpdesk/bulk', { ids, action: 'priority', value: 'high' })
  check('bulk priority', st === 200 && res.changed === 3, JSON.stringify(res))
  check('all three are high',
    psql(`SELECT count(*) FROM helpdesk_tickets WHERE id = ANY(ARRAY['${ids.join("','")}']::uuid[]) AND priority = 'high'`) === '3')

  const [, assigned] = await call('POST', '/helpdesk/bulk', { ids, action: 'assign', value: 'Hari Shrestha' })
  check('bulk assign moves open tickets to in progress',
    assigned.changed === 3 &&
    psql(`SELECT count(*) FROM helpdesk_tickets WHERE id = ANY(ARRAY['${ids.join("','")}']::uuid[]) AND status = 'in_progress'`) === '3')

  // Closing what is not resolved would tidy the queue and leave the fault.
  const [, closed] = await call('POST', '/helpdesk/bulk', { ids, action: 'close' })
  check('bulk close skips anything not resolved', closed.changed === 0 && closed.skipped === 3, JSON.stringify(closed))

  await call('POST', `/helpdesk/tickets/${ids[0]}/status`, { status: 'resolved', resolution: 'Tightened the bolt.' })
  const [, closed2] = await call('POST', '/helpdesk/bulk', { ids, action: 'close' })
  check('bulk close takes only the resolved one', closed2.changed === 1 && closed2.skipped === 2, JSON.stringify(closed2))

  const [bad] = await call('POST', '/helpdesk/bulk', { ids, action: 'delete_everything' })
  check('an unknown action is refused', bad === 400)
  const [none] = await call('POST', '/helpdesk/bulk', { ids: [], action: 'priority', value: 'low' })
  check('an empty selection is refused', none === 400)
  const [badp] = await call('POST', '/helpdesk/bulk', { ids, action: 'priority', value: 'catastrophic' })
  check('an unknown priority is refused', badp === 400)

  check('the bulk change is written into each history',
    Number(psql(`SELECT count(*) FROM helpdesk_comments WHERE ticket_id = '${ids[1]}' AND event_kind = 'bulk'`)) >= 2)
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
