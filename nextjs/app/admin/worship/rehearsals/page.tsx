'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CalendarClock, Plus, X, Save, Trash2, MapPin, Users } from 'lucide-react'
import { worshipApi, type Rehearsal } from '@/lib/worship/api'
import {
  CARD, PageHeader, EmptyState, TableSkeleton, Chip, btn, field, Label,
} from '@/components/offerings/ui'

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
}

export default function RehearsalsPage() {
  const qc = useQueryClient()
  const today = new Date().toISOString().slice(0, 10)
  const [creating, setCreating] = useState(false)
  const [f, setF] = useState({
    title: 'Rehearsal', serviceId: '', rehearsalDate: today,
    startTime: '17:00', endTime: '19:00', location: '', agenda: '',
  })

  const { data: rehearsals, isLoading } = useQuery({
    queryKey: ['worship-rehearsals'],
    queryFn: worshipApi.rehearsals,
  })
  const { data: services } = useQuery({
    queryKey: ['worship-services-upcoming'],
    queryFn: () => worshipApi.services({ upcoming: true }),
    staleTime: 60_000,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['worship-rehearsals'] })
    qc.invalidateQueries({ queryKey: ['worship-dashboard'] })
  }

  const create = useMutation({
    mutationFn: () =>
      worshipApi.createRehearsal({
        title: f.title.trim() || 'Rehearsal',
        service_id: f.serviceId || null,
        rehearsal_date: f.rehearsalDate,
        start_time: f.startTime || null,
        end_time: f.endTime || null,
        location: f.location.trim(),
        agenda: f.agenda.trim(),
      }),
    onSuccess: (r: Rehearsal) => {
      invalidate()
      setCreating(false)
      // Tying a rehearsal to a service auto-invites that roster, which is not
      // obvious from the form — say what happened.
      toast.success(
        r.invitedCount > 0
          ? `Rehearsal scheduled — ${r.invitedCount} invited from the service roster`
          : 'Rehearsal scheduled'
      )
    },
    onError: (e: Error) => toast.error(e.message || 'Could not schedule the rehearsal'),
  })

  const remove = useMutation({
    mutationFn: (id: string) => worshipApi.deleteRehearsal(id),
    onSuccess: () => { invalidate(); toast.success('Rehearsal removed') },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <>
      <PageHeader
        title="Rehearsals"
        subtitle="Practice sessions and who turned up"
        actions={
          <button type="button" onClick={() => setCreating((v) => !v)} className={btn.primary}>
            <Plus className="size-4" aria-hidden /> Schedule
          </button>
        }
      />

      {creating && (
        <section className={`${CARD} p-4 sm:p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Schedule a rehearsal</h2>
            <button type="button" onClick={() => setCreating(false)} className={btn.ghost} aria-label="Close">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); create.mutate() }} className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="r-title">Title</Label>
              <input id="r-title" className={field} value={f.title} onChange={(e) => setF((s) => ({ ...s, title: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="r-service" hint="Invites that service's roster automatically">For which service</Label>
              <select id="r-service" className={field} value={f.serviceId} onChange={(e) => setF((s) => ({ ...s, serviceId: e.target.value }))}>
                <option value="">Not linked to a service</option>
                {(services ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {s.serviceDate}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="r-date" required>Date</Label>
              <input id="r-date" type="date" className={field} value={f.rehearsalDate} onChange={(e) => setF((s) => ({ ...s, rehearsalDate: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="r-start">Start</Label>
              <input id="r-start" type="time" className={field} value={f.startTime} onChange={(e) => setF((s) => ({ ...s, startTime: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="r-end">End</Label>
              <input id="r-end" type="time" className={field} value={f.endTime} onChange={(e) => setF((s) => ({ ...s, endTime: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="r-loc">Location</Label>
              <input id="r-loc" className={field} placeholder="Main Hall" value={f.location} onChange={(e) => setF((s) => ({ ...s, location: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="r-agenda">Agenda</Label>
              <input id="r-agenda" className={field} placeholder="What to work on" value={f.agenda} onChange={(e) => setF((s) => ({ ...s, agenda: e.target.value }))} />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className={btn.secondary}>Cancel</button>
              <button type="submit" disabled={create.isPending} className={btn.primary}>
                <Save className="size-4" aria-hidden />
                {create.isPending ? 'Scheduling…' : 'Schedule'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className={`${CARD} overflow-hidden`}>
        {isLoading ? (
          <TableSkeleton cols={6} />
        ) : !rehearsals?.length ? (
          <EmptyState
            icon={CalendarClock}
            title="No rehearsals scheduled"
            subtitle="Schedule practice for an upcoming service and the roster is invited automatically."
            action={<button type="button" onClick={() => setCreating(true)} className={btn.primary}>Schedule</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {['Rehearsal', 'Date', 'Time', 'Location', 'For service', 'Attendance', 'Status', ''].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rehearsals.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{r.title}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.rehearsalDate}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {r.startTime ? `${r.startTime.slice(0, 5)}${r.endTime ? `–${r.endTime.slice(0, 5)}` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" aria-hidden />{r.location}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[14rem] truncate">{r.serviceName ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Users className="size-3.5" aria-hidden />
                        <span className="tabular-nums">{r.presentCount} / {r.invitedCount}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Chip className={STATUS_STYLE[r.status] ?? STATUS_STYLE.scheduled}>{r.status}</Chip>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => { if (window.confirm(`Remove "${r.title}"?`)) remove.mutate(r.id) }}
                        className={btn.ghost}
                        aria-label={`Remove ${r.title}`}
                      >
                        <Trash2 className="size-3.5 text-destructive" aria-hidden />
                      </button>
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
