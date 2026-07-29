import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Our Pastor',
  description: 'Meet our senior pastor and learn about his heart for discipleship.',
  alternates: { canonical: '/pastor' },
  openGraph: {
    title: 'Our Pastor — Grace Nepal Church',
    description: 'Meet our senior pastor and learn about his heart for discipleship.',
    url: '/pastor',
  },
}

export default function pastorLayout({ children }: { children: React.ReactNode }) {
  return children
}
