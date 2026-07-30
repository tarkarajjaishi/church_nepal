'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import { SlideCanvas } from '@/components/presentation/SlideCanvas'
import { watchLive, type LiveFrame } from '@/lib/presentation/api'

/**
 * Projector / display output.
 *
 * Open this fullscreen on whatever device drives a screen:
 *   /display/main-projector
 *   /display/stage?notes=1
 *   /display/lobby-tv
 *
 * Design constraints that shaped this page:
 *
 *  - It is unauthenticated. A projector cannot log in, and a login prompt on
 *    the main screen mid-service is unacceptable. The public watch endpoint
 *    exposes only what is already on the screen in front of the congregation.
 *  - It never renders an error to the wall. A failed poll retries with backoff
 *    while the last good frame stays up, because a stack trace projected during
 *    worship is far worse than a slide that is briefly stale.
 *  - The poll doubles as the heartbeat, so the Displays page can show whether
 *    this screen is actually alive.
 */

const MAX_BACKOFF_MS = 10_000

export default function DisplayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = use(params)
  const sp = use(searchParams)
  const showNotes = sp.notes === '1' || sp.notes === 'true'
  const showNext = sp.next === '1' || sp.next === 'true'

  const [frame, setFrame] = useState<LiveFrame | null>(null)
  const [connected, setConnected] = useState(false)
  const versionRef = useRef(0)
  const stopped = useRef(false)

  useEffect(() => {
    stopped.current = false
    const ctrl = new AbortController()
    let backoff = 500

    // Same-origin: this page is served by Next, whose /api/* is proxied to the
    // Rust backend, so the tenant host is preserved and the display resolves to
    // the right church without any configuration on the device.
    const origin = window.location.origin

    const loop = async () => {
      while (!stopped.current) {
        try {
          const f = await watchLive({
            version: versionRef.current,
            displaySlug: slug,
            origin,
            signal: ctrl.signal,
          })
          versionRef.current = f.version
          setFrame(f)
          setConnected(true)
          backoff = 500
        } catch (e) {
          if (ctrl.signal.aborted) return
          setConnected(false)
          // Keep the last frame on screen and retry; never surface the error.
          await new Promise((r) => setTimeout(r, backoff))
          backoff = Math.min(backoff * 2, MAX_BACKOFF_MS)
        }
      }
    }
    void loop()

    return () => {
      stopped.current = true
      ctrl.abort()
    }
  }, [slug])

  // Hide the cursor after inactivity — a mouse pointer parked on the main
  // screen is the classic giveaway that a church is running slides from a laptop.
  const [cursorHidden, setCursorHidden] = useState(true)
  const cursorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wake = useCallback(() => {
    setCursorHidden(false)
    if (cursorTimer.current) clearTimeout(cursorTimer.current)
    cursorTimer.current = setTimeout(() => setCursorHidden(true), 3000)
  }, [])

  useEffect(() => {
    // F toggles fullscreen from the display device itself, so a volunteer can
    // set the screen up without touching the admin console.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (document.fullscreenElement) void document.exitFullscreen()
        else void document.documentElement.requestFullscreen().catch(() => {})
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <main
      className={`fixed inset-0 bg-black flex items-center justify-center ${cursorHidden ? 'cursor-none' : ''}`}
      onMouseMove={wake}
      onTouchStart={wake}
    >
      {/* Letterboxed to 16:9 so the slide keeps its aspect on any panel. */}
      <div className="w-full h-full max-w-[177.78vh] max-h-[56.25vw]">
        <SlideCanvas frame={frame} className="w-full h-full" />
      </div>

      {showNext && frame?.nextSlide && (
        <div className="fixed bottom-4 right-4 w-56 rounded-lg overflow-hidden ring-1 ring-white/20 shadow-2xl">
          <p className="bg-black/80 text-white/70 text-[10px] uppercase tracking-widest px-2 py-1">Next</p>
          <SlideCanvas frame={frame} slide={frame.nextSlide} mode="normal" showLowerThird={false} className="w-full" />
        </div>
      )}

      {showNotes && frame?.currentSlide?.notes && (
        <div className="fixed bottom-4 left-4 max-w-md rounded-lg bg-black/80 text-white px-3 py-2 ring-1 ring-white/20">
          <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Notes</p>
          <p className="text-sm whitespace-pre-wrap">{frame.currentSlide.notes}</p>
        </div>
      )}

      {/* Connection dot, only while disconnected, and small enough to be
          invisible from the congregation. It exists so a technician standing at
          the machine can tell the difference between "no slide" and "no link". */}
      {!connected && (
        <div
          className="fixed top-2 right-2 size-2 rounded-full bg-red-500 animate-pulse"
          title="Reconnecting to the presentation server"
          aria-hidden
        />
      )}
    </main>
  )
}
