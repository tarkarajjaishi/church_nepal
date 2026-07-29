import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Give',
  description: 'Support our mission through your generous giving.',
  alternates: { canonical: '/give' },
  openGraph: {
    title: 'Give — Grace Nepal Church',
    description: 'Support our mission through your generous giving.',
    url: '/give',
  },
}

export default function giveLayout({ children }: { children: React.ReactNode }) {
  return children
}
