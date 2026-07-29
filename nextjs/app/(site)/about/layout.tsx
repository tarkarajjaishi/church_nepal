import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Our story, mission and what we believe as a Christ-centred church in Nepal.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Us — Grace Nepal Church',
    description:
      'Our story, mission and what we believe as a Christ-centred church in Nepal.',
    url: '/about',
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
