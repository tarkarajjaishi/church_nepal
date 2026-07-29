import { Suspense } from 'react'
import { BibleApp } from '@/components/bible/BibleApp'
import { BibleFallback } from '@/components/bible/BibleFallback'

// Server component — see app/bible/[book]/page.tsx for why this must not be
// a client component.
export default function BiblePage() {
  return (
    <Suspense fallback={<BibleFallback />}>
      <BibleApp initialBook="JHN" initialChapter={1} />
    </Suspense>
  )
}
