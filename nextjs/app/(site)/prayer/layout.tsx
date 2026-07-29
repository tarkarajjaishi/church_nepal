import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prayer Request',
  description: 'Submit a confidential prayer request. Our prayer team commits to praying over every one.',
  alternates: { canonical: '/prayer' },
  openGraph: {
    title: 'Prayer Request — Grace Nepal Church',
    description: 'Submit a confidential prayer request. Our prayer team commits to praying over every one.',
    url: '/prayer',
  },
}

export default function prayerLayout({ children }: { children: React.ReactNode }) {
  return children
}
