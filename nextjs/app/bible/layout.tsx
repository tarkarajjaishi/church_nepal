'use client'

import { Providers } from '@/lib/providers'

export default function BibleLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      {children}
    </Providers>
  )
}
