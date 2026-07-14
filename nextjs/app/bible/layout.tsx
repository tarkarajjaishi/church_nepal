import type { Metadata } from 'next'
import { Providers } from '@/lib/providers'

export const metadata: Metadata = {
  title: 'पवित्र बाइबल (NE) — Grace Nepal Church',
  description: 'पवित्र बाइबल - नेपाली नयाँ संशोधित संस्करण (NNRV) - Nepal Bible Society',
}

export default function BibleLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      {children}
    </Providers>
  )
}
