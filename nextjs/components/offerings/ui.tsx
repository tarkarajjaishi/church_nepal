'use client'

import type { LucideIcon } from 'lucide-react'
import { AlertCircle, Inbox } from 'lucide-react'

/** Card shell used across the module. One place so radius/shadow stay uniform. */
export const CARD =
  'rounded-2xl border border-border bg-card shadow-sm'

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  loading,
}: {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  tone?: 'default' | 'good' | 'warn' | 'bad'
  loading?: boolean
}) {
  // Tones use the palette families globals.css inverts under .dark, so a tile
  // reads correctly in both themes without a dark: variant per class.
  const toneRing: Record<string, string> = {
    default: 'text-muted-foreground',
    good: 'text-green-700',
    warn: 'text-amber-700',
    bad: 'text-red-700',
  }

  return (
    <div className={`${CARD} p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        {Icon && <Icon className={`size-4 shrink-0 ${toneRing[tone]}`} aria-hidden />}
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-24 rounded bg-muted animate-pulse" />
      ) : (
        <p
          className="mt-1.5 text-2xl font-semibold text-foreground tabular-nums truncate"
          title={String(value)}
        >
          {value}
        </p>
      )}
      {hint && !loading && (
        <p className="mt-1 text-xs text-muted-foreground truncate">{hint}</p>
      )}
    </div>
  )
}

export function EmptyState({
  title,
  subtitle,
  icon: Icon = Inbox,
  action,
}: {
  title: string
  subtitle?: string
  icon?: LucideIcon
  action?: React.ReactNode
}) {
  return (
    <div className="text-center py-14 px-4">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted">
        <Icon className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <p className="font-medium text-foreground">{title}</p>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="text-center py-14 px-4">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-red-100">
        <AlertCircle className="size-6 text-red-700" aria-hidden />
      </div>
      <p className="font-medium text-foreground">Could not load this data</p>
      <p className="text-sm text-muted-foreground mt-1">
        {message || 'Something went wrong. Please try again.'}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center min-h-10 px-4 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Try again
        </button>
      )}
    </div>
  )
}

/** Table skeleton sized to the real column count so layout does not jump. */
export function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="p-4 space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-5 rounded bg-muted animate-pulse"
              style={{ width: `${100 / cols}%`, animationDelay: `${(r * cols + c) * 15}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function Chip({
  children,
  className = '',
  dot,
}: {
  children: React.ReactNode
  className?: string
  dot?: string | null
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${className}`}
    >
      {dot && (
        <span
          className="size-1.5 rounded-full shrink-0"
          style={{ backgroundColor: dot }}
          aria-hidden
        />
      )}
      {children}
    </span>
  )
}

export const btn = {
  primary:
    'inline-flex items-center justify-center gap-1.5 min-h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  secondary:
    'inline-flex items-center justify-center gap-1.5 min-h-10 px-4 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  ghost:
    'inline-flex items-center justify-center gap-1.5 min-h-10 px-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  danger:
    'inline-flex items-center justify-center gap-1.5 min-h-10 px-4 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
}

export const field =
  'w-full min-h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-shadow'

export function Label({
  children,
  htmlFor,
  required,
  hint,
}: {
  children: React.ReactNode
  htmlFor?: string
  required?: boolean
  hint?: string
}) {
  return (
    <label htmlFor={htmlFor} className="block mb-1.5">
      <span className="text-sm font-medium text-foreground">
        {children}
        {required && (
          <span className="text-destructive ml-0.5" aria-hidden>
            *
          </span>
        )}
      </span>
      {hint && <span className="block text-xs text-muted-foreground mt-0.5">{hint}</span>}
    </label>
  )
}
