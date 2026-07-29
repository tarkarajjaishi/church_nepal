import type { Metadata } from 'next'
import { fetchTenant } from '@/lib/serverApi'

type ChurchEvent = {
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

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return children
}
