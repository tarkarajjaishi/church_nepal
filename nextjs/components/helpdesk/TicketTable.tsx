'use client'

import Link from 'next/link'
import { Ticket as TicketIcon, AlertTriangle, Paperclip, Eye, Globe } from 'lucide-react'
import {
  duration, breachReason, PRIORITY_TONE, STATUS_TONE, STATUS_LABEL, type Ticket,
} from '@/lib/helpdesk/api'
import { EmptyState, TableSkeleton, ErrorState, Chip } from '@/components/offerings/ui'

/**
 * The ticket table, shared by every queue view.
 *
 * One component so the unassigned, breaching and all-tickets pages can never
 * drift apart on what a breach looks like or how age is worded.
 */
export function TicketTable({
  data,
  isLoading,
  error,
  onRetry,
  emptyTitle,
  emptySubtitle,
  action,
  selected,
  onSelect,
}: {
  data?: Ticket[]
  isLoading?: boolean
  error?: unknown
  onRetry?: () => void
  emptyTitle: string
  emptySubtitle?: string
  action?: React.ReactNode
  /** Omit both to get the plain table the other queue pages use. */
  selected?: Set<string>
  onSelect?: (ids: string[], checked: boolean) => void
}) {
  if (error) return <ErrorState message={(error as Error).message} onRetry={onRetry} />
  if (isLoading) return <TableSkeleton cols={selected ? 7 : 6} />
  if (!data?.length) {
    return <EmptyState icon={TicketIcon} title={emptyTitle} subtitle={emptySubtitle} action={action} />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
          <tr>
            {selected && onSelect && (
              <th scope="col" className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  className="size-4 rounded border-border"
                  aria-label="Select every ticket on this page"
                  checked={data.every((t) => selected.has(t.id))}
                  onChange={(e) => onSelect(data.map((t) => t.id), e.target.checked)}
                />
              </th>
            )}
            {['Ticket', 'Category', 'Priority', 'Status', 'Owner', 'Age'].map((h) => (
              <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((t) => {
            const reason = breachReason(t)
            return (
              <tr
                key={t.id}
                className={`border-b border-border last:border-0 transition-colors ${
                  selected?.has(t.id) ? 'bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                {selected && onSelect && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border"
                      aria-label={`Select ${t.ticketCode}`}
                      checked={selected.has(t.id)}
                      onChange={(e) => onSelect([t.id], e.target.checked)}
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <Link href={`/admin/helpdesk/tickets/${t.id}`} className="font-medium hover:text-primary transition-colors">
                    {t.subject}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono">{t.ticketCode}</span>
                    {' · '}{t.reporterName}
                    {t.location && ` · ${t.location}`}
                    {t.reopenCount > 0 && (
                      <span className="text-amber-700"> · reopened {t.reopenCount}×</span>
                    )}
                  </p>
                  {(t.attachmentCount > 0 || t.watcherCount > 0 || t.source === 'public') && (
                    <p className="flex items-center gap-2.5 mt-1 text-xs text-muted-foreground">
                      {t.source === 'public' && (
                        <span className="inline-flex items-center gap-1" title="Reported from the website">
                          <Globe className="size-3" aria-hidden /> website
                        </span>
                      )}
                      {t.attachmentCount > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Paperclip className="size-3" aria-hidden />
                          {t.attachmentCount}
                          <span className="sr-only">photo{t.attachmentCount === 1 ? '' : 's'}</span>
                        </span>
                      )}
                      {t.watcherCount > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Eye className="size-3" aria-hidden />
                          {t.watcherCount}
                          <span className="sr-only">watching</span>
                        </span>
                      )}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {t.categoryName
                    ? <Chip className="bg-muted text-foreground border-border" dot={t.categoryColor}>{t.categoryName}</Chip>
                    : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3">
                  <Chip className={PRIORITY_TONE[t.priority]}>{t.priority}</Chip>
                </td>
                <td className="px-4 py-3">
                  <Chip className={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Chip>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {t.assigneeName || <span className="text-muted-foreground">Unassigned</span>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={reason ? 'text-red-700 font-medium' : ''}>{duration(t.ageHours)}</span>
                  {reason && (
                    <p className="text-xs text-red-700 inline-flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="size-3 shrink-0" aria-hidden />
                      {reason}
                    </p>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
