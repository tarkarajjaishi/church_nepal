'use client'

import { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Full-page or section loading spinner.
 */
export function Loading({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 className="size-8 animate-spin text-primary" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}

/**
 * Skeleton loader for table/list placeholders.
 */
export function SkeletonLoader({ count = 3, height = 'h-12' }: { count?: number; height?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${height} rounded-md bg-muted animate-pulse`} />
      ))}
    </div>
  )
}

/**
 * Table row skeleton for data tables.
 */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="p-3">
              <div className="h-4 rounded bg-muted animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

/**
 * Empty state — shown when a list has no items.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      {icon && <div className="text-muted-foreground/50">{icon}</div>}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

/**
 * Inline empty state for inside table cells.
 */
export function TableEmpty({ colSpan, message = 'No data yet' }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-8 text-center text-muted-foreground text-sm">
        {message}
      </td>
    </tr>
  )
}

/**
 * Error state — shown when data loading fails.
 */
export function ErrorState({
  message = 'Failed to load data',
  onRetry,
  action,
}: {
  message?: string
  onRetry?: () => void
  action?: ReactNode
}) {
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
      <p className="text-sm font-medium text-destructive mb-2">{message}</p>
      {action && <div className="mt-2">{action}</div>}
      {onRetry && !action && (
        <button onClick={onRetry} className="text-sm text-primary hover:underline">
          Retry
        </button>
      )}
    </div>
  )
}

/** Backward-compatible alias */
export const LoadingSpinner = Loading

/**
 * Full loading/empty/error wrapper for list pages.
 * Renders the appropriate state based on query results.
 */
export function DataState({
  isLoading,
  isError,
  isEmpty,
  error,
  onRetry,
  emptyIcon,
  emptyTitle = 'No data yet',
  emptyDescription,
  emptyAction,
  children,
}: {
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  error?: any
  onRetry?: () => void
  emptyIcon?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  children: ReactNode
}) {
  if (isLoading) return <Loading />
  if (isError) return <ErrorState message={error?.message || error?.detail || 'Failed to load data'} onRetry={onRetry} />
  if (isEmpty) return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={emptyAction} />
  return <>{children}</>
}

export function PaginationControls({
  page,
  perPage,
  total,
  totalPages,
  onPageChange,
}: {
  page: number
  perPage?: number
  total?: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between gap-4 mt-4 text-sm">
      <span className="text-muted-foreground">
        {total != null ? `${total} item${total === 1 ? '' : 's'}` : `Page ${page} of ${totalPages}`}
        {perPage != null ? ` · ${perPage} per page` : ''}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-md border border-border disabled:opacity-50 hover:bg-muted transition-colors"
        >
          Previous
        </button>
        <span className="px-2">Page {page} of {totalPages}</span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-md border border-border disabled:opacity-50 hover:bg-muted transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}
