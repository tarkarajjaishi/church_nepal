import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Reach out, drop by, or send us a message.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact — Grace Nepal Church',
    description: 'Reach out, drop by, or send us a message.',
    url: '/contact',
  },
}

export default function contactLayout({ children }: { children: React.ReactNode }) {
  return children
}
