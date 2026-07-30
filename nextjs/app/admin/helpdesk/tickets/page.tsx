'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, X, Save, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { helpdeskApi, STATUS_LABEL, type TicketFilters, type Status } from '@/lib/helpdesk/api'
import { TicketTable } from '@/components/helpdesk/TicketTable'
import { CARD, PageHeader, btn, field, Label } from '@/components/offerings/ui'

const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const
const STATUS_OPTIONS: Status[] = ['open', 'in_progress', 'waiting', 'resolved', 'closed', 'cancelled']

const EMPTY = {
  subject: '', body: '', categoryId: '', reporterName: '', reporterContact: '',
  location: '', priority: 'normal',
}

function TicketsInner() {
  const params = useSearchParams()
  const qc = useQueryClient()
  const [creating, setCreating] = useState(params.get('new') === '1')
  const [f, setF] = useState(EMPTY)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<TicketFilters>({
    page: 1,
    per_page: 25,
    view: (params.get('view') as TicketFilters['view']) ?? undefined,
    status: params.get('status') ?? undefined,
  })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['helpdesk', 'tickets', filters],
    queryFn: () => helpdeskApi.tickets(filters),
  })
  const { data: cats } = useQuery({ queryKey: ['helpdesk', 'categories'], queryFn: helpdeskApi.categories })

  const create = useMutation({
    mutationFn: () =>
      helpdeskApi.createTicket({
        subject: f.subject.trim(),
        body: f.body.trim(),
        category_id: f.categoryId || undefined,
        reporter_name: f.reporterName.trim(),
        reporter_contact: f.reporterContact.trim(),
        location: f.location.trim(),
        priority: f.priority,
      }),
    onSuccess: (r: { ticketCode: string }) => {
      qc.invalidateQueries({ queryKey: ['helpdesk'] })
      toast.success(`Raised as ${r.ticketCode}`)
      setCreating(false)
      setF(EMPTY)
    },
    onError: (e: Error) => toast.error(e.message || 'Could not raise this ticket'),
  })

  const apply = (patch: Partial<TicketFilters>) =>
    setFilters((s) => ({ ...s, ...patch, page: patch.page ?? 1 }))

  const page = data?.page ?? 1
  const totalPages = data?.totalPages ?? 1
  const canSubmit = f.subject.trim() && f.reporterName.trim()

  return (
    <>
      <PageHeader
        title="Tickets"
        subtitle="Everything reported, in one queue"
        actions={
          <button type="button" onClick={() => setCreating((v) => !v)} className={btn.primary}>
            <Plus className="size-4" aria-hidden /> Raise a ticket
          </button>
        }
      />

      {creating && (
        <section className={`${CARD} p-4 sm:p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">New ticket</h2>
            <button type="button" onClick={() => setCreating(false)} className={btn.ghost} aria-label="Close">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) create.mutate() }} className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="t-subject" required>What is wrong</Label>
              <input id="t-subject" className={field} value={f.subject} onChange={(e) => setF((s) => ({ ...s, subject: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="t-priority">Priority</Label>
              <select id="t-priority" className={field} value={f.priority} onChange={(e) => setF((s) => ({ ...s, priority: e.target.value }))}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="t-reporter" required>Reported by</Label>
              <input id="t-reporter" className={field} value={f.reporterName} onChange={(e) => setF((s) => ({ ...s, reporterName: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="t-contact">Phone or email</Label>
              <input id="t-contact" className={field} value={f.reporterContact} onChange={(e) => setF((s) => ({ ...s, reporterContact: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="t-cat" hint="Sets the response target">Area</Label>
              <select id="t-cat" className={field} value={f.categoryId} onChange={(e) => setF((s) => ({ ...s, categoryId: e.target.value }))}>
                <option value="">Uncategorised</option>
                {cats?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — reply in {c.responseHours}h</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="t-loc">Where</Label>
              <input id="t-loc" className={field} placeholder="Main hall" value={f.location} onChange={(e) => setF((s) => ({ ...s, location: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="t-body">Details</Label>
              <textarea id="t-body" rows={3} className={`${field} py-2`} value={f.body} onChange={(e) => setF((s) => ({ ...s, body: e.target.value }))} />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className={btn.secondary}>Cancel</button>
              <button type="submit" disabled={!canSubmit || create.isPending} className={btn.primary}>
                <Save className="size-4" aria-hidden />
                {create.isPending ? 'Raising…' : 'Raise ticket'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className={`${CARD} p-3 sm:p-4 mb-4`}>
        <form
          onSubmit={(e) => { e.preventDefault(); apply({ search: search.trim() || undefined }) }}
          className="grid gap-3 sm:grid-cols-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden />
            <input
              className={`${field} pl-9`}
              placeholder="Subject, code, reporter"
              aria-label="Search tickets"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className={field} aria-label="Status" value={filters.status ?? ''} onChange={(e) => apply({ status: e.target.value || undefined })}>
            <option value="">Any status</option>
            <option value="open">Still open</option>
            <option value="done">Resolved or closed</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <select className={field} aria-label="Priority" value={filters.priority ?? ''} onChange={(e) => apply({ priority: e.target.value || undefined })}>
            <option value="">Any priority</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
          </select>
          <select className={field} aria-label="Area" value={filters.category_id ?? ''} onChange={(e) => apply({ category_id: e.target.value || undefined })}>
            <option value="">Any area</option>
            {cats?.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.openCount})</option>)}
          </select>
        </form>
      </div>

      <div className={`${CARD} overflow-hidden`}>
        <TicketTable
          data={data?.data}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          emptyTitle="Nothing here"
          emptySubtitle={filters.search || filters.status ? 'No ticket matches these filters.' : 'Nothing has been reported yet.'}
          action={<button type="button" onClick={() => setCreating(true)} className={btn.primary}>Raise a ticket</button>}
        />
        {!!data?.data.length && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {data.total} ticket{data.total === 1 ? '' : 's'} · page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => apply({ page: page - 1 })} className={btn.secondary} aria-label="Previous page">
                <ChevronLeft className="size-4" aria-hidden /> Prev
              </button>
              <button type="button" disabled={page >= totalPages} onClick={() => apply({ page: page + 1 })} className={btn.secondary} aria-label="Next page">
                Next <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default function TicketsPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<div className={`${CARD} h-64 animate-pulse`} aria-busy="true" />}>
      <TicketsInner />
    </Suspense>
  )
}
