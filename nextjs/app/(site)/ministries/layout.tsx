import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ministries',
  description: 'Discover a ministry where you can grow, serve and belong.',
  alternates: { canonical: '/ministries' },
  openGraph: {
    title: 'Ministries — Grace Nepal Church',
    description: 'Discover a ministry where you can grow, serve and belong.',
    url: '/ministries',
  },
}

export default function ministriesLayout({ children }: { children: React.ReactNode }) {
  return children
}
