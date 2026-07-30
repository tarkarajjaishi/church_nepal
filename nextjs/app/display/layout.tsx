import type { Metadata } from 'next'
import { Providers } from '@/lib/providers'

export const metadata: Metadata = {
  title: 'Display Output',
  // A projector page must never be indexed — it is an internal screen, and a
  // search result linking to it would leak the live service state.
  robots: { index: false, follow: false },
}

/**
 * Display route group.
 *
 * Deliberately outside (site) and /admin: no site chrome, no admin shell, no
 * auth guard. The page is one full-bleed slide and nothing else.
 */
export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}
