import { fetchTenant, tenantSiteOrigin } from '@/lib/serverApi'

/**
 * llms.txt — a plain-text map of this church for AI crawlers.
 *
 * The llmstxt.org convention: a title, a one-line summary, then curated links
 * with short descriptions. An LLM answering "what time is the service at X
 * church?" should be able to resolve it from this file alone, without parsing
 * a React app.
 *
 * Built per tenant from the request Host, like robots.ts and sitemap.ts. On a
 * multi-tenant deployment a single generated file would describe one church to
 * every church's crawler — the same defect those two routes already had.
 *
 * Every collection degrades independently: if the sermons API is down, the
 * services and events sections still render. A partial map is useful; a 500 is
 * not, and an AI crawler that gets a 500 may not return for days.
 */

export const dynamic = 'force-dynamic'

interface Block { sectionKey?: string; section_key?: string; title?: string | null; subtitle?: string | null; body?: string | null }
interface ServiceTime { name?: string; day?: string; time?: string; enabled?: boolean | null }
interface Sermon { id: string; title?: string; speaker?: string; date?: string; series?: string; topic?: string }
interface EventItem { id: string; title?: string; display_date?: string; date?: string; location?: string }
interface Ministry { id: string; name?: string; description?: string; enabled?: boolean | null }

/** Some list endpoints paginate and some do not. */
function asList<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[]
  const d = (v as { data?: unknown } | null)?.data
  return Array.isArray(d) ? (d as T[]) : []
}

/** Collapse to a single line — newlines and markdown would break the format. */
function line(s: unknown, max = 160): string {
  const t = String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

export async function GET() {
  const [origin, blocksRaw, servicesRaw, sermonsRaw, eventsRaw, ministriesRaw] =
    await Promise.all([
      tenantSiteOrigin(),
      fetchTenant<unknown>('/api/content-blocks/enabled'),
      fetchTenant<unknown>('/api/service-times'),
      fetchTenant<unknown>('/api/sermons'),
      fetchTenant<unknown>('/api/events'),
      fetchTenant<unknown>('/api/ministries'),
    ])

  const blocks = asList<Block>(blocksRaw)
  const brand = blocks.find((b) => (b.sectionKey ?? b.section_key) === 'site_brand')
  const name = line(brand?.title) || 'Church'
  const slogan = line(brand?.subtitle)

  const services = asList<ServiceTime>(servicesRaw).filter((s) => s.enabled !== false)
  const sermons = asList<Sermon>(sermonsRaw).slice(0, 15)
  const events = asList<EventItem>(eventsRaw).slice(0, 10)
  const ministries = asList<Ministry>(ministriesRaw).filter((m) => m.enabled !== false).slice(0, 12)

  const out: string[] = []
  out.push(`# ${name}`, '')
  if (slogan) out.push(`> ${slogan}`, '')

  // Service times first: this is the single most asked question about a church,
  // and the answer belongs in the file rather than behind a link.
  if (services.length) {
    out.push('## Service times', '')
    for (const s of services) {
      const when = [line(s.day), line(s.time)].filter(Boolean).join(' ')
      out.push(`- ${line(s.name) || 'Service'}${when ? ` — ${when}` : ''}`)
    }
    out.push('')
  }

  out.push('## Main pages', '')
  out.push(`- [Home](${origin}/): overview of ${name}`)
  out.push(`- [About](${origin}/about): who we are and what we believe`)
  out.push(`- [Visit](${origin}/visit): what to expect on your first visit`)
  out.push(`- [Sermons](${origin}/sermons): past messages, audio and video`)
  out.push(`- [Events](${origin}/events): upcoming gatherings`)
  out.push(`- [Ministries](${origin}/ministries): groups and areas of service`)
  out.push(`- [Give](${origin}/give): how to support the church`)
  out.push(`- [Contact](${origin}/contact): how to reach us`)
  out.push(`- [Bible](${origin}/bible): the Nepali NNRV Bible, readable online`)
  out.push('')

  if (ministries.length) {
    out.push('## Ministries', '')
    for (const m of ministries) {
      const d = line(m.description, 110)
      out.push(`- [${line(m.name)}](${origin}/ministries/${m.id})${d ? `: ${d}` : ''}`)
    }
    out.push('')
  }

  if (sermons.length) {
    out.push('## Recent sermons', '')
    for (const s of sermons) {
      const meta = [line(s.speaker), line(s.date), line(s.series)].filter(Boolean).join(' · ')
      out.push(`- [${line(s.title)}](${origin}/sermons/${s.id})${meta ? `: ${meta}` : ''}`)
    }
    out.push('')
  }

  if (events.length) {
    out.push('## Upcoming events', '')
    for (const e of events) {
      const meta = [line(e.display_date || e.date), line(e.location)].filter(Boolean).join(' · ')
      out.push(`- [${line(e.title)}](${origin}/events/${e.id})${meta ? `: ${meta}` : ''}`)
    }
    out.push('')
  }

  out.push('## Optional', '')
  out.push(`- [Sitemap](${origin}/sitemap.xml): every indexable URL`)
  out.push('')

  return new Response(out.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // Content changes when admins edit it; an hour is fresh enough for a
      // crawler and spares the API a request per bot per page view.
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
