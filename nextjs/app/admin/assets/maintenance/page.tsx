'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Wrench, Plus, X, Save, Check } from 'lucide-react'
import { assetsApi, MAINTENANCE_KINDS, CONDITIONS } from '@/lib/assets/api'
import { money, toMinor } from '@/lib/offerings/api'
import {
  CARD, PageHeader, EmptyState, TableSkeleton, Chip, btn, field, Label,
} from '@/components/offerings/ui'

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-amber-100 text-amber-800 border-amber-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
}

export default function MaintenancePage() {
  const qc = useQueryClient()
  const today = new Date().toISOString().slice(0, 10)
  const [creating, setCreating] = useState(false)
  const [f, setF] = useState({
    assetId: '', kind: 'preventive', title: '', scheduledFor: today,
    technician: '', cost: '', nextDue: '',
  })

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['asset-maintenance'],
    queryFn: assetsApi.maintenance,
  })
  const { data: assets } = useQuery({
    queryKey: ['assets-for-maintenance'],
    queryFn: () => assetsApi.list({ perPage: 200 }),
    staleTime: 60_000,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['asset-maintenance'] })
    qc.invalidateQueries({ queryKey: ['asset-dashboard'] })
    qc.invalidateQueries({ queryKey: ['assets'] })
  }

  const create = useMutation({
    mutationFn: () =>
      assetsApi.createMaintenance(f.assetId, {
        maintenance_kind: f.kind,
        title: f.title.trim(),
        scheduled_for: f.scheduledFor || null,
        technician: f.technician.trim(),
        cost: f.cost ? toMinor(f.cost) ?? 0 : 0,
        next_due: f.nextDue || null,
      }),
    onSuccess: () => {
      invalidate()
      setCreating(false)
      setF({ assetId: '', kind: 'preventive', title: '', scheduledFor: today, technician: '', cost: '', nextDue: '' })
      toast.success('Maintenance scheduled')
    },
    onError: (e: Error) => toast.error(e.message || 'Could not schedule this job'),
  })

  const complete = useMutation({
    mutationFn: ({ id, cost, condition }: { id: string; cost?: number; condition?: string }) =>
      assetsApi.completeMaintenance(id, { cost, condition_after: condition }),
    onSuccess: () => {
      invalidate()
      // Completing work also returns the asset to service and records its
      // condition, which is not obvious from the button — say so.
      toast.success('Job completed — asset back in service')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const onComplete = (id: string) => {
    const costStr = window.prompt('What did it cost? Leave blank for none.', '')
    if (costStr === null) return
    const cond = window.prompt(`Condition afterwards? One of: ${CONDITIONS.join(', ')}`, 'good')
    if (cond === null) return
    complete.mutate({
      id,
      cost: costStr.trim() ? toMinor(costStr) ?? undefined : undefined,
      condition: CONDITIONS.includes(cond) ? cond : undefined,
    })
  }

  return (
    <>
      <PageHeader
        title="Maintenance"
        subtitle="Scheduled and completed work, with what it cost"
        actions={
          <button type="button" onClick={() => setCreating((v) => !v)} className={btn.primary}>
            <Plus className="size-4" aria-hidden /> Schedule Work
          </button>
        }
      />

      {creating && (
        <section className={`${CARD} p-4 sm:p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Schedule maintenance</h2>
            <button type="button" onClick={() => setCreating(false)} className={btn.ghost} aria-label="Close">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (f.assetId) create.mutate() }} className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="m-asset" required>Asset</Label>
              <select id="m-asset" className={field} value={f.assetId} onChange={(e) => setF((s) => ({ ...s, assetId: e.target.value }))}>
                <option value="">Choose an asset…</option>
                {(assets?.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.assetCode})</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="m-kind">Type</Label>
              <select id="m-kind" className={field} value={f.kind} onChange={(e) => setF((s) => ({ ...s, kind: e.target.value }))}>
                {MAINTENANCE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="m-title">What needs doing</Label>
              <input id="m-title" className={field} placeholder="Annual service" value={f.title} onChange={(e) => setF((s) => ({ ...s, title: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="m-when">Scheduled for</Label>
              <input id="m-when" type="date" className={field} value={f.scheduledFor} onChange={(e) => setF((s) => ({ ...s, scheduledFor: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="m-tech">Technician</Label>
              <input id="m-tech" className={field} value={f.technician} onChange={(e) => setF((s) => ({ ...s, technician: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="m-cost">Estimated cost</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rs</span>
                <input id="m-cost" inputMode="decimal" className={`${field} pl-9 text-right tabular-nums`} placeholder="0.00" value={f.cost} onChange={(e) => setF((s) => ({ ...s, cost: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label htmlFor="m-next" hint="For recurring servicing">Next due</Label>
              <input id="m-next" type="date" className={field} value={f.nextDue} onChange={(e) => setF((s) => ({ ...s, nextDue: e.target.value }))} />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className={btn.secondary}>Cancel</button>
              <button type="submit" disabled={!f.assetId || create.isPending} className={btn.primary}>
                <Save className="size-4" aria-hidden />
                {create.isPending ? 'Scheduling…' : 'Schedule'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className={`${CARD} overflow-hidden`}>
        {isLoading ? (
          <TableSkeleton cols={7} />
        ) : !jobs?.length ? (
          <EmptyState
            icon={Wrench}
            title="No maintenance recorded"
            subtitle="Schedule servicing so equipment does not fail mid-service."
            action={<button type="button" onClick={() => setCreating(true)} className={btn.primary}>Schedule Work</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {['Asset', 'Work', 'Type', 'Scheduled', 'Done', 'Technician', 'Cost', 'Status', ''].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium truncate max-w-[12rem]">{m.assetName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{m.assetCode}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[14rem] truncate">{m.title || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.maintenanceKind}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{m.scheduledFor ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{m.performedOn ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[10rem] truncate">{m.technician || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">{money(m.cost)}</td>
                    <td className="px-4 py-3">
                      <Chip className={STATUS_STYLE[m.status] ?? STATUS_STYLE.scheduled}>{m.status}</Chip>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {m.status !== 'completed' && m.status !== 'cancelled' && (
                        <button type="button" onClick={() => onComplete(m.id)} disabled={complete.isPending} className={btn.secondary}>
                          <Check className="size-3.5" aria-hidden /> Complete
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
