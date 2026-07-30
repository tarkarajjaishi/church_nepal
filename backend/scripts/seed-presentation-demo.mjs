#!/usr/bin/env node
/**
 * Seed + integration test for the Presentation module.
 *
 * Runs a whole service through the real HTTP API: songs -> slides -> playlist
 * -> go live -> advance -> black -> countdown -> lower third -> stop, checking
 * the live state after each step. If the presenter console would misbehave,
 * this fails first.
 *
 *   node scripts/seed-presentation-demo.mjs
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

async function api(method, route, body, { auth = true } = {}) {
  const res = await fetch(`${API}/api${route}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(auth ? { authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let parsed
  try { parsed = text ? JSON.parse(text) : null } catch { parsed = text }
  if (!res.ok) {
    const e = new Error(`${method} ${route} -> ${res.status} ${JSON.stringify(parsed)?.slice(0, 250)}`)
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

/** Four verses separated by blank lines, so the split is 4 slides exactly. */
const SONGS = [
  {
    title: 'Amazing Grace',
    artist: 'John Newton',
    language: 'English',
    category: 'Hymn',
    song_key: 'G',
    bpm: 72,
    ccli_number: '22025',
    lyrics: [
      'Amazing grace how sweet the sound\nThat saved a wretch like me',
      'I once was lost but now am found\nWas blind but now I see',
      "'Twas grace that taught my heart to fear\nAnd grace my fears relieved",
      'How precious did that grace appear\nThe hour I first believed',
    ].join('\n\n'),
  },
  {
    title: 'कति असल हुनुहुन्छ',
    artist: 'Nepali Worship',
    language: 'Nepali',
    category: 'Worship',
    song_key: 'D',
    bpm: 68,
    // Devanagari round-trips through the API, the database and the renderer;
    // the test asserts it survives rather than assuming UTF-8 is fine.
    lyrics: 'कति असल हुनुहुन्छ प्रभु\nतपाईंको प्रेम अनन्त छ\n\nम गाउँछु तपाईंको महिमा\nसदासर्वदा',
  },
  {
    title: 'How Great Is Our God',
    artist: 'Chris Tomlin',
    language: 'English',
    category: 'Worship',
    song_key: 'C',
    bpm: 78,
    ccli_number: '4348399',
    lyrics:
      'The splendour of the King\nClothed in majesty\n\nHow great is our God\nSing with me how great is our God',
  },
]

