export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="relative">
        <div className="size-10 rounded-full border-4 border-church-blue/20 border-t-church-blue animate-spin" />
      </div>
      <span className="ml-3 text-muted-foreground text-sm">Loading...</span>
    </div>
  )
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/60 overflow-hidden animate-pulse">
          <div className="aspect-video bg-gray-200" />
          <div className="p-5 space-y-3">
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 rounded-lg" />
      ))}
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[60vh] bg-gray-300 animate-pulse">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-8 bg-gray-400/50 rounded w-64" />
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-5xl px-4 animate-pulse">
        <div className="aspect-video bg-gray-200 rounded-2xl mb-8" />
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
          <div className="space-y-4">
            <div className="h-48 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
