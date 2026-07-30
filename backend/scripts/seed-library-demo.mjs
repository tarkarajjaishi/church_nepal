#!/usr/bin/env node
/**
 * Seed + integration test for the Church Library module.
 *
 * Catalogues a realistic church library, then goes after the ways a lending
 * system quietly loses books: two people taking the last copy at the same
 * moment, a borrower walking past their limit one title at a time, renewing
 * forever while someone waits, and fees drifting after the rate changes.
 *
 *   node scripts/seed-library-demo.mjs
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
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d) }
const daysAhead = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d) }

// A plausible small-church library: doctrine, biography, Nepali-language
// titles, a couple of reference works nobody takes home, and some digital.
const CATALOGUE = [
  { title: 'Mere Christianity', authors: ['C. S. Lewis'], slug: 'theology', isbn: '9780060652920', publisher: 'HarperOne', year: 1952, pages: 227, copies: 3, shelf: 'A-1' },
  { title: 'The Pursuit of God', authors: ['A. W. Tozer'], slug: 'devotional', isbn: '9781600661075', publisher: 'Christian Publications', year: 1948, pages: 128, copies: 2, shelf: 'A-2' },
  { title: 'Knowing God', authors: ['J. I. Packer'], slug: 'theology', isbn: '9780830816507', publisher: 'IVP', year: 1973, pages: 286, copies: 2, shelf: 'A-1' },
  { title: 'The Cost of Discipleship', authors: ['Dietrich Bonhoeffer'], slug: 'discipleship', isbn: '9780684815008', publisher: 'Touchstone', year: 1937, pages: 316, copies: 1, shelf: 'A-3' },
  { title: 'Shadow of the Almighty', authors: ['Elisabeth Elliot'], slug: 'biography', isbn: '9780060622138', publisher: 'HarperOne', year: 1958, pages: 256, copies: 1, shelf: 'B-1' },
  { title: 'Hudson Taylor and the China Inland Mission', authors: ['Howard Taylor', 'Geraldine Taylor'], slug: 'missions', isbn: '9780875087948', publisher: 'OMF', year: 1918, pages: 640, copies: 2, shelf: 'B-2' },
  { title: 'The Purpose Driven Life', authors: ['Rick Warren'], slug: 'christian-living', isbn: '9780310205715', publisher: 'Zondervan', year: 2002, pages: 334, copies: 4, shelf: 'C-1' },
  { title: 'Nepali Bible Commentary — Gospels', authors: ['Bishnu Adhikari'], slug: 'bible-study', publisher: 'Nepal Bible Society', year: 2015, pages: 512, copies: 2, shelf: 'D-1', language: 'Nepali' },
  { title: 'परमेश्वरको वचन अध्ययन', authors: ['Ram Prasad Gurung'], slug: 'bible-study', publisher: 'Ekta Books', year: 2018, pages: 240, copies: 3, shelf: 'D-2', language: 'Nepali' },
  { title: 'ख्रीष्टियन जीवनको यात्रा', authors: ['Sita Rai'], slug: 'christian-living', publisher: 'Ekta Books', year: 2020, pages: 180, copies: 2, shelf: 'D-2', language: 'Nepali' },
  { title: 'Strong\'s Exhaustive Concordance', authors: ['James Strong'], slug: 'reference', isbn: '9781598563788', publisher: 'Hendrickson', year: 1890, pages: 1680, copies: 1, shelf: 'REF' },
  { title: 'The Bible Knowledge Commentary', authors: ['John Walvoord', 'Roy Zuck'], slug: 'reference', isbn: '9780882078120', publisher: 'David C. Cook', year: 1983, pages: 991, copies: 1, shelf: 'REF' },
  { title: 'Sunday School Teacher\'s Handbook', authors: ['Grace Church Education Team'], slug: 'childrens', publisher: 'In-house', year: 2022, pages: 96, copies: 5, shelf: 'E-1' },
  { title: 'Marriage on the Rock', authors: ['Jimmy Evans'], slug: 'marriage-family', isbn: '9780830772841', publisher: 'Gospel Light', year: 1994, pages: 288, copies: 2, shelf: 'F-1' },
  { title: 'Youth Ministry That Lasts', authors: ['Prakash Thapa'], slug: 'youth', publisher: 'In-house', year: 2021, pages: 140, copies: 2, shelf: 'F-2' },
  { title: 'The Hiding Place', authors: ['Corrie ten Boom'], slug: 'biography', isbn: '9780800794057', publisher: 'Chosen Books', year: 1971, pages: 272, copies: 2, shelf: 'B-1' },
  { title: 'Worship Matters', authors: ['Bob Kauflin'], slug: 'worship', isbn: '9781581348248', publisher: 'Crossway', year: 2008, pages: 304, copies: 1, shelf: 'G-1' },
  { title: 'Spiritual Leadership', authors: ['J. Oswald Sanders'], slug: 'leadership', isbn: '9780802482327', publisher: 'Moody', year: 1967, pages: 240, copies: 2, shelf: 'G-2' },
  { title: 'Church History in Plain Language', authors: ['Bruce Shelley'], slug: 'church-history', isbn: '9780718025533', publisher: 'Thomas Nelson', year: 1982, pages: 560, copies: 1, shelf: 'H-1' },
  { title: 'Prayer: Experiencing Awe and Intimacy with God', authors: ['Timothy Keller'], slug: 'prayer', isbn: '9781594634512', publisher: 'Penguin', year: 2014, pages: 336, copies: 2, shelf: 'A-2' },
  // Digital material has no copies and is never lent — it is linked, not borrowed.
  { title: 'Grace Church Sermon Archive 2020–2025', authors: ['Pastor Daniel Shrestha'], slug: 'audio-video', kind: 'audio', digital_url: 'https://gracechurch.np/sermons', copies: 0 },
  { title: 'Discipleship Course Workbook (PDF)', authors: ['Grace Church Education Team'], slug: 'discipleship', kind: 'ebook', digital_url: 'https://gracechurch.np/files/discipleship.pdf', copies: 0 },
]

// Regular borrowers, so the borrower list and the fee ledger have real shape.
const READERS = [
  { name: 'Anjali Shrestha', contact: '9841000111' },
  { name: 'Bikash Tamang', contact: '9841000222' },
  { name: 'Sarita Gurung', contact: '9841000333' },
  { name: 'Prakash Thapa', contact: '9841000444' },
  { name: 'Maya Rai', contact: '9841000555' },
  { name: 'Deepak Karki', contact: '9841000666' },
]

async function main() {
  console.log('\nChurch Library — seed + integration test')
  console.log(`API: ${API}\n`)

  // -- 1. Reference data ---------------------------------------------------
  console.log('1. Categories and settings')
  const cats = await api('GET', '/library/categories')
  check('categories seeded', cats.length >= 16, `${cats.length}`)
  check('categories carry a colour for the dashboard', cats.every((c) => !!c.color))
  const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c]))
  check('theology category present', !!bySlug.theology)

  // Fees are set to a real rate so the accrual path is actually exercised.
  // A church that charges nothing is the default; this seed opts in.
  await api('PUT', '/library/settings', {
    loan_days: 14, max_renewals: 2, renewal_days: 14,
    daily_fee: rupees(5), max_fee: rupees(200), max_loans_per_person: 3, hold_days: 3,
  })
  const settings = await api('GET', '/library/settings')
  check('settings persist', settings.loan_days === 14 && settings.daily_fee === 500)
  await expectReject('nonsense loan settings rejected', 400, () =>
    api('PUT', '/library/settings', { loan_days: 0 })
  )

  // -- 2. Catalogue --------------------------------------------------------
  console.log('\n2. Catalogue')
  const existing = await api('GET', '/library/books?per_page=200')
  const have = new Set(existing.data.map((b) => b.title))
  for (const b of CATALOGUE) {
    if (have.has(b.title)) continue
    await api('POST', '/library/books', {
      title: b.title, authors: b.authors, isbn: b.isbn || '',
      publisher: b.publisher || '', publication_year: b.year, pages: b.pages,
      category_id: bySlug[b.slug]?.id, language: b.language || 'English',
      material_kind: b.kind || 'book', digital_url: b.digital_url || '',
      copies: b.copies, shelf: b.shelf || '',
    })
  }
  const books = await api('GET', '/library/books?per_page=200')
  check('whole catalogue present', books.data.length >= CATALOGUE.length, `${books.data.length}`)

  const byTitle = Object.fromEntries(books.data.map((b) => [b.title, b]))
  const mere = byTitle['Mere Christianity']
  check('authors created on demand', mere.authors.includes('C. S. Lewis'))
  check('multi-author book keeps both names',
    byTitle['Hudson Taylor and the China Inland Mission'].authors.length === 2)
  check('copies created with the book', mere.total_copies === 3, `${mere.total_copies}`)
  check('a fresh book is fully available',
    mere.available_copies === mere.total_copies)
  check('digital material has no physical copies',
    byTitle['Grace Church Sermon Archive 2020–2025'].total_copies === 0)

  const authors = await api('GET', '/library/authors')
  check('author list counts their books', authors.find((a) => a.name === 'C. S. Lewis')?.book_count >= 1)

  await expectReject('duplicate ISBN rejected', 409, () =>
    api('POST', '/library/books', { title: 'Mere Christianity (dupe)', isbn: '9780060652920' })
  )
  await expectReject('a book with no title is rejected', 400, () =>
    api('POST', '/library/books', { title: '   ' })
  )
  await expectReject('digital material cannot grow physical copies', 400, () =>
    api('POST', `/library/books/${byTitle['Discipleship Course Workbook (PDF)'].id}/copies`, { count: 2 })
  )

  // -- 3. Search -----------------------------------------------------------
  console.log('\n3. Search and filters')
  const byAuthor = await api('GET', '/library/books?search=Tozer')
  check('search finds a book by its author', byAuthor.data.some((b) => b.title === 'The Pursuit of God'))
  const nepali = await api('GET', '/library/books?language=Nepali')
  check('language filter works', nepali.data.length >= 3 && nepali.data.every((b) => b.language === 'Nepali'))
  const digital = await api('GET', '/library/books?availability=digital')
  check('digital filter excludes physical books',
    digital.data.length >= 2 && digital.data.every((b) => b.material_kind !== 'book'))

  // The one that matters: a hostile string must be data, never SQL.
  const evil = await api('GET', `/library/books?search=${encodeURIComponent("'; DROP TABLE library_books; --")}`)
  check('injection through search is inert', evil.data.length === 0)
  const stillThere = await api('GET', '/library/books?per_page=1')
  check('catalogue survived the injection attempt', stillThere.total >= CATALOGUE.length)

  // -- 4. Lending ----------------------------------------------------------
  console.log('\n4. Lending')
  const openLoans = await api('GET', '/library/loans?status=open')
  const alreadyLent = new Set(openLoans.map((l) => l.copy_id))

  // Clear the decks so this script is re-runnable: return everything out.
  for (const l of openLoans) {
    await api('POST', `/library/loans/${l.id}/return`, { waive_fee: true })
  }
  for (const h of await api('GET', '/library/holds')) {
    await api('DELETE', `/library/holds/${h.id}`)
  }
  if (alreadyLent.size) console.log(`  (returned ${alreadyLent.size} loan(s) from a previous run)`)

  // Mend anything a previous run damaged, or the shelf shrinks every time.
  let mended = 0
  for (const b of (await api('GET', '/library/books?per_page=200')).data) {
    if (b.out_of_circulation === 0) continue
    const d = await api('GET', `/library/books/${b.id}`)
    for (const c of d.copies.filter((c) => c.status !== 'in_circulation')) {
      await api('PUT', `/library/copies/${c.id}`, { status: 'in_circulation', condition: 'good' })
      mended++
    }
  }
  if (mended) console.log(`  (returned ${mended} copy/copies to circulation)`)

  const purpose = byTitle['The Purpose Driven Life']
  // Read availability now, not from the catalogue snapshot taken before the
  // cleanup above — otherwise the second run compares against a stale number.
  const before = (await api('GET', `/library/books/${purpose.id}`)).book
  const loan1 = await api('POST', '/library/loans', {
    book_id: purpose.id, borrower_name: READERS[0].name, borrower_contact: READERS[0].contact,
  })
  check('a book can be borrowed', !!loan1.loan_id)
  check('due date defaults to the loan period',
    loan1.due_on === daysAhead(14), `${loan1.due_on} vs ${daysAhead(14)}`)

  const afterLoan = await api('GET', `/library/books/${purpose.id}`)
  check('availability drops by one', afterLoan.book.available_copies === before.available_copies - 1,
    `${afterLoan.book.available_copies} (was ${before.available_copies})`)
  check('the copy shows who has it',
    afterLoan.copies.some((c) => c.borrower === READERS[0].name))

  // -- 5. The last copy ----------------------------------------------------
  console.log('\n5. Two people, one last copy')
  const solo = byTitle['The Cost of Discipleship'] // exactly one copy
  const soloDetail = await api('GET', `/library/books/${solo.id}`)
  const soloCopy = soloDetail.copies[0].id

  // Fired together, not in sequence: this is the race a stored
  // available_copies counter loses.
  const results = await Promise.allSettled([
    api('POST', '/library/loans', { copy_id: soloCopy, borrower_name: READERS[1].name }),
    api('POST', '/library/loans', { copy_id: soloCopy, borrower_name: READERS[2].name }),
  ])
  const won = results.filter((r) => r.status === 'fulfilled')
  const lost = results.filter((r) => r.status === 'rejected')
  check('exactly one simultaneous borrower wins', won.length === 1, `${won.length} succeeded`)
  check('the loser is told why, not 500ed', lost[0]?.reason?.status === 409,
    `got ${lost[0]?.reason?.status}`)

  const soloAfter = await api('GET', `/library/books/${solo.id}`)
  check('the last copy is now unavailable', soloAfter.book.available_copies === 0)
  check('only one open loan exists for it',
    soloAfter.loans.filter((l) => !l.returned_on).length === 1)

  await expectReject('borrowing a title with nothing on the shelf is refused', 409, () =>
    api('POST', '/library/loans', { book_id: solo.id, borrower_name: READERS[3].name })
  )

  // -- 6. Holds ------------------------------------------------------------
  console.log('\n6. Holds queue')
  await expectReject('no hold when a copy is on the shelf', 400, () =>
    api('POST', `/library/books/${purpose.id}/hold`, { requester_name: READERS[3].name })
  )

  await api('POST', `/library/books/${solo.id}/hold`, {
    requester_name: READERS[3].name, requester_contact: READERS[3].contact,
  })
  await api('POST', `/library/books/${solo.id}/hold`, {
    requester_name: READERS[4].name, requester_contact: READERS[4].contact,
  })
  const holds = await api('GET', '/library/holds')
  const queue = holds.filter((h) => h.book_id === solo.id)
  check('two people are queued', queue.length === 2, `${queue.length}`)
  check('the queue is ordered first-come',
    queue.find((h) => h.requester_name === READERS[3].name)?.queue_position === 1)
  await expectReject('the same person cannot queue twice', 409, () =>
    api('POST', `/library/books/${solo.id}/hold`, { requester_name: READERS[3].name })
  )

  const winnerLoan = won[0].value
  await expectReject('renewal is refused while someone waits', 409, () =>
    api('POST', `/library/loans/${winnerLoan.loan_id}/renew`)
  )

  const returned = await api('POST', `/library/loans/${winnerLoan.loan_id}/return`, {})
  check('returning notifies the next in the queue', returned.hold_notified === true)
  const afterReturn = await api('GET', '/library/holds')
  check('the first in the queue is marked ready',
    afterReturn.find((h) => h.book_id === solo.id && h.requester_name === READERS[3].name)?.status === 'ready')

  // Taking the book you queued for closes your hold.
  await api('POST', '/library/loans', { book_id: solo.id, borrower_name: READERS[3].name })
  const afterPickup = await api('GET', '/library/holds')
  check('collecting the book clears your hold',
    !afterPickup.some((h) => h.book_id === solo.id && h.requester_name === READERS[3].name))

  // -- 7. Renewals ---------------------------------------------------------
  console.log('\n7. Renewals')
  const know = byTitle['Knowing God']
  const renewLoan = await api('POST', '/library/loans', {
    book_id: know.id, borrower_name: READERS[5].name, borrower_contact: READERS[5].contact,
  })
  const r1 = await api('POST', `/library/loans/${renewLoan.loan_id}/renew`)
  check('first renewal extends the due date', r1.due_on === daysAhead(28), r1.due_on)
  const r2 = await api('POST', `/library/loans/${renewLoan.loan_id}/renew`)
  check('second renewal allowed', r2.renewals === 2)
  await expectReject('third renewal hits the limit', 409, () =>
    api('POST', `/library/loans/${renewLoan.loan_id}/renew`)
  )

  // -- 8. Borrower limit ---------------------------------------------------
  console.log('\n8. Borrower limit')
  const limitReader = 'Test Overborrower'
  const spare = books.data.filter((b) => b.material_kind === 'book' && b.available_copies > 0).slice(0, 4)
  const taken = []
  for (const b of spare) {
    try {
      taken.push(await api('POST', '/library/loans', { book_id: b.id, borrower_name: limitReader }))
    } catch (e) {
      check('the fourth loan is refused, not silently allowed', e.status === 409 && taken.length === 3,
        `${taken.length} loans out, status ${e.status}`)
      break
    }
  }
  check('the limit is exactly three', taken.length === 3, `${taken.length}`)
  for (const l of taken) await api('POST', `/library/loans/${l.loan_id}/return`, { waive_fee: true })

  // -- 9. Overdue and fees -------------------------------------------------
  console.log('\n9. Overdue and fees')
  const hiding = byTitle['The Hiding Place']
  const late = await api('POST', '/library/loans', {
    book_id: hiding.id, borrower_name: READERS[2].name, borrower_contact: READERS[2].contact,
    borrowed_on: daysAgo(40), due_on: daysAgo(26),
  })
  check('a backdated loan can be recorded', !!late.loan_id)

  const overdueList = await api('GET', '/library/loans?status=overdue')
  const lateLoan = overdueList.find((l) => l.id === late.loan_id)
  check('the overdue loan is listed as overdue', !!lateLoan)
  check('days overdue is counted', lateLoan.days_overdue === 26, `${lateLoan?.days_overdue}`)
  check('the accruing fee is capped at the maximum',
    lateLoan.fee_accruing === rupees(130), `Rs ${lateLoan?.fee_accruing / 100}`)
  check('the accruing fee is not written to the row', lateLoan.fee_assessed === 0)

  const settled = await api('POST', `/library/loans/${late.loan_id}/return`, {
    fee_paid: rupees(130), condition_in: 'fair',
  })
  check('the fee is charged on return', settled.fee_assessed === rupees(130))
  check('the fee is recorded as paid', settled.fee_paid === rupees(130))

  // Changing the rate afterwards must not move a debt already settled.
  await api('PUT', '/library/settings', { daily_fee: rupees(50) })
  const history = await api('GET', `/library/books/${hiding.id}`)
  const settledLoan = history.loans.find((l) => l.id === late.loan_id)
  check('a settled fee does not drift when the rate changes',
    settledLoan.fee_assessed === rupees(130), `Rs ${settledLoan?.fee_assessed / 100}`)
  await api('PUT', '/library/settings', { daily_fee: rupees(5) })

  // A second overdue loan, left open, so the dashboard has something to show.
  const nepaliBook = byTitle['परमेश्वरको वचन अध्ययन']
  const stillOut = await api('POST', '/library/loans', {
    book_id: nepaliBook.id, borrower_name: READERS[4].name, borrower_contact: READERS[4].contact,
    borrowed_on: daysAgo(21), due_on: daysAgo(7),
  })
  const waived = await api('POST', '/library/loans', {
    book_id: byTitle['Worship Matters'].id, borrower_name: READERS[0].name,
    borrowed_on: daysAgo(30), due_on: daysAgo(16),
  })
  const graced = await api('POST', `/library/loans/${waived.loan_id}/return`, { waive_fee: true })
  check('a waived fee is zero, not an unpaid debt',
    graced.fee_assessed === 0 && graced.fee_paid === 0)

  // -- 10. Condition -------------------------------------------------------
  console.log('\n10. Condition')
  const damagedTarget = byTitle['Spiritual Leadership']
  const dmg = await api('POST', '/library/loans', {
    book_id: damagedTarget.id, borrower_name: READERS[1].name,
  })
  await api('POST', `/library/loans/${dmg.loan_id}/return`, { condition_in: 'damaged' })
  const dmgDetail = await api('GET', `/library/books/${damagedTarget.id}`)
  const dmgCopy = dmgDetail.copies.find((c) => c.condition === 'damaged')
  check('a damaged return marks the copy damaged', !!dmgCopy)
  check('a damaged copy leaves circulation', dmgCopy?.status === 'damaged')
  check('and stops counting as available',
    dmgDetail.book.available_copies === dmgDetail.copies.filter(
      (c) => c.status === 'in_circulation' && !c.borrower).length)
  await expectReject('a damaged copy cannot be lent', 400, () =>
    api('POST', '/library/loans', { copy_id: dmgCopy.id, borrower_name: READERS[5].name })
  )

  await expectReject('returning an already-returned loan is refused', 409, () =>
    api('POST', `/library/loans/${dmg.loan_id}/return`, {})
  )

  // Mend it, and it goes back on the shelf.
  await api('PUT', `/library/copies/${dmgCopy.id}`, { status: 'in_circulation', condition: 'fair' })
  const mendedDetail = await api('GET', `/library/books/${damagedTarget.id}`)
  check('a repaired copy returns to circulation',
    mendedDetail.copies.find((c) => c.id === dmgCopy.id)?.status === 'in_circulation')
  check('and counts as available again',
    mendedDetail.book.available_copies > dmgDetail.book.available_copies)

  // -- 11. Everyday circulation, so the data looks lived-in ----------------
  console.log('\n11. Circulation history')
  let lent = 0
  const lendable = books.data.filter((b) => b.material_kind === 'book')
  for (let i = 0; i < lendable.length; i++) {
    const b = lendable[i]
    const reader = READERS[i % READERS.length]
    const out = 30 + i * 3
    try {
      const l = await api('POST', '/library/loans', {
        book_id: b.id, borrower_name: reader.name, borrower_contact: reader.contact,
        borrowed_on: daysAgo(out), due_on: daysAgo(out - 14),
      })
      await api('POST', `/library/loans/${l.id ?? l.loan_id}/return`, { waive_fee: true })
      lent++
    } catch { /* no free copy right now; fine */ }
  }
  check('history recorded for most of the shelf', lent >= 10, `${lent} loans`)

  // -- 12. Borrowers and dashboard -----------------------------------------
  console.log('\n12. Borrowers and dashboard')
  const borrowers = await api('GET', '/library/borrowers')
  check('borrowers are listed', borrowers.length >= READERS.length, `${borrowers.length}`)
  const sarita = borrowers.find((b) => b.name === READERS[2].name)
  check('a borrower shows their history', sarita?.total_loans >= 1)
  check('outstanding fees never go negative', borrowers.every((b) => b.fees_outstanding >= 0))

  const dash = await api('GET', '/library/dashboard')
  check('dashboard counts titles', dash.total_titles >= CATALOGUE.length, `${dash.total_titles}`)
  check('available + on loan never exceeds total copies',
    dash.available + dash.on_loan <= dash.total_copies,
    `${dash.available} + ${dash.on_loan} > ${dash.total_copies}`)
  check('dashboard sees the open overdue loan', dash.overdue >= 1, `${dash.overdue}`)
  check('overdue list carries the accruing fee',
    dash.overdue_loans.every((l) => l.fee_accruing >= 0 && l.days_overdue > 0))
  check('the open overdue loan is in the list',
    dash.overdue_loans.some((l) => l.id === stillOut.loan_id))
  check('categories charted', dash.by_category.length >= 5, `${dash.by_category.length}`)
  check('most borrowed ranked', dash.most_borrowed.length >= 1)
  check('digital counted separately', dash.digital_titles >= 2)

  // The whole point of the module, asserted directly against the shelf.
  const all = await api('GET', '/library/books?per_page=200')
  const bad = all.data.filter((b) => b.available_copies + b.on_loan > b.total_copies)
  check('no title reports more books than it owns', bad.length === 0,
    bad.map((b) => b.title).join(', '))

  const fmt = (p) => `Rs ${(p / 100).toLocaleString('en-IN')}`
  console.log('\n--- Library ---')
  console.log(`  Titles            ${dash.total_titles} (${dash.digital_titles} digital)`)
  console.log(`  Copies            ${dash.total_copies}`)
  console.log(`  On loan           ${dash.on_loan}`)
  console.log(`  Available         ${dash.available}`)
  console.log(`  Overdue           ${dash.overdue}`)
  console.log(`  Holds waiting     ${dash.holds_waiting}`)
  console.log(`  Fees outstanding  ${fmt(dash.fees_outstanding)}`)
  console.log(`  Loans this month  ${dash.loans_this_month}`)

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
