import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How we collect, use and protect your personal information.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Privacy Policy — Grace Nepal Church',
    description: 'How we collect, use and protect your personal information.',
    url: '/privacy',
  },
}

export default function privacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
