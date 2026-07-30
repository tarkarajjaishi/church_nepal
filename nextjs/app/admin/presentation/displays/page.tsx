'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Monitor, Plus, X, Save, Trash2, ExternalLink, Copy, Check } from 'lucide-react'
import { presentationApi, clock, type DisplayStatus } from '@/lib/presentation/api'
import {
  CARD, PageHeader, EmptyState, TableSkeleton, Chip, btn, field, Label,
} from '@/components/offerings/ui'

const KINDS = [
  { value: 'projector', label: 'Main Projector' },
  { value: 'led_wall', label: 'LED Wall' },
  { value: 'stage', label: 'Stage Display' },
  { value: 'confidence', label: 'Confidence Monitor' },
  { value: 'lobby', label: 'Lobby TV' },
  { value: 'kids', label: 'Children Room TV' },
  { value: 'outdoor', label: 'Outdoor Screen' },
  { value: 'stream', label: 'Livestream Output' },
]

const RESOLUTIONS = ['1920x1080', '3840x2160', '1280x720', '1366x768', '1024x768']

// Values come from connection_for() in handlers/presentation_live.rs.
const CONN: Record<string, { cls: string; label: string }> = {
  online: { cls: 'bg-green-100 text-green-800 border-green-200', label: 'Online' },
  stale: { cls: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Stale' },
  offline: { cls: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Offline' },
}

export default function DisplaysPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [f, setF] = useState({
    name: '', displayKind: 'projector', resolution: '1920x1080',
    orientation: 'landscape', showsNotes: false, showsNextSlide: false, isStreamOutput: false,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['displays'],
    queryFn: presentationApi.displays,
    // The connection state is derived from last_seen_at, which only advances
    // when a display polls, so this needs to refresh to stay truthful.
    refetchInterval: 10_000,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['displays'] })

  const create = useMutation({
    mutationFn: () =>
      presentationApi.createDisplay({
        name: f.name.trim(),
        display_kind: f.displayKind,
        resolution: f.resolution,
        orientation: f.orientation,
        shows_notes: f.showsNotes,
        shows_next_slide: f.showsNextSlide,
        is_stream_output: f.isStreamOutput,
      }),
    onSuccess: () => {
      invalidate()
      toast.success('Display added')
      setOpen(false)
      setF({ name: '', displayKind: 'projector', resolution: '1920x1080', orientation: 'landscape', showsNotes: false, showsNextSlide: false, isStreamOutput: false })
    },
    onError: (e: Error) => toast.error(e.message || 'Could not add this display'),
  })

  const toggle = useMutation({
    mutationFn: (d: DisplayStatus) =>
      presentationApi.updateDisplay(d.id, { name: d.name, is_enabled: !d.isEnabled }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => presentationApi.deleteDisplay(id),
    onSuccess: () => { invalidate(); toast.success('Display removed') },
    onError: (e: Error) => toast.error(e.message),
  })

  const displayUrl = (slug: string, d: DisplayStatus) => {
    const p = new URLSearchParams()
    if (d.showsNotes) p.set('notes', '1')
    if (d.showsNextSlide) p.set('next', '1')
    const q = p.toString()
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/display/${slug}${q ? `?${q}` : ''}`
  }

  const copy = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(id)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      toast.error('Could not copy — select and copy the URL manually')
    }
  }

  return (
    <>
      <PageHeader
        title="Displays"
        subtitle="Each screen opens its own URL and polls for the live slide"
        actions={
          <button type="button" onClick={() => setOpen((v) => !v)} className={btn.primary}>
            <Plus className="size-4" aria-hidden />
            Add Display
          </button>
        }
      />

      {open && (
        <section className={`${CARD} p-4 sm:p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">New display</h2>
            <button type="button" onClick={() => setOpen(false)} className={btn.ghost} aria-label="Close"><X className="size-4" aria-hidden /></button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (f.name.trim()) create.mutate() }} className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="d-name" required>Name</Label>
              <input id="d-name" className={field} placeholder="Main Projector" value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="d-kind">Type</Label>
              <select id="d-kind" className={field} value={f.displayKind} onChange={(e) => setF((s) => ({ ...s, displayKind: e.target.value }))}>
                {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="d-res">Resolution</Label>
              <select id="d-res" className={field} value={f.resolution} onChange={(e) => setF((s) => ({ ...s, resolution: e.target.value }))}>
                {RESOLUTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="sm:col-span-3 flex flex-wrap gap-4">
              {([
                ['showsNextSlide', 'Show next slide (confidence monitor)'],
                ['showsNotes', 'Show speaker notes (stage display)'],
                ['isStreamOutput', 'Clean feed for livestream'],
              ] as const).map(([k, label]) => (
                <label key={k} className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={f[k]}
                    onChange={(e) => setF((s) => ({ ...s, [k]: e.target.checked }))}
                    className="size-4 rounded border-border accent-[var(--church-blue)]"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className={btn.secondary}>Cancel</button>
              <button type="submit" disabled={!f.name.trim() || create.isPending} className={btn.primary}>
                <Save className="size-4" aria-hidden />
                {create.isPending ? 'Saving…' : 'Add display'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className={`${CARD} overflow-hidden`}>
        {isLoading ? (
          <TableSkeleton cols={6} />
        ) : !data?.length ? (
          <EmptyState
            icon={Monitor}
            title="No displays configured"
            subtitle="Add a display, then open its URL fullscreen on the device driving that screen."
            action={<button type="button" onClick={() => setOpen(true)} className={btn.primary}>Add Display</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr>
                  {['Display', 'Type', 'Resolution', 'Connection', 'URL', ''].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((d) => {
                  const conn = CONN[d.connection] ?? CONN.offline
                  const url = displayUrl(d.slug, d)
                  return (
                    <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{d.name}</p>
                        {!d.isEnabled && (
                          <span className="text-xs text-muted-foreground">Disabled</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {KINDS.find((k) => k.value === d.displayKind)?.label ?? d.displayKind}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">{d.resolution}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Chip className={conn.cls}>{conn.label}</Chip>
                        {d.secondsSinceSeen != null && d.connection !== 'online' && (
                          <span className="ml-2 text-xs text-muted-foreground">{clock(d.secondsSinceSeen)} ago</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <code className="text-xs text-muted-foreground truncate max-w-[14rem]">/display/{d.slug}</code>
                          <button
                            type="button"
                            onClick={() => copy(url, d.id)}
                            className="inline-flex items-center justify-center size-7 rounded hover:bg-muted transition-colors"
                            aria-label={`Copy URL for ${d.name}`}
                          >
                            {copied === d.id
                              ? <Check className="size-3.5 text-green-600" aria-hidden />
                              : <Copy className="size-3.5 text-muted-foreground" aria-hidden />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="inline-flex gap-1">
                          <a href={url} target="_blank" rel="noopener noreferrer" className={btn.ghost}>
                            <ExternalLink className="size-3.5" aria-hidden />
                            Open
                          </a>
                          <button type="button" onClick={() => toggle.mutate(d)} className={btn.ghost}>
                            {d.isEnabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { if (window.confirm(`Remove "${d.name}"?`)) remove.mutate(d.id) }}
                            className={btn.ghost}
                            aria-label={`Remove ${d.name}`}
                          >
                            <Trash2 className="size-3.5 text-destructive" aria-hidden />
                          </button>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground max-w-prose">
        Open a display URL fullscreen on the machine driving that screen. It needs no login,
        reconnects on its own, and keeps the last slide on screen while it does — a projector
        should never show an error to a congregation. Press <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">F</kbd> on
        the display device to toggle fullscreen.
      </p>
    </>
  )
}
