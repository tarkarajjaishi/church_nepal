import { BookOpen } from 'lucide-react'

/** Suspense fallback shared by /bible and /bible/[book]. */
export function BibleFallback() {
  return (
    <div
      className="flex h-[100dvh] items-center justify-center bg-section-bg"
      role="status"
    >
      <div className="text-center">
        <BookOpen className="size-10 mx-auto text-church-blue/30 animate-pulse mb-3" />
        <p className="text-sm text-muted-foreground font-nepali">बाइबल लोड हुँदैछ...</p>
      </div>
    </div>
  )
}
