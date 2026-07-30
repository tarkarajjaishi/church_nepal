'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CalendarCheck, Plus, X, Save, Check, Ban } from 'lucide-react'
import { assetsApi, RESERVATION_STYLE } from '@/lib/assets/api'
import {
  CARD, PageHeader, EmptyState, TableSkeleton, Chip, btn, field, Label,
} from '@/components/offerings/ui'

export default function ReservationsPage() {
  const qc = useQueryClient()
  const today = new Date().toISOString().slice(0, 10)
  const [creating, setCreating] = useState(false)
  const [f, setF] = useState({ assetId: '', requestedBy: '', purpose: '', startsOn: today, endsOn: today })

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['asset-reservations'],
    queryFn: assetsApi.reservations,
  })
  const { data: bookable } = useQuery({
    queryKey: ['assets-reservable'],
    queryFn: () => assetsApi.list({ reservable: true, perPage: 200 }),
    staleTime: 60_000,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['asset-reservations'] })
    qc.invalidateQueries({ queryKey: ['asset-dashboard'] })
  }

  const create = useMutation({
    mutationFn: () =>
      assetsApi.reserve(f.assetId, {
        requested_by: f.requestedBy.trim(),
        purpose: f.purpose.trim(),
        starts_on: f.startsOn,
        ends_on: f.endsOn,
      }),
    onSuccess: () => {
      invalidate()
      setCreating(false)
      setF({ assetId: '', requestedBy: '', purpose: '', startsOn: today, endsOn: today })
      toast.success('Booking requested')
    },
    // A 409 here is the database exclusion constraint refusing an overlap —
    // its message already says what clashed, so surface it verbatim.
    onError: (e: Error) => toast.error(e.message || 'Could not book this asset'),
  })

  const decide = useMutation({
    mutationFn: ({ id, decision, reason }: { id: string; decision: string; reason?: string }) =>
      assetsApi.decideReservation(id, decision, reason),
    onSuccess: (_r, v) => { invalidate(); toast.success(`Booking ${v.decision}`) },
    onError: (e: Error) => toast.error(e.message),
  })

  const reject = (id: string) => {
    const reason = window.prompt('Why is this booking being refused?')
    if (reason === null) return
    if (!reason.trim()) return toast.error('A reason is required')
    decide.mutate({ id, decision: 'rejected', reason })
  }

  const valid = f.assetId && f.requestedBy.trim() && f.endsOn >= f.startsOn

  return (
    <>
      <PageHeader
        title="Reservations"
        subtitle="Bookings are refused at the database if the dates overlap"
        actions={
          <button type="button" onClick={() => setCreating((v) => !v)} className={btn.primary}>
            <Plus className="size-4" aria-hidden /> Book an Asset
          </button>
        }
      />

      {creating && (
        <section className={`${CARD} p-4 sm:p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">New booking</h2>
            <button type="button" onClick={() => setCreating(false)} className={btn.ghost} aria-label="Close"><X className="size-4" aria-hidden /></button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (valid) create.mutate() }} className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Label htmlFor="r-asset" required>Asset</Label>
              <select id="r-asset" className={field} value={f.assetId} onChange={(e) => setF((s) => ({ ...s, assetId: e.target.value }))}>
                <option value="">Choose a bookable asset…</option>
                {(bookable?.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.assetCode})</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="r-by" required>Requested by</Label>
              <input id="r-by" className={field} placeholder="Ministry or person" value={f.requestedBy} onChange={(e) => setF((s) => ({ ...s, requestedBy: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="r-from" required>From</Label>
              <input id="r-from" type="date" className={field} value={f.startsOn} onChange={(e) => setF((s) => ({ ...s, startsOn: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="r-to" required>To</Label>
              <input id="r-to" type="date" min={f.startsOn} className={field} value={f.endsOn} onChange={(e) => setF((s) => ({ ...s, endsOn: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="r-purpose">Purpose</Label>
              <input id="r-purpose" className={field} value={f.purpose} onChange={(e) => setF((s) => ({ ...s, purpose: e.target.value }))} />
            </div>
            <div className="sm:col-span-4 flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className={btn.secondary}>Cancel</button>
              <button type="submit" disabled={!valid || create.isPending} className={btn.primary}>
                <Save className="size-4" aria-hidden />
                {create.isPending ? 'Booking…' : 'Request booking'}
              </button>
            </div>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            An asset that is out on its last day still counts as booked, so a request starting that day will clash.
          </p>
        </section>
      )}

      <div className={`${CARD} overflow-hidden`}>
        {isLoading ? (
          <TableSkeleton cols={6} />
        ) : !reservations?.length ? (
          <EmptyState
            icon={CalendarCheck}
            title="No bookings"
            subtitle="Ministries can reserve projectors, cameras, vehicles and more."
            action={<button type="button" onClick={() => setCreating(true)} className={btn.primary}>Book an Asset</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {['Asset', 'Requested by', 'Dates', 'Purpose', 'Status', 'Decided by', ''].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium truncate max-w-[14rem]">{r.assetName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{r.assetCode}</p>
                    </td>
                    <td className="px-4 py-3">{r.requestedBy || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {r.startsOn} → {r.endsOn}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[14rem] truncate" title={r.purpose}>
                      {r.purpose || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Chip className={RESERVATION_STYLE[r.status] ?? RESERVATION_STYLE.pending}>{r.status}</Chip>
                      {r.rejectReason && (
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-[12rem] truncate" title={r.rejectReason}>
                          {r.rejectReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[10rem] truncate">
                      {r.approvedBy || '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {r.status === 'pending' && (
                        <span className="inline-flex gap-1">
                          <button type="button" onClick={() => decide.mutate({ id: r.id, decision: 'approved' })} disabled={decide.isPending} className={btn.secondary}>
                            <Check className="size-3.5" aria-hidden /> Approve
                          </button>
                          <button type="button" onClick={() => reject(r.id)} disabled={decide.isPending} className={btn.ghost}>
                            <Ban className="size-3.5" aria-hidden /> Refuse
                          </button>
                        </span>
                      )}
                      {r.status === 'approved' && (
                        <button type="button" onClick={() => decide.mutate({ id: r.id, decision: 'collected' })} className={btn.ghost}>
                          Mark collected
                        </button>
                      )}
                      {r.status === 'collected' && (
                        <button type="button" onClick={() => decide.mutate({ id: r.id, decision: 'returned' })} className={btn.ghost}>
                          Mark returned
                        </button>
                      )}
                    </td>
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
