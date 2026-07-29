import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Moments of worship, fellowship and mission.',
  alternates: { canonical: '/gallery' },
  openGraph: {
    title: 'Gallery — Grace Nepal Church',
    description: 'Moments of worship, fellowship and mission.',
    url: '/gallery',
  },
}

export default function galleryLayout({ children }: { children: React.ReactNode }) {
  return children
}
