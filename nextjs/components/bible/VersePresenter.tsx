'use client'

import { useEffect, useRef } from 'react'
import { X, Quote, ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Full-screen presentation of a single verse.
 *
 * Built for showing scripture on a screen — a projector at a service, or a
 * phone held up to someone — so it strips everything except the words and the
 * reference. Deliberately theme-aware rather than always-dark: a reader on a
 * bright phone outdoors needs the light treatment, and the same overlay is
 * used in both places.
 *
 * Escape closes it, focus moves to the close button on open and returns to
 * whatever opened it on close, and the page behind is locked from scrolling —
 * without those it is a div that merely looks like a dialog.
 */
export function VersePresenter({
  text,
  reference,
  fontFamily,
  onClose,
  onPrev,
  onNext,
}: {
  text: string
  reference: string
  fontFamily?: string
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}) {
  // Thresholds are character counts, chosen by eye against typical verses —
  // not derived from the corpus. The clamp lower bounds are what actually
  // stop a very long verse overflowing, so the tiers only decide how large a
  // SHORT verse is allowed to get.
  const n = text.length
  const size =
    n < 90
      ? 'clamp(2.5rem, 7vw, 7rem)'
      : n < 200
        ? 'clamp(2rem, 5vw, 5rem)'
        : n < 400
          ? 'clamp(1.6rem, 3.6vw, 3.5rem)'
          : 'clamp(1.25rem, 2.6vw, 2.5rem)'

  const closeRef = useRef<HTMLButtonElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    returnTo.current = document.activeElement as HTMLElement | null
    closeRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      // Someone presenting from a lectern is using a clicker, which sends
      // arrow keys — so these have to work without touching the screen.
      if (e.key === 'ArrowLeft') onPrev?.()
      if (e.key === 'ArrowRight') onNext?.()
    }
    document.addEventListener('keydown', onKey)

    // Restore the exact previous value rather than assuming it was ''.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      returnTo.current?.focus?.()
    }
  }, [onClose, onPrev, onNext])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${reference} — प्रस्तुति`}
      className="fixed inset-0 z-[100] flex flex-col bg-background"
    >
      <div className="absolute right-3 top-3 sm:right-5 sm:top-5 z-10">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="बन्द गर्नुहोस्"
          title="बन्द गर्नुहोस् (Esc)"
          className="inline-flex items-center justify-center size-11 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/50"
        >
          <X className="size-6" />
        </button>
      </div>

      {onPrev && (
        <button
          type="button"
          onClick={onPrev}
          aria-label="अघिल्लो पद"
          title="अघिल्लो पद (←)"
          className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center size-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/50"
        >
          <ChevronLeft className="size-7" />
        </button>
      )}

      {onNext && (
        <button
          type="button"
          onClick={onNext}
          aria-label="अर्को पद"
          title="अर्को पद (→)"
          className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center size-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/50"
        >
          <ChevronRight className="size-7" />
        </button>
      )}

      {/* Centres against the FULL height. While the close button sat in a
          flex row above this, the figure could only centre in what was left
          over, so it rode visibly low — and a bottom-only pad made the top
          gap larger still. Padding is symmetric here for the same reason. */}
      <div className="flex flex-1 items-center justify-center px-16 py-16 sm:px-24">
        <figure className="w-full max-w-[92vw] xl:max-w-[86vw] text-center">
          <Quote
            className="mx-auto mb-6 size-10 sm:size-14 xl:size-16 text-gold"
            aria-hidden="true"
            fill="currentColor"
          />

          <blockquote
            className="text-foreground font-nepali"
            style={{
              fontFamily,
              // Scale to the LENGTH of the verse, not just the viewport. A
              // fixed clamp has to be small enough for the longest verse in
              // scripture, which left a six-word verse marooned in the middle
              // of a 4K screen. Psalm 119:5 and Esther 8:9 are two orders of
              // magnitude apart in length; one size cannot serve both.
              fontSize: size,
              lineHeight: 1.5,
              letterSpacing: '0.005em',
            }}
          >
            {text}
          </blockquote>

          <div className="mx-auto mt-8 h-px w-20 bg-gold" aria-hidden="true" />

          {/* Same face as the verse. `font-nepali` alone pinned this to Noto
              while the quote above used the reader's chosen font, so the
              reference read as a different typeface. `uppercase` and wide
              tracking are dropped too: Devanagari has no case, and letter
              spacing pulls conjuncts apart. */}
          <figcaption
            className="mt-5 text-base sm:text-lg font-semibold text-muted-foreground font-nepali"
            style={{ fontFamily }}
          >
            {reference}
          </figcaption>
        </figure>
      </div>
    </div>
  )
}
