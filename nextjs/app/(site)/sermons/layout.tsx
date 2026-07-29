import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sermons',
  description: 'Watch and listen to Bible-based messages.',
  alternates: { canonical: '/sermons' },
  openGraph: {
    title: 'Sermons — Grace Nepal Church',
    description: 'Watch and listen to Bible-based messages.',
    url: '/sermons',
  },
}

export default function sermonsLayout({ children }: { children: React.ReactNode }) {
  return children
}
