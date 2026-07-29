import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Watch Live',
  description: 'Join our live Sunday service online, wherever you are.',
  alternates: { canonical: '/live' },
  openGraph: {
    title: 'Watch Live — Grace Nepal Church',
    description: 'Join our live Sunday service online, wherever you are.',
    url: '/live',
  },
}

export default function liveLayout({ children }: { children: React.ReactNode }) {
  return children
}
