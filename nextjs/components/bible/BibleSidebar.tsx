'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  BookOpen,
  ChevronDown,
  Home,
  Minus,
  Plus,
  Church,
  ScrollText,
  Info,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/site/ThemeToggle'
import {
  BOOK_NAMES,
  OT_BOOKS,
  NT_BOOKS,
  CHAPTER_COUNTS,
  normalizeBookCode,
  BIBLE_FONTS,
} from '@/lib/bible/books'

interface BibleSidebarProps {
  selectedBook: string
  open: boolean
  onClose: () => void
  fontSize: number
  onFontSizeChange: (size: number) => void
  /** Desktop always-visible mode vs mobile drawer */
  mode?: 'desktop' | 'drawer'
}

export function BibleSidebar({
  selectedBook,
  open,
  onClose,
  fontSize,
  onFontSizeChange,
  fontId,
  onFontChange,
  mode = 'desktop',
}: BibleSidebarProps) {
  const book = normalizeBookCode(selectedBook)
  const [searchQuery, setSearchQuery] = useState('')
  // Which book's chapter grid is open. Defaults to the book being read, so
  // its chapters are one click away on arrival.
  const [expandedBook, setExpandedBook] = useState<string | null>(book)
  const [otOpen, setOtOpen] = useState(true)
  const [ntOpen, setNtOpen] = useState(
    (NT_BOOKS as readonly string[]).includes(book)
  )

  useEffect(() => {
    if ((NT_BOOKS as readonly string[]).includes(book)) {
      setNtOpen(true)
    } else {
      setOtOpen(true)
    }
  }, [book])

  const filteredOT = useMemo(
    () =>
      OT_BOOKS.filter(
        (abbr) =>
          BOOK_NAMES[abbr].includes(searchQuery) ||
          abbr.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  )

  const filteredNT = useMemo(
    () =>
      NT_BOOKS.filter(
        (abbr) =>
          BOOK_NAMES[abbr].includes(searchQuery) ||
          abbr.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  )

  const content = (
    <aside
      className={`flex flex-col h-full text-white bg-gradient-to-b from-[var(--church-blue-surface)] via-[var(--church-blue-surface)] to-[#082a42] dark:from-card dark:via-card dark:to-background ${
        mode === 'desktop'
          ? 'w-[280px] shrink-0 border-r border-white/10'
          : 'w-[min(100vw-3rem,320px)] shadow-2xl'
      }`}
    >
      {/* Brand */}
      <div className="relative overflow-hidden px-4 pt-5 pb-4 border-b border-white/10">
        <div className="absolute -top-8 -right-8 size-28 rounded-full bg-gold/10 blur-2xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-2">
          <Link
            href="/"
            className="flex items-center gap-3 min-w-0 rounded-xl -m-1 p-1 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            <div className="size-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shadow-inner shrink-0">
              <Church className="size-5 text-gold" />
            </div>
            <div className="min-w-0">
              <div
                className="font-bold text-sm tracking-tight truncate"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Grace Nepal Church
              </div>
              <div className="text-[11px] text-white/60 mt-0.5 flex items-center gap-1.5">
                <ScrollText className="size-3 text-gold/90 shrink-0" />
                <span className="truncate">पवित्र बाइबल · NNRV</span>
              </div>
            </div>
          </Link>
          {/* Drawer mode gets its close button from Sheet, which also brings
              the focus trap, Escape handling and focus restore. */}
          {mode === 'drawer' && <span className="size-11 shrink-0" aria-hidden />}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40 pointer-events-none" />
          <input
            type="search"
            placeholder="पुस्तक खोज्नुहोस्..."
            aria-label="पुस्तक खोज्नुहोस्"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-11 pl-10 pr-3 py-2.5 bg-white/[0.08] border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/40 transition-shadow font-nepali"
          />
        </div>
      </div>

      {/* Book list */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin" aria-label="Bible books">
        <Section
          title="पुरानो करार"
          count={filteredOT.length}
          open={otOpen || !!searchQuery}
          onToggle={() => setOtOpen((v) => !v)}
          forceOpen={!!searchQuery}
        >
          {filteredOT.map((abbr) => (
            <BookLink
              key={abbr}
              abbr={abbr}
              active={book === abbr}
              expanded={expandedBook === abbr}
              onToggle={() => setExpandedBook(expandedBook === abbr ? null : abbr)}
              onNavigate={mode === 'drawer' ? onClose : undefined}
            />
          ))}
          {filteredOT.length === 0 && (
            <p className="px-3 py-3 text-xs text-white/40 font-nepali">कुनै पुस्तक भेटिएन</p>
          )}
        </Section>

        <div className="my-1.5 mx-3 border-t border-white/10" />

        <Section
          title="नयाँ करार"
          count={filteredNT.length}
          open={ntOpen || !!searchQuery}
          onToggle={() => setNtOpen((v) => !v)}
          forceOpen={!!searchQuery}
        >
          {filteredNT.map((abbr) => (
            <BookLink
              key={abbr}
              abbr={abbr}
              active={book === abbr}
              expanded={expandedBook === abbr}
              onToggle={() => setExpandedBook(expandedBook === abbr ? null : abbr)}
              onNavigate={mode === 'drawer' ? onClose : undefined}
            />
          ))}
          {filteredNT.length === 0 && (
            <p className="px-3 py-3 text-xs text-white/40 font-nepali">कुनै पुस्तक भेटिएन</p>
          )}
        </Section>
      </nav>

      {/* Footer controls */}
      <div className="px-3 py-3.5 border-t border-white/10 space-y-2.5 bg-black/15">
        {/* Reading face. Persisted by the reader, so the choice is the default
            the next time the Bible is opened. */}
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="bible-font" className="text-xs text-white/70 shrink-0">अक्षर शैली</label>
          <select
            id="bible-font"
            value={fontId}
            onChange={(e) => onFontChange(e.target.value)}
            className="min-h-10 flex-1 min-w-0 rounded-xl bg-white/[0.08] border border-white/10 px-2 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            {BIBLE_FONTS.map((f) => (
              <option key={f.id} value={f.id} className="text-black">
                {f.label}{f.localOnly ? ' (स्थानीय)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-white/70">अक्षर आकार</span>
          <div className="flex items-center gap-0.5 bg-white/[0.08] rounded-xl p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => onFontSizeChange(Math.max(14, fontSize - 1))}
              className="inline-flex items-center justify-center size-10 rounded-lg hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              aria-label="Decrease font size"
            >
              <Minus className="size-4 text-white/75" />
            </button>
            <span className="text-xs text-white/65 w-8 text-center tabular-nums font-medium">
              {fontSize}
            </span>
            <button
              type="button"
              onClick={() => onFontSizeChange(Math.min(28, fontSize + 1))}
              className="inline-flex items-center justify-center size-10 rounded-lg hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              aria-label="Increase font size"
            >
              <Plus className="size-4 text-white/75" />
            </button>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2.5 min-h-11 text-sm text-white/60 hover:text-white transition-colors rounded-xl px-3 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        >
          <Home className="size-4 shrink-0" />
          मुख्य पृष्ठ
        </Link>
      </div>
    </aside>
  )

  if (mode === 'desktop') {
    return content
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="left"
        className="lg:hidden w-[min(100vw-3rem,320px)] max-w-none p-0 gap-0 border-r-0 bg-transparent [&>button]:top-6 [&>button]:right-4 [&>button]:z-10 [&>button]:text-white/75 [&>button]:opacity-100 [&>button]:hover:text-white"
      >
        <SheetTitle className="sr-only">बाइबल पुस्तकहरू</SheetTitle>
        {content}
      </SheetContent>
    </Sheet>
  )
}

function Section({
  title,
  count,
  open,
  onToggle,
  forceOpen,
  children,
}: {
  title: string
  count: number
  open: boolean
  onToggle: () => void
  forceOpen?: boolean
  children: React.ReactNode
}) {
  const isOpen = forceOpen || open
  return (
    <div className="px-2 py-1">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between min-h-11 px-2.5 py-2 text-[11px] font-semibold text-white/70 uppercase tracking-[0.14em] hover:text-white/70 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
      >
        <span className="flex items-center gap-2 font-nepali normal-case tracking-wide">
          {title}
          <span className="tracking-normal font-medium text-white/70 tabular-nums text-[10px]">
            {count}
          </span>
        </span>
        <ChevronDown
          className={`size-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && <div className="mt-0.5 space-y-0.5">{children}</div>}
    </div>
  )
}

/**
 * A book row that expands into its chapter grid in place.
 *
 * Picking a chapter used to mean: open the book (full navigation), then open
 * a separate chapter dialog. The grid lives under the book instead, so the
 * whole choice is one list — the ⓘ tile is the book introduction, ahead of
 * chapter 1, matching how printed Bibles and other readers order it.
 */
function BookLink({
  abbr,
  active,
  expanded,
  onToggle,
  onNavigate,
}: {
  abbr: string
  active: boolean
  expanded: boolean
  onToggle: () => void
  onNavigate?: () => void
}) {
  const chapters = CHAPTER_COUNTS[abbr] ?? 1
  const gridId = `bible-chapters-${abbr}`

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={gridId}
        className={`group w-full flex items-center gap-2.5 min-h-11 px-3 py-2.5 rounded-xl text-[13px] font-nepali transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 ${
          active || expanded
            ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
            : 'text-white/85 hover:bg-white/[0.08] hover:text-white'
        }`}
      >
        <BookOpen
          className={`size-4 shrink-0 ${
            active ? 'text-gold' : 'text-white/35 group-hover:text-white/55'
          }`}
        />
        <span className="truncate leading-snug text-left flex-1">{BOOK_NAMES[abbr]}</span>
        {active && <span className="size-1.5 rounded-full bg-gold shrink-0" aria-hidden />}
        <ChevronDown
          className={`size-3.5 shrink-0 text-white/35 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded && (
        <div id={gridId} className="grid grid-cols-5 gap-1 px-2 pt-1.5 pb-2">
          <Link
            href={`/bible/${abbr}?chapter=0`}
            onClick={onNavigate}
            aria-label={`${BOOK_NAMES[abbr]} — पुस्तक परिचय`}
            title="पुस्तक परिचय"
            className="aspect-square min-h-9 grid place-items-center rounded-lg bg-gold/15 text-gold hover:bg-gold/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
          >
            <Info className="size-3.5" />
          </Link>
          {Array.from({ length: chapters }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/bible/${abbr}${n === 1 ? '' : `?chapter=${n}`}`}
              onClick={onNavigate}
              className="aspect-square min-h-9 grid place-items-center rounded-lg bg-white/[0.07] text-white/75 text-xs font-semibold tabular-nums hover:bg-white/15 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
