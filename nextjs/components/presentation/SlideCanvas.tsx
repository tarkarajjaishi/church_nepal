'use client'

import { useEffect, useState } from 'react'
import type { LiveFrame, PresentationTheme, ScreenMode, Slide } from '@/lib/presentation/api'
import { clock } from '@/lib/presentation/api'

/**
 * The single renderer for a slide.
 *
 * Both the operator's preview and the projector output use this, so the
 * preview is genuinely what the congregation sees. Two separate renderers
 * would drift, and the operator would stop trusting the preview — which is the
 * one thing a presenter console has to get right.
 *
 * Everything scales from `--slide-unit`, a font size derived from the actual
 * rendered width. A slide at 320px in the preview and 3840px on an LED wall is
 * then the same layout, not two designs that happen to look similar.
 */

const DEFAULT_THEME: PresentationTheme = {
  id: '', name: 'Default', slug: 'default',
  fontFamily: 'var(--font-heading)', fontSize: 100,
  textColor: '#ffffff', backgroundColor: '#0b1220', backgroundImage: '',
  textAlign: 'center', verticalAlign: 'center',
  textEffects: {}, transition: 'fade', isDefault: true,
}

function useElementWidth<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // ResizeObserver rather than a window resize listener: the presenter panes
    // change size when the layout reflows, not only when the window does.
    const ro = new ResizeObserver(([entry]) => setW(entry.contentRect.width))
    ro.observe(el)
    setW(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [ref])
  return w
}

function Countdown({ targetIso, pausedSeconds, message, unit }: {
  targetIso: string | null
  pausedSeconds: number | null
  message: string
  unit: number
}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (pausedSeconds != null) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [pausedSeconds])

  // A paused countdown holds its remaining seconds; a running one is derived
  // from the target so every display agrees without clock sync between them.
  const remaining =
    pausedSeconds != null
      ? pausedSeconds
      : targetIso
        ? Math.max(0, Math.round((new Date(targetIso + 'Z').getTime() - now) / 1000))
        : 0

  return (
    <div className="flex flex-col items-center justify-center gap-[0.4em]">
      {message && (
        <p style={{ fontSize: `${unit * 0.55}px`, opacity: 0.85 }} className="text-balance">
          {message}
        </p>
      )}
      <p
        style={{ fontSize: `${unit * 2.4}px`, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
        className="font-semibold"
      >
        {clock(remaining)}
      </p>
    </div>
  )
}

function SlideBody({ slide, unit }: { slide: Slide; unit: number }) {
  switch (slide.slideType) {
    case 'image':
      return slide.mediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary operator-supplied URL, and next/image cannot optimise unknown remote hosts
        <img src={slide.mediaUrl} alt={slide.title || ''} className="max-h-full max-w-full object-contain" />
      ) : null

    case 'video':
      return slide.mediaUrl ? (
        <video src={slide.mediaUrl} autoPlay muted loop playsInline className="max-h-full max-w-full object-contain" />
      ) : null

    case 'bible':
      return (
        <div className="flex flex-col gap-[0.5em]">
          <p style={{ fontSize: `${unit}px`, lineHeight: 1.35 }} className="text-balance">
            {slide.body}
          </p>
          {slide.reference && (
            <p style={{ fontSize: `${unit * 0.55}px`, opacity: 0.8 }}>{slide.reference}</p>
          )}
        </div>
      )

    case 'quote':
      return (
        <div className="flex flex-col gap-[0.5em]">
          <p style={{ fontSize: `${unit}px`, lineHeight: 1.35 }} className="text-balance italic">
            “{slide.body}”
          </p>
          {slide.reference && (
            <p style={{ fontSize: `${unit * 0.5}px`, opacity: 0.8 }}>— {slide.reference}</p>
          )}
        </div>
      )

    default:
      return (
        <div className="flex flex-col gap-[0.45em]">
          {slide.title && slide.slideType !== 'lyrics' && (
            <p style={{ fontSize: `${unit * 0.75}px`, opacity: 0.85 }}>{slide.title}</p>
          )}
          {/* Lyrics keep their authored line breaks — re-wrapping a verse
              changes where the congregation breathes. */}
          <p style={{ fontSize: `${unit}px`, lineHeight: 1.35, whiteSpace: 'pre-wrap' }} className="text-balance">
            {slide.body}
          </p>
        </div>
      )
  }
}

