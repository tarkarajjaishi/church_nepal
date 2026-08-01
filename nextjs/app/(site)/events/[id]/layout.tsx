import type { Metadata } from 'next'
import { fetchTenant, tenantSiteOrigin } from '@/lib/serverApi'
import { JsonLd, isoDate, plain, absolute } from '@/components/site/JsonLd'

type ChurchEvent = {
  id?: string
  date?: string
  title?: string
  display_date?: string
  time?: string
  location?: string
  description?: string
  image?: string
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const event = await fetchTenant<ChurchEvent>(`/api/events/${id}`)

  if (!event?.title) {
    return { title: 'Event' }
  }

  // Lead with when and where — that is what someone deciding whether to attend
  // needs to see in a search result or a shared link.
  const when = [event.display_date, event.time].filter(Boolean).join(' · ')
  const description =
    [when, event.location].filter(Boolean).join(' — ') ||
    event.description?.slice(0, 160) ||
    'Event details.'

  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${id}` },
    openGraph: {
      type: 'article',
      title: `${event.title} — Grace Nepal Church`,
      description,
      url: `/events/${id}`,
      images: event.image ? [{ url: event.image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${event.title} — Grace Nepal Church`,
      description,
      images: event.image ? [event.image] : undefined,
    },
  }
}

/**
 * schema.org/Event for this event.
 *
 * Emitted only when the record has a title AND a real calendar date. `startDate`
 * is required for an Event to be eligible for rich results, and the seed
 * contains impossible dates ("2024-02-30", "2024-01-35") that JavaScript
 * silently rolls forward — publishing a date the page never displays. isoDate
 * rejects those rather than guessing.
 *
 * `location` is the church's own name and the event's location string; no
 * address is invented, because a fabricated address is exactly the kind of
 * detail an answer engine repeats as fact.
 */
export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [origin, event] = await Promise.all([
    tenantSiteOrigin(),
    fetchTenant<ChurchEvent>(`/api/events/${id}`),
  ])

  const startDate = isoDate(event?.date)
  const ld =
    event?.title && startDate
      ? {
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: event.title,
          startDate,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          url: `${origin}/events/${id}`,
          ...(plain(event.description) ? { description: plain(event.description) } : {}),
          ...(absolute(origin, event.image) ? { image: absolute(origin, event.image) } : {}),
          ...(event.location
            ? { location: { '@type': 'Place', name: event.location } }
            : {}),
        }
      : null

  return (
    <>
      <JsonLd data={ld} />
      {children}
    </>
  )
}
