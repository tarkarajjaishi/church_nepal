'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ChevronLeft, BookOpen, Monitor, Plus, ArrowLeftRight, Clock, X,
  Wrench, RotateCcw, ExternalLink,
} from 'lucide-react'
import { libraryApi, copyState, type BookCopy } from '@/lib/library/api'
import { money } from '@/lib/offerings/api'
import {
  CARD, PageHeader, EmptyState, ErrorState, Chip, btn, field, Label,
} from '@/components/offerings/ui'

const TONE: Record<string, string> = {
  ok: 'bg-green-100 text-green-800 border-green-200',
  out: 'bg-amber-100 text-amber-800 border-amber-200',
  bad: 'bg-red-100 text-red-800 border-red-200',
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [lending, setLending] = useState<BookCopy | null>(null)
  const [borrower, setBorrower] = useState({ name: '', contact: '' })
  const [holder, setHolder] = useState({ name: '', contact: '' })
  const [addingCopies, setAddingCopies] = useState(false)
  const [copyForm, setCopyForm] = useState({ count: '1', shelf: '' })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['library', 'book', id],
    queryFn: () => libraryApi.book(id),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['library'] })

  const borrow = useMutation({
    mutationFn: () =>
      libraryApi.borrow({
        copy_id: lending?.id,
        borrower_name: borrower.name.trim(),
        borrower_contact: borrower.contact.trim(),
      }),
    // Response keys arrive camelCased — the axios interceptor rewrites them,
    // so this is `dueOn`, never the `due_on` the API actually sends.
    onSuccess: (r: { dueOn: string }) => {
      invalidate()
      toast.success(`Lent — due ${r.dueOn}`)
      setLending(null)
      setBorrower({ name: '', contact: '' })
    },
    onError: (e: Error) => toast.error(e.message || 'Could not lend this copy'),
  })

  const hold = useMutation({
    mutationFn: () =>
      libraryApi.placeHold(id, {
        requester_name: holder.name.trim(),
        requester_contact: holder.contact.trim(),
      }),
    onSuccess: () => {
      invalidate()
      toast.success('Added to the queue')
      setHolder({ name: '', contact: '' })
    },
    onError: (e: Error) => toast.error(e.message || 'Could not place this hold'),
  })

  const addCopies = useMutation({
    mutationFn: () =>
      libraryApi.addCopies(id, { count: Number(copyForm.count || 1), shelf: copyForm.shelf.trim() }),
    onSuccess: (r: { added?: number }) => {
      invalidate()
      toast.success(`${r.added ?? ''} copy/copies added`)
      setAddingCopies(false)
      setCopyForm({ count: '1', shelf: '' })
    },
    onError: (e: Error) => toast.error(e.message || 'Could not add copies'),
  })

  const returnLoan = useMutation({
    mutationFn: (loanId: string) => libraryApi.returnLoan(loanId, {}),
    onSuccess: (r: { feeAssessed?: number; holdNotified?: boolean }) => {
      invalidate()
      toast.success(
        r.feeAssessed
          ? `Returned — ${money(r.feeAssessed)} fee due`
          : r.holdNotified ? 'Returned — the next person has been notified' : 'Returned'
      )
    },
    onError: (e: Error) => toast.error(e.message || 'Could not record this return'),
  })

  const mend = useMutation({
    mutationFn: (copyId: string) =>
      libraryApi.updateCopy(copyId, { status: 'in_circulation', condition: 'fair' }),
    onSuccess: () => { invalidate(); toast.success('Back on the shelf') },
    onError: (e: Error) => toast.error(e.message || 'Could not update this copy'),
  })

  if (error) {
    return (
      <div className={CARD}>
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      </div>
    )
  }
  if (isLoading || !data) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-8 w-64 rounded bg-muted animate-pulse" />
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      </div>
    )
  }

  const { book, copies, loans, holds } = data
  const openLoans = loans.filter((l) => !l.returnedOn)
  const digital = book.materialKind !== 'book'

  return (
    <>
      <Link href="/admin/library/catalogue" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
        <ChevronLeft className="size-3.5" aria-hidden /> Back to catalogue
      </Link>

      <PageHeader
        title={book.title}
        subtitle={[book.authors.join(', '), book.publisher, book.publicationYear].filter(Boolean).join(' · ')}
        actions={
          !digital && (
            <button type="button" onClick={() => setAddingCopies((v) => !v)} className={btn.secondary}>
              <Plus className="size-4" aria-hidden /> Add copies
            </button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {book.categoryName && (
          <Chip className="bg-muted text-foreground border-border" dot={book.categoryColor}>{book.categoryName}</Chip>
        )}
        <Chip className="bg-muted text-foreground border-border">{book.language}</Chip>
        {book.isbn && <Chip className="bg-muted text-foreground border-border">ISBN {book.isbn}</Chip>}
        {book.pages && <Chip className="bg-muted text-foreground border-border">{book.pages} pages</Chip>}
        {digital ? (
          <Chip className="bg-church-blue-surface text-church-blue-ink border-transparent">
            {book.materialKind}
          </Chip>
        ) : (
          <Chip className={book.availableCopies > 0 ? TONE.ok : TONE.out}>
            {book.availableCopies} of {book.totalCopies} on the shelf
          </Chip>
        )}
      </div>

      {digital && book.digitalUrl && (
        <a
          href={book.digitalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn.secondary} mb-4`}
        >
          <ExternalLink className="size-4" aria-hidden /> Open the material
        </a>
      )}

      {addingCopies && (
        <section className={`${CARD} p-4 sm:p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Add copies</h2>
            <button type="button" onClick={() => setAddingCopies(false)} className={btn.ghost} aria-label="Close">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); addCopies.mutate() }} className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="c-count" hint="Each gets its own barcode">How many</Label>
              <input id="c-count" type="number" min={1} max={100} className={field} value={copyForm.count} onChange={(e) => setCopyForm((s) => ({ ...s, count: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="c-shelf">Shelf</Label>
              <input id="c-shelf" className={field} value={copyForm.shelf} onChange={(e) => setCopyForm((s) => ({ ...s, shelf: e.target.value }))} />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={addCopies.isPending} className={btn.primary}>
                {addCopies.isPending ? 'Adding…' : 'Add'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Copies */}
        <section className={`${CARD} p-4 sm:p-5 lg:col-span-2`}>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            {digital ? <Monitor className="size-4 text-muted-foreground" aria-hidden /> : <BookOpen className="size-4 text-muted-foreground" aria-hidden />}
            Copies
          </h2>
          {!copies.length ? (
            <EmptyState
              title={digital ? 'Digital material has no copies' : 'No copies yet'}
              subtitle={digital ? 'It is linked rather than lent, so there is nothing to shelve.' : 'Add one before this title can be borrowed.'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    {['Copy', 'Shelf', 'Condition', 'State', ''].map((h, i) => (
                      <th key={i} scope="col" className="text-left px-2 py-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {copies.map((c) => {
                    const st = copyState(c)
                    return (
                      <tr key={c.id} className="border-b border-border last:border-0">
                        <td className="px-2 py-2.5 font-mono text-xs">{c.copyCode}</td>
                        <td className="px-2 py-2.5 text-muted-foreground">{c.shelf || '—'}</td>
                        <td className="px-2 py-2.5 text-muted-foreground capitalize">{c.condition}</td>
                        <td className="px-2 py-2.5">
                          <Chip className={TONE[st.tone]}>{st.label}</Chip>
                          {c.borrower && (
                            <p className="text-xs text-muted-foreground mt-1">{c.borrower} · due {c.dueOn}</p>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-right whitespace-nowrap">
                          {c.status !== 'in_circulation' ? (
                            <button type="button" onClick={() => mend.mutate(c.id)} className={btn.ghost} title="Return this copy to the shelf">
                              <Wrench className="size-3.5" aria-hidden /> Mend
                            </button>
                          ) : c.borrower ? (
                            <button
                              type="button"
                              onClick={() => {
                                const l = openLoans.find((x) => x.copyId === c.id)
                                if (l) returnLoan.mutate(l.id)
                              }}
                              className={btn.ghost}
                            >
                              <RotateCcw className="size-3.5" aria-hidden /> Return
                            </button>
                          ) : (
                            <button type="button" onClick={() => setLending(c)} className={btn.ghost}>
                              <ArrowLeftRight className="size-3.5" aria-hidden /> Lend
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Holds */}
        <section className={`${CARD} p-4 sm:p-5`}>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" aria-hidden /> Waiting list
          </h2>
          {holds.length > 0 ? (
            <ol className="space-y-2 mb-4">
              {holds.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">
                    <span className="text-muted-foreground tabular-nums mr-2">{h.queuePosition}.</span>
                    {h.requesterName}
                  </span>
                  {h.status === 'ready' && <Chip className={TONE.ok}>Ready</Chip>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">Nobody is waiting.</p>
          )}

          {/* A hold is only offered when there is genuinely nothing to take. */}
          {!digital && book.availableCopies === 0 && (
            <form onSubmit={(e) => { e.preventDefault(); if (holder.name.trim()) hold.mutate() }} className="space-y-3 pt-3 border-t border-border">
              <div>
                <Label htmlFor="h-name" required>Add to the queue</Label>
                <input id="h-name" className={field} placeholder="Name" value={holder.name} onChange={(e) => setHolder((s) => ({ ...s, name: e.target.value }))} />
              </div>
              <input className={field} placeholder="Phone (optional)" aria-label="Phone" value={holder.contact} onChange={(e) => setHolder((s) => ({ ...s, contact: e.target.value }))} />
              <button type="submit" disabled={!holder.name.trim() || hold.isPending} className={`${btn.primary} w-full`}>
                {hold.isPending ? 'Adding…' : 'Place hold'}
              </button>
            </form>
          )}
        </section>
      </div>

      {/* Loan history */}
      <section className={`${CARD} p-4 sm:p-5 mt-4`}>
        <h2 className="font-semibold mb-4">Loan history</h2>
        {!loans.length ? (
          <EmptyState title="Never borrowed" subtitle="This title has not left the shelf yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  {['Borrower', 'Copy', 'Out', 'Due', 'Back', 'Fee'].map((h) => (
                    <th key={h} scope="col" className="text-left px-2 py-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loans.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="px-2 py-2.5">{l.borrowerName}</td>
                    <td className="px-2 py-2.5 font-mono text-xs text-muted-foreground">{l.copyCode}</td>
                    <td className="px-2 py-2.5 text-muted-foreground tabular-nums whitespace-nowrap">{l.borrowedOn}</td>
                    <td className="px-2 py-2.5 tabular-nums whitespace-nowrap">
                      {l.dueOn}
                      {!l.returnedOn && l.daysOverdue > 0 && (
                        <span className="ml-1.5 text-xs text-red-700">{l.daysOverdue}d late</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-muted-foreground tabular-nums whitespace-nowrap">
                      {l.returnedOn ?? <span className="text-amber-700">Still out</span>}
                    </td>
                    <td className="px-2 py-2.5 tabular-nums whitespace-nowrap">
                      {l.returnedOn
                        ? l.feeAssessed > 0 ? money(l.feeAssessed) : '—'
                        : l.feeAccruing > 0 ? <span className="text-muted-foreground">{money(l.feeAccruing)} so far</span> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Lend dialog */}
      {lending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setLending(null)} aria-label="Cancel" />
          <div role="dialog" aria-modal="true" aria-labelledby="lend-title" className={`${CARD} relative w-full max-w-md p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h2 id="lend-title" className="font-semibold">Lend {lending.copyCode}</h2>
              <button type="button" onClick={() => setLending(null)} className={btn.ghost} aria-label="Close">
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (borrower.name.trim()) borrow.mutate() }} className="space-y-3">
              <div>
                <Label htmlFor="l-name" required>Who is borrowing it</Label>
                <input id="l-name" className={field} autoFocus value={borrower.name} onChange={(e) => setBorrower((s) => ({ ...s, name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="l-contact">Phone</Label>
                <input id="l-contact" className={field} value={borrower.contact} onChange={(e) => setBorrower((s) => ({ ...s, contact: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setLending(null)} className={btn.secondary}>Cancel</button>
                <button type="submit" disabled={!borrower.name.trim() || borrow.isPending} className={btn.primary}>
                  {borrow.isPending ? 'Lending…' : 'Lend it'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
