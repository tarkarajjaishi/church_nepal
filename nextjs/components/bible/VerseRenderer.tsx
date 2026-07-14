'use client'

import { Bookmark, BookmarkCheck, Share2, Copy, Check } from 'lucide-react'
import { useState } from 'react'

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
}: VerseRendererProps) {
  const [copied, setCopied] = useState(false)

  const renderText = (raw: string) => {
    const parts = raw.split(/(<red>[\s\S]*?<\/red>)/g)
    return parts.map((part, i) => {
      if (part.startsWith('<red>') && part.endsWith('</red>')) {
        const redText = part.slice(5, -6)
        return (
          <span key={i} className="text-red-700 font-medium">
            {redText}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const plain = text.replace(/<\/?red>/g, '')
    try {
      await navigator.clipboard.writeText(plain)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      className={`group relative rounded-xl px-3 sm:px-4 py-3 cursor-pointer transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45 focus-visible:ring-offset-1 ${
        selected
          ? 'bg-gradient-to-r from-church-blue/[0.07] to-gold/[0.08] border border-church-blue/20 shadow-sm'
          : 'hover:bg-section-bg border border-transparent hover:border-church-blue/8'
      }`}
    >
      <div className="flex gap-3">
        <span
          className={`shrink-0 mt-0.5 inline-flex items-center justify-center min-w-[1.75rem] h-7 px-1.5 rounded-lg text-[11px] font-bold tabular-nums transition-colors ${
            selected
              ? 'bg-gold text-white shadow-sm shadow-gold/25'
              : 'bg-gold-soft/70 text-accent-foreground group-hover:bg-gold/20'
          }`}
        >
          {verseNumber}
        </span>
        <p
          className="flex-1 text-foreground font-nepali"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: 1.9,
            letterSpacing: '0.01em',
          }}
        >
          {renderText(text)}
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
