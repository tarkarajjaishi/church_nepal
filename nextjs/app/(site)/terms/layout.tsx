import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Guidelines for using our website.',
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'Terms of Service — Grace Nepal Church',
    description: 'Guidelines for using our website.',
    url: '/terms',
  },
}

export default function termsLayout({ children }: { children: React.ReactNode }) {
  return children
}
