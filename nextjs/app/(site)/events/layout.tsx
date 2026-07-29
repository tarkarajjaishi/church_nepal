import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Events',
  description: 'Upcoming services, camps, conferences and gatherings.',
  alternates: { canonical: '/events' },
  openGraph: {
    title: 'Events — Grace Nepal Church',
    description: 'Upcoming services, camps, conferences and gatherings.',
    url: '/events',
  },
}

export default function eventsLayout({ children }: { children: React.ReactNode }) {
  return children
}
