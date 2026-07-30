'use client'

import { useQuery } from '@tanstack/react-query'
import { Wallet, PiggyBank, AlertTriangle, Coins } from 'lucide-react'
import { money } from '@/lib/offerings/api'
import { insightsApi } from '@/lib/offerings/insights'
import {
  CARD, PageHeader, StatTile, EmptyState, ErrorState, TableSkeleton, Chip,
} from '@/components/offerings/ui'

/**
 * What each fund holds, and how it moved.
 *
 * Balances come from `offering_allocations`, not from the `fund_id` on the
 * offering header: an offering can be split across funds, and summing the
 * header would count a split gift twice.
 */
export default function FundsPage() {
  const { data, isLoading, isError, error, failureReason, refetch, isFetching } = useQuery({
    queryKey: ['offering-fund-balances'],
    queryFn: insightsApi.fundBalances,
  })
  const failure = (error ?? failureReason) as (Error & { isForbidden?: boolean }) | null

  const funds = data?.funds ?? []
  const months = [...new Set((data?.movement ?? []).map((m) => m.month))].sort()
  const byFund = new Map<string, Map<string, number>>()
  for (const m of data?.movement ?? []) {
    if (!byFund.has(m.fundName)) byFund.set(m.fundName, new Map())
    byFund.get(m.fundName)!.set(m.month, m.amount)
  }
  const peak = Math.max(1, ...(data?.movement ?? []).map((m) => m.amount))

  return (
    <>
      <PageHeader title="Funds" subtitle="Balances and movement per fund" />

      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <StatTile label="Allocated in total" value={money(data?.totalAllocated ?? 0)} icon={Wallet} loading={isLoading} />
        <StatTile label="Funds" value={funds.length} hint={`${funds.filter((f) => f.isActive).length} open`} icon={PiggyBank} loading={isLoading} />
        <StatTile
          label="This month"
          value={money(funds.reduce((s, f) => s + f.thisMonth, 0))}
          icon={Coins}
          loading={isLoading}
        />
        {/* A number that should be zero, shown because it sometimes is not. */}
        <StatTile
          label="Reached no fund"
          value={money(data?.unallocated ?? 0)}
          hint={data?.unallocated ? 'Counted giving with no allocation' : 'Everything is allocated'}
          icon={AlertTriangle}
          tone={data?.unallocated ? 'warn' : 'good'}
          loading={isLoading}
        />
      </div>

      <div className={`${CARD} overflow-hidden mb-4`}>
        {isError || (!isLoading && !isFetching && !data) ? (
          <ErrorState message={failure?.message} forbidden={failure?.isForbidden} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <TableSkeleton cols={6} />
        ) : !funds.length ? (
          <EmptyState icon={Wallet} title="No funds yet" subtitle="Create a fund to direct giving to it." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-card/95 border-b border-border">
                <tr>
                  {['Fund', 'Balance', 'Share', 'This month', 'This year', 'Gifts', 'Last movement'].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {funds.map((f) => (
                  <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium">{f.name}</span>
                      {!f.isActive && <Chip className="ml-2 bg-muted text-muted-foreground border-border">closed</Chip>}
                      {f.description && <p className="text-xs text-muted-foreground truncate max-w-[28rem]">{f.description}</p>}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums whitespace-nowrap">{money(f.allocated)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block h-1.5 w-16 rounded-full bg-muted overflow-hidden" aria-hidden>
                          <span className="block h-full bg-primary" style={{ width: `${Math.min(100, f.sharePercent)}%` }} />
                        </span>
                        <span className="tabular-nums text-xs text-muted-foreground">{f.sharePercent}%</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums whitespace-nowrap">{money(f.thisMonth)}</td>
                    <td className="px-4 py-3 tabular-nums whitespace-nowrap">{money(f.thisYear)}</td>
                    <td className="px-4 py-3 tabular-nums">{f.offeringCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{f.lastMovementOn ?? 'never'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {months.length > 0 && (
        <section className={`${CARD} p-4 sm:p-5`}>
          <h2 className="font-semibold mb-1">Movement over the last year</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Allocated per fund, per month. Bar height is relative to the largest month shown.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th scope="col" className="text-left py-2 pr-4 font-medium text-muted-foreground">Fund</th>
                  {months.map((m) => (
                    <th key={m} scope="col" className="py-2 px-1 font-medium text-muted-foreground whitespace-nowrap">{m.slice(2)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...byFund.entries()].map(([name, series]) => (
                  <tr key={name}>
                    <th scope="row" className="text-left py-1.5 pr-4 font-normal truncate max-w-[12rem]">{name}</th>
                    {months.map((m) => {
                      const v = series.get(m) ?? 0
                      return (
                        <td key={m} className="py-1.5 px-1 align-bottom">
                          <span
                            className="block w-full rounded-sm bg-primary/80"
                            style={{ height: `${Math.max(2, (v / peak) * 36)}px` }}
                            title={`${name}, ${m}: ${money(v)}`}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}
