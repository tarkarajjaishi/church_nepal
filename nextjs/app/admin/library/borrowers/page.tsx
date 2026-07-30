'use client'

import { useQuery } from '@tanstack/react-query'
import { Users, Phone } from 'lucide-react'
import { libraryApi } from '@/lib/library/api'
import { money } from '@/lib/offerings/api'
import {
  CARD, PageHeader, EmptyState, ErrorState, TableSkeleton, Chip, StatTile,
} from '@/components/offerings/ui'

export default function BorrowersPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['library', 'borrowers'],
    queryFn: libraryApi.borrowers,
  })
  const { data: settings } = useQuery({
    queryKey: ['library', 'settings'],
    queryFn: libraryApi.settings,
  })

  const withBooks = data?.filter((b) => b.openLoans > 0) ?? []
  const owing = data?.filter((b) => b.feesOutstanding > 0) ?? []
  const limit = settings?.maxLoansPerPerson ?? 0

  return (
    <>
      <PageHeader title="Borrowers" subtitle="Everyone who has taken a book out, and what they still have" />

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <StatTile label="People with books out" value={withBooks.length} icon={Users} loading={isLoading} />
        <StatTile label="At their limit" value={withBooks.filter((b) => b.openLoans >= limit).length} hint={limit ? `Limit is ${limit}` : undefined} tone={withBooks.some((b) => b.openLoans >= limit) ? 'warn' : 'default'} loading={isLoading} />
        <StatTile
          label="Fees outstanding"
          value={money(owing.reduce((s, b) => s + b.feesOutstanding, 0))}
          hint={owing.length ? `${owing.length} person(s)` : 'Nothing owed'}
          tone={owing.length ? 'warn' : 'good'}
          loading={isLoading}
        />
      </div>

      <div className={`${CARD} overflow-hidden`}>
        {error ? (
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton cols={6} />
        ) : !data?.length ? (
          <EmptyState icon={Users} title="Nobody has borrowed yet" subtitle="Lend a book and the borrower appears here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {['Borrower', 'Out now', 'Overdue', 'Total borrowed', 'Fees owed', 'Last borrowed'].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((b) => (
                  <tr key={`${b.personId ?? ''}${b.name}`} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.name}</p>
                      {b.contact && (
                        <a href={`tel:${b.contact}`} className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-primary">
                          <Phone className="size-3" aria-hidden />{b.contact}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {b.openLoans}
                      {limit > 0 && b.openLoans >= limit && (
                        <Chip className="ml-2 bg-amber-100 text-amber-800 border-amber-200">At limit</Chip>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {b.overdue > 0
                        ? <Chip className="bg-red-100 text-red-800 border-red-200">{b.overdue}</Chip>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{b.totalLoans}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {b.feesOutstanding > 0
                        ? <span className="text-red-700">{money(b.feesOutstanding)}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums whitespace-nowrap">{b.lastBorrowed ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
