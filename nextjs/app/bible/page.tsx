'use client'

import { Suspense } from 'react'
import { BibleApp } from '@/components/bible/BibleApp'
import { BookOpen } from 'lucide-react'

function BibleFallback() {
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-[#f4f7fb]">
      <div className="text-center">
        <BookOpen className="size-10 mx-auto text-[#0b3c5d]/30 animate-pulse mb-3" />
        <p className="text-sm text-slate-500">बाइबल लोड हुँदैछ...</p>
      </div>
    </div>
  )
}

export default function BiblePage() {
  return (
    <Suspense fallback={<BibleFallback />}>
      <BibleApp initialBook="JHN" initialChapter={1} />
    </Suspense>
  )
}
