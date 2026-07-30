'use client'

import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp, TrendingDown, Users, UserPlus, UserMinus, Scale, PieChart, AlertTriangle,
} from 'lucide-react'
import { money } from '@/lib/offerings/api'
import { insightsApi, type LabelAmount } from '@/lib/offerings/insights'
import {
  CARD, PageHeader, StatTile, ErrorState, TableSkeleton,
} from '@/components/offerings/ui'

/**
 * Trends, growth and giving behaviour.
 *
 * The year-on-year figure compares the same *span* of last year, not the whole
 * of it — eight months against twelve invents a collapse in giving that never
 * happened.
 */
export default function AnalyticsPage() {
  const { data, isLoading, isError, error, failureReason, refetch, isFetching } = useQuery({
    queryKey: ['offering-analytics'],
    queryFn: insightsApi.analytics,
  })
  const failure = (error ?? failureReason) as (Error & { isForbidden?: boolean }) | null

  if (isError || (!isLoading && !isFetching && !data)) {
    return (
      <>
        <PageHeader title="Analytics" subtitle="Trends, growth and giving behaviour" />
        <div className={CARD}>
          <ErrorState message={failure?.message} forbidden={failure?.isForbidden} onRetry={() => refetch()} />
        </div>
      </>
    )
  }
  if (isLoading || !data) {
    return (
      <>
        <PageHeader title="Analytics" subtitle="Trends, growth and giving behaviour" />
        <div className={CARD}><TableSkeleton cols={4} /></div>
      </>
    )
  }

  const peak = Math.max(1, ...data.months.map((m) => m.amount))
  const up = (data.growthPercent ?? 0) >= 0

  return (
    <>
      <PageHeader title="Analytics" subtitle="Trends, growth and giving behaviour" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <StatTile label="Given this year" value={money(data.yearToDate)} icon={TrendingUp} />
        <StatTile
          label="Same span last year"
          value={money(data.sameSpanLastYear)}
          hint={
            data.growthPercent === null
              ? 'Nothing to compare against yet'
              : `${up ? '+' : ''}${data.growthPercent}% year on year`
          }
          icon={up ? TrendingUp : TrendingDown}
          tone={data.growthPercent === null ? 'default' : up ? 'good' : 'warn'}
        />
        {/* The median matters more than the mean: one large gift drags an
            average somewhere no actual gift sits. */}
        <StatTile
          label="Typical gift"
          value={money(data.medianGift)}
          hint={`Median. The mean is ${money(data.averageGift)}`}
          icon={Scale}
        />
        <StatTile
          label="Top ten donors give"
          value={`${data.topDonorSharePercent}%`}
          hint="Of all named giving"
          icon={AlertTriangle}
          tone={data.topDonorSharePercent > 60 ? 'warn' : 'default'}
        />
      </div>

      <section className={`${CARD} p-4 sm:p-5 mb-4`}>
        <h2 className="font-semibold mb-1">Giving by month</h2>
        <p className="text-xs text-muted-foreground mb-4">The last twelve months, gap-filled — a month with no giving is a gap, not a missing bar.</p>
        <div className="flex items-end gap-1.5 h-40" role="img" aria-label="Giving by month for the last twelve months">
          {data.months.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
              <span
                className="w-full rounded-t bg-primary/80 hover:bg-primary transition-colors"
                style={{ height: `${Math.max(2, (m.amount / peak) * 100)}%` }}
                title={`${m.month}: ${money(m.amount)} from ${m.donors} donor${m.donors === 1 ? '' : 's'}`}
              />
              <span className="text-[10px] text-muted-foreground truncate w-full text-center">{m.month.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <StatTile label="Gave again this year" value={data.returningDonors} hint="Also gave last year" icon={Users} />
        <StatTile label="New this year" value={data.newDonors} hint="First gift this year" icon={UserPlus} tone="good" />
        <StatTile
          label="Stopped"
          value={data.lapsedDonors}
          hint={data.lapsedDonors ? 'Gave last year, nothing this year' : 'Nobody has stopped'}
          icon={UserMinus}
          tone={data.lapsedDonors ? 'warn' : 'good'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown title="How it arrives" rows={data.byMethod} />
        <Breakdown title="What it is for" rows={data.byCategory} />
        <Breakdown title="Who gives" rows={data.byGiverType} />
        <Breakdown title="Which day" rows={data.byWeekday} />
      </div>
    </>
  )
}

function Breakdown({ title, rows }: { title: string; rows: LabelAmount[] }) {
  const total = rows.reduce((s, r) => s + r.amount, 0)
  return (
    <section className={`${CARD} p-4 sm:p-5`}>
      <h2 className="font-semibold mb-3 flex items-center gap-2">
        <PieChart className="size-4 text-muted-foreground" aria-hidden /> {title}
      </h2>
      {!rows.length ? (
        <p className="text-sm text-muted-foreground">Nothing recorded.</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.label}>
              <div className="flex items-center justify-between gap-3 text-sm mb-1">
                <span className="truncate capitalize">{r.label.replace(/_/g, ' ')}</span>
                <span className="tabular-nums shrink-0">
                  {money(r.amount)} <span className="text-muted-foreground">({r.count})</span>
                </span>
              </div>
              <span className="block h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden>
                <span
                  className="block h-full bg-primary"
                  style={{ width: `${total ? (r.amount / total) * 100 : 0}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
