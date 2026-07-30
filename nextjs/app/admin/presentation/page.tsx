'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  MonitorPlay, Monitor, Music, ListMusic, Presentation, Radio,
  Clock, CircleDot, ExternalLink,
} from 'lucide-react'
import { presentationApi, clock } from '@/lib/presentation/api'
import { CARD, PageHeader, StatTile, EmptyState, btn } from '@/components/offerings/ui'

/** Connection dot colour. Derived from last_seen_at by the API, not guessed here. */
const CONN: Record<string, { cls: string; label: string }> = {
  online: { cls: 'bg-green-500', label: 'Online' },
  stale: { cls: 'bg-amber-500', label: 'Stale' },
  offline: { cls: 'bg-neutral-400', label: 'Offline' },
}

export default function PresentationDashboardPage() {
  const { data: live } = useQuery({
    queryKey: ['live-frame'],
    queryFn: presentationApi.live,
    refetchInterval: 5_000,
  })
  const { data: displays } = useQuery({
    queryKey: ['displays'],
    queryFn: presentationApi.displays,
    refetchInterval: 10_000,
  })
  const { data: playlists } = useQuery({ queryKey: ['playlists'], queryFn: presentationApi.playlists })
  const { data: songs } = useQuery({ queryKey: ['songs-count'], queryFn: () => presentationApi.songs({ perPage: 1 }) })
  const { data: presentations } = useQuery({
    queryKey: ['presentations'],
    queryFn: () => presentationApi.presentations(),
  })

  const st = live
  const isLive = !!st?.isLive
  const online = (displays ?? []).filter((d) => d.connection === 'online').length

  const todayIso = new Date().toISOString().slice(0, 10)
  const todayPlaylist = (playlists ?? []).find((p) => p.serviceDate === todayIso)

  const elapsed = st?.startedAt
    ? Math.max(0, Math.round((Date.now() - new Date(st.startedAt + 'Z').getTime()) / 1000))
    : null

  return (
    <>
      <PageHeader
        title="Presentation"
        subtitle="Worship display control"
        actions={
          <Link href="/admin/presentation/live" className={btn.primary}>
            <MonitorPlay className="size-4" aria-hidden />
            Open Live Console
          </Link>
        }
      />

      {/* Live banner — the single most important thing on this page */}
      <div
        className={`${CARD} p-4 sm:p-5 mb-4 ${isLive ? 'border-red-500/40 bg-red-500/5' : ''}`}
        role="status"
      >
        <div className="flex flex-wrap items-center gap-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              isLive ? 'bg-red-600 text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Radio className="size-3" aria-hidden />
            {isLive ? 'ON AIR' : 'OFF AIR'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">
              {live?.presentationTitle ?? 'Nothing loaded'}
            </p>
            <p className="text-xs text-muted-foreground">
              {live && live.slideTotal > 0
                ? `Slide ${(st?.slideIndex ?? 0) + 1} of ${live.slideTotal}`
                : 'No slides'}
              {st?.screenMode && st.screenMode !== 'normal' && ` · screen ${st.screenMode}`}
              {st?.operator && ` · ${st.operator}`}
            </p>
          </div>
          {elapsed != null && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Running</p>
              <p className="font-semibold tabular-nums">{clock(elapsed)}</p>
            </div>
          )}
        </div>
      </div>

      <section className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-4">
        <StatTile label="Connected Displays" value={`${online} / ${displays?.length ?? 0}`} icon={Monitor}
          tone={online > 0 ? 'good' : 'default'} />
        <StatTile label="Songs" value={songs?.total ?? 0} icon={Music} />
        <StatTile label="Presentations" value={presentations?.length ?? 0} icon={Presentation} />
        <StatTile label="Playlists" value={playlists?.length ?? 0} icon={ListMusic}
          hint={todayPlaylist ? 'One scheduled today' : undefined} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Displays */}
        <div className={`${CARD} overflow-hidden`}>
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3">
            <h2 className="font-semibold">Displays</h2>
            <Link href="/admin/presentation/displays" className={btn.ghost}>Manage</Link>
          </div>
          {!displays?.length ? (
            <EmptyState
              icon={Monitor}
              title="No displays configured"
              subtitle="Add a display, then open its URL on the device driving that screen."
              action={<Link href="/admin/presentation/displays" className={btn.primary}>Add display</Link>}
            />
          ) : (
            <ul className="divide-y divide-border">
              {displays.map((d) => {
                const c = CONN[d.connection] ?? CONN.offline
                return (
                  <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                    <span className={`size-2 rounded-full shrink-0 ${c.cls}`} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.resolution} · {c.label}
                        {d.secondsSinceSeen != null && d.connection !== 'online' && ` · ${clock(d.secondsSinceSeen)} ago`}
                      </p>
                    </div>
                    <a
                      href={`/display/${d.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                    >
                      Open <ExternalLink className="size-3" aria-hidden />
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Playlists */}
        <div className={`${CARD} overflow-hidden`}>
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3">
            <h2 className="font-semibold">Playlists</h2>
            <Link href="/admin/presentation/playlists" className={btn.ghost}>Manage</Link>
          </div>
          {!playlists?.length ? (
            <EmptyState
              icon={ListMusic}
              title="No playlists yet"
              subtitle="A playlist is the running order for a service."
              action={<Link href="/admin/presentation/playlists" className={btn.primary}>Create playlist</Link>}
            />
          ) : (
            <ul className="divide-y divide-border">
              {playlists.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <CircleDot className="size-4 text-muted-foreground shrink-0" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.serviceDate ?? 'No date'}
                      {p.serviceTime && ` · ${p.serviceTime.slice(0, 5)}`}
                      {p.operator && ` · ${p.operator}`}
                    </p>
                  </div>
                  {p.serviceDate === todayIso && (
                    <span className="shrink-0 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-medium">
                      Today
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
