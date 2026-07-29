import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Leadership',
  description: 'Meet the servant-hearted team leading our church.',
  alternates: { canonical: '/leadership' },
  openGraph: {
    title: 'Leadership — Grace Nepal Church',
    description: 'Meet the servant-hearted team leading our church.',
    url: '/leadership',
  },
}

export default function leadershipLayout({ children }: { children: React.ReactNode }) {
  return children
}
