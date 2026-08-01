/**
 * Server-rendered JSON-LD.
 *
 * Two rules this file enforces, both learned from the real data:
 *
 * 1. Never emit a value we cannot vouch for. Structured data is what answer
 *    engines quote verbatim, so a wrong field here is repeated as fact by
 *    ChatGPT and Google AI Overviews. Unknown is always better than guessed.
 * 2. Never emit an entity that fails its own type's requirements. A VideoObject
 *    without a media URL, or an Event with an unparseable date, is worse than
 *    no markup: it gets the page flagged as invalid rather than merely thin.
 */

/** Escape `<` so a `</script>` inside admin-entered copy cannot break out. */
export function JsonLd({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

/**
 * A strict ISO date, or null.
 *
 * `new Date('2024-02-30')` does not throw — it rolls over to 1 March, and
 * `new Date('2024-01-35')` becomes 4 February. The seed contains both of those
 * exact values, so a naive conversion would publish a date the page itself
 * never shows. Round-tripping the components catches the rollover.
 */
export function isoDate(raw: unknown): string | null {
  const s = String(raw ?? '').trim().slice(0, 10)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null

  const [, y, mo, d] = m
  const dt = new Date(`${s}T00:00:00Z`)
  if (Number.isNaN(dt.getTime())) return null

  // If the parsed date disagrees with what was written, the input was not a
  // real calendar date and JavaScript quietly moved it.
  const same =
    dt.getUTCFullYear() === Number(y) &&
    dt.getUTCMonth() + 1 === Number(mo) &&
    dt.getUTCDate() === Number(d)
  return same ? s : null
}

/** Collapse HTML/whitespace to one line, capped — descriptions are summaries. */
export function plain(raw: unknown, max = 300): string | undefined {
  const t = String(raw ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!t) return undefined
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

/** Absolute URL, since schema.org consumers do not resolve relative paths. */
export function absolute(origin: string, url: unknown): string | undefined {
  const s = String(url ?? '').trim()
  if (!s) return undefined
  return /^https?:\/\//i.test(s) ? s : `${origin}${s.startsWith('/') ? '' : '/'}${s}`
}