async function main() {
  console.log(`\nPresentation module — seed + integration test`)
  console.log(`API: ${API}\n`)

  // 1. Themes seeded by migration 062
  console.log('1. Themes')
  const themes = await api('GET', '/presentation-themes')
  check('a theme exists', themes.length > 0, `${themes.length}`)
  const theme = themes.find((t) => t.is_default) ?? themes[0]
  check('one theme is marked default', !!themes.find((t) => t.is_default))

  // 2. Songs
  console.log('\n2. Song library')
  const existing = await api('GET', '/songs?per_page=200')
  const have = new Set((existing.data ?? []).map((s) => s.title))
  const songs = []
  for (const s of SONGS) {
    if (have.has(s.title)) {
      songs.push((existing.data ?? []).find((x) => x.title === s.title))
    } else {
      songs.push(await api('POST', '/songs', s))
    }
  }
  check('3 songs available', songs.filter(Boolean).length === 3)
  check('song stores its key and BPM', songs[0].song_key === 'G' && songs[0].bpm === 72,
    `${songs[0].song_key}/${songs[0].bpm}`)

  await expectReject('song requires a title', 400, () => api('POST', '/songs', { title: '   ' }))

  const search = await api('GET', '/songs?search=Amazing')
  check('song search finds by title', search.data.some((s) => s.title === 'Amazing Grace'),
    `${search.data.length} results`)

  // 3. Lyrics split into slides
  console.log('\n3. Slide building')
  const preview = await api('GET', `/songs/${songs[0].id}/slide-preview`)
  check('slide preview splits on blank lines', preview.slides.length === 4, `${preview.slides.length} slides`)

  const deck = await api('POST', '/presentations/from-song', {
    song_id: songs[0].id,
    theme_id: theme?.id,
  })
  check('presentation built from song', deck.slides.length === 4, `${deck.slides.length} slides`)
  check('slides are strictly ordered', deck.slides.every((s, i) => i === 0 || s.sort_order > deck.slides[i - 1].sort_order), deck.slides.map((s) => s.sort_order).join(','))
  check('slides carry lyric type', deck.slides.every((s) => s.slide_type === 'lyrics'))
  check('first slide holds the first verse', deck.slides[0].body.includes('Amazing grace'),
    deck.slides[0].body.slice(0, 40))

  // Rebuilding into the same presentation must replace, not duplicate.
  const rebuilt = await api('POST', '/presentations/from-song', {
    song_id: songs[0].id, theme_id: theme?.id, presentation_id: deck.id,
  })
  check('rebuilding replaces rather than appends', rebuilt.slides.length === 4,
    `${rebuilt.slides.length} slides after rebuild`)

  const deck2 = await api('POST', '/presentations/from-song', { song_id: songs[1].id, theme_id: theme?.id })
  const deck3 = await api('POST', '/presentations/from-song', { song_id: songs[2].id, theme_id: theme?.id })
  check('Nepali lyrics survive round-trip', deck2.slides[0].body.includes('प्रभु'),
    deck2.slides[0].body.slice(0, 30))

  // 4. Displays
  console.log('\n4. Displays')
  const existingDisplays = await api('GET', '/displays')
  const want = [
    { name: 'Main Projector', display_kind: 'projector', resolution: '1920x1080' },
    { name: 'Stage Display', display_kind: 'stage', resolution: '1920x1080', shows_notes: true, shows_next_slide: true },
    { name: 'Lobby TV', display_kind: 'lobby', resolution: '1920x1080' },
  ]
  const displays = [...existingDisplays]
  for (const d of want) {
    if (displays.some((x) => x.name === d.name)) continue
    displays.push(await api('POST', '/displays', d))
  }
  check('3+ displays configured', displays.length >= 3, `${displays.length}`)
  check('displays get a slug for their URL', displays.every((d) => !!d.slug))

  // 5. Playlist
  console.log('\n5. Playlist')
  const today = new Date().toISOString().slice(0, 10)
  const playlist = await api('POST', '/playlists', {
    name: `Sunday Service ${today}`,
    service_date: today,
    service_time: '10:30',
    service_name: 'Sunday First Service',
    operator: 'Media Team',
  })
  const order = [
    { title: 'Countdown', item_kind: 'countdown', planned_seconds: 300 },
    { title: 'Welcome', item_kind: 'section', planned_seconds: 120 },
    { title: 'Amazing Grace', item_kind: 'presentation', presentation_id: deck.id, planned_seconds: 240 },
    { title: 'कति असल हुनुहुन्छ', item_kind: 'presentation', presentation_id: deck2.id, planned_seconds: 240 },
    { title: 'Offering', item_kind: 'section', planned_seconds: 180 },
    { title: 'How Great Is Our God', item_kind: 'presentation', presentation_id: deck3.id, planned_seconds: 300 },
    { title: 'Message', item_kind: 'section', planned_seconds: 1800 },
  ]
  for (const it of order) await api('POST', `/playlists/${playlist.id}/items`, it)

  const full = await api('GET', `/playlists/${playlist.id}`)
  check('playlist has 7 items', full.items.length === 7, `${full.items.length}`)
  check('playlist items are strictly ordered', full.items.every((it, i) => i === 0 || it.sort_order > full.items[i - 1].sort_order), full.items.map((i) => i.sort_order).join(','))
  check('planned total is summed server-side', full.planned_total_seconds === 3180,
    `${full.planned_total_seconds}`)
  check('presentation items report a slide count',
    full.items.filter((i) => i.item_kind === 'presentation').every((i) => (i.slide_count ?? 0) > 0))

  // Reorder: move the message to the top and back.
  const ids = full.items.map((i) => i.id)
  const shuffled = [ids[6], ...ids.slice(0, 6)]
  await api('PUT', `/playlists/${playlist.id}/items/reorder`, { ids: shuffled })
  const after = await api('GET', `/playlists/${playlist.id}`)
  check('reorder persists', after.items[0].title === 'Message', after.items[0].title)
  await api('PUT', `/playlists/${playlist.id}/items/reorder`, { ids })

  const dup = await api('POST', `/playlists/${playlist.id}/duplicate`, { name: '' })
  const dupFull = dup
  check('duplicate copies every item', dupFull.items.length === 7, `${dupFull.items.length}`)
  check('duplicate is a distinct playlist', dup.id !== playlist.id)
  await api('DELETE', `/playlists/${dup.id}`)

  // 6. Live control
  console.log('\n6. Live control')
  const songItem = after.items.find((i) => i.presentation_id === deck.id)

  let live = await api('POST', '/presentation/live/go', {
    playlist_id: playlist.id,
    playlist_item_id: songItem.id,
  })
  check('going live sets is_live', live.is_live === true)
  check('live loads the item presentation', live.presentation_id === deck.id)
  check('live starts on slide 0', live.slide_index === 0, `${live.slide_index}`)
  check('current slide is populated', !!live.current_slide)
  check('next slide is populated', !!live.next_slide)
  check('slide total reported', live.slide_total === 4, `${live.slide_total}`)

  const v0 = live.version

  live = await api('POST', '/presentation/live/step/next', {})
  check('next advances one slide', live.slide_index === 1, `${live.slide_index}`)
  check('version increments on change', live.version > v0, `${v0} -> ${live.version}`)

  live = await api('POST', '/presentation/live/step/next', {})
  live = await api('POST', '/presentation/live/step/prev', {})
  check('prev goes back one slide', live.slide_index === 1, `${live.slide_index}`)

  live = await api('POST', '/presentation/live/goto', { slide_index: 3 })
  check('goto jumps to an index', live.slide_index === 3, `${live.slide_index}`)
  check('last slide has no next', live.next_slide === null)

  // Advancing past the end must not crash or wrap around to the start.
  live = await api('POST', '/presentation/live/step/next', {})
  check('next at the end stays put rather than wrapping', live.slide_index === 3,
    `${live.slide_index}`)

  live = await api('POST', '/presentation/live/goto', { slide_index: 0 })
  live = await api('POST', '/presentation/live/step/prev', {})
  check('prev at the start stays put', live.slide_index === 0, `${live.slide_index}`)

  // 7. Screen modes
  console.log('\n7. Screen modes')
  for (const mode of ['black', 'logo', 'blank', 'freeze', 'normal']) {
    live = await api('POST', '/presentation/live/screen', { mode })
    check(`screen mode ${mode}`, live.screen_mode === mode, live.screen_mode)
  }
  await expectReject('unknown screen mode rejected', 400, () =>
    api('POST', '/presentation/live/screen', { mode: 'disco' })
  )

  // 8. Countdown
  console.log('\n8. Countdown')
  live = await api('POST', '/presentation/live/countdown', { seconds: 300, message: 'Service starts in' })
  check('countdown sets a target', !!live.countdown_target)
  check('countdown carries the message', live.countdown_message === 'Service starts in')

  live = await api('POST', '/presentation/live/countdown/toggle', {})
  check('toggle pauses the countdown', live.countdown_paused_seconds != null,
    `${live.countdown_paused_seconds}`)
  live = await api('POST', '/presentation/live/countdown/toggle', {})
  check('toggle resumes the countdown', live.countdown_paused_seconds == null)

  live = await api('POST', '/presentation/live/countdown', {})
  check('empty countdown clears it', !live.countdown_target)

  // 9. Lower third
  console.log('\n9. Lower third')
  live = await api('POST', '/presentation/live/lower-third', {
    title: 'Pastor Daniel Shrestha', subtitle: 'John 3:16', visible: true,
  })
  check('lower third shows', live.lower_third_visible === true)
  check('lower third keeps its title', live.lower_third_title === 'Pastor Daniel Shrestha')
  live = await api('POST', '/presentation/live/lower-third', { visible: false })
  check('lower third hides', live.lower_third_visible === false)
  check('hiding keeps the text for reuse', live.lower_third_title === 'Pastor Daniel Shrestha')

  // 10. The public watch endpoint, which every display depends on
  console.log('\n10. Display watch')
  const pub = await fetch(`${API}/api/presentation/live/watch?version=0&timeout_ms=1000`)
  check('watch is reachable without auth', pub.status === 200, `HTTP ${pub.status}`)
  const pubFrame = await pub.json()
  check('watch returns a full frame', 'version' in pubFrame && 'slide_total' in pubFrame)

  // Holding the current version must block until the timeout rather than
  // returning immediately — that is what makes long-polling cheap.
  const t0 = Date.now()
  const held = await fetch(
    `${API}/api/presentation/live/watch?version=${pubFrame.version}&timeout_ms=1500`
  )
  const heldMs = Date.now() - t0
  check('watch blocks while nothing changes', held.status === 200 && heldMs >= 1200,
    `returned after ${heldMs}ms`)

  // A stale version must return at once.
  const t1 = Date.now()
  const stale = await fetch(`${API}/api/presentation/live/watch?version=0&timeout_ms=5000`)
  const staleMs = Date.now() - t1
  check('watch returns immediately on a stale version', stale.status === 200 && staleMs < 1000,
    `returned after ${staleMs}ms`)

  // The heartbeat is what the Displays page reports as "connection".
  const slug = displays[0].slug
  await fetch(`${API}/api/presentation/live/watch?version=0&display=${slug}&timeout_ms=500`)
  const statuses = await api('GET', '/displays')
  const seen = statuses.find((d) => d.slug === slug)
  check('polling stamps the display heartbeat', seen?.connection === 'online',
    `connection=${seen?.connection}`)

  // 11. Stop
  console.log('\n11. Stop')
  live = await api('POST', '/presentation/live/stop', {})
  check('stop clears is_live', live.is_live === false)
  check('stop blanks the screen rather than leaving a slide up',
    live.screen_mode !== 'normal' || live.current_slide === null,
    `mode=${live.screen_mode}`)

  // 12. Dashboard
  console.log('\n12. Dashboard')
  const dash = await api('GET', '/presentation/dashboard')
  check('dashboard responds', !!dash)

  console.log('\n--- Seeded ---')
  const finalSongs = await api('GET', '/songs?per_page=1')
  const finalDecks = await api('GET', '/presentations')
  const finalPlaylists = await api('GET', '/playlists')
  const finalDisplays = await api('GET', '/displays')
  console.log(`  Songs          ${finalSongs.total}`)
  console.log(`  Presentations  ${finalDecks.length}`)
  console.log(`  Playlists      ${finalPlaylists.length}`)
  console.log(`  Displays       ${finalDisplays.length}`)
  console.log(`  Display URLs:`)
  finalDisplays.forEach((d) => console.log(`    /display/${d.slug}  (${d.name})`))

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
