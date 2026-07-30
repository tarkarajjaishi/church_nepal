'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Receipt, Search, Printer, Send, Hash, CheckCircle2, ChevronLeft, ChevronRight, Mail,
} from 'lucide-react'
import { money } from '@/lib/offerings/api'
import { insightsApi, openReceiptPdf, type ReceiptRow } from '@/lib/offerings/insights'
import {
  CARD, PageHeader, StatTile, EmptyState, ErrorState, TableSkeleton, Chip, btn, field,
} from '@/components/offerings/ui'

/**
 * Issue, reprint and send receipts.
 *
 * Issuing takes a number from a locked sequence and is idempotent — an
 * offering that already carries one keeps it. Reprinting is not re-issuing,
 * which is why Print changes nothing.
 */

const VIEWS = [
  { key: '', label: 'All receipts' },
  { key: 'unissued', label: 'Waiting for a number' },
  { key: 'issued', label: 'Numbered' },
  { key: 'unsent', label: 'Not sent yet' },
  { key: 'sent', label: 'Sent' },
]

export default function ReceiptsPage() {
  const qc = useQueryClient()
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [view, setView] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState<ReceiptRow | null>(null)

  const { data, isLoading, isError, error, failureReason, refetch, isFetching } = useQuery({
    queryKey: ['offering-receipts', { search, view, page }],
    queryFn: () => insightsApi.receipts({ search, view, page, per_page: 25 }),
  })
  const failure = (error ?? failureReason) as (Error & { isForbidden?: boolean }) | null
  const rows = data?.data ?? []

  const invalidate = () => qc.invalidateQueries({ queryKey: ['offering-receipts'] })

  const issueOne = useMutation({
    mutationFn: (id: string) => insightsApi.issue(id),
    onSuccess: (r) => {
      invalidate()
      toast.success(r.issued ? `Issued ${r.receiptNo}` : `Already numbered ${r.receiptNo}`)
    },
    onError: (e: Error) => toast.error(e.message || 'Could not issue a receipt number'),
  })

  const issueMany = useMutation({
    mutationFn: (ids: string[]) => insightsApi.issueBulk(ids),
    onSuccess: (r) => {
      invalidate()
      setSelected(new Set())
      // Reports what changed rather than what was asked for: anything already
      // numbered keeps its number and is skipped.
      toast.success(
        r.skipped ? `Issued ${r.issued} — ${r.skipped} already had a number` : `Issued ${r.issued}`
      )
    },
    onError: (e: Error) => toast.error(e.message || 'Could not issue those receipts'),
  })

  const toggle = (ids: string[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of ids) { if (on) next.add(id); else next.delete(id) }
      return next
    })

  const selectableOnPage = rows.filter((r) => !r.issued).map((r) => r.id)

  return (
    <>
      <PageHeader
        title="Receipts"
        subtitle="Issue, reprint and send"
        actions={
          selected.size > 0 ? (
            <button
              type="button"
              onClick={() => issueMany.mutate([...selected])}
              disabled={issueMany.isPending}
              className={btn.primary}
            >
              <Hash className="size-4" aria-hidden />
              Issue {selected.size} number{selected.size === 1 ? '' : 's'}
            </button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <StatTile label="Receipts" value={data?.total ?? 0} icon={Receipt} loading={isLoading} />
        <StatTile
          label="Waiting for a number"
          value={data?.unissuedCount ?? 0}
          hint={data?.unissuedCount ? 'Submitted but not numbered' : 'Everything is numbered'}
          icon={Hash}
          tone={data?.unissuedCount ? 'warn' : 'good'}
          loading={isLoading}
        />
        <StatTile label="Sent to the donor" value={data?.sentCount ?? 0} icon={Mail} loading={isLoading} />
        <StatTile label="Value receipted" value={money(data?.totalAmount ?? 0)} icon={CheckCircle2} loading={isLoading} />
      </div>

      <div className={`${CARD} p-3 sm:p-4 mb-4`}>
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(draft.trim()); setPage(1) }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden />
            <input
              className={`${field} pl-9`}
              placeholder="Receipt number, donor or reference"
              aria-label="Search receipts"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </div>
          <select
            className={field}
            aria-label="Filter receipts"
            value={view}
            onChange={(e) => { setView(e.target.value); setPage(1); setSelected(new Set()) }}
          >
            {VIEWS.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
          </select>
        </form>
      </div>

      <div className={`${CARD} overflow-hidden`}>
        {isError || (!isLoading && !isFetching && !data) ? (
          <ErrorState message={failure?.message} forbidden={failure?.isForbidden} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <TableSkeleton cols={7} />
        ) : !rows.length ? (
          <EmptyState
            icon={Receipt}
            title={search || view ? 'Nothing matches that' : 'No receipts yet'}
            subtitle={search || view ? 'Try a different filter.' : 'Receipts appear once offerings are submitted.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-card/95 border-b border-border">
                <tr>
                  <th scope="col" className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border"
                      aria-label="Select every unnumbered receipt on this page"
                      disabled={!selectableOnPage.length}
                      checked={!!selectableOnPage.length && selectableOnPage.every((id) => selected.has(id))}
                      onChange={(e) => toggle(selectableOnPage, e.target.checked)}
                    />
                  </th>
                  {['Receipt', 'Donor', 'Date', 'Fund', 'Amount', 'Sent'].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b border-border last:border-0 transition-colors ${
                      selected.has(r.id) ? 'bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      {!r.issued && (
                        <input
                          type="checkbox"
                          className="size-4 rounded border-border"
                          aria-label={`Select the offering from ${r.donorName} on ${r.serviceDate}`}
                          checked={selected.has(r.id)}
                          onChange={(e) => toggle([r.id], e.target.checked)}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.issued ? (
                        <span className="font-mono text-xs">{r.receiptNo}</span>
                      ) : (
                        <Chip className="bg-amber-100 text-amber-800 border-amber-200">not numbered</Chip>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{r.donorName}</span>
                      {r.donorEmail && (
                        <p className="text-xs text-muted-foreground truncate max-w-[16rem]">{r.donorEmail}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.serviceDate}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.fundName ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums whitespace-nowrap">{money(r.totalAmount)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {r.sentAt ? (
                        <span className="text-green-700">{r.sentAt.slice(0, 10)}</span>
                      ) : (
                        <span className="text-muted-foreground">not sent</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {!r.issued ? (
                          <button
                            type="button"
                            onClick={() => issueOne.mutate(r.id)}
                            disabled={issueOne.isPending}
                            aria-label={`Issue a receipt number for ${r.donorName}`}
                            className={btn.secondary}
                          >
                            <Hash className="size-3.5" aria-hidden /> Issue
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                openReceiptPdf(r.id, r.receiptNo).catch((e: Error) =>
                                  toast.error(e.message || 'Could not open that receipt')
                                )
                              }
                              aria-label={`Print receipt ${r.receiptNo}`}
                              title="Print"
                              className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors"
                            >
                              <Printer className="size-4" aria-hidden />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSending(r)}
                              aria-label={`Send receipt ${r.receiptNo} to the donor`}
                              title="Send"
                              className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors"
                            >
                              <Send className="size-4" aria-hidden />
                            </button>
                          </>
                        )}
                      </div>
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
              {data!.total} receipt{data!.total === 1 ? '' : 's'} · page {data!.page} of {data!.totalPages}
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

      {sending && <SendDialog row={sending} onClose={() => setSending(null)} onSent={invalidate} />}
    </>
  )
}

function SendDialog({
  row,
  onClose,
  onSent,
}: {
  row: ReceiptRow
  onClose: () => void
  onSent: () => void
}) {
  const [email, setEmail] = useState(row.donorEmail)

  const send = useMutation({
    mutationFn: () => insightsApi.send(row.id, email.trim() || undefined),
    onSuccess: (r) => { onSent(); toast.success(`Sent to ${r.sentTo}`); onClose() },
    // Fails loudly when SMTP is not configured, rather than reporting success
    // beside a "sent" column that would then be a lie.
    onError: (e: Error) => toast.error(e.message || 'Could not send the receipt'),
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={`Send receipt ${row.receiptNo}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`${CARD} w-full max-w-md p-5`}>
        <h2 className="font-semibold">Send receipt {row.receiptNo}</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          {money(row.totalAmount)} from {row.donorName} on {row.serviceDate}.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); send.mutate() }} className="space-y-3">
          <label htmlFor="receipt-email" className="block text-sm font-medium">Send to</label>
          <input
            id="receipt-email"
            type="email"
            required
            autoFocus
            className={field}
            placeholder="donor@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {!row.donorEmail && (
            <p className="text-xs text-muted-foreground">
              This donor has no email on record, so what you type here is used once
              and not remembered.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className={btn.secondary}>Cancel</button>
            <button type="submit" disabled={!email.trim() || send.isPending} className={btn.primary}>
              <Send className="size-4" aria-hidden /> {send.isPending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
