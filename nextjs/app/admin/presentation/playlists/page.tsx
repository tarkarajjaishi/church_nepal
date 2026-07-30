'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ListMusic, Plus, X, Save, Trash2, Copy, GripVertical, MonitorPlay, ChevronUp, ChevronDown,
} from 'lucide-react'
import { presentationApi, clock, type Playlist, type PlaylistWithItems } from '@/lib/presentation/api'
import {
  CARD, PageHeader, EmptyState, TableSkeleton, Chip, btn, field, Label,
} from '@/components/offerings/ui'

/** A typical Nepali church running order, offered as one-click starters. */
const ITEM_PRESETS = [
  'Countdown', 'Welcome', 'Opening Prayer', 'Song', 'Announcements',
  'Bible Reading', 'Offering', 'Special Music', 'Message', 'Communion',
  'Closing Song', 'Benediction', 'Thank You',
]

export default function PlaylistsPage() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState({
    name: '', serviceDate: new Date().toISOString().slice(0, 10),
    serviceTime: '10:30', serviceName: 'Sunday First Service', operator: '',
  })

  const { data: playlists, isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: presentationApi.playlists,
  })

  const activeId = selectedId ?? playlists?.[0]?.id ?? null
  const { data: detail } = useQuery({
    queryKey: ['playlist', activeId],
    queryFn: () => presentationApi.playlist(activeId!),
    enabled: !!activeId,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['playlists'] })
    if (activeId) qc.invalidateQueries({ queryKey: ['playlist', activeId] })
  }

  const create = useMutation({
    mutationFn: () =>
      presentationApi.createPlaylist({
        name: draft.name.trim(),
        service_date: draft.serviceDate || null,
        service_time: draft.serviceTime || null,
        service_name: draft.serviceName,
        operator: draft.operator.trim(),
      }),
    onSuccess: (p: Playlist) => {
      invalidate()
      setSelectedId(p.id)
      setCreating(false)
      setDraft((d) => ({ ...d, name: '', operator: '' }))
      toast.success('Playlist created')
    },
    onError: (e: Error) => toast.error(e.message || 'Could not create the playlist'),
  })

  const duplicate = useMutation({
    mutationFn: (id: string) => presentationApi.duplicatePlaylist(id),
    onSuccess: (p: PlaylistWithItems) => { invalidate(); setSelectedId(p.id); toast.success('Playlist duplicated') },
    onError: (e: Error) => toast.error(e.message),
  })

  const removePlaylist = useMutation({
    mutationFn: (id: string) => presentationApi.deletePlaylist(id),
    onSuccess: () => { invalidate(); setSelectedId(null); toast.success('Playlist deleted') },
    onError: (e: Error) => toast.error(e.message),
  })

  const addItem = useMutation({
    mutationFn: (title: string) =>
      presentationApi.addPlaylistItem(activeId!, { title, item_kind: 'section' }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  })

  const removeItem = useMutation({
    mutationFn: (id: string) => presentationApi.deletePlaylistItem(id),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  })

  // Reorder with buttons rather than drag-and-drop: it works on a touchscreen
  // in a dim booth, it is keyboard reachable, and it needs no drag library.
  const reorder = useMutation({
    mutationFn: (ids: string[]) => presentationApi.reorderPlaylistItems(activeId!, ids),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message || 'Could not reorder'),
  })

  const move = (index: number, delta: number) => {
    const items = detail?.items ?? []
    const target = index + delta
    if (target < 0 || target >= items.length) return
    const ids = items.map((i) => i.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorder.mutate(ids)
  }

  return (
    <>
      <PageHeader
        title="Playlists"
        subtitle="The running order for a service"
        actions={
          <button type="button" onClick={() => setCreating((v) => !v)} className={btn.primary}>
            <Plus className="size-4" aria-hidden />
            New Playlist
          </button>
        }
      />

      {creating && (
        <section className={`${CARD} p-4 sm:p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">New playlist</h2>
            <button type="button" onClick={() => setCreating(false)} className={btn.ghost} aria-label="Close"><X className="size-4" aria-hidden /></button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (draft.name.trim()) create.mutate() }} className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Label htmlFor="p-name" required>Name</Label>
              <input id="p-name" className={field} placeholder="Sunday 10:30 Service" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="p-date">Service date</Label>
              <input id="p-date" type="date" className={field} value={draft.serviceDate} onChange={(e) => setDraft((d) => ({ ...d, serviceDate: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="p-time">Start time</Label>
              <input id="p-time" type="time" className={field} value={draft.serviceTime} onChange={(e) => setDraft((d) => ({ ...d, serviceTime: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="p-service">Service</Label>
              <input id="p-service" className={field} value={draft.serviceName} onChange={(e) => setDraft((d) => ({ ...d, serviceName: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="p-op">Operator</Label>
              <input id="p-op" className={field} placeholder="Who is running slides" value={draft.operator} onChange={(e) => setDraft((d) => ({ ...d, operator: e.target.value }))} />
            </div>
            <div className="sm:col-span-4 flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className={btn.secondary}>Cancel</button>
              <button type="submit" disabled={!draft.name.trim() || create.isPending} className={btn.primary}>
                <Save className="size-4" aria-hidden />
                {create.isPending ? 'Creating…' : 'Create playlist'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Playlist list */}
        <div className={`${CARD} overflow-hidden lg:col-span-1`}>
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">All playlists</h2>
          </div>
          {isLoading ? (
            <TableSkeleton cols={2} rows={4} />
          ) : !playlists?.length ? (
            <EmptyState
              icon={ListMusic}
              title="No playlists"
              subtitle="Create one to plan a service."
              action={<button type="button" onClick={() => setCreating(true)} className={btn.primary}>New Playlist</button>}
            />
          ) : (
            <ul className="divide-y divide-border max-h-[32rem] overflow-y-auto">
              {playlists.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    aria-current={p.id === activeId ? 'true' : undefined}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      p.id === activeId ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-muted/50 border-l-2 border-transparent'
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.serviceDate ?? 'No date'}{p.serviceTime && ` · ${p.serviceTime.slice(0, 5)}`}
                      {p.isTemplate && ' · template'}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Playlist detail */}
        <div className={`${CARD} overflow-hidden lg:col-span-2`}>
          {!detail ? (
            <EmptyState icon={ListMusic} title="Select a playlist" subtitle="Pick one on the left to edit its running order." />
          ) : (
            <>
              <div className="p-4 sm:p-5 border-b border-border flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold truncate">{detail.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {detail.items.length} item{detail.items.length === 1 ? '' : 's'}
                    {detail.plannedTotalSeconds > 0 && ` · planned ${clock(detail.plannedTotalSeconds)}`}
                    {detail.operator && ` · ${detail.operator}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Link href="/admin/presentation/live" className={btn.primary}>
                    <MonitorPlay className="size-4" aria-hidden />
                    Go Live
                  </Link>
                  <button type="button" onClick={() => duplicate.mutate(detail.id)} className={btn.secondary}>
                    <Copy className="size-4" aria-hidden />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (window.confirm(`Delete "${detail.name}"?`)) removePlaylist.mutate(detail.id) }}
                    className={btn.ghost}
                    aria-label="Delete playlist"
                  >
                    <Trash2 className="size-4 text-destructive" aria-hidden />
                  </button>
                </div>
              </div>

              {detail.items.length === 0 ? (
                <div className="p-5">
                  <p className="text-sm text-muted-foreground mb-3">
                    Empty running order. Add the usual sections to get started:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ITEM_PRESETS.map((t) => (
                      <button key={t} type="button" onClick={() => addItem.mutate(t)} className={btn.secondary}>
                        <Plus className="size-3.5" aria-hidden />
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <ol className="divide-y divide-border">
                    {detail.items.map((item, i) => (
                      <li key={item.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/50 transition-colors">
                        <GripVertical className="size-4 text-muted-foreground/40 shrink-0" aria-hidden />
                        <span className="text-xs tabular-nums text-muted-foreground w-5 shrink-0">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.itemKind}
                            {item.slideCount != null && ` · ${item.slideCount} slides`}
                            {item.plannedSeconds ? ` · ${clock(item.plannedSeconds)}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || reorder.isPending}
                            className="inline-flex items-center justify-center size-8 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                            aria-label={`Move ${item.title} up`}>
                            <ChevronUp className="size-4" aria-hidden />
                          </button>
                          <button type="button" onClick={() => move(i, 1)} disabled={i === detail.items.length - 1 || reorder.isPending}
                            className="inline-flex items-center justify-center size-8 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                            aria-label={`Move ${item.title} down`}>
                            <ChevronDown className="size-4" aria-hidden />
                          </button>
                          <button type="button" onClick={() => removeItem.mutate(item.id)}
                            className="inline-flex items-center justify-center size-8 rounded hover:bg-muted transition-colors"
                            aria-label={`Remove ${item.title}`}>
                            <X className="size-4 text-destructive" aria-hidden />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div className="p-3 border-t border-border flex flex-wrap gap-1.5">
                    {ITEM_PRESETS.map((t) => (
                      <button key={t} type="button" onClick={() => addItem.mutate(t)} className={btn.ghost}>
                        <Plus className="size-3" aria-hidden />
                        {t}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
