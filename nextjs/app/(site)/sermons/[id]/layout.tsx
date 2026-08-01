import type { Metadata } from 'next'
import { fetchTenant, tenantSiteOrigin } from '@/lib/serverApi'
import { JsonLd, isoDate, plain, absolute } from '@/components/site/JsonLd'

type Sermon = {
  date?: string
  video_url?: string | null
  duration?: string
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

/**
 * Structured data for a sermon.
 *
 * Type is chosen by what the record actually has, not by what we wish it had:
 *
 *   - with a video URL  -> VideoObject, which is what earns a video rich result
 *     and is how an answer engine surfaces "watch the sermon on X".
 *   - without one       -> CreativeWork. VideoObject REQUIRES contentUrl or
 *     embedUrl; emitting it for the 17 seeded sermons that all have
 *     `video_url: null` would mark every sermon page as invalid markup.
 *
 * uploadDate is likewise omitted unless the date is a real calendar date —
 * VideoObject treats it as required, but a wrong date is worse than an absent
 * one, and the seed contains impossible values.
 */
export default async function SermonLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [origin, sermon] = await Promise.all([
    tenantSiteOrigin(),
    fetchTenant<Sermon>(`/api/sermons/${id}`),
  ])

  const video = absolute(origin, sermon?.video_url)
  const uploadDate = isoDate(sermon?.date)

  const ld = sermon?.title
    ? {
        '@context': 'https://schema.org',
        '@type': video ? 'VideoObject' : 'CreativeWork',
        name: sermon.title,
        url: `${origin}/sermons/${id}`,
        ...(plain(sermon.description) ? { description: plain(sermon.description) } : {}),
        ...(absolute(origin, sermon.image) ? { thumbnailUrl: absolute(origin, sermon.image) } : {}),
        ...(video ? { contentUrl: video } : {}),
        ...(video && uploadDate ? { uploadDate } : {}),
        ...(!video && uploadDate ? { datePublished: uploadDate } : {}),
        ...(sermon.speaker
          ? { author: { '@type': 'Person', name: sermon.speaker } }
          : {}),
        ...(sermon.series ? { isPartOf: { '@type': 'CreativeWorkSeries', name: sermon.series } } : {}),
      }
    : null

  return (
    <>
      <JsonLd data={ld} />
      {children}
    </>
  )
}
