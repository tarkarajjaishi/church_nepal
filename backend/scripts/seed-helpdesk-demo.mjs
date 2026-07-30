#!/usr/bin/env node
/**
 * Seed + integration test for the Help Desk module.
 *
 * Raises a realistic mix of church support tickets, then goes after the ways
 * a ticket queue quietly lies: two volunteers both claiming the same ticket,
 * a response time that improves every time someone comments, a ticket marked
 * resolved with no record of what fixed it, and an SLA that un-breaches
 * itself once the ticket is finally closed.
 *
 *   node backend/scripts/seed-helpdesk-demo.mjs
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

const TEAM = ['Prakash Thapa', 'Bikash Tamang', 'Sarita Gurung', 'Deepak Karki']

const isoStamp = (d) => d.toISOString().slice(0, 19)
const hoursAgo = (h) => isoStamp(new Date(Date.now() - h * 3600_000))

/** The one ticket every run leaves untouched. See section 2. */
const PROBE = 'SLA probe — deliberately left unanswered'

// The kind of thing a church actually files. A few urgent Sunday-morning
// failures, plenty of slow-burning building and IT work.
const TICKETS = [
  { subject: 'No sound from the left speaker', slug: 'sound-audio', priority: 'urgent', reporter: 'Anjali Shrestha', location: 'Main hall', body: 'Left speaker went silent halfway through the second song.' },
  { subject: 'Feedback whine when the pastor walks forward', slug: 'sound-audio', priority: 'high', reporter: 'Prakash Thapa', location: 'Main hall stage' },
  { subject: 'Projector shows a blue screen on startup', slug: 'projection', priority: 'high', reporter: 'Maya Rai', location: 'Main hall' },
  { subject: 'Slides lag behind the worship leader', slug: 'projection', priority: 'normal', reporter: 'Sarita Gurung' },
  { subject: 'Livestream dropped twice during the sermon', slug: 'livestream', priority: 'urgent', reporter: 'Bikash Tamang', location: 'Media room' },
  { subject: 'Camera battery does not hold charge', slug: 'livestream', priority: 'normal', reporter: 'Deepak Karki' },
  { subject: 'Ladies toilet tap is leaking', slug: 'building', priority: 'normal', reporter: 'Sita Rai', location: 'Ground floor' },
  { subject: 'Front door lock sticks in wet weather', slug: 'building', priority: 'low', reporter: 'Ram Prasad Gurung' },
  { subject: 'Fluorescent tube flickering in the foyer', slug: 'building', priority: 'low', reporter: 'Anjali Shrestha', location: 'Foyer' },
  { subject: 'Wifi drops in the Sunday school rooms', slug: 'it-network', priority: 'high', reporter: 'Maya Rai', location: 'First floor' },
  { subject: 'Office printer keeps jamming', slug: 'it-network', priority: 'normal', reporter: 'Sarita Gurung', location: 'Church office' },
  { subject: 'Need an email account for the new youth leader', slug: 'website-email', priority: 'normal', reporter: 'Pastor Daniel Shrestha' },
  { subject: 'Keyboard sustain pedal is intermittent', slug: 'instruments', priority: 'normal', reporter: 'Prakash Thapa' },
  { subject: 'Guitar amp hums when the lights are on', slug: 'instruments', priority: 'low', reporter: 'Bikash Tamang' },
  { subject: 'Fire extinguisher in the kitchen is past its date', slug: 'safety', priority: 'urgent', reporter: 'Sita Rai', location: 'Kitchen' },
  { subject: 'Church van needs its service booking', slug: 'transport', priority: 'normal', reporter: 'Deepak Karki' },
  { subject: 'Two volunteers double-booked on the same rota slot', slug: 'volunteer-support', priority: 'normal', reporter: 'Sarita Gurung' },
  { subject: 'Reimbursement for the youth camp deposit', slug: 'finance-admin', priority: 'low', reporter: 'Prakash Thapa' },
  { subject: 'Sermon audio missing from last Sunday', slug: 'website-email', priority: 'normal', reporter: 'Maya Rai' },
  { subject: 'Stage monitor cable is frayed', slug: 'sound-audio', priority: 'high', reporter: 'Bikash Tamang', location: 'Main hall stage' },
]

