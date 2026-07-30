'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Search, ChevronLeft, ChevronRight, Link2, HelpCircle, X, TrendingUp } from 'lucide-react'
import { money } from '@/lib/offerings/api'
import { insightsApi, type DonorRow } from '@/lib/offerings/insights'
import {
  CARD, PageHeader, StatTile, EmptyState, ErrorState, TableSkeleton, Chip, btn, field,
} from '@/components/offerings/ui'

/**
 * Who gives, and how much.
 *
 * Every total is a `SUM` computed on read, so a correction to one offering
 * moves this page immediately rather than whenever something remembers to
 * recalculate.
 */

const SORTS = [
  { key: 'total', label: 'Most given' },
  { key: 'gifts', label: 'Most gifts' },
  { key: 'last', label: 'Most recent' },
  { key: 'largest', label: 'Largest single gift' },
  { key: 'name', label: 'Name' },
]

export default function DonorsPage() {
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [linked, setLinked] = useState('')
  const [sort, setSort] = useState('total')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<DonorRow | null>(null)

  const { data, isLoading, isError, error, failureReason, refetch, isFetching } = useQuery({
    queryKey: ['offering-donors', { search, linked, sort, page }],
    queryFn: () => insightsApi.donors({ search, linked, sort, page, per_page: 25 }),
  })
  // While a query is retrying, `error` is null and only failureReason knows why.
  const failure = (error ?? failureReason) as (Error & { isForbidden?: boolean }) | null
  const rows = data?.data ?? []

  return (
    <>
      <PageHeader title="Donors" subtitle="Giving history, per person" />

      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <StatTile label="Donors" value={data?.total ?? 0} icon={Users} loading={isLoading} />
        <StatTile
          label="Anonymous giving"
          value={money(data?.anonymousTotal ?? 0)}
          hint={`${data?.anonymousCount ?? 0} gifts that name nobody`}
          icon={HelpCircle}
          loading={isLoading}
        />
        <StatTile
          label="Linked to a person"
          value={`${rows.filter((d) => d.isLinked).length} of ${rows.length}`}
          hint="On this page"
          icon={Link2}
          loading={isLoading}
        />
        <StatTile
          label="Largest single gift"
          value={money(rows.length ? Math.max(...rows.map((d) => d.largestGift)) : 0)}
          hint="On this page"
          icon={TrendingUp}
          loading={isLoading}
        />
      </div>

      <div className={`${CARD} p-3 sm:p-4 mb-4`}>
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(draft.trim()); setPage(1) }}
          className="grid gap-3 sm:grid-cols-3"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden />
            <input
              className={`${field} pl-9`}
              placeholder="Name or email"
              aria-label="Search donors"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </div>
          <select className={field} aria-label="Sort donors by" value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1) }}>
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select className={field} aria-label="Filter by whether the donor has a person record"
            value={linked} onChange={(e) => { setLinked(e.target.value); setPage(1) }}>
            <option value="">Everyone</option>
            <option value="yes">Linked to a person record</option>
            <option value="no">Name only, not linked</option>
          </select>
        </form>
      </div>

      <div className={`${CARD} overflow-hidden`}>
        {isError || (!isLoading && !isFetching && !data) ? (
          <ErrorState message={failure?.message} forbidden={failure?.isForbidden} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <TableSkeleton cols={6} />
        ) : !rows.length ? (
          <EmptyState
            icon={Users}
            title={search ? 'Nobody matches that' : 'No giving recorded yet'}
            subtitle={search ? 'Try a different name.' : 'Donors appear here once offerings name them.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-card/95 border-b border-border">
                <tr>
                  {['Donor', 'Given', 'Gifts', 'Average', 'Largest', 'Last gift'].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.donorKey} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelected(d)}
                        aria-label={`Giving history for ${d.name}`}
                        className="font-medium hover:text-primary transition-colors text-left"
                      >
                        {d.name}
                      </button>
                      <p className="text-xs text-muted-foreground">
                        {d.email || d.phone || 'No contact recorded'}
                        {/* Said plainly: a total built from a typed name may be
                            two different people who share it. */}
                        {!d.isLinked && (
                          <span title="Grouped by the name typed on each offering, not a person record">
                            {' · name only'}
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums whitespace-nowrap">{money(d.totalGiven)}</td>
                    <td className="px-4 py-3 tabular-nums">{d.giftCount}</td>
                    <td className="px-4 py-3 tabular-nums whitespace-nowrap text-muted-foreground">{money(d.averageGift)}</td>
                    <td className="px-4 py-3 tabular-nums whitespace-nowrap text-muted-foreground">{money(d.largestGift)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {d.lastGiftOn ?? '—'}
                      {d.daysSinceLast !== null && d.daysSinceLast > 120 && (
                        <Chip className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                          {Math.floor(d.daysSinceLast / 30)} months ago
                        </Chip>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!!rows.length && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {data!.total} donor{data!.total === 1 ? '' : 's'} · page {data!.page} of {data!.totalPages}
            </p>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className={btn.secondary} aria-label="Previous page">
                <ChevronLeft className="size-4" aria-hidden /> Prev
              </button>
              <button type="button" disabled={page >= (data?.totalPages ?? 1)} onClick={() => setPage(page + 1)} className={btn.secondary} aria-label="Next page">
                Next <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && <DonorPanel donorKey={selected.donorKey} onClose={() => setSelected(null)} />}
    </>
  )
}

function DonorPanel({ donorKey, onClose }: { donorKey: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['offering-donor', donorKey],
    queryFn: () => insightsApi.donor(donorKey),
  })

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="Donor giving history"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-xl h-full overflow-y-auto bg-card border-l border-border">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 p-5 bg-card border-b border-border">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">{data?.donor.name ?? 'Loading…'}</h2>
            {data && (
              <p className="text-sm text-muted-foreground">
                {money(data.donor.totalGiven)} over {data.donor.giftCount} gift
                {data.donor.giftCount === 1 ? '' : 's'}
                {data.donor.firstGiftOn && ` since ${data.donor.firstGiftOn}`}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted shrink-0">
            <X className="size-4" aria-hidden />
          </button>
        </div>

        {isLoading || !data ? (
          <div className="p-5"><TableSkeleton cols={3} /></div>
        ) : (
          <div className="p-5 space-y-6">
            {!data.donor.isLinked && (
              <p className="text-xs text-muted-foreground rounded-xl bg-muted p-3">
                These gifts are grouped by the name typed on each offering. If two
                people share that name this total covers both — link the giving to a
                person record to be certain.
              </p>
            )}

            <section>
              <h3 className="font-medium mb-2">Where it went</h3>
              {!data.byFund.length ? (
                <p className="text-sm text-muted-foreground">Nothing allocated to a fund.</p>
              ) : (
                <ul className="space-y-1.5">
                  {data.byFund.map((f) => (
                    <li key={f.label} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{f.label}</span>
                      <span className="tabular-nums shrink-0">{money(f.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="font-medium mb-2">By year</h3>
              <ul className="space-y-1.5">
                {data.byYear.map((y) => (
                  <li key={y.label} className="flex items-center justify-between gap-3 text-sm">
                    <span>{y.label}</span>
                    <span className="tabular-nums">
                      {money(y.amount)} <span className="text-muted-foreground">({y.count})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="font-medium mb-2">Every gift</h3>
              <ul className="divide-y divide-border">
                {data.gifts.map((g) => (
                  <li key={g.id} className="py-2 flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate">{g.serviceName || 'Offering'}</span>
                      <span className="block text-xs text-muted-foreground">
                        {g.serviceDate}
                        {g.fundName && ` · ${g.fundName}`}
                        {g.receiptNo && ` · ${g.receiptNo}`}
                      </span>
                    </span>
                    <span className="tabular-nums shrink-0">{money(g.totalAmount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
