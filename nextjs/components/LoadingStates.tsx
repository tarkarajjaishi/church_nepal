'use client'

import { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Skeleton screen component for loading states
 * Provides better UX than blank/loading text
 */
export function SkeletonLoader({ count = 1, height = 'h-12' }: { count?: number; height?: string }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${height} bg-gray-200 rounded animate-pulse`} />
      ))}
    </div>
  )
}

/**
 * Loading spinner for async operations
 */
export function LoadingSpinner({ size = 'md', message }: { size?: 'sm' | 'md' | 'lg'; message?: string }) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size]

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClass} animate-spin text-blue-600`} />
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  )
}

/**
 * Empty state component
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="text-gray-400">{Icon}</div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

/**
 * Error state component for failed data loading
 */
export function ErrorState({
  message = 'Failed to load data',
  action,
}: {
  message?: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h3 className="font-semibold text-red-900 mb-2">Error</h3>
      <p className="text-sm text-red-700 mb-4">{message}</p>
      {action && <div>{action}</div>}
    </div>
  )
}