export function SlideCanvas({
  frame,
  slide,
  mode,
  showLowerThird = true,
  className = '',
  containerRef,
}: {
  frame: LiveFrame | null
  /** Which slide to draw. Defaults to the live current slide. */
  slide?: Slide | null
  /** Override the screen mode — the "next slide" pane renders normally even when live output is black. */
  mode?: ScreenMode
  showLowerThird?: boolean
  className?: string
  containerRef?: React.RefObject<HTMLDivElement | null>
}) {
  const innerRef = useState(() => ({ current: null as HTMLDivElement | null }))[0]
  const ref = (containerRef ?? innerRef) as React.RefObject<HTMLDivElement | null>
  const width = useElementWidth(ref)

  const theme = frame?.theme ?? DEFAULT_THEME
  const active = slide !== undefined ? slide : frame?.currentSlide ?? null
  const screen = mode ?? frame?.screenMode ?? 'normal'

  // 16:9 reference width of 1920 gives unit ≈ 60px at full HD, which reads as
  // a sensible default body size for a projected lyric line.
  const unit = (width / 1920) * (theme.fontSize || 100) * 0.6

  const align =
    theme.textAlign === 'left' ? 'items-start text-left'
      : theme.textAlign === 'right' ? 'items-end text-right'
        : 'items-center text-center'
  const vAlign =
    theme.verticalAlign === 'top' ? 'justify-start'
      : theme.verticalAlign === 'bottom' ? 'justify-end'
        : 'justify-center'

  const bg =
    screen === 'black' ? '#000000'
      : screen === 'blank' ? (theme.backgroundColor || '#0b1220')
        : active?.backgroundColor || theme.backgroundColor || '#0b1220'

  const bgImage =
    screen === 'black' || screen === 'blank'
      ? undefined
      : active?.backgroundUrl || theme.backgroundImage || undefined

  const showContent = screen === 'normal' || screen === 'freeze'
  const st = frame

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundColor: bg,
        color: theme.textColor || '#ffffff',
        fontFamily: theme.fontFamily || 'var(--font-heading)',
        aspectRatio: '16 / 9',
      }}
      // The projector output is decorative to assistive tech; the operator
      // console conveys the same information in accessible form.
      role="img"
      aria-label={
        screen !== 'normal'
          ? `Screen ${screen}`
          : active
            ? `${active.slideType} slide: ${(active.title || active.body || '').slice(0, 80)}`
            : 'No slide'
      }
    >
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${JSON.stringify(bgImage).slice(1, -1)})` }}
          aria-hidden
        />
      )}

      {showContent && active && (
        <div className={`absolute inset-0 flex flex-col ${vAlign} ${align}`} style={{ padding: `${unit * 0.9}px` }}>
          <SlideBody slide={active} unit={unit} />
        </div>
      )}

      {showContent && !active && screen === 'normal' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p style={{ fontSize: `${unit * 0.5}px`, opacity: 0.4 }}>No slide</p>
        </div>
      )}

      {screen === 'logo' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p style={{ fontSize: `${unit * 0.8}px`, opacity: 0.9 }} className="font-semibold">
            Grace Nepal Church
          </p>
        </div>
      )}

      {/* Countdown overlays whatever is behind it, including in logo mode. */}
      {st?.countdownTarget && screen !== 'black' && screen !== 'blank' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Countdown
            targetIso={st.countdownTarget}
            pausedSeconds={st.countdownPausedSeconds}
            message={st.countdownMessage}
            unit={unit}
          />
        </div>
      )}

      {showLowerThird && st?.lowerThirdVisible && screen !== 'black' && (
        <div
          className="absolute left-0 right-0"
          style={{ bottom: `${unit * 0.8}px`, paddingLeft: `${unit * 0.9}px`, paddingRight: `${unit * 0.9}px` }}
        >
          <div
            className="inline-block rounded-[0.25em] backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.55)', padding: `${unit * 0.25}px ${unit * 0.5}px` }}
          >
            <p style={{ fontSize: `${unit * 0.5}px`, lineHeight: 1.2 }} className="font-semibold">
              {st.lowerThirdTitle}
            </p>
            {st.lowerThirdSubtitle && (
              <p style={{ fontSize: `${unit * 0.34}px`, opacity: 0.85 }}>{st.lowerThirdSubtitle}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
