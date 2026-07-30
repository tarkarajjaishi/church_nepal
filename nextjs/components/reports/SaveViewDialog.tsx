'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Save } from 'lucide-react'
import { savedApi, PERIODS, type SavedReport, type Filter } from '@/lib/reports/api'
import { CARD, btn, field, Label } from '@/components/offerings/ui'

/**
 * Save the current view under a name.
 *
 * What gets stored is the *question* — which report, which period, which
 * columns, which rows, what order — never the figures. Opening it in December
 * recomputes from the records as they are then, rather than replaying a
 * snapshot taken in July.
 *
 * The period is a named range for the same reason. "This month" has to still
 * mean this month next year, especially once a schedule is emailing it.
 */
export function SaveViewDialog({
  open,
  onClose,
  reportKey,
  reportName,
  columns,
  filters,
  sortColumn,
  sortDesc,
  editing,
}: {
  open: boolean
  onClose: () => void
  reportKey: string
  reportName: string
  columns: string[]
  filters: Filter[]
  sortColumn: string
  sortDesc: boolean
  editing?: SavedReport | null
}) {
  const qc = useQueryClient()
  const [f, setF] = useState({
    name: '',
    description: '',
    period: 'this_month',
    customFrom: '',
    customTo: '',
    isShared: true,
  })

  useEffect(() => {
    if (!open) return
    setF(
      editing
        ? {
            name: editing.name,
            description: editing.description,
            period: editing.period,
            customFrom: editing.customFrom ?? '',
            customTo: editing.customTo ?? '',
            isShared: editing.isShared,
          }
        : { name: '', description: '', period: 'this_month', customFrom: '', customTo: '', isShared: true }
    )
  }, [open, editing])

  const body = () => ({
    name: f.name.trim(),
    description: f.description.trim(),
    report_key: reportKey,
    period: f.period,
    custom_from: f.period === 'custom' ? f.customFrom : undefined,
    custom_to: f.period === 'custom' ? f.customTo : undefined,
    columns,
    filters,
    sort_column: sortColumn,
    sort_desc: sortDesc,
    is_shared: f.isShared,
  })

  const save = useMutation({
    mutationFn: () => (editing ? savedApi.update(editing.id, body()) : savedApi.create(body())),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-reports'] })
      toast.success(editing ? 'View updated' : 'View saved')
      onClose()
    },
    // The server runs the report before saving, so a filter on a column that
    // does not exist is refused here rather than failing later in front of
    // whoever opened the view.
    onError: (e: Error) => toast.error(e.message || 'Could not save this view'),
  })

  if (!open) return null
  const canSave = f.name.trim() && (f.period !== 'custom' || (f.customFrom && f.customTo))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-label="Cancel" />
      <div role="dialog" aria-modal="true" aria-labelledby="save-view" className={`${CARD} relative w-full max-w-lg p-5`}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 id="save-view" className="font-semibold">{editing ? 'Edit view' : 'Save this view'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{reportName}</p>
          </div>
          <button type="button" onClick={onClose} className={btn.ghost} aria-label="Close">
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (canSave) save.mutate() }} className="space-y-4">
          <div>
            <Label htmlFor="v-name" required>Name</Label>
            <input id="v-name" className={field} placeholder="Monthly giving for the board" value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="v-desc">What it is for</Label>
            <input id="v-desc" className={field} value={f.description} onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="v-period" hint="Recalculated every time it is opened">Period</Label>
            <select id="v-period" className={field} value={f.period} onChange={(e) => setF((s) => ({ ...s, period: e.target.value }))}>
              {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          {f.period === 'custom' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="v-from" required>From</Label>
                <input id="v-from" type="date" className={field} value={f.customFrom} onChange={(e) => setF((s) => ({ ...s, customFrom: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="v-to" required>To</Label>
                <input id="v-to" type="date" className={field} value={f.customTo} onChange={(e) => setF((s) => ({ ...s, customTo: e.target.value }))} />
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Fixed dates freeze the window. A named period moves with the calendar, which is
              what you want if this view is going to be emailed on a schedule.
            </p>
          )}

          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              className="size-4 mt-0.5 rounded border-border"
              checked={f.isShared}
              onChange={(e) => setF((s) => ({ ...s, isShared: e.target.checked }))}
            />
            <span>
              Share with the team
              <span className="block text-xs text-muted-foreground">
                Only people who can already run {reportName} will see it — sharing a view never
                shares figures they could not otherwise reach.
              </span>
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className={btn.secondary}>Cancel</button>
            <button type="submit" disabled={!canSave || save.isPending} className={btn.primary}>
              <Save className="size-4" aria-hidden />
              {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Save view'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
