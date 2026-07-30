'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ChevronLeft, ChevronRight, Square, Play, Radio, Keyboard,
  Timer, Captions, X, ArrowLeft, Loader2,
} from 'lucide-react'
import {
  presentationApi, watchLive, SCREEN_MODES, clock,
  type LiveFrame, type PlaylistWithItems, type ScreenMode,
} from '@/lib/presentation/api'
import { SlideCanvas } from '@/components/presentation/SlideCanvas'

/**
 * Live presenter console.
 *
 * Layout: playlist on the left, live output in the centre, next slide and
 * controls on the right — the arrangement every operator already knows from
 * ProPresenter, so muscle memory transfers.
 *
 * The frame is driven by the same long-poll the projectors use, not by local
 * state. So if a second operator advances a slide from a phone, this console
 * follows rather than fighting it, and what is shown here is provably what is
 * on the wall.
 */

const btnBase =
  'inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-40 disabled:pointer-events-none'

export default function LivePresenterPage() {
  const [frame, setFrame] = useState<LiveFrame | null>(null)
  const [connected, setConnected] = useState(false)
  const [busy, setBusy] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const versionRef = useRef(0)
  const stopped = useRef(false)

  // --- live feed ------------------------------------------------------------
  useEffect(() => {
    stopped.current = false
    const ctrl = new AbortController()
    let backoff = 500
    const origin = window.location.origin

    const loop = async () => {
      while (!stopped.current) {
        try {
          const f = await watchLive({ version: versionRef.current, origin, signal: ctrl.signal })
          versionRef.current = f.version
          setFrame(f)
          setConnected(true)
          backoff = 500
        } catch {
          if (ctrl.signal.aborted) return
          setConnected(false)
          await new Promise((r) => setTimeout(r, backoff))
          backoff = Math.min(backoff * 2, 10_000)
        }
      }
    }
    void loop()
    return () => { stopped.current = true; ctrl.abort() }
  }, [])

  const apply = useCallback((f: LiveFrame) => {
    versionRef.current = f.version
    setFrame(f)
  }, [])

  /**
   * Run a live action.
   *
   * Serialised through `busy` so holding down the arrow key cannot fire ten
   * overlapping advances and land on an unpredictable slide.
   */
  const act = useCallback(
    async (fn: () => Promise<LiveFrame>, label: string) => {
      if (busy) return
      setBusy(true)
      try {
        apply(await fn())
      } catch (e) {
        toast.error(`${label} failed: ${(e as Error).message}`)
      } finally {
        setBusy(false)
      }
    },
    [busy, apply]
  )

  const st = frame
  const isLive = !!st?.isLive

  const next = useCallback(() => act(() => presentationApi.step('next'), 'Next slide'), [act])
  const prev = useCallback(() => act(() => presentationApi.step('prev'), 'Previous slide'), [act])
  const setScreen = useCallback(
    (m: ScreenMode) => act(() => presentationApi.screen(m), 'Screen mode'),
    [act]
  )
  const stop = useCallback(() => act(() => presentationApi.stop(), 'Stop'), [act])

  // --- keyboard -------------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      // Never hijack typing. An operator editing a lower-third caption must be
      // able to press B without blacking out the main screen.
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      switch (e.key) {
        case ' ':
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault(); next(); break
        case 'Backspace':
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault(); prev(); break
        case 'b': case 'B': e.preventDefault(); setScreen(st?.screenMode === 'black' ? 'normal' : 'black'); break
        case 'l': case 'L': e.preventDefault(); setScreen(st?.screenMode === 'logo' ? 'normal' : 'logo'); break
        case 'w': case 'W': e.preventDefault(); setScreen(st?.screenMode === 'blank' ? 'normal' : 'blank'); break
        case 'f': case 'F': e.preventDefault(); setScreen(st?.screenMode === 'freeze' ? 'normal' : 'freeze'); break
        case 'n': case 'N': e.preventDefault(); setScreen('normal'); break
        case 'Escape': e.preventDefault(); setShowHelp(false); break
        case '?': e.preventDefault(); setShowHelp((v) => !v); break
        default:
          // Digits jump to a slide, matching the numbered thumbnails.
          if (/^[1-9]$/.test(e.key)) {
            e.preventDefault()
            act(() => presentationApi.goto({ slide_index: Number(e.key) - 1 }), 'Go to slide')
          }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, setScreen, act, st?.screenMode])

  // --- playlist -------------------------------------------------------------
  const { data: playlists } = useQuery({
    queryKey: ['playlists'],
    queryFn: presentationApi.playlists,
    staleTime: 30_000,
  })

  const activePlaylistId = st?.playlistId ?? playlists?.[0]?.id ?? null
  const { data: playlist } = useQuery<PlaylistWithItems>({
    queryKey: ['playlist', activePlaylistId],
    queryFn: () => presentationApi.playlist(activePlaylistId!),
    enabled: !!activePlaylistId,
  })

  const { data: presentation } = useQuery({
    queryKey: ['presentation', st?.presentationId],
    queryFn: () => presentationApi.presentation(st!.presentationId!),
    enabled: !!st?.presentationId,
  })

  const slides = presentation?.slides ?? []

  return (
    // Dark console regardless of the admin theme: an operator sits in a dark
    // room, and a white panel beside a projected slide destroys night vision.
    <div className="fixed inset-0 bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Top bar */}
      <header className="shrink-0 h-14 border-b border-neutral-800 flex items-center gap-3 px-3">
        <Link
          href="/admin/presentation"
          className={`${btnBase} h-9 px-2.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800`}
        >
          <ArrowLeft className="size-4" aria-hidden />
          <span className="hidden sm:inline">Exit</span>
        </Link>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isLive ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400'
          }`}
        >
          <Radio className="size-3" aria-hidden />
          {isLive ? 'LIVE' : 'OFF AIR'}
        </span>

        <div className="min-w-0 hidden md:block">
          <p className="text-sm font-medium truncate">{frame?.presentationTitle ?? 'Nothing loaded'}</p>
          {frame && frame.slideTotal > 0 && (
            <p className="text-[11px] text-neutral-500 tabular-nums">
              Slide {(st?.slideIndex ?? 0) + 1} of {frame.slideTotal}
            </p>
          )}
        </div>

        <div className="flex-1" />

        {/* Screen modes */}
        <div className="flex items-center gap-1" role="group" aria-label="Screen mode">
          {SCREEN_MODES.map((m) => {
            const on = st?.screenMode === m.value
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setScreen(m.value)}
                aria-pressed={on}
                title={`${m.label} (${m.key})`}
                className={`${btnBase} h-9 px-2.5 ${
                  on
                    ? m.value === 'black' ? 'bg-neutral-100 text-neutral-900'
                      : 'bg-sky-600 text-white'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {m.label}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className={`${btnBase} h-9 px-2.5 bg-neutral-800 text-neutral-300 hover:bg-neutral-700`}
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="size-4" aria-hidden />
        </button>

        <span
          className={`size-2 rounded-full shrink-0 ${connected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}
          title={connected ? 'Connected' : 'Reconnecting'}
          aria-label={connected ? 'Connected' : 'Reconnecting'}
        />
      </header>

      <div className="flex-1 min-h-0 flex">
        {/* Left: playlist */}
        <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-neutral-800">
          <div className="h-11 shrink-0 flex items-center px-3 border-b border-neutral-800">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 truncate">
              {playlist?.name ?? 'Playlist'}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!playlist?.items.length ? (
              <p className="text-xs text-neutral-500 p-3">
                No playlist items.{' '}
                <Link href="/admin/presentation/playlists" className="text-sky-400 hover:underline">
                  Build a playlist
                </Link>
              </p>
            ) : (
              playlist.items.map((item, i) => {
                const on = st?.playlistItemId === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      act(
                        () => presentationApi.go({ playlist_id: playlist.id, playlist_item_id: item.id }),
                        'Load item'
                      )
                    }
                    aria-current={on ? 'true' : undefined}
                    className={`w-full text-left rounded-lg px-2.5 py-2 transition-colors ${
                      on ? 'bg-sky-600/20 ring-1 ring-sky-500' : 'hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] tabular-nums text-neutral-500 w-4 shrink-0">{i + 1}</span>
                      <span className="text-sm truncate flex-1">{item.title}</span>
                      {item.plannedSeconds ? (
                        <span className="text-[10px] tabular-nums text-neutral-500 shrink-0">
                          {clock(item.plannedSeconds)}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[10px] text-neutral-500 pl-6 truncate">
                      {item.itemKind}
                      {item.slideCount != null && ` · ${item.slideCount} slides`}
                    </p>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* Centre: live output */}
        <section className="flex-1 min-w-0 flex flex-col p-3 gap-3">
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="w-full max-w-5xl">
              <div className="relative rounded-xl overflow-hidden ring-1 ring-neutral-800 shadow-2xl">
                <SlideCanvas frame={frame} className="w-full" />
                {busy && (
                  <div className="absolute top-2 left-2 rounded-full bg-black/70 p-1.5">
                    <Loader2 className="size-3.5 animate-spin text-white" aria-hidden />
                  </div>
                )}
              </div>

              {/* Transport */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={prev}
                  disabled={!isLive || busy}
                  className={`${btnBase} h-12 px-6 bg-neutral-800 hover:bg-neutral-700`}
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="size-5" aria-hidden />
                  <span className="hidden sm:inline">Prev</span>
                </button>
                <button
                  type="button"
                  onClick={next}
                  disabled={!isLive || busy}
                  className={`${btnBase} h-12 px-8 bg-sky-600 hover:bg-sky-500 text-white`}
                  aria-label="Next slide"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="size-5" aria-hidden />
                </button>
                {isLive ? (
                  <button
                    type="button"
                    onClick={stop}
                    disabled={busy}
                    className={`${btnBase} h-12 px-5 bg-red-600 hover:bg-red-500 text-white`}
                  >
                    <Square className="size-4" aria-hidden />
                    <span className="hidden sm:inline">Stop</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      act(
                        () =>
                          presentationApi.go(
                            activePlaylistId ? { playlist_id: activePlaylistId } : {}
                          ),
                        'Go live'
                      )
                    }
                    disabled={busy || !activePlaylistId}
                    className={`${btnBase} h-12 px-5 bg-green-600 hover:bg-green-500 text-white`}
                  >
                    <Play className="size-4" aria-hidden />
                    <span className="hidden sm:inline">Go Live</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Slide filmstrip */}
          {slides.length > 0 && (
            <div className="shrink-0 border-t border-neutral-800 pt-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {slides.map((s, i) => {
                  const on = st?.slideId === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => act(() => presentationApi.goto({ slide_id: s.id }), 'Go to slide')}
                      aria-current={on ? 'true' : undefined}
                      className={`shrink-0 w-32 rounded-lg overflow-hidden transition-all ${
                        on ? 'ring-2 ring-sky-500 scale-[1.02]' : 'ring-1 ring-neutral-800 hover:ring-neutral-600'
                      }`}
                      title={s.label || `Slide ${i + 1}`}
                    >
                      <SlideCanvas frame={frame} slide={s} mode="normal" showLowerThird={false} className="w-full" />
                      <p className="bg-neutral-900 text-[10px] px-1.5 py-1 truncate text-left text-neutral-400">
                        {i + 1}. {s.label || s.slideType}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* Right: next slide + tools */}
        <aside className="hidden xl:flex w-80 shrink-0 flex-col border-l border-neutral-800 p-3 gap-3 overflow-y-auto">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-2">Next slide</p>
            {frame?.nextSlide ? (
              <div className="rounded-lg overflow-hidden ring-1 ring-neutral-800">
                {/* Rendered normally even when the live output is blacked, so
                    the operator can line up what comes next while the screen
                    is dark. */}
                <SlideCanvas frame={frame} slide={frame.nextSlide} mode="normal" showLowerThird={false} className="w-full" />
              </div>
            ) : (
              <div className="rounded-lg ring-1 ring-neutral-800 aspect-video flex items-center justify-center">
                <p className="text-xs text-neutral-600">End of presentation</p>
              </div>
            )}
          </div>

          {frame?.currentSlide?.notes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-2">Notes</p>
              <p className="text-sm text-neutral-300 whitespace-pre-wrap rounded-lg bg-neutral-900 p-3 ring-1 ring-neutral-800">
                {frame.currentSlide.notes}
              </p>
            </div>
          )}

          <CountdownPanel act={act} frame={frame} />
          <LowerThirdPanel act={act} frame={frame} />
        </aside>
      </div>

      {showHelp && <ShortcutHelp onClose={() => setShowHelp(false)} />}
    </div>
  )
}

function CountdownPanel({
  act,
  frame,
}: {
  act: (fn: () => Promise<LiveFrame>, label: string) => void
  frame: LiveFrame | null
}) {
  const [minutes, setMinutes] = useState('5')
  const [message, setMessage] = useState('Service starts in')
  const running = !!frame?.countdownTarget

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-2">Countdown</p>
      <div className="rounded-lg bg-neutral-900 p-3 ring-1 ring-neutral-800 space-y-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-label="Countdown message"
          className="w-full h-9 px-2.5 rounded-lg bg-neutral-800 text-sm border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <div className="flex gap-1.5">
          {[5, 10, 15, 30].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMinutes(String(m))
                act(() => presentationApi.countdown({ seconds: m * 60, message }), 'Countdown')
              }}
              className={`${btnBase} h-9 flex-1 bg-neutral-800 hover:bg-neutral-700`}
            >
              {m}m
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input
            value={minutes}
            onChange={(e) => setMinutes(e.target.value.replace(/[^\d]/g, ''))}
            inputMode="numeric"
            aria-label="Custom minutes"
            className="w-16 h-9 px-2.5 rounded-lg bg-neutral-800 text-sm text-right tabular-nums border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="button"
            onClick={() =>
              act(() => presentationApi.countdown({ seconds: (Number(minutes) || 0) * 60, message }), 'Countdown')
            }
            className={`${btnBase} h-9 flex-1 bg-neutral-800 hover:bg-neutral-700`}
          >
            <Timer className="size-3.5" aria-hidden />
            Start
          </button>
          {running && (
            <>
              <button
                type="button"
                onClick={() => act(() => presentationApi.countdownToggle(), 'Pause countdown')}
                className={`${btnBase} h-9 px-3 bg-neutral-800 hover:bg-neutral-700`}
              >
                {frame?.countdownPausedSeconds != null ? 'Resume' : 'Pause'}
              </button>
              <button
                type="button"
                onClick={() => act(() => presentationApi.countdown({}), 'Clear countdown')}
                className={`${btnBase} h-9 px-2.5 bg-neutral-800 hover:bg-neutral-700`}
                aria-label="Clear countdown"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function LowerThirdPanel({
  act,
  frame,
}: {
  act: (fn: () => Promise<LiveFrame>, label: string) => void
  frame: LiveFrame | null
}) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const visible = !!frame?.lowerThirdVisible

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-2">Lower third</p>
      <div className="rounded-lg bg-neutral-900 p-3 ring-1 ring-neutral-800 space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Speaker name"
          aria-label="Lower third title"
          className="w-full h-9 px-2.5 rounded-lg bg-neutral-800 text-sm border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Role or reference"
          aria-label="Lower third subtitle"
          className="w-full h-9 px-2.5 rounded-lg bg-neutral-800 text-sm border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => act(() => presentationApi.lowerThird({ title, subtitle, visible: true }), 'Show caption')}
            disabled={!title.trim()}
            className={`${btnBase} h-9 flex-1 bg-sky-600 hover:bg-sky-500 text-white`}
          >
            <Captions className="size-3.5" aria-hidden />
            Show
          </button>
          <button
            type="button"
            onClick={() => act(() => presentationApi.lowerThird({ visible: false }), 'Hide caption')}
            disabled={!visible}
            className={`${btnBase} h-9 flex-1 bg-neutral-800 hover:bg-neutral-700`}
          >
            Hide
          </button>
        </div>
      </div>
    </div>
  )
}

function ShortcutHelp({ onClose }: { onClose: () => void }) {
  const rows = [
    ['Space / →', 'Next slide'],
    ['Backspace / ←', 'Previous slide'],
    ['1 – 9', 'Jump to slide'],
    ['B', 'Black screen'],
    ['L', 'Logo screen'],
    ['W', 'Blank (background only)'],
    ['F', 'Freeze'],
    ['N', 'Back to normal'],
    ['?', 'This help'],
    ['Esc', 'Close'],
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <button type="button" className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-sm rounded-xl bg-neutral-900 ring-1 ring-neutral-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Keyboard shortcuts</h2>
          <button type="button" onClick={onClose} className={`${btnBase} size-8 hover:bg-neutral-800`} aria-label="Close">
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <dl className="space-y-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4">
              <dt>
                <kbd className="rounded bg-neutral-800 px-2 py-1 text-xs font-mono ring-1 ring-neutral-700">{k}</kbd>
              </dt>
              <dd className="text-sm text-neutral-400">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-neutral-500">
          Shortcuts are ignored while typing in a field, so editing a caption never changes the screen.
        </p>
      </div>
    </div>
  )
}
