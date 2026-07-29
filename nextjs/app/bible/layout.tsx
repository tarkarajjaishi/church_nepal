import type { Metadata } from 'next'
import { Providers } from '@/lib/providers'

export const metadata: Metadata = {
  // The root layout applies a '%s — Grace Nepal Church' template, so spelling
  // the suffix out here rendered it twice in the tab title.
  title: 'पवित्र बाइबल (NNRV)',
  description: 'पवित्र बाइबल - नेपाली नयाँ संशोधित संस्करण (NNRV) - Nepal Bible Society',
}

export default function BibleLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      {children}
    </Providers>
  )
}
