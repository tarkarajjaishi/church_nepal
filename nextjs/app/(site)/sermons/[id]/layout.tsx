import type { Metadata } from 'next'
import { fetchTenant } from '@/lib/serverApi'

type Sermon = {
  title?: string
  speaker?: string
  series?: string
  description?: string
  image?: string
}

/**
 * Per-sermon metadata.
 *
 * The page itself is a client component and cannot export metadata, so this
 * server layout fetches the sermon for the *current tenant* (via the Host
 * header — see lib/serverApi) and describes it. Without this every sermon
 * shared the site-wide title, so sharing a sermon link showed nothing about it.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const sermon = await fetchTenant<Sermon>(`/api/sermons/${id}`)

  if (!sermon?.title) {
    return { title: 'Sermon' }
  }

  const description =
    sermon.description?.slice(0, 160) ||
    [sermon.speaker && `A message from ${sermon.speaker}`, sermon.series]
      .filter(Boolean)
      .join(' · ') ||
    'Listen to this Bible-based message.'

  return {
    title: sermon.title,
    description,
    alternates: { canonical: `/sermons/${id}` },
    openGraph: {
      type: 'article',
      title: `${sermon.title} — Grace Nepal Church`,
      description,
      url: `/sermons/${id}`,
      images: sermon.image ? [{ url: sermon.image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${sermon.title} — Grace Nepal Church`,
      description,
      images: sermon.image ? [sermon.image] : undefined,
    },
  }
}

export default function SermonLayout({ children }: { children: React.ReactNode }) {
  return children
}
