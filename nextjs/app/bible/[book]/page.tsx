'use client'

import { Suspense, use } from 'react'
import { BookOpen } from 'lucide-react'
import { BibleApp } from '@/components/bible/BibleApp'
import { normalizeBookCode } from '@/lib/bible/books'

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

export default function BibleBookPage({
  params,
}: {
  params: Promise<{ book: string }>
}) {
  const { book: rawBook } = use(params)
  const book = normalizeBookCode(rawBook)

  return (
    <Suspense fallback={<BibleFallback />}>
      <BibleApp initialBook={book} initialChapter={1} />
    </Suspense>
  )
}
