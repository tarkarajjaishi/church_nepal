'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Repeat, Plus, Pause, Play, X, CalendarClock, CheckCircle2, AlertTriangle, Coins,
} from 'lucide-react'
import { money, toMinor, offeringsApi } from '@/lib/offerings/api'
import { insightsApi, type StandingOrder } from '@/lib/offerings/insights'
import {
  CARD, PageHeader, StatTile, EmptyState, ErrorState, TableSkeleton, Chip, btn, field, Label,
} from '@/components/offerings/ui'

/**
 * Standing orders: money the church has been promised on a rhythm.
 *
 * "Collected" moves the schedule on from the date that was due, not from
 * today, so recording a late collection does not push every future date out
 * by the same lateness.
 */

const INTERVALS = [
  { key: 'weekly', label: 'Every week' },
  { key: 'fortnightly', label: 'Every fortnight' },
  { key: 'monthly', label: 'Every month' },
  { key: 'quarterly', label: 'Every quarter' },
  { key: 'yearly', label: 'Every year' },
]

const VIEWS = [
  { key: '', label: 'Everything' },
  { key: 'active', label: 'Running' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paused', label: 'Paused' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function RecurringPage() {
  const qc = useQueryClient()
  const [view, setView] = useState('')
  const [creating, setCreating] = useState(false)

  const { data, isLoading, isError, error, failureReason, refetch, isFetching } = useQuery({
    queryKey: ['offering-recurring', view],
    queryFn: () => insightsApi.recurring(view),
  })
  const failure = (error ?? failureReason) as (Error & { isForbidden?: boolean }) | null
  const rows = data?.data ?? []

  const invalidate = () => qc.invalidateQueries({ queryKey: ['offering-recurring'] })

  const act = useMutation({
    mutationFn: (v: { id: string; action: 'pause' | 'resume' | 'cancel' }) =>
      insightsApi.recurringAction(v.id, v.action),
    onSuccess: (_r, v) => {
      invalidate()
      toast.success({ pause: 'Paused', resume: 'Running again', cancel: 'Cancelled' }[v.action])
    },
    onError: (e: Error) => toast.error(e.message || 'Could not change that standing order'),
  })

  const collect = useMutation({
    mutationFn: (id: string) => insightsApi.collectRecurring(id),
    onSuccess: () => { invalidate(); toast.success('Recorded, and the next date has moved on') },
    onError: (e: Error) => toast.error(e.message || 'Could not record that collection'),
  })

  return (
    <>
      <PageHeader
        title="Recurring giving"
        subtitle="Standing orders and scheduled gifts"
        actions={
          <button type="button" onClick={() => setCreating(true)} className={btn.primary}>
            <Plus className="size-4" aria-hidden /> New standing order
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <StatTile label="Running" value={data?.activeCount ?? 0} icon={Repeat} loading={isLoading} />
        <StatTile
          label="Overdue"
          value={data?.overdueCount ?? 0}
          hint={data?.overdueCount ? 'Past their collection date' : 'Nothing is late'}
          icon={AlertTriangle}
          tone={data?.overdueCount ? 'warn' : 'good'}
          loading={isLoading}
        />
        {/* Weekly and monthly gifts are not comparable until they are put on
            the same footing. */}
        <StatTile
          label="Expected a year"
          value={money(data?.annualisedTotal ?? 0)}
          hint="From everything still running"
          icon={Coins}
          loading={isLoading}
        />
        <StatTile
          label="A month, on average"
          value={money(data?.monthlyEquivalent ?? 0)}
          icon={CalendarClock}
          loading={isLoading}
        />
      </div>

      <div className={`${CARD} p-3 sm:p-4 mb-4`}>
        <select
          className={`${field} max-w-xs`}
          aria-label="Filter standing orders"
          value={view}
          onChange={(e) => setView(e.target.value)}
        >
          {VIEWS.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
        </select>
      </div>

      <div className={`${CARD} overflow-hidden`}>
        {isError || (!isLoading && !isFetching && !data) ? (
          <ErrorState message={failure?.message} forbidden={failure?.isForbidden} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <TableSkeleton cols={6} />
        ) : !rows.length ? (
          <EmptyState
            icon={Repeat}
            title={view ? 'Nothing here' : 'No standing orders yet'}
            subtitle={view ? 'Try another filter.' : 'Record a regular gift so it can be expected and chased.'}
            action={<button type="button" onClick={() => setCreating(true)} className={btn.primary}>New standing order</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-card/95 border-b border-border">
                <tr>
                  {['Donor', 'Amount', 'Rhythm', 'Fund', 'Next due', 'Collected'].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => <Row key={r.id} r={r} onAct={act.mutate} onCollect={collect.mutate} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating && <NewDialog onClose={() => setCreating(false)} onSaved={invalidate} />}
    </>
  )
}

function Row({
  r,
  onAct,
  onCollect,
}: {
  r: StandingOrder
  onAct: (v: { id: string; action: 'pause' | 'resume' | 'cancel' }) => void
  onCollect: (id: string) => void
}) {
  const cancelled = !!r.cancelledAt
  const overdue = r.active && !cancelled && (r.daysUntilDue ?? 0) < 0

  return (
    <tr className={`border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${cancelled ? 'opacity-60' : ''}`}>
      <td className="px-4 py-3">
        <span className="font-medium">{r.donorName}</span>
        {r.donorContact && <p className="text-xs text-muted-foreground truncate max-w-[16rem]">{r.donorContact}</p>}
      </td>
      <td className="px-4 py-3 font-semibold tabular-nums whitespace-nowrap">
        {money(r.amount)}
        <p className="text-xs font-normal text-muted-foreground">{money(r.annualised)} a year</p>
      </td>
      <td className="px-4 py-3 whitespace-nowrap capitalize">{r.interval}</td>
      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.fundName ?? 'General'}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        {cancelled ? (
          <Chip className="bg-muted text-muted-foreground border-border">cancelled</Chip>
        ) : !r.active ? (
          <Chip className="bg-muted text-muted-foreground border-border">paused</Chip>
        ) : (
          <>
            {r.nextChargeAt?.slice(0, 10) ?? '—'}
            {overdue && (
              <Chip className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                {Math.abs(r.daysUntilDue ?? 0)}d late
              </Chip>
            )}
          </>
        )}
      </td>
      <td className="px-4 py-3 tabular-nums">
        {r.chargeCount}
        {r.lastChargedAt && (
          <span className="block text-xs text-muted-foreground">last {r.lastChargedAt.slice(0, 10)}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {!cancelled && r.active && (
            <button
              type="button"
              onClick={() => onCollect(r.id)}
              aria-label={`Record a collection from ${r.donorName}`}
              className={btn.secondary}
            >
              <CheckCircle2 className="size-3.5" aria-hidden /> Collected
            </button>
          )}
          {!cancelled && (
            <button
              type="button"
              onClick={() => onAct({ id: r.id, action: r.active ? 'pause' : 'resume' })}
              aria-label={`${r.active ? 'Pause' : 'Resume'} the standing order from ${r.donorName}`}
              title={r.active ? 'Pause' : 'Resume'}
              className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors"
            >
              {r.active ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
            </button>
          )}
          {!cancelled && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Cancel the standing order from ${r.donorName}? The record is kept.`)) {
                  onAct({ id: r.id, action: 'cancel' })
                }
              }}
              aria-label={`Cancel the standing order from ${r.donorName}`}
              title="Cancel"
              className="inline-flex items-center justify-center size-9 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

function NewDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    donor_name: '', donor_contact: '', amount: '', interval: 'monthly',
    fund_id: '', next_charge_at: '', notes: '',
  })

  const { data: funds = [] } = useQuery({ queryKey: ['funds'], queryFn: offeringsApi.funds })

  const create = useMutation({
    mutationFn: () =>
      insightsApi.createRecurring({
        donor_name: f.donor_name.trim(),
        donor_contact: f.donor_contact.trim(),
        // Money is minor units everywhere; converted once, here at the edge.
        amount: toMinor(f.amount),
        interval: f.interval,
        fund_id: f.fund_id || undefined,
        next_charge_at: f.next_charge_at ? `${f.next_charge_at}T00:00:00` : undefined,
        notes: f.notes.trim(),
      }),
    onSuccess: () => { onSaved(); toast.success('Standing order recorded'); onClose() },
    onError: (e: Error) => toast.error(e.message || 'Could not record that standing order'),
  })

  const amount = toMinor(f.amount)
  const valid = f.donor_name.trim() && amount !== null && amount > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="New standing order"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`${CARD} w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto`}>
        <h2 className="font-semibold mb-4">New standing order</h2>
        <form onSubmit={(e) => { e.preventDefault(); if (valid) create.mutate() }} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="so-name" required>Donor</Label>
            <input id="so-name" className={field} value={f.donor_name}
              onChange={(e) => setF((s) => ({ ...s, donor_name: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="so-contact">Email or phone</Label>
            <input id="so-contact" className={field} value={f.donor_contact}
              onChange={(e) => setF((s) => ({ ...s, donor_contact: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="so-amount" required>Amount each time</Label>
            <input id="so-amount" inputMode="decimal" className={field} placeholder="1000"
              value={f.amount} onChange={(e) => setF((s) => ({ ...s, amount: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="so-interval" required>How often</Label>
            <select id="so-interval" className={field} value={f.interval}
              onChange={(e) => setF((s) => ({ ...s, interval: e.target.value }))}>
              {INTERVALS.map((i) => <option key={i.key} value={i.key}>{i.label}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="so-fund">Fund</Label>
            <select id="so-fund" className={field} value={f.fund_id}
              onChange={(e) => setF((s) => ({ ...s, fund_id: e.target.value }))}>
              <option value="">General</option>
              {funds.map((fund) => <option key={fund.id} value={fund.id}>{fund.name}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="so-next" hint="Defaults to a month from today">First collection</Label>
            <input id="so-next" type="date" className={field} value={f.next_charge_at}
              onChange={(e) => setF((s) => ({ ...s, next_charge_at: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="so-notes">Notes</Label>
            <textarea id="so-notes" rows={2} className={`${field} py-2`} value={f.notes}
              onChange={(e) => setF((s) => ({ ...s, notes: e.target.value }))} />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className={btn.secondary}>Cancel</button>
            <button type="submit" disabled={!valid || create.isPending} className={btn.primary}>
              {create.isPending ? 'Saving…' : 'Record it'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
