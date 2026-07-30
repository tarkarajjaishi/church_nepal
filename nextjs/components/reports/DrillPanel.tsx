'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { X, ExternalLink, Search } from 'lucide-react'
import { reportsApi, formatCell, isNumeric } from '@/lib/reports/api'
import { CARD, EmptyState, ErrorState, TableSkeleton, btn } from '@/components/offerings/ui'

/**
 * The records behind one row.
 *
 * A report answers "how much"; this answers "which ones". It runs against the
 * same period and the same conditions as the row it came from, so the figures
 * add up to the one in the table — which is the whole reason it is worth
 * having. A figure nobody can check is a figure nobody trusts for long.
 */
export function DrillPanel({
  reportKey,
  value,
  from,
  to,
  onClose,
}: {
  reportKey: string
  value: string
  from: string
  to: string
  onClose: () => void
}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['drill', reportKey, value, from, to],
    queryFn: () => reportsApi.drill(reportKey, value, from, to),
  })

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drill-title"
        className="relative w-[min(92vw,52rem)] h-full overflow-y-auto bg-card border-l border-border p-5"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 id="drill-title" className="font-semibold truncate">{value}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {from} to {to}
              {data && ` · ${data.total} record${data.total === 1 ? '' : 's'}`}
            </p>
          </div>
          <button type="button" onClick={onClose} className={btn.ghost} aria-label="Close">
            <X className="size-4" aria-hidden />
          </button>
        </div>

        {error ? (
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <TableSkeleton cols={4} />
        ) : !data.rows.length ? (
          <EmptyState
            icon={Search}
            title="Nothing behind this row"
            subtitle="The figure came from records outside this period, or they have since been removed."
          />
        ) : (
          <>
            <div className={`${CARD} overflow-x-auto`}>
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    {data.columns.map((c) => (
                      <th
                        key={c.key}
                        scope="col"
                        className={`px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap ${isNumeric(c.kind) ? 'text-right' : 'text-left'}`}
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      {data.columns.map((c) => (
                        <td
                          key={c.key}
                          className={`px-3 py-2 whitespace-nowrap ${isNumeric(c.kind) ? 'text-right tabular-nums' : ''}`}
                        >
                          {formatCell(row[c.key], c.kind)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* A drill-down is a look, not a replacement for the module — the
                place to actually change any of this is where it lives. */}
            {data.link && (
              <Link href={data.link} className={`${btn.secondary} mt-4`}>
                <ExternalLink className="size-4" aria-hidden /> Open the full records
              </Link>
            )}
            {data.rows.length < data.total && (
              <p className="text-xs text-muted-foreground mt-3">
                Showing the first {data.rows.length} of {data.total}.
              </p>
            )}
          </>
        )}
      </aside>
    </div>
  )
}