const ARTICLES = [
  { title: 'Resetting the sound desk after a power cut', slug: 'sound-audio', keywords: 'mixer, power, reset, x32', body: 'Hold the reset pin for five seconds, wait for the boot tone, then reload the Sunday scene from the saved scenes list.' },
  { title: 'What to do when the projector shows no signal', slug: 'projection', keywords: 'projector, hdmi, no signal', body: 'Check the HDMI at both ends, switch the projector input to HDMI 1, then restart the presentation laptop. Nine times in ten it is the cable at the laptop end.' },
  { title: 'Starting the livestream from scratch', slug: 'livestream', keywords: 'stream, obs, youtube', body: 'Open the streaming software, confirm the camera preview is live, check the audio meter is moving, then press Go Live. Wait for the platform to show "live" before announcing it.' },
  { title: 'Getting a new volunteer onto the church wifi', slug: 'it-network', keywords: 'wifi, password, guest', body: 'Use the guest network for visitors. The staff network is only for people with a church email account.' },
]

async function main() {
  console.log('\nHelp Desk — seed + integration test')
  console.log(`API: ${API}\n`)

  // -- 1. Categories -------------------------------------------------------
  console.log('1. Categories and SLA targets')
  const cats = await api('GET', '/helpdesk/categories')
  check('categories seeded', cats.length >= 12, `${cats.length}`)
  check('every category has an SLA target',
    cats.every((c) => c.response_hours > 0 && c.resolve_hours > 0))
  check('urgent categories respond faster than admin ones',
    cats.find((c) => c.slug === 'safety').response_hours <
    cats.find((c) => c.slug === 'finance-admin').response_hours)
  const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c]))

  await expectReject('a category with no name is rejected', 400, () =>
    api('POST', '/helpdesk/categories', { name: '  ' })
  )
  await expectReject('a zero-hour SLA is rejected', 400, () =>
    api('POST', '/helpdesk/categories', { name: 'Impossible SLA', response_hours: 0 })
  )

  // -- 2. Raising tickets --------------------------------------------------
  console.log('\n2. Raising tickets')
  const existing = await api('GET', '/helpdesk/tickets?per_page=200')
  const have = new Set(existing.data.map((t) => t.subject))
  // Stagger the ages so the queue looks like a real one: a few raised in the
  // last hour, most over the past fortnight. Without this every ticket is
  // seconds old, no SLA target can have passed, and the breach path is never
  // exercised against real data.
  const raised = {}
  for (let i = 0; i < TICKETS.length; i++) {
    const t = TICKETS[i]
    if (have.has(t.subject)) {
      raised[t.subject] = existing.data.find((x) => x.subject === t.subject)
      continue
    }
    const r = await api('POST', '/helpdesk/tickets', {
      subject: t.subject, body: t.body || '', category_id: bySlug[t.slug]?.id,
      reporter_name: t.reporter, location: t.location || '', priority: t.priority,
      opened_at: hoursAgo(i * 18),
    })
    raised[t.subject] = r
  }
  const all = await api('GET', '/helpdesk/tickets?per_page=200')
  check('all tickets present', all.total >= TICKETS.length, `${all.total}`)

  const first = all.data.find((t) => t.subject === TICKETS[0].subject)
  check('tickets get a quotable code', /^HD-\d{5}$/.test(first.ticket_code), first.ticket_code)
  check('the SLA target comes back with the ticket', first.response_target_hours > 0)
  check('a due date is set from the category target', !!first.due_at)

  // One deliberately neglected ticket, raised a fortnight ago against the
  // tightest SLA in the list and never answered. It is the only thing in the
  // seed that proves the breach path works on real data rather than in a unit
  // test, so it is created once and then left alone by every later step.
  if (!have.has(PROBE)) {
    await api('POST', '/helpdesk/tickets', {
      subject: PROBE, reporter_name: 'Seed Probe', category_id: bySlug.safety.id,
      priority: 'urgent', opened_at: hoursAgo(336),
      body: 'Left open on purpose so the SLA breach path is exercised end to end.',
    })
  }
  const probe = (await api('GET', `/helpdesk/tickets?search=${encodeURIComponent(PROBE)}`)).data[0]
  check('a backdated ticket reports its real age', probe.age_hours >= 336, `${probe.age_hours}h`)
  check('a backdated ticket is already past its deadline',
    new Date(probe.due_at) < new Date(), probe.due_at)
  check('and is flagged as breaching both targets',
    probe.response_breached && probe.resolve_breached)

  await expectReject('a ticket raised in the future is rejected', 400, () =>
    api('POST', '/helpdesk/tickets', {
      subject: 'Time travel', reporter_name: 'X',
      opened_at: isoStamp(new Date(Date.now() + 86400_000)),
    })
  )
  await expectReject('a ticket with no subject is rejected', 400, () =>
    api('POST', '/helpdesk/tickets', { subject: '  ', reporter_name: 'X' })
  )
  await expectReject('a ticket with no reporter is rejected', 400, () =>
    api('POST', '/helpdesk/tickets', { subject: 'Something broke', reporter_name: '' })
  )
  await expectReject('an invented priority is rejected', 400, () =>
    api('POST', '/helpdesk/tickets', { subject: 'X', reporter_name: 'Y', priority: 'catastrophic' })
  )

  // -- 3. Search and filters -----------------------------------------------
  console.log('\n3. Search and filters')
  const wifi = await api('GET', '/helpdesk/tickets?search=wifi')
  check('search finds a ticket by subject', wifi.data.some((t) => /wifi/i.test(t.subject)))
  const urgent = await api('GET', '/helpdesk/tickets?priority=urgent&status=open')
  check('priority filter works', urgent.data.every((t) => t.priority === 'urgent'))
  const unassigned = await api('GET', '/helpdesk/tickets?view=unassigned')
  check('the unassigned queue only holds unassigned open tickets',
    unassigned.data.every((t) => t.assignee_name === '' && !['resolved', 'closed', 'cancelled'].includes(t.status)))

  const evil = await api('GET', `/helpdesk/tickets?search=${encodeURIComponent("'; DROP TABLE helpdesk_tickets; --")}`)
  check('injection through search is inert', evil.total === 0)
  const survived = await api('GET', '/helpdesk/tickets?per_page=1')
  check('the queue survived the injection attempt', survived.total >= TICKETS.length)

  // -- 4. Two volunteers, one ticket ---------------------------------------
  console.log('\n4. Two volunteers, one ticket')
  const contest = await api('POST', '/helpdesk/tickets', {
    subject: `Contested ticket ${Date.now()}`, reporter_name: 'Test Reporter',
    category_id: bySlug['it-network'].id,
  })

  // Fired together, not in sequence: this is the race a plain
  // "set assigned_to" loses without anyone noticing.
  const results = await Promise.allSettled([
    api('POST', `/helpdesk/tickets/${contest.id}/claim`, { assignee_name: TEAM[0] }),
    api('POST', `/helpdesk/tickets/${contest.id}/claim`, { assignee_name: TEAM[1] }),
  ])
  const won = results.filter((r) => r.status === 'fulfilled')
  const lost = results.filter((r) => r.status === 'rejected')
  check('exactly one claimer wins', won.length === 1, `${won.length} succeeded`)
  check('the loser is told who has it, not 500ed', lost[0]?.reason?.status === 409,
    `got ${lost[0]?.reason?.status}`)

  const claimed = await api('GET', `/helpdesk/tickets/${contest.id}`)
  check('the ticket has exactly one owner',
    [TEAM[0], TEAM[1]].includes(claimed.ticket.assignee_name), claimed.ticket.assignee_name)
  check('claiming moves it out of the open queue', claimed.ticket.status === 'in_progress')
  check('the assignment is on the timeline',
    claimed.comments.some((c) => c.event_kind === 'assigned'))

  await expectReject('a routine claim cannot steal a ticket in progress', 409, () =>
    api('POST', `/helpdesk/tickets/${contest.id}/claim`, { assignee_name: TEAM[2] })
  )
  const stolen = await api('POST', `/helpdesk/tickets/${contest.id}/claim`, {
    assignee_name: TEAM[2], force: true,
  })
  check('an explicit reassignment is allowed', stolen.assigned_to === TEAM[2])

  await api('POST', `/helpdesk/tickets/${contest.id}/release`)
  const released = await api('GET', `/helpdesk/tickets/${contest.id}`)
  check('releasing puts it back in the queue',
    released.ticket.assignee_name === '' && released.ticket.status === 'open')
  await expectReject('releasing an unassigned ticket is refused', 409, () =>
    api('POST', `/helpdesk/tickets/${contest.id}/release`)
  )

  // -- 5. First response is written once -----------------------------------
  console.log('\n5. First response time cannot drift')
  const respond = await api('POST', '/helpdesk/tickets', {
    subject: `Response timing ${Date.now()}`, reporter_name: 'Test Reporter',
    category_id: bySlug['building'].id,
  })

  const internal = await api('POST', `/helpdesk/tickets/${respond.id}/comments`, {
    body: 'Checking who is free to look at this.', is_internal: true, author_name: TEAM[0],
  })
  check('an internal note does not count as a response',
    internal.counted_as_first_response === false)
  const stillWaiting = await api('GET', `/helpdesk/tickets/${respond.id}`)
  check('the ticket is still awaiting a first reply',
    stillWaiting.ticket.first_responded_at === null)

  const reply1 = await api('POST', `/helpdesk/tickets/${respond.id}/comments`, {
    body: 'Thanks for reporting it — we will take a look on Tuesday.', author_name: TEAM[0],
  })
  check('the first public reply is the response', reply1.counted_as_first_response === true)
  const afterReply = await api('GET', `/helpdesk/tickets/${respond.id}`)
  const stamp = afterReply.ticket.first_responded_at

  const reply2 = await api('POST', `/helpdesk/tickets/${respond.id}/comments`, {
    body: 'Update: parts ordered.', author_name: TEAM[0],
  })
  check('a later reply does not become the response',
    reply2.counted_as_first_response === false)
  const afterSecond = await api('GET', `/helpdesk/tickets/${respond.id}`)
  check('the recorded response time never moves',
    afterSecond.ticket.first_responded_at === stamp, `${stamp} -> ${afterSecond.ticket.first_responded_at}`)
  check('only real comments are counted', afterSecond.ticket.comment_count === 3,
    `${afterSecond.ticket.comment_count}`)

  await expectReject('an empty comment is rejected', 400, () =>
    api('POST', `/helpdesk/tickets/${respond.id}/comments`, { body: '   ' })
  )

  // -- 6. Resolving --------------------------------------------------------
  console.log('\n6. Resolving')
  await expectReject('resolving with no explanation is refused', 400, () =>
    api('POST', `/helpdesk/tickets/${respond.id}/status`, { status: 'resolved' })
  )
  await expectReject('an invented status is refused', 400, () =>
    api('POST', `/helpdesk/tickets/${respond.id}/status`, { status: 'probably_fine' })
  )

  const resolved = await api('POST', `/helpdesk/tickets/${respond.id}/status`, {
    status: 'resolved', resolution: 'Replaced the washer in the mixer tap.',
  })
  check('a ticket resolves with an explanation', resolved.status === 'resolved')
  const done = await api('GET', `/helpdesk/tickets/${respond.id}`)
  check('the resolution is kept', done.ticket.resolution.includes('washer'))
  check('resolving stamps the time', !!done.ticket.resolved_at)
  check('the status change is on the timeline',
    done.comments.some((c) => c.event_kind === 'status'))

  // -- 7. Reopening --------------------------------------------------------
  console.log('\n7. Reopening')
  const reopened = await api('POST', `/helpdesk/tickets/${respond.id}/status`, {
    status: 'open', note: 'It started dripping again a week later.',
  })
  check('a resolved ticket can be reopened', reopened.reopened === true)
  const back = await api('GET', `/helpdesk/tickets/${respond.id}`)
  check('reopening is counted', back.ticket.reopen_count === 1, `${back.ticket.reopen_count}`)
  check('reopening clears the resolution time', back.ticket.resolved_at === null)
  check('but the response time survives the reopen',
    back.ticket.first_responded_at === stamp)
  check('the note is on the timeline',
    back.comments.some((c) => c.body.includes('dripping again')))

  await api('POST', `/helpdesk/tickets/${respond.id}/status`, {
    status: 'resolved', resolution: 'Replaced the whole tap this time.',
  })

  // -- 8. SLA --------------------------------------------------------------
  console.log('\n8. SLA is derived, never stored')
  const open = await api('GET', '/helpdesk/tickets?status=open&per_page=200')
  check('every open ticket reports an age', open.data.every((t) => t.age_hours >= 0))
  check('an unanswered ticket has no response time',
    open.data.filter((t) => !t.first_responded_at).every((t) => t.response_hours_taken === null))
  // Compared as instants, exactly as the server does. Comparing whole hours
  // here would call a ticket 4h30 past a 4h target "not late", because 4 > 4
  // is false — the same truncation bug this assertion is supposed to catch.
  const past = (t) => {
    const due = new Date(t.opened_at + 'Z').getTime() + t.response_target_hours * 3600_000
    const at = t.first_responded_at ? new Date(t.first_responded_at + 'Z') : new Date()
    return at.getTime() > due
  }
  check('a breach flag is only set on tickets past their target',
    open.data.filter((t) => t.response_breached).every(past),
    open.data.filter((t) => t.response_breached && !past(t)).map((t) => t.ticket_code).join(', '))
  check('and every ticket past its target is flagged',
    open.data.filter(past).every((t) => t.response_breached),
    open.data.filter((t) => past(t) && !t.response_breached).map((t) => t.ticket_code).join(', '))

  const doneList = await api('GET', '/helpdesk/tickets?status=done&per_page=200')
  check('a finished ticket stops ageing',
    doneList.data.every((t) => !t.resolved_at || t.age_hours >= 0))
  check('a cancelled or closed ticket is never marked as breaching response',
    doneList.data.filter((t) => !t.first_responded_at).every((t) => t.response_breached === false))

  const breached = await api('GET', '/helpdesk/tickets?view=breached&per_page=200')
  check('the breached view only holds live tickets',
    breached.data.every((t) => !['resolved', 'closed', 'cancelled'].includes(t.status)))
  check('the aged tickets really are breaching', breached.total >= 1, `${breached.total}`)
  check('everything in the breached view is genuinely past a target',
    breached.data.every((t) => t.response_breached || t.resolve_breached))
  check('nothing raised in the last hour is in it',
    breached.data.every((t) => t.age_hours >= t.response_target_hours
                            || t.age_hours >= t.resolve_target_hours))

  // -- 9. Knowledge base ---------------------------------------------------
  console.log('\n9. Knowledge base')
  const haveArticles = new Set((await api('GET', '/helpdesk/articles')).map((a) => a.title))
  for (const a of ARTICLES) {
    if (haveArticles.has(a.title)) continue
    await api('POST', '/helpdesk/articles', {
      title: a.title, body: a.body, keywords: a.keywords, category_id: bySlug[a.slug]?.id,
    })
  }
  const articles = await api('GET', '/helpdesk/articles')
  check('articles published', articles.length >= ARTICLES.length, `${articles.length}`)
  check('articles get a slug', articles.every((a) => a.slug && !a.slug.includes(' ')))
  const projector = articles.find((a) => a.title.includes('no signal'))
  check('article search works',
    (await api('GET', '/helpdesk/articles?search=hdmi')).some((a) => a.id === projector.id))
  await api('POST', `/helpdesk/articles/${projector.id}/helpful`)
  const voted = await api('GET', '/helpdesk/articles?search=hdmi')
  check('marking an article helpful counts',
    voted.find((a) => a.id === projector.id).helpful_count >= 1)
  await expectReject('a duplicate article title is refused', 409, () =>
    api('POST', '/helpdesk/articles', { title: projector.title })
  )

  // -- 10. Working the queue, so the data looks lived-in -------------------
  console.log('\n10. Working the queue')
  const queue = (await api('GET', '/helpdesk/tickets?view=unassigned&per_page=200')).data
    .filter((t) => t.subject !== PROBE)
  for (let i = 0; i < queue.length; i++) {
    const t = queue[i]
    const agent = TEAM[i % TEAM.length]
    try {
      await api('POST', `/helpdesk/tickets/${t.id}/claim`, { assignee_name: agent })
      // Leave roughly a third untouched so the "awaiting reply" tile is real.
      if (i % 3 !== 0) {
        await api('POST', `/helpdesk/tickets/${t.id}/comments`, {
          body: 'Taking a look at this — will report back.', author_name: agent,
        })
      }
      // And resolve about half, so averages have something to average.
      if (i % 2 === 0) {
        await api('POST', `/helpdesk/tickets/${t.id}/status`, {
          status: 'resolved', resolution: 'Sorted on site.',
        })
      } else if (i % 5 === 0) {
        await api('POST', `/helpdesk/tickets/${t.id}/status`, {
          status: 'waiting', note: 'Waiting on a part to arrive.',
        })
      }
    } catch { /* claimed by a previous run; fine */ }
  }

  // Assert the state, not how much of it this run produced — a second run
  // finds the queue already worked and would otherwise fail for no reason.
  const workedTotal = (await api('GET', '/helpdesk/tickets?per_page=200')).data
    .filter((t) => TEAM.includes(t.assignee_name)).length
  check('the team owns a real load', workedTotal >= 8, `${workedTotal} tickets`)
  check('some are resolved',
    (await api('GET', '/helpdesk/tickets?status=resolved&per_page=1')).total >= 4)

  // -- 11. Dashboard -------------------------------------------------------
  console.log('\n11. Dashboard')
  const dash = await api('GET', '/helpdesk/dashboard')
  check('open count matches the open list',
    dash.open === (await api('GET', '/helpdesk/tickets?status=open&per_page=1')).total,
    `${dash.open}`)
  check('unassigned never exceeds open', dash.unassigned <= dash.open,
    `${dash.unassigned} > ${dash.open}`)
  check('the breach tile matches the breached view',
    dash.breaching === (await api('GET', '/helpdesk/tickets?view=breached&per_page=1')).total,
    `${dash.breaching}`)
  check('awaiting-reply matches its view',
    dash.awaiting_first_reply === (await api('GET', '/helpdesk/tickets?view=awaiting_reply&per_page=1')).total)
  check('agents are listed with their load', dash.agents.length >= 1)
  check('an agent never has more breached than open',
    dash.agents.every((a) => a.breached <= a.open_tickets))
  check('categories charted', dash.by_category.length >= 3)
  check('priorities charted', dash.by_priority.length >= 1)
  check('reopened tickets are surfaced', dash.reopened >= 1, `${dash.reopened}`)
  check('average response time is only over answered tickets',
    dash.avg_response_hours === null || dash.avg_response_hours >= 0)
  check('oldest open list is genuinely open',
    dash.oldest_open.every((t) => !['resolved', 'closed', 'cancelled'].includes(t.status)))
  check('needs-reply list has nobody who has been replied to',
    dash.needs_reply.every((t) => t.first_responded_at === null))

  const hrs = (h) => (h === null || h === undefined ? '—' : `${h}h`)
  console.log('\n--- Help Desk ---')
  console.log(`  Open              ${dash.open} (${dash.unassigned} unassigned)`)
  console.log(`  Urgent open       ${dash.urgent_open}`)
  console.log(`  Breaching SLA     ${dash.breaching}`)
  console.log(`  Awaiting reply    ${dash.awaiting_first_reply}`)
  console.log(`  Resolved (month)  ${dash.resolved_this_month}`)
  console.log(`  Reopened          ${dash.reopened}`)
  console.log(`  Avg first reply   ${hrs(dash.avg_response_hours)}`)
  console.log(`  Avg to resolve    ${hrs(dash.avg_resolve_hours)}`)

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
