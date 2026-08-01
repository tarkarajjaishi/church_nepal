'use client'

import { Bookmark, BookmarkCheck, Share2, Copy, Check, Presentation } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { HIGHLIGHT_COLORS, type HighlightColor } from '@/lib/bible/hooks'
import { stripHtml } from '@/lib/sanitize-html'

interface VerseRendererProps {
  text: string
  verseNumber?: number
  selected?: boolean
  onClick?: () => void
  book?: string
  chapter?: number
  onBookmark?: () => void
  isBookmarked?: boolean
  onShare?: () => void
  fontSize?: number
  /** Reading face chosen in the sidebar. */
  fontFamily?: string
  /** Colour currently on this verse, or null. */
  highlight?: HighlightColor | null
  onHighlight?: (color: HighlightColor) => void
  onPresent?: () => void
}

const actionBtnBase =
  'inline-flex items-center justify-center gap-1.5 min-h-11 rounded-xl px-3.5 text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/50 focus-visible:ring-offset-1'

export function VerseRenderer({
  text,
  verseNumber,
  selected,
  onClick,
  onBookmark,
  isBookmarked,
  onShare,
  fontSize = 17,
  fontFamily,
  highlight,
  onHighlight,
  onPresent,
}: VerseRendererProps) {
  const [copied, setCopied] = useState(false)
  const { resolvedTheme } = useTheme()
  // Paper-highlighter colours are chosen for white paper; at full strength on a
  // dark page they glare and swamp the text. Each swatch therefore carries a
  // dark-mode counterpart rather than being dimmed with opacity, which would
  // wash the ink out along with the marker.
  // `resolvedTheme` alone was the wrong signal: the stylesheet keys off the
  // `.dark` class, and the two can disagree (a direct class toggle, or the
  // first paint before next-themes resolves). Read the class as the source of
  // truth and fall back to resolvedTheme.
  const isDark =
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : resolvedTheme === 'dark'

  const marker = (c: HighlightColor | null | undefined) => {
    if (!c) return undefined
    const h = HIGHLIGHT_COLORS.find((x) => x.id === c)
    if (!h) return undefined
    return isDark ? { bg: h.dark, ink: h.darkInk } : { bg: h.light, ink: h.lightInk }
  }

const renderText = (raw: string) => {
  const parts = raw.split(/(<red>[\s\S]*?<\/red>)/g)
  return parts.map((part, i) => {
    if (part.startsWith('<red>') && part.endsWith('</red>')) {
      const redText = part.slice(5, -6)
      return (
        <span key={i} className="text-red-700 font-medium">
          {stripHtml(redText)}
        </span>
      )
    }
    return <span key={i}>{stripHtml(part)}</span>
  })
}

  const handleCopy = async (e: React.MouseEvent) => {
      e.stopPropagation()
      const plain = stripHtml(text.replace(/<\/?red>/g, ''))
      try {
      await navigator.clipboard.writeText(plain)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    // The row is clickable for pointer users but carries no button role: it
    // used to be role="button" while containing real buttons, which is invalid
    // nesting and made a screen reader announce 50+ "button"s per chapter.
    // The verse number below is the real, focusable control, so keyboard and
    // assistive-tech users still have a way in — and the verse text stays
    // plain text, so it can be selected and copied.
    <div
      onClick={onClick}
      // py-3 left ~58px between verse numbers once verses became full-width and
      // mostly one line each, so the gold markers read as a sparse, unrelated
      // column rather than as scripture running on. The line-height stays at
      // 1.9 — Devanagari matras sit above and below the baseline and need it.
      className={`group relative rounded-xl px-3 sm:px-4 py-1.5 transition-colors duration-150 ${
        selected
          ? 'bg-gradient-to-r from-church-blue/[0.07] to-gold/[0.08] border border-church-blue/20 shadow-sm'
          : 'hover:bg-section-bg border border-transparent hover:border-church-blue/8'
      }`}
    >
      <div className="flex gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
          aria-expanded={!!selected}
          aria-label={`पद ${verseNumber}`}
          className={`shrink-0 mt-0.5 inline-flex items-center justify-center min-w-[1.75rem] h-7 px-1.5 rounded-lg text-[11px] font-bold tabular-nums transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45 focus-visible:ring-offset-1 ${
            selected
              ? 'bg-gold text-[var(--church-blue-ink)] shadow-sm shadow-gold/25'
              // --gold-soft is #33290f in dark mode — a dark brown that at 70%
              // over a dark card left the verse numbers all but invisible.
              // gold/15 + --gold-text works in both themes: the tint stays
              // subtle and the ink inverts (#845f00 light, #e0b34a dark).
              : 'bg-gold/15 text-gold-text group-hover:bg-gold/25'
          }`}
        >
          {verseNumber}
        </button>
        <p
          className="flex-1 text-foreground font-nepali cursor-pointer"
          style={{
            fontSize: `${fontSize}px`,
            fontFamily,
            lineHeight: 1.9,
            letterSpacing: '0.01em',
          }}
        >
          {highlight ? (
            // Inline, not on the <p>: the paragraph is flex-1 and its box runs
            // to the right edge, so painting it there produced a full-width
            // band. An inline span hugs the words and, with box-decoration-break,
            // breaks across wrapped lines the way a highlighter pen does.
            <span
              style={{
                backgroundColor: marker(highlight)?.bg,
                color: marker(highlight)?.ink,
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone',
                borderRadius: '0.25rem',
                padding: '0.08em 0.22em',
                margin: '0 -0.22em',
              }}
            >
              {renderText(text)}
            </span>
          ) : (
            renderText(text)
          )}
        </p>
      </div>

      {selected && (
        <div className="mt-3.5 flex flex-wrap items-center gap-2 pl-[2.5rem] animate-in fade-in slide-in-from-top-1 duration-200">
          {onBookmark && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onBookmark()
              }}
              className={`${actionBtnBase} ${
                isBookmarked
                  ? 'bg-gold/15 text-accent-foreground border border-gold/30'
                  : 'bg-white text-church-blue border border-church-blue/12 hover:bg-church-blue/5'
              }`}
            >
              {isBookmarked ? (
                <BookmarkCheck className="size-4" />
              ) : (
                <Bookmark className="size-4" />
              )}
              {isBookmarked ? 'बुकमार्क गरियो' : 'बुकमार्क'}
            </button>
          )}
          {onHighlight && (
            <div
              className="inline-flex items-center gap-1 rounded-xl border border-church-blue/12 bg-card px-1.5 py-1"
              role="group"
              aria-label="हाइलाइट रङ"
            >
              {HIGHLIGHT_COLORS.map((c) => {
                const active = highlight === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onHighlight(c.id)
                    }}
                    // Pressed rather than a bare title: this is a toggle, and
                    // picking the active colour again clears the highlight.
                    aria-pressed={active}
                    aria-label={`${c.label} हाइलाइट`}
                    title={`${c.label} हाइलाइट`}
                    className={`size-7 rounded-lg border transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45 ${
                      active
                        ? 'border-church-blue/50 scale-110'
                        : 'border-church-blue/15 hover:scale-105'
                    }`}
                    style={{ backgroundColor: isDark ? c.dark : c.light }}
                  >
                    {active && <Check className="size-3.5 mx-auto" style={{ color: isDark ? c.darkInk : c.lightInk }} />}
                  </button>
                )
              })}
            </div>
          )}

          {onPresent && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onPresent()
              }}
              className={`${actionBtnBase} bg-white text-church-blue border border-church-blue/12 hover:bg-church-blue/5`}
            >
              <Presentation className="size-4" />
              प्रस्तुति
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className={`${actionBtnBase} bg-white text-church-blue border border-church-blue/12 hover:bg-church-blue/5`}
          >
            {copied ? (
              <Check className="size-4 text-success" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? 'कपी भयो' : 'कपी'}
          </button>
          {onShare && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onShare()
              }}
              className={`${actionBtnBase} bg-white text-church-blue border border-church-blue/12 hover:bg-church-blue/5`}
            >
              <Share2 className="size-4" />
              साझा
            </button>
          )}
        </div>
      )}
    </div>
  )
}
