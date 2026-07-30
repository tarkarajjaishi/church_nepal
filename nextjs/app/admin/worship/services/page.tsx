'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  CalendarRange, Plus, X, Save, Trash2, Copy, ChevronUp, ChevronDown,
  Music, Clock, UserPlus, GripVertical, Printer,
} from 'lucide-react'
import {
  worshipApi, duration, ITEM_KINDS, SERVICE_TYPES, SERVICE_STATUSES,
  STATUS_STYLE, ASSIGNMENT_STYLE,
} from '@/lib/worship/api'
import { presentationApi } from '@/lib/presentation/api'
import {
  CARD, PageHeader, EmptyState, TableSkeleton, Chip, btn, field, Label,
} from '@/components/offerings/ui'

export default function ServicesPage() {
  // useSearchParams needs a Suspense boundary or the route fails to prerender.
  return (
    <Suspense fallback={<div className={`${CARD} h-96 animate-pulse`} />}>
      <ServicesInner />
    </Suspense>
  )
}

function ServicesInner() {
  const qc = useQueryClient()
  const params = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const [draft, setDraft] = useState({
    name: 'Sunday Morning Worship', serviceDate: today, startTime: '10:30',
    endTime: '12:00', theme: '', speaker: '', serviceType: 'sunday', worshipLeader: '',
  })

  const { data: services, isLoading } = useQuery({
    queryKey: ['worship-services'],
    queryFn: () => worshipApi.services(),
  })

  // Deep link from the dashboard: ?id=<service>
  useEffect(() => {
    const id = params.get('id')
    if (id) setSelectedId(id)
  }, [params])

  const activeId = selectedId ?? services?.[0]?.id ?? null
  const { data: plan } = useQuery({
    queryKey: ['worship-service', activeId],
    queryFn: () => worshipApi.service(activeId!),
    enabled: !!activeId,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['worship-services'] })
    qc.invalidateQueries({ queryKey: ['worship-dashboard'] })
    if (activeId) qc.invalidateQueries({ queryKey: ['worship-service', activeId] })
  }

  const create = useMutation({
    mutationFn: () =>
      worshipApi.createService({
        name: draft.name.trim(),
        service_date: draft.serviceDate,
        start_time: draft.startTime || null,
        end_time: draft.endTime || null,
        theme: draft.theme.trim(),
        speaker: draft.speaker.trim(),
        service_type: draft.serviceType,
        worship_leader: draft.worshipLeader.trim(),
        status: 'planned',
      }),
    onSuccess: (s) => { invalidate(); setSelectedId(s.id); setCreating(false); toast.success('Service planned') },
    onError: (e: Error) => toast.error(e.message || 'Could not create the service'),
  })

  const removeService = useMutation({
    mutationFn: (id: string) => worshipApi.deleteService(id),
    onSuccess: () => { invalidate(); setSelectedId(null); toast.success('Service deleted') },
    onError: (e: Error) => toast.error(e.message),
  })

  const duplicate = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      worshipApi.duplicateService(id, { name: '', service_date: date }),
    onSuccess: (p) => { invalidate(); setSelectedId(p.service.id); toast.success('Copied to a new date as a draft') },
    onError: (e: Error) => toast.error(e.message),
  })

  const setStatus = useMutation({
    mutationFn: (status: string) =>
      worshipApi.updateService(plan!.service.id, {
        name: plan!.service.name,
        service_date: plan!.service.serviceDate,
        start_time: plan!.service.startTime,
        end_time: plan!.service.endTime,
        status,
      }),
    onSuccess: () => { invalidate(); toast.success('Status updated') },
    onError: (e: Error) => toast.error(e.message),
  })

  const onDuplicate = () => {
    if (!plan) return
    const next = new Date(plan.service.serviceDate)
    next.setDate(next.getDate() + 7)
    const date = window.prompt('Copy this plan to which date?', next.toISOString().slice(0, 10))
    if (!date) return
    duplicate.mutate({ id: plan.service.id, date })
  }

  return (
    <>
      <PageHeader
        title="Service Plans"
        subtitle="Running order, setlist and team for each service"
        actions={
          <button type="button" onClick={() => setCreating((v) => !v)} className={btn.primary}>
            <Plus className="size-4" aria-hidden />
            Plan a Service
          </button>
        }
      />

      {creating && (
        <section className={`${CARD} p-4 sm:p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">New service plan</h2>
            <button type="button" onClick={() => setCreating(false)} className={btn.ghost} aria-label="Close"><X className="size-4" aria-hidden /></button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (draft.name.trim()) create.mutate() }} className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Label htmlFor="s-name" required>Service name</Label>
              <input id="s-name" className={field} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="s-date" required>Date</Label>
              <input id="s-date" type="date" className={field} value={draft.serviceDate} onChange={(e) => setDraft((d) => ({ ...d, serviceDate: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="s-type">Type</Label>
              <select id="s-type" className={field} value={draft.serviceType} onChange={(e) => setDraft((d) => ({ ...d, serviceType: e.target.value }))}>
                {SERVICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="s-start">Start</Label>
              <input id="s-start" type="time" className={field} value={draft.startTime} onChange={(e) => setDraft((d) => ({ ...d, startTime: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="s-end">End</Label>
              <input id="s-end" type="time" className={field} value={draft.endTime} onChange={(e) => setDraft((d) => ({ ...d, endTime: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="s-theme">Theme</Label>
              <input id="s-theme" className={field} value={draft.theme} onChange={(e) => setDraft((d) => ({ ...d, theme: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="s-speaker">Speaker</Label>
              <input id="s-speaker" className={field} value={draft.speaker} onChange={(e) => setDraft((d) => ({ ...d, speaker: e.target.value }))} />
            </div>
            <div className="sm:col-span-4 flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className={btn.secondary}>Cancel</button>
              <button type="submit" disabled={!draft.name.trim() || create.isPending} className={btn.primary}>
                <Save className="size-4" aria-hidden />
                {create.isPending ? 'Creating…' : 'Create plan'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Service list */}
        <div className={`${CARD} overflow-hidden lg:col-span-1`}>
          <div className="p-4 border-b border-border"><h2 className="font-semibold">All plans</h2></div>
          {isLoading ? (
            <TableSkeleton cols={2} rows={5} />
          ) : !services?.length ? (
            <EmptyState icon={CalendarRange} title="No service plans" subtitle="Plan your first service."
              action={<button type="button" onClick={() => setCreating(true)} className={btn.primary}>Plan a Service</button>} />
          ) : (
            <ul className="divide-y divide-border max-h-[36rem] overflow-y-auto">
              {services.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => setSelectedId(s.id)}
                    aria-current={s.id === activeId ? 'true' : undefined}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      s.id === activeId ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-muted/50 border-l-2 border-transparent'
                    }`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <Chip className={STATUS_STYLE[s.status] ?? STATUS_STYLE.draft}>{s.status}</Chip>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.serviceDate}{s.startTime && ` · ${s.startTime.slice(0, 5)}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.itemCount} items · {s.songCount} songs · {s.teamCount} on team
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Plan detail */}
        <div className="lg:col-span-2 space-y-4">
          {!plan ? (
            <div className={CARD}>
              <EmptyState icon={CalendarRange} title="Select a service" subtitle="Pick a plan on the left to edit it." />
            </div>
          ) : (
            <>
              <div className={`${CARD} p-4 sm:p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-lg truncate">{plan.service.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {plan.service.serviceDate}
                      {plan.service.startTime && ` · ${plan.service.startTime.slice(0, 5)}`}
                      {plan.service.endTime && `–${plan.service.endTime.slice(0, 5)}`}
                    </p>
                    {(plan.service.theme || plan.service.speaker) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[plan.service.theme, plan.service.speaker].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <select
                      className={`${field} w-auto`}
                      value={plan.service.status}
                      onChange={(e) => setStatus.mutate(e.target.value)}
                      aria-label="Service status"
                    >
                      {SERVICE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button type="button" onClick={onDuplicate} className={btn.secondary}>
                      <Copy className="size-4" aria-hidden /> Duplicate
                    </button>
                    <button type="button" onClick={() => window.print()} aria-label="Print this service plan" className={btn.secondary}>
                      <Printer className="size-4" aria-hidden />
                    </button>
                    <button type="button"
                      onClick={() => { if (window.confirm(`Delete "${plan.service.name}"?`)) removeService.mutate(plan.service.id) }}
                      className={btn.ghost} aria-label="Delete plan">
                      <Trash2 className="size-4 text-destructive" aria-hidden />
                    </button>
                  </div>
                </div>

                <dl className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                  <div><dt className="text-xs text-muted-foreground">Planned</dt>
                    <dd className="font-semibold tabular-nums">{duration(plan.plannedSeconds)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Actual</dt>
                    <dd className="font-semibold tabular-nums">
                      {plan.actualSeconds > 0 ? duration(plan.actualSeconds) : '—'}
                    </dd></div>
                  <div><dt className="text-xs text-muted-foreground">On team</dt>
                    <dd className="font-semibold tabular-nums">{plan.team.length}</dd></div>
                </dl>
              </div>

              <RunningOrder plan={plan} onChange={invalidate} />
              <TeamPanel plan={plan} onChange={invalidate} />
            </>
          )}
        </div>
      </div>
    </>
  )
}

function RunningOrder({
  plan,
  onChange,
}: {
  plan: NonNullable<Awaited<ReturnType<typeof worshipApi.service>>>
  onChange: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [kind, setKind] = useState('song')
  const [songId, setSongId] = useState('')
  const [songKey, setSongKey] = useState('')

  const { data: songs } = useQuery({
    queryKey: ['songs-for-plan'],
    queryFn: () => presentationApi.songs({ perPage: 200 }),
    staleTime: 60_000,
  })

  const add = useMutation({
    mutationFn: () => {
      const preset = ITEM_KINDS.find((k) => k.value === kind)
      return worshipApi.addItem(plan.service.id,
        kind === 'song'
          ? { song_id: songId, song_key: songKey, planned_seconds: preset?.seconds ?? 300 }
          : { item_kind: kind, title: preset?.label ?? 'Item', planned_seconds: preset?.seconds ?? 180 })
    },
    onSuccess: () => { onChange(); setAdding(false); setSongId(''); setSongKey('') },
    onError: (e: Error) => toast.error(e.message || 'Could not add the item'),
  })

  const remove = useMutation({
    mutationFn: (id: string) => worshipApi.deleteItem(id),
    onSuccess: onChange,
    onError: (e: Error) => toast.error(e.message),
  })

  // Buttons rather than drag-and-drop: keyboard reachable, works on a phone
  // in a rehearsal room, and needs no drag library.
  const reorder = useMutation({
    mutationFn: (ids: string[]) => worshipApi.reorderItems(plan.service.id, ids),
    onSuccess: onChange,
    onError: (e: Error) => toast.error(e.message),
  })

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= plan.items.length) return
    const ids = plan.items.map((i) => i.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorder.mutate(ids)
  }

  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Running Order</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {plan.items.length} items · the songs here are the setlist
          </p>
        </div>
        <button type="button" onClick={() => setAdding((v) => !v)} className={btn.secondary}>
          <Plus className="size-4" aria-hidden /> Add
        </button>
      </div>

      {adding && (
        <div className="p-4 border-b border-border bg-muted/30">
          <form onSubmit={(e) => { e.preventDefault(); if (kind !== 'song' || songId) add.mutate() }}
            className="flex flex-wrap items-end gap-2">
            <div className="min-w-[10rem]">
              <Label htmlFor="i-kind">Type</Label>
              <select id="i-kind" className={field} value={kind} onChange={(e) => setKind(e.target.value)}>
                {ITEM_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </div>
            {kind === 'song' && (
              <>
                <div className="min-w-[14rem] flex-1">
                  <Label htmlFor="i-song" required>Song</Label>
                  <select id="i-song" className={field} value={songId} onChange={(e) => setSongId(e.target.value)}>
                    <option value="">Choose a song…</option>
                    {(songs?.data ?? []).map((s) => (
                      <option key={s.id} value={s.id}>{s.title}{s.songKey ? ` (${s.songKey})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <Label htmlFor="i-key" hint="Optional">Key</Label>
                  <input id="i-key" className={field} placeholder="G" value={songKey} onChange={(e) => setSongKey(e.target.value)} />
                </div>
              </>
            )}
            <button type="submit" disabled={add.isPending || (kind === 'song' && !songId)} className={btn.primary}>
              {add.isPending ? 'Adding…' : 'Add'}
            </button>
            <button type="button" onClick={() => setAdding(false)} className={btn.ghost}>Cancel</button>
          </form>
          {kind === 'song' && (
            <p className="mt-2 text-xs text-muted-foreground">
              Setting a key here transposes it for this service only — the song&rsquo;s own key is left alone.
            </p>
          )}
        </div>
      )}

      {!plan.items.length ? (
        <EmptyState icon={Music} title="Nothing planned yet" subtitle="Add songs and service elements to build the order." />
      ) : (
        <ol className="divide-y divide-border">
          {plan.items.map((item, i) => (
            <li key={item.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/50 transition-colors">
              <GripVertical className="size-4 text-muted-foreground/40 shrink-0" aria-hidden />
              <span className="text-xs tabular-nums text-muted-foreground w-5 shrink-0">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  {item.songId && (
                    <Chip className="bg-muted text-muted-foreground border-border">
                      <Music className="size-3" aria-hidden />
                      {item.songKey || item.songDefaultKey || '—'}
                      {item.songBpm ? ` · ${item.songBpm}bpm` : ''}
                    </Chip>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.itemKind}
                  {item.plannedSeconds > 0 && ` · ${duration(item.plannedSeconds)}`}
                  {item.actualSeconds != null && ` · actual ${duration(item.actualSeconds)}`}
                  {item.leader && ` · ${item.leader}`}
                </p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || reorder.isPending}
                  className="inline-flex items-center justify-center size-8 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                  aria-label={`Move ${item.title} up`}>
                  <ChevronUp className="size-4" aria-hidden />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === plan.items.length - 1 || reorder.isPending}
                  className="inline-flex items-center justify-center size-8 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                  aria-label={`Move ${item.title} down`}>
                  <ChevronDown className="size-4" aria-hidden />
                </button>
                <button type="button" onClick={() => remove.mutate(item.id)}
                  className="inline-flex items-center justify-center size-8 rounded hover:bg-muted transition-colors"
                  aria-label={`Remove ${item.title}`}>
                  <X className="size-4 text-destructive" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {plan.items.length > 0 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm">
          <span className="text-muted-foreground inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden /> Planned length
          </span>
          <span className="font-semibold tabular-nums">{duration(plan.plannedSeconds)}</span>
        </div>
      )}
    </div>
  )
}

function TeamPanel({
  plan,
  onChange,
}: {
  plan: NonNullable<Awaited<ReturnType<typeof worshipApi.service>>>
  onChange: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [memberId, setMemberId] = useState('')
  const [roleId, setRoleId] = useState('')

  const { data: members } = useQuery({
    queryKey: ['worship-members-active'],
    queryFn: () => worshipApi.members({ active: true }),
    staleTime: 60_000,
  })
  const { data: roles } = useQuery({ queryKey: ['worship-roles'], queryFn: worshipApi.roles, staleTime: 300_000 })

  const assign = useMutation({
    mutationFn: () => worshipApi.assign(plan.service.id, { member_id: memberId, role_id: roleId || undefined }),
    onSuccess: () => { onChange(); setMemberId(''); setRoleId(''); setAdding(false); toast.success('Added to the team') },
    // The 409 here is the double-booking guard, and its message names the
    // clashing service — surface it rather than a generic failure.
    onError: (e: Error) => toast.error(e.message || 'Could not add to the team'),
  })

  const unassign = useMutation({
    mutationFn: (id: string) => worshipApi.unassign(id),
    onSuccess: onChange,
    onError: (e: Error) => toast.error(e.message),
  })

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => worshipApi.assignmentStatus(id, status),
    onSuccess: onChange,
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3">
        <h2 className="font-semibold">Team</h2>
        <button type="button" onClick={() => setAdding((v) => !v)} className={btn.secondary}>
          <UserPlus className="size-4" aria-hidden /> Roster
        </button>
      </div>

      {adding && (
        <div className="p-4 border-b border-border bg-muted/30">
          <form onSubmit={(e) => { e.preventDefault(); if (memberId) assign.mutate() }} className="flex flex-wrap items-end gap-2">
            <div className="min-w-[12rem] flex-1">
              <Label htmlFor="a-member" required>Person</Label>
              <select id="a-member" className={field} value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                <option value="">Choose someone…</option>
                {(members ?? []).map((m) => (
                  <option key={m.id} value={m.id}>{m.name}{m.roles.length ? ` — ${m.roles.join(', ')}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[10rem]">
              <Label htmlFor="a-role">Role</Label>
              <select id="a-role" className={field} value={roleId} onChange={(e) => setRoleId(e.target.value)}>
                <option value="">Unspecified</option>
                {(roles ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <button type="submit" disabled={!memberId || assign.isPending} className={btn.primary}>
              {assign.isPending ? 'Adding…' : 'Add'}
            </button>
            <button type="button" onClick={() => setAdding(false)} className={btn.ghost}>Cancel</button>
          </form>
        </div>
      )}

      {!plan.team.length ? (
        <EmptyState icon={UserPlus} title="Nobody rostered" subtitle="Add the band and tech team for this service." />
      ) : (
        <ul className="divide-y divide-border">
          {plan.team.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {t.memberName.trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{t.memberName}</p>
                <p className="text-xs text-muted-foreground">{t.roleName ?? 'Role unspecified'}</p>
              </div>
              <select
                className="text-xs rounded-lg border border-border bg-background px-2 py-1"
                value={t.status}
                onChange={(e) => setStatus.mutate({ id: t.id, status: e.target.value })}
                aria-label={`Status for ${t.memberName}`}
              >
                {['invited', 'accepted', 'confirmed', 'declined'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <Chip className={ASSIGNMENT_STYLE[t.status] ?? ASSIGNMENT_STYLE.invited}>{t.status}</Chip>
              <button type="button" onClick={() => unassign.mutate(t.id)}
                className="inline-flex items-center justify-center size-8 rounded hover:bg-muted transition-colors shrink-0"
                aria-label={`Remove ${t.memberName}`}>
                <X className="size-4 text-destructive" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
