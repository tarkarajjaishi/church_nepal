'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Library, BookOpen, ArrowLeftRight, AlertTriangle, Clock, Users,
  Coins, Monitor, ArrowRight,
} from 'lucide-react'
import { libraryApi } from '@/lib/library/api'
import { money } from '@/lib/offerings/api'
import { CARD, PageHeader, StatTile, EmptyState, ErrorState } from '@/components/offerings/ui'

const dayLabel = (n: number) => (n === 1 ? '1 day' : `${n} days`)

export default function LibraryDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['library', 'dashboard'],
    queryFn: libraryApi.dashboard,
  })

  if (error) {
    return (
      <>
        <PageHeader title="Library" subtitle="What is on the shelf and who has the rest" />
        <div className={CARD}>
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        </div>
      </>
    )
  }

  const d = data
  const maxCategory = Math.max(1, ...(d?.byCategory ?? []).map((c) => c.count))
  const maxBorrowed = Math.max(1, ...(d?.mostBorrowed ?? []).map((c) => c.count))

  return (
    <>
      <PageHeader
        title="Library"
        subtitle="What is on the shelf and who has the rest"
        actions={
          <>
            <Link href="/admin/library/loans" className="inline-flex items-center gap-1.5 min-h-10 px-4 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-colors">
              <ArrowLeftRight className="size-4" aria-hidden /> Circulation
            </Link>
            <Link href="/admin/library/catalogue" className="inline-flex items-center gap-1.5 min-h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Library className="size-4" aria-hidden /> Catalogue
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <StatTile
          label="Titles"
          value={d?.totalTitles ?? 0}
          hint={d ? `${d.totalCopies} physical copies` : undefined}
          icon={BookOpen}
          loading={isLoading}
        />
        <StatTile
          label="On the shelf"
          value={d?.available ?? 0}
          hint={d ? `${d.onLoan} out on loan` : undefined}
          icon={Library}
          tone="good"
          loading={isLoading}
        />
        <StatTile
          label="Overdue"
          value={d?.overdue ?? 0}
          hint={d?.overdue ? 'Chase these first' : 'Nothing late'}
          icon={AlertTriangle}
          tone={d?.overdue ? 'bad' : 'good'}
          loading={isLoading}
        />
        <StatTile
          label="Fees owed"
          value={money(d?.feesOutstanding ?? 0)}
          hint={d ? `${d.activeBorrowers} borrower(s) active` : undefined}
          icon={Coins}
          tone={d?.feesOutstanding ? 'warn' : 'default'}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatTile label="Borrowed this month" value={d?.loansThisMonth ?? 0} icon={ArrowLeftRight} loading={isLoading} />
        <StatTile label="Waiting on a hold" value={d?.holdsWaiting ?? 0} icon={Clock} tone={d?.holdsWaiting ? 'warn' : 'default'} loading={isLoading} />
        <StatTile label="Digital material" value={d?.digitalTitles ?? 0} hint="Linked, not lent" icon={Monitor} loading={isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Overdue */}
        <section className={`${CARD} p-4 sm:p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-700" aria-hidden /> Overdue
            </h2>
            <Link href="/admin/library/loans?status=overdue" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              All overdue <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : !d?.overdueLoans.length ? (
            <EmptyState title="Nothing overdue" subtitle="Every book is back or still within its loan period." />
          ) : (
            <ul className="divide-y divide-border">
              {d.overdueLoans.map((l) => (
                <li key={l.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{l.bookTitle}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {l.borrowerName} · {l.copyCode}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-red-700">{dayLabel(l.daysOverdue)} late</p>
                    {l.feeAccruing > 0 && (
                      <p className="text-xs text-muted-foreground">{money(l.feeAccruing)} accruing</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Due soon */}
        <section className={`${CARD} p-4 sm:p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" aria-hidden /> Due in the next week
            </h2>
            <Link href="/admin/library/loans" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              All loans <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : !d?.dueSoon.length ? (
            <EmptyState title="Nothing due this week" subtitle="No reminders to send." />
          ) : (
            <ul className="divide-y divide-border">
              {d.dueSoon.map((l) => (
                <li key={l.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{l.bookTitle}</p>
                    <p className="text-xs text-muted-foreground truncate">{l.borrowerName}</p>
                  </div>
                  <p className="text-sm text-muted-foreground shrink-0 tabular-nums">{l.dueOn}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Collection by category */}
        <section className={`${CARD} p-4 sm:p-5`}>
          <h2 className="font-semibold mb-4">Collection by subject</h2>
          {isLoading ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-7 rounded bg-muted animate-pulse" />)}
            </div>
          ) : !d?.byCategory.length ? (
            <EmptyState title="Nothing catalogued yet" />
          ) : (
            <ul className="space-y-2.5">
              {d.byCategory.map((c) => (
                <li key={c.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="truncate">{c.label}</span>
                    <span className="text-muted-foreground tabular-nums shrink-0 ml-2">{c.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(c.count / maxCategory) * 100}%`,
                        backgroundColor: c.color || 'var(--primary)',
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Most borrowed */}
        <section className={`${CARD} p-4 sm:p-5`}>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" aria-hidden /> Most borrowed
          </h2>
          {isLoading ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-7 rounded bg-muted animate-pulse" />)}
            </div>
          ) : !d?.mostBorrowed.length ? (
            <EmptyState title="No loans recorded yet" subtitle="Once books start moving, the favourites show up here." />
          ) : (
            <ol className="space-y-2.5">
              {d.mostBorrowed.map((b, i) => (
                <li key={b.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="truncate">
                      <span className="text-muted-foreground tabular-nums mr-2">{i + 1}.</span>
                      {b.label}
                    </span>
                    <span className="text-muted-foreground tabular-nums shrink-0 ml-2">{b.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(b.count / maxBorrowed) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  )
}
