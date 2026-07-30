'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeftRight, RotateCcw, RefreshCw, Search, X, Save } from 'lucide-react'
import { libraryApi, type Loan } from '@/lib/library/api'
import { money, toMinor } from '@/lib/offerings/api'
import {
  CARD, PageHeader, EmptyState, ErrorState, TableSkeleton, Chip, btn, field, Label,
} from '@/components/offerings/ui'

const TABS = [
  { key: 'open', label: 'Out now' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'returned', label: 'Returned' },
  { key: 'all', label: 'Everything' },
]

const CONDITIONS = ['good', 'fair', 'poor', 'damaged']

export default function LoansPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('open')
  const [borrower, setBorrower] = useState('')
  const [query, setQuery] = useState('')
  const [returning, setReturning] = useState<Loan | null>(null)
  const [ret, setRet] = useState({ condition: 'good', paid: '', waive: false })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['library', 'loans', status, query],
    queryFn: () => libraryApi.loans({ status, borrower: query || undefined }),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['library'] })

  const doReturn = useMutation({
    mutationFn: () =>
      libraryApi.returnLoan(returning!.id, {
        condition_in: ret.condition,
        fee_paid: ret.waive ? 0 : toMinor(ret.paid) ?? 0,
        waive_fee: ret.waive,
      }),
    onSuccess: (r: { feeAssessed: number; feePaid: number; holdNotified: boolean }) => {
      invalidate()
      const owed = r.feeAssessed - r.feePaid
      toast.success(
        owed > 0 ? `Returned — ${money(owed)} still owed`
          : r.holdNotified ? 'Returned — the next person has been notified'
          : 'Returned'
      )
      setReturning(null)
      setRet({ condition: 'good', paid: '', waive: false })
    },
    onError: (e: Error) => toast.error(e.message || 'Could not record this return'),
  })

  const renew = useMutation({
    mutationFn: (id: string) => libraryApi.renew(id),
    onSuccess: (r: { dueOn: string; renewals: number }) => {
      invalidate()
      toast.success(`Renewed — now due ${r.dueOn}`)
    },
    // The refusals here are deliberate: a queue is waiting, or the renewal
    // limit is reached. Show the reason rather than a generic failure.
    onError: (e: Error) => toast.error(e.message || 'Could not renew this loan'),
  })

  const openReturn = (l: Loan) => {
    setReturning(l)
    setRet({ condition: l.conditionOut || 'good', paid: l.feeAccruing ? String(l.feeAccruing / 100) : '', waive: false })
  }

  return (
    <>
      <PageHeader
        title="Circulation"
        subtitle="What is out, what is late, and what came back"
        actions={
          <Link href="/admin/library/catalogue" className={btn.primary}>
            <ArrowLeftRight className="size-4" aria-hidden /> Lend a book
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div role="tablist" aria-label="Loan status" className="inline-flex rounded-xl border border-border bg-card p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={status === t.key}
              type="button"
              onClick={() => setStatus(t.key)}
              className={`min-h-9 px-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                status === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(borrower.trim()) }} className="relative flex-1 min-w-[14rem]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden />
          <input
            className={`${field} pl-9`}
            placeholder="Find a borrower"
            aria-label="Find a borrower"
            value={borrower}
            onChange={(e) => setBorrower(e.target.value)}
          />
        </form>
      </div>

      <div className={`${CARD} overflow-hidden`}>
        {error ? (
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton cols={6} />
        ) : !data?.length ? (
          <EmptyState
            icon={ArrowLeftRight}
            title={status === 'overdue' ? 'Nothing is overdue' : 'No loans here'}
            subtitle={status === 'overdue' ? 'Every book is back or still within its loan period.' : 'Lend a book from the catalogue to see it here.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {['Book', 'Borrower', 'Out', 'Due', 'Fee', ''].map((h, i) => (
                    <th key={i} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/library/catalogue/${l.bookId}`} className="font-medium hover:text-primary transition-colors">
                        {l.bookTitle}
                      </Link>
                      <p className="text-xs text-muted-foreground font-mono">{l.copyCode}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{l.borrowerName}</p>
                      {l.borrowerContact && <p className="text-xs text-muted-foreground">{l.borrowerContact}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums whitespace-nowrap">{l.borrowedOn}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {l.returnedOn ? (
                        <Chip className="bg-green-100 text-green-800 border-green-200">Back {l.returnedOn}</Chip>
                      ) : l.daysOverdue > 0 ? (
                        <Chip className="bg-red-100 text-red-800 border-red-200">
                          {l.daysOverdue} day{l.daysOverdue === 1 ? '' : 's'} late
                        </Chip>
                      ) : (
                        <span className="tabular-nums">{l.dueOn}</span>
                      )}
                      {l.renewals > 0 && (
                        <span className="ml-1.5 text-xs text-muted-foreground">·{l.renewals} renewal{l.renewals === 1 ? '' : 's'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                      {l.returnedOn ? (
                        l.feeAssessed > 0
                          ? <span className={l.feeAssessed > l.feePaid ? 'text-red-700' : ''}>
                              {money(l.feeAssessed)}{l.feeAssessed > l.feePaid ? ` (${money(l.feeAssessed - l.feePaid)} owed)` : ''}
                            </span>
                          : '—'
                      ) : l.feeAccruing > 0 ? (
                        <span className="text-muted-foreground">{money(l.feeAccruing)} so far</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {!l.returnedOn && (
                        <div className="inline-flex gap-1">
                          <button type="button" onClick={() => renew.mutate(l.id)} disabled={renew.isPending} className={btn.ghost} title="Extend the due date">
                            <RefreshCw className="size-3.5" aria-hidden /> Renew
                          </button>
                          <button type="button" onClick={() => openReturn(l)} className={btn.secondary}>
                            <RotateCcw className="size-3.5" aria-hidden /> Return
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Return dialog */}
      {returning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setReturning(null)} aria-label="Cancel" />
          <div role="dialog" aria-modal="true" aria-labelledby="ret-title" className={`${CARD} relative w-full max-w-md p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h2 id="ret-title" className="font-semibold">Return {returning.copyCode}</h2>
              <button type="button" onClick={() => setReturning(null)} className={btn.ghost} aria-label="Close">
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {returning.bookTitle} — {returning.borrowerName}
            </p>

            <form onSubmit={(e) => { e.preventDefault(); doReturn.mutate() }} className="space-y-4">
              <div>
                <Label htmlFor="r-cond" hint="A damaged copy leaves circulation">Condition</Label>
                <select id="r-cond" className={field} value={ret.condition} onChange={(e) => setRet((s) => ({ ...s, condition: e.target.value }))}>
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>

              {returning.feeAccruing > 0 && (
                <>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    {returning.daysOverdue} day{returning.daysOverdue === 1 ? '' : 's'} overdue —
                    {' '}<strong>{money(returning.feeAccruing)}</strong> would be charged.
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border"
                      checked={ret.waive}
                      onChange={(e) => setRet((s) => ({ ...s, waive: e.target.checked }))}
                    />
                    Waive the fee
                  </label>
                  {!ret.waive && (
                    <div>
                      <Label htmlFor="r-paid" hint="Leave blank if they will pay later">Paid now (Rs)</Label>
                      <input id="r-paid" inputMode="decimal" className={field} value={ret.paid} onChange={(e) => setRet((s) => ({ ...s, paid: e.target.value }))} />
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setReturning(null)} className={btn.secondary}>Cancel</button>
                <button type="submit" disabled={doReturn.isPending} className={btn.primary}>
                  <Save className="size-4" aria-hidden />
                  {doReturn.isPending ? 'Saving…' : 'Record return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
