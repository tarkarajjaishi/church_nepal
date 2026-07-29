import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plan Your Visit',
  description: 'Everything you need for a warm, relaxed first Sunday — service times, what to expect, kids, parking and directions.',
  alternates: { canonical: '/visit' },
  openGraph: {
    title: 'Plan Your Visit — Grace Nepal Church',
    description: 'Everything you need for a warm, relaxed first Sunday — service times, what to expect, kids, parking and directions.',
    url: '/visit',
  },
}

export default function visitLayout({ children }: { children: React.ReactNode }) {
  return children
}
