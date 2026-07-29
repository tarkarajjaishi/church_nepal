import type { Metadata } from 'next'
import { Suspense } from 'react'
import { BibleApp } from '@/components/bible/BibleApp'
import { BibleFallback } from '@/components/bible/BibleFallback'
import { getBookName, normalizeBookCode } from '@/lib/bible/books'

/**
 * Server component on purpose.
 *
 * This page used to be a client component that resolved `params` with
 * `use(params)` and rendered <BibleApp> — which itself calls
 * useSearchParams() — inside a Suspense boundary. That combination left the
 * boundary suspended forever on the client: the fallback stayed visible, the
 * server-rendered reader sat orphaned in the DOM, and nothing ever hydrated.
 * The whole Bible reader was a dead shell — no chapter ever loaded, no button
 * did anything.
 *
 * Resolving params on the server and handing BibleApp a plain string keeps the
 * only client boundary inside <Suspense>, which is what App Router expects.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ book: string }>
}): Promise<Metadata> {
  const { book } = await params
  const name = getBookName(normalizeBookCode(book))
  return {
    title: `${name} — पवित्र बाइबल (NNRV)`,
    description: `${name} — नेपाली नयाँ संशोधित संस्करण (NNRV) बाइबल अनलाइन पढ्नुहोस्।`,
  }
}

export default async function BibleBookPage({
  params,
}: {
  params: Promise<{ book: string }>
}) {
  const { book } = await params

  return (
    <Suspense fallback={<BibleFallback />}>
      <BibleApp initialBook={normalizeBookCode(book)} initialChapter={1} />
    </Suspense>
  )
}
