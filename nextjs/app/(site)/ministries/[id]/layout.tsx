import type { Metadata } from 'next'
import { fetchTenant } from '@/lib/serverApi'

type Ministry = {
  name?: string
  description?: string
  leader?: string
  meeting?: string
  image?: string
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const ministry = await fetchTenant<Ministry>(`/api/ministries/${id}`)

  if (!ministry?.name) {
    return { title: 'Ministry' }
  }

  const description =
    ministry.description?.slice(0, 160) ||
    [ministry.leader && `Led by ${ministry.leader}`, ministry.meeting]
      .filter(Boolean)
      .join(' · ') ||
    'Learn about this ministry.'

  return {
    title: ministry.name,
    description,
    alternates: { canonical: `/ministries/${id}` },
    openGraph: {
      type: 'article',
      title: `${ministry.name} — Grace Nepal Church`,
      description,
      url: `/ministries/${id}`,
      images: ministry.image ? [{ url: ministry.image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${ministry.name} — Grace Nepal Church`,
      description,
      images: ministry.image ? [ministry.image] : undefined,
    },
  }
}

export default function MinistryLayout({ children }: { children: React.ReactNode }) {
  return children
}
