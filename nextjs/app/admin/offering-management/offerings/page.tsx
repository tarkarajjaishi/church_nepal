'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Search,
  Filter,
  X,
  Check,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  ReceiptText,
  ArrowUpDown,
  EyeOff,
} from 'lucide-react'
import {
  offeringsApi,
  money,
  methodLabel,
  PAYMENT_METHODS,
  STATUS_LABELS,
  STATUS_STYLES,
  type OfferingFilters,
  type OfferingRow,
  type OfferingStatus,
} from '@/lib/offerings/api'
import {
  CARD,
  PageHeader,
  EmptyState,
  ErrorState,
  TableSkeleton,
  Chip,
  btn,
  field,
} from '@/components/offerings/ui'

const STATUSES: OfferingStatus[] = ['draft', 'submitted', 'counted', 'approved', 'rejected']

const COLUMNS = [
  { key: 'receipt', label: 'Receipt', sortable: true },
  { key: 'date', label: 'Date', sortable: true, sort: 'date' },
  { key: 'service', label: 'Service' },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'donor', label: 'Donor', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true, align: 'right' as const },
  { key: 'method', label: 'Method' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'entered', label: 'Entered By' },
  { key: 'approved', label: 'Approved By' },
]

export default function OfferingsTablePage() {
  const qc = useQueryClient()
  const [filters, setFilters] = useState<OfferingFilters>({ page: 1, perPage: 25 })
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searchDraft, setSearchDraft] = useState('')

  const { data: categories } = useQuery({
    queryKey: ['offering-categories'],
    queryFn: offeringsApi.categories,
    staleTime: 5 * 60_000,
  })

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['offerings-table', filters],
    queryFn: () => offeringsApi.list(filters),
    // Keeps the previous page visible while the next loads, so the table does
    // not collapse to a skeleton on every filter keystroke.
    placeholderData: (prev) => prev,
  })

  const rows = data?.data ?? []
  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id))

  const activeFilterCount = useMemo(
    () =>
      (['fromDate', 'toDate', 'categoryId', 'paymentMethod', 'status', 'donor', 'minAmount', 'maxAmount', 'search'] as const)
        .filter((k) => filters[k]).length,
    [filters]
  )

  const patch = (p: Partial<OfferingFilters>) =>
    setFilters((f) => ({ ...f, ...p, page: p.page ?? 1 }))

  const clearFilters = () => {
    setFilters({ page: 1, perPage: filters.perPage })
    setSearchDraft('')
  }

  const toggleSort = (key: string) => {
    setFilters((f) => ({
      ...f,
      sort: key,
      dir: f.sort === key && f.dir === 'desc' ? 'asc' : 'desc',
      page: 1,
    }))
  }

  const approveMutation = useMutation({
    mutationFn: (ids: string[]) => offeringsApi.bulkApprove(ids),
    onSuccess: (res: { approved: number; skipped: number }) => {
      // Report skipped explicitly. A silent partial success on a finance action
      // would let someone believe they approved rows that they did not.
      if (res.approved > 0) {
        toast.success(
          `Approved ${res.approved} offering${res.approved === 1 ? '' : 's'}` +
            (res.skipped > 0 ? ` — ${res.skipped} skipped (not awaiting approval)` : '')
        )
      } else {
        toast.info('Nothing to approve — the selected offerings are not awaiting approval')
      }
      setSelected(new Set())
      qc.invalidateQueries({ queryKey: ['offerings-table'] })
      qc.invalidateQueries({ queryKey: ['offering-dashboard'] })
    },
    onError: (e: Error) => toast.error(e.message || 'Could not approve the selection'),
  })

  const exportCsv = () => {
    const target = selected.size > 0 ? rows.filter((r) => selected.has(r.id)) : rows
    if (!target.length) return toast.info('Nothing to export')
    const head = [
      'Receipt', 'Date', 'Service', 'Category', 'Fund', 'Donor', 'Anonymous',
      'Amount', 'Currency', 'Payment Method', 'Reference', 'Status', 'Entered By', 'Approved By',
    ]
    // Prefix a leading =,+,-,@ with an apostrophe so a spreadsheet does not
    // evaluate donor-supplied text as a formula.
    const cell = (v: unknown) => {
      const s = String(v ?? '')
      const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
      return `"${safe.replace(/"/g, '""')}"`
    }
    const csv = [
      head.join(','),
      ...target.map((r) =>
        [
          r.receiptNo ?? '', r.serviceDate, r.serviceName, r.categoryName ?? '',
          r.fundName ?? '', r.isAnonymous ? 'Anonymous' : r.donorName,
          r.isAnonymous ? 'Yes' : 'No', (r.totalAmount / 100).toFixed(2), r.currency,
          methodLabel(r.paymentMethod), r.referenceNo, STATUS_LABELS[r.status],
          r.enteredBy, r.approvedBy ?? '',
        ].map(cell).join(',')
      ),
    ].join('\r\n')

    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `offerings-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${target.length} row${target.length === 1 ? '' : 's'}`)
  }

  return (
    <>
      <PageHeader
        title="Offerings"
        subtitle={
          data
            ? `${data.total.toLocaleString()} record${data.total === 1 ? '' : 's'} · ${money(data.filteredTotal)} in view`
            : undefined
        }
        actions={
          <>
            <button type="button" onClick={exportCsv} className={btn.secondary}>
              <Download className="size-4" aria-hidden />
              Export
            </button>
            <button type="button" onClick={() => window.print()} className={btn.secondary}>
              <Printer className="size-4" aria-hidden />
              Print
            </button>
            <Link href="/admin/offering-management/new" className={btn.primary}>
              <PlusCircle className="size-4" aria-hidden />
              Record Offering
            </Link>
          </>
        }
      />

      {/* Search + filter bar */}
      <div className={`${CARD} p-3 sm:p-4 mb-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <form
            className="relative flex-1 min-w-[14rem]"
            onSubmit={(e) => {
              e.preventDefault()
              patch({ search: searchDraft || undefined })
            }}
          >
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
              aria-hidden
            />
            <input
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search receipt, reference, donor or notes…"
              aria-label="Search offerings"
              className={`${field} pl-9`}
            />
          </form>

          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className={btn.secondary}
          >
            <Filter className="size-4" aria-hidden />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button type="button" onClick={clearFilters} className={btn.ghost}>
              <X className="size-4" aria-hidden />
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="f-from" className="block text-xs font-medium text-muted-foreground mb-1">From</label>
              <input id="f-from" type="date" className={field} value={filters.fromDate ?? ''} onChange={(e) => patch({ fromDate: e.target.value || undefined })} />
            </div>
            <div>
              <label htmlFor="f-to" className="block text-xs font-medium text-muted-foreground mb-1">To</label>
              <input id="f-to" type="date" className={field} value={filters.toDate ?? ''} onChange={(e) => patch({ toDate: e.target.value || undefined })} />
            </div>
            <div>
              <label htmlFor="f-cat" className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
              <select id="f-cat" className={field} value={filters.categoryId ?? ''} onChange={(e) => patch({ categoryId: e.target.value || undefined })}>
                <option value="">All categories</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-method" className="block text-xs font-medium text-muted-foreground mb-1">Payment method</label>
              <select id="f-method" className={field} value={filters.paymentMethod ?? ''} onChange={(e) => patch({ paymentMethod: e.target.value || undefined })}>
                <option value="">All methods</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-status" className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <select id="f-status" className={field} value={filters.status ?? ''} onChange={(e) => patch({ status: e.target.value || undefined })}>
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-donor" className="block text-xs font-medium text-muted-foreground mb-1">Donor</label>
              <input id="f-donor" className={field} placeholder="Name contains…" value={filters.donor ?? ''} onChange={(e) => patch({ donor: e.target.value || undefined })} />
            </div>
            <div>
              <label htmlFor="f-min" className="block text-xs font-medium text-muted-foreground mb-1">Min amount</label>
              <input id="f-min" inputMode="decimal" className={field} placeholder="0" value={filters.minAmount ?? ''} onChange={(e) => patch({ minAmount: e.target.value || undefined })} />
            </div>
            <div>
              <label htmlFor="f-max" className="block text-xs font-medium text-muted-foreground mb-1">Max amount</label>
              <input id="f-max" inputMode="decimal" className={field} placeholder="Any" value={filters.maxAmount ?? ''} onChange={(e) => patch({ maxAmount: e.target.value || undefined })} />
            </div>
          </div>
        )}
      </div>

      {/* Bulk action bar — only present when something is selected */}
      {selected.size > 0 && (
        <div
          className={`${CARD} p-3 mb-4 flex flex-wrap items-center gap-2 border-primary/30 bg-primary/5`}
          role="region"
          aria-label="Bulk actions"
        >
          <span className="text-sm font-medium">
            {selected.size} selected
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => approveMutation.mutate([...selected])}
            disabled={approveMutation.isPending}
            className={btn.primary}
          >
            <Check className="size-4" aria-hidden />
            {approveMutation.isPending ? 'Approving…' : 'Approve'}
          </button>
          <button type="button" onClick={exportCsv} className={btn.secondary}>
            <Download className="size-4" aria-hidden />
            Export selected
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className={btn.ghost}>
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className={`${CARD} overflow-hidden`}>
        {isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton cols={7} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title={activeFilterCount > 0 ? 'No offerings match these filters' : 'No offerings recorded yet'}
            subtitle={
              activeFilterCount > 0
                ? 'Try widening the date range or clearing a filter.'
                : 'Record your first offering to see it here.'
            }
            action={
              activeFilterCount > 0 ? (
                <button type="button" onClick={clearFilters} className={btn.secondary}>Clear filters</button>
              ) : (
                <Link href="/admin/offering-management/new" className={btn.primary}>Record Offering</Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  <th scope="col" className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all rows on this page"
                      checked={allOnPageSelected}
                      onChange={(e) =>
                        setSelected((prev) => {
                          const next = new Set(prev)
                          rows.forEach((r) => (e.target.checked ? next.add(r.id) : next.delete(r.id)))
                          return next
                        })
                      }
                      className="size-4 rounded border-border accent-[var(--church-blue)]"
                    />
                  </th>
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      className={`px-3 py-3 font-medium text-muted-foreground whitespace-nowrap ${
                        c.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {c.sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(c.sort ?? c.key)}
                          className="inline-flex items-center gap-1 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                          aria-label={`Sort by ${c.label}`}
                        >
                          {c.label}
                          <ArrowUpDown
                            className={`size-3 ${filters.sort === (c.sort ?? c.key) ? 'text-primary' : 'opacity-40'}`}
                            aria-hidden
                          />
                        </button>
                      ) : (
                        c.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={isFetching ? 'opacity-60 transition-opacity' : ''}>
                {rows.map((r) => (
                  <Row
                    key={r.id}
                    row={r}
                    selected={selected.has(r.id)}
                    onToggle={() =>
                      setSelected((prev) => {
                        const next = new Set(prev)
                        next.has(r.id) ? next.delete(r.id) : next.add(r.id)
                        return next
                      })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground tabular-nums">
              Page {data.page} of {data.totalPages} · {data.total.toLocaleString()} records
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={data.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                className={btn.secondary}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                disabled={data.page >= data.totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                className={btn.secondary}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function Row({
  row: r,
  selected,
  onToggle,
}: {
  row: OfferingRow
  selected: boolean
  onToggle: () => void
}) {
  return (
    <tr className={`border-b border-border last:border-0 transition-colors ${selected ? 'bg-primary/5' : 'hover:bg-muted/50'}`}>
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select offering ${r.receiptNo ?? r.id.slice(0, 8)}`}
          className="size-4 rounded border-border accent-[var(--church-blue)]"
        />
      </td>
      <td className="px-3 py-3 font-mono text-xs whitespace-nowrap">
        {r.receiptNo ?? <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        {r.serviceDate}
        {r.serviceTime && (
          <span className="text-muted-foreground text-xs ml-1">{r.serviceTime.slice(0, 5)}</span>
        )}
      </td>
      <td className="px-3 py-3 max-w-[12rem] truncate" title={r.serviceName}>{r.serviceName}</td>
      <td className="px-3 py-3 whitespace-nowrap">
        {r.categoryName ? (
          <Chip className="bg-muted text-foreground border-border" dot={r.categoryColor}>
            {r.categoryName}
          </Chip>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-3 py-3 max-w-[12rem]">
        {r.isAnonymous ? (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <EyeOff className="size-3.5" aria-hidden />
            Anonymous
          </span>
        ) : (
          <span className="truncate block" title={r.donorName}>
            {r.donorName || <span className="text-muted-foreground">—</span>}
          </span>
        )}
      </td>
      <td className="px-3 py-3 text-right font-medium tabular-nums whitespace-nowrap">
        {money(r.totalAmount, { currency: r.currency === 'NPR' ? 'Rs' : r.currency })}
      </td>
      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
        {methodLabel(r.paymentMethod)}
      </td>
      <td className="px-3 py-3">
        <Chip className={STATUS_STYLES[r.status]}>{STATUS_LABELS[r.status]}</Chip>
      </td>
      <td className="px-3 py-3 max-w-[10rem] truncate text-muted-foreground text-xs" title={r.enteredBy}>
        {r.enteredBy || '—'}
      </td>
      <td className="px-3 py-3 max-w-[10rem] truncate text-muted-foreground text-xs" title={r.approvedBy ?? ''}>
        {r.approvedBy || '—'}
      </td>
    </tr>
  )
}
