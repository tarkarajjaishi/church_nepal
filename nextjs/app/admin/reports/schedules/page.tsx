'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Mail, Plus, X, Save, Send, Trash2, ChevronLeft, AlertTriangle, CheckCircle2, Clock,
} from 'lucide-react'
import {
  schedulesApi, savedApi, describeSchedule, DAYS,
  type ReportSchedule,
} from '@/lib/reports/api'
import {
  CARD, PageHeader, EmptyState, ErrorState, TableSkeleton, Chip, btn, field, Label,
} from '@/components/offerings/ui'

const EMPTY = {
  savedReportId: '',
  frequency: 'weekly',
  dayOfWeek: 1,
  dayOfMonth: 1,
  hour: 7,
  recipients: '',
  isActive: true,
}

export default function SchedulesPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<ReportSchedule | null>(null)
  const [creating, setCreating] = useState(false)
  const [f, setF] = useState(EMPTY)

  const { data: schedules, isLoading, error, refetch } = useQuery({
    queryKey: ['report-schedules'],
    queryFn: schedulesApi.list,
  })
  const { data: saved } = useQuery({ queryKey: ['saved-reports'], queryFn: savedApi.list })
  const { data: deliveries } = useQuery({
    queryKey: ['report-deliveries'],
    queryFn: schedulesApi.deliveries,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['report-schedules'] })
    qc.invalidateQueries({ queryKey: ['report-deliveries'] })
    qc.invalidateQueries({ queryKey: ['saved-reports'] })
  }

  const open = (s: ReportSchedule | null) => {
    setEditing(s)
    setCreating(true)
    setF(
      s
        ? {
            savedReportId: s.savedReportId,
            frequency: s.frequency,
            dayOfWeek: s.dayOfWeek,
            dayOfMonth: s.dayOfMonth,
            hour: s.hour,
            recipients: s.recipients,
            isActive: s.isActive,
          }
        : { ...EMPTY, savedReportId: saved?.[0]?.id ?? '' }
    )
  }

  const body = () => ({
    saved_report_id: f.savedReportId,
    frequency: f.frequency,
    day_of_week: f.dayOfWeek,
    day_of_month: f.dayOfMonth,
    hour: f.hour,
    recipients: f.recipients,
    is_active: f.isActive,
  })

  const save = useMutation({
    mutationFn: () =>
      editing ? schedulesApi.update(editing.id, body()) : schedulesApi.create(body()),
    onSuccess: (r: { nextRunAt: string }) => {
      invalidate()
      toast.success(`Saved — next send ${r.nextRunAt.replace('T', ' ').slice(0, 16)}`)
      setCreating(false)
      setEditing(null)
    },
    onError: (e: Error) => toast.error(e.message || 'Could not save this schedule'),
  })

  const remove = useMutation({
    mutationFn: (id: string) => schedulesApi.remove(id),
    onSuccess: () => { invalidate(); toast.success('Schedule deleted') },
    onError: (e: Error) => toast.error(e.message || 'Could not delete this schedule'),
  })

  const sendNow = useMutation({
    mutationFn: (id: string) => schedulesApi.sendNow(id),
    onSuccess: (r: { recipients: string; rows: number }) => {
      invalidate()
      toast.success(`Sent ${r.rows} rows to ${r.recipients}`)
    },
    // The whole point of "send now" is to find out it does not work while
    // somebody is watching, rather than at 07:00 on Monday.
    onError: (e: Error) => toast.error(e.message || 'Could not send it'),
  })

  const failing = (schedules ?? []).filter((s) => s.lastStatus === 'failed')

  return (
    <>
      <Link href="/admin/reports" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
        <ChevronLeft className="size-3.5" aria-hidden /> Back to reports
      </Link>

      <PageHeader
        title="Scheduled reports"
        subtitle="Reports that send themselves, and the record of what went out"
        actions={
          <button
            type="button"
            onClick={() => open(null)}
            disabled={!saved?.length}
            title={saved?.length ? undefined : 'Save a view first — a schedule sends a saved view'}
            className={btn.primary}
          >
            <Plus className="size-4" aria-hidden /> New schedule
          </button>
        }
      />

      {failing.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 mb-4 flex items-start gap-3">
          <AlertTriangle className="size-5 shrink-0 text-red-700 mt-0.5" aria-hidden />
          <div className="text-sm text-red-900">
            <p className="font-medium">
              {failing.length} schedule{failing.length === 1 ? '' : 's'} failed to send
            </p>
            <p className="mt-0.5">{failing[0].lastError}</p>
          </div>
        </div>
      )}

      {creating && (
        <section className={`${CARD} p-4 sm:p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{editing ? 'Edit schedule' : 'New schedule'}</h2>
            <button type="button" onClick={() => { setCreating(false); setEditing(null) }} className={btn.ghost} aria-label="Close">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (f.savedReportId && f.recipients.trim()) save.mutate() }} className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <Label htmlFor="s-report" required hint="A schedule sends a saved view, so the period moves with the calendar">Report</Label>
              <select id="s-report" className={field} value={f.savedReportId} onChange={(e) => setF((s) => ({ ...s, savedReportId: e.target.value }))}>
                {saved?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="s-freq">How often</Label>
              <select id="s-freq" className={field} value={f.frequency} onChange={(e) => setF((s) => ({ ...s, frequency: e.target.value }))}>
                <option value="daily">Every day</option>
                <option value="weekly">Every week</option>
                <option value="monthly">Every month</option>
              </select>
            </div>
            {f.frequency === 'weekly' && (
              <div>
                <Label htmlFor="s-dow">On</Label>
                <select id="s-dow" className={field} value={f.dayOfWeek} onChange={(e) => setF((s) => ({ ...s, dayOfWeek: Number(e.target.value) }))}>
                  {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                </select>
              </div>
            )}
            {f.frequency === 'monthly' && (
              <div>
                <Label htmlFor="s-dom" hint="1–28, so February always has one">Day of the month</Label>
                <input id="s-dom" type="number" min={1} max={28} className={field} value={f.dayOfMonth} onChange={(e) => setF((s) => ({ ...s, dayOfMonth: Number(e.target.value) }))} />
              </div>
            )}
            <div>
              <Label htmlFor="s-hour">At</Label>
              <select id="s-hour" className={field} value={f.hour} onChange={(e) => setF((s) => ({ ...s, hour: Number(e.target.value) }))}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="s-to" required hint="Commas or one per line">Send to</Label>
              <textarea id="s-to" rows={2} className={`${field} py-2`} placeholder="treasurer@church.org, pastor@church.org" value={f.recipients} onChange={(e) => setF((s) => ({ ...s, recipients: e.target.value }))} />
            </div>
            <label className="sm:col-span-3 flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 rounded border-border" checked={f.isActive} onChange={(e) => setF((s) => ({ ...s, isActive: e.target.checked }))} />
              Active
            </label>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => { setCreating(false); setEditing(null) }} className={btn.secondary}>Cancel</button>
              <button type="submit" disabled={!f.savedReportId || !f.recipients.trim() || save.isPending} className={btn.primary}>
                <Save className="size-4" aria-hidden />
                {save.isPending ? 'Saving…' : 'Save schedule'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className={`${CARD} overflow-hidden mb-6`}>
        {error ? (
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton cols={5} />
        ) : !schedules?.length ? (
          <EmptyState
            icon={Mail}
            title="Nothing is scheduled"
            subtitle={saved?.length
              ? 'Pick a saved view and have it emailed on a cadence.'
              : 'Save a view on the reports page first — a schedule sends a saved view.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {['Report', 'When', 'To', 'Next send', 'Last result', ''].map((h, i) => (
                    <th key={i} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{s.reportName}</p>
                      {!s.isActive && (
                        <Chip className="bg-gray-100 text-gray-700 border-gray-200 mt-1">Paused</Chip>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{describeSchedule(s)}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[16rem] truncate" title={s.recipients}>
                      {s.recipients}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums whitespace-nowrap">
                      {s.isActive ? s.nextRunAt.replace('T', ' ').slice(0, 16) : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {!s.lastRunAt ? (
                        <span className="text-muted-foreground">Never sent</span>
                      ) : s.lastStatus === 'sent' ? (
                        <Chip className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 className="size-3" aria-hidden /> Sent
                        </Chip>
                      ) : (
                        <Chip className="bg-red-100 text-red-800 border-red-200" >
                          <AlertTriangle className="size-3" aria-hidden /> Failed
                        </Chip>
                      )}
                      {s.runCount > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">{s.runCount}×</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button type="button" onClick={() => sendNow.mutate(s.id)} disabled={sendNow.isPending} className={btn.ghost} title="Send it now, without waiting for its slot">
                        <Send className="size-3.5" aria-hidden /> Send now
                      </button>
                      <button type="button" onClick={() => open(s)} className={`${btn.secondary} ml-1`}>Edit</button>
                      <button type="button" onClick={() => remove.mutate(s.id)} disabled={remove.isPending} className={`${btn.ghost} ml-1`} aria-label={`Delete schedule for ${s.reportName}`}>
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delivery log — without it, "did the treasurer get last Monday's
          report?" has no answer but somebody's inbox. */}
      <section className={`${CARD} overflow-hidden`}>
        <h2 className="font-semibold px-4 py-3 border-b border-border flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" aria-hidden /> What has been sent
        </h2>
        {!deliveries?.length ? (
          <EmptyState title="Nothing sent yet" subtitle="Every send is recorded here, including the ones that fail." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  {['When', 'Report', 'To', 'Period', 'Rows', 'Result'].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums whitespace-nowrap">
                      {d.sentAt.replace('T', ' ').slice(0, 16)}
                    </td>
                    <td className="px-4 py-2.5">{d.reportName}</td>
                    <td className="px-4 py-2.5 text-muted-foreground max-w-[14rem] truncate" title={d.recipients}>{d.recipients}</td>
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums whitespace-nowrap">
                      {d.periodFrom} → {d.periodTo}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{d.rowCount}</td>
                    <td className="px-4 py-2.5">
                      {d.status === 'sent' ? (
                        <Chip className="bg-green-100 text-green-800 border-green-200">Sent</Chip>
                      ) : (
                        <span className="inline-flex flex-col gap-0.5">
                          <Chip className="bg-red-100 text-red-800 border-red-200">Failed</Chip>
                          <span className="text-xs text-red-700 max-w-[22rem]">{d.error}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
