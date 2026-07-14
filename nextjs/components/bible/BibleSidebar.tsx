'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  BookOpen,
  ChevronDown,
  X,
  Home,
  Minus,
  Plus,
  Church,
  ScrollText,
} from 'lucide-react'
import { BOOK_NAMES, OT_BOOKS, NT_BOOKS, normalizeBookCode } from '@/lib/bible/books'

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
  mode = 'desktop',
}: BibleSidebarProps) {
  const book = normalizeBookCode(selectedBook)
  const [searchQuery, setSearchQuery] = useState('')
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
      className={`flex flex-col h-full text-white bg-gradient-to-b from-church-blue via-church-blue to-[#082a42] ${
        mode === 'desktop'
          ? 'w-[280px] shrink-0 border-r border-white/10'
          : 'w-[min(100vw-3rem,320px)] shadow-2xl'
      }`}
    >
      {/* Brand */}
      <div className="relative overflow-hidden px-4 pt-5 pb-4 border-b border-white/10">
        <div className="absolute -top-8 -right-8 size-28 rounded-full bg-gold/10 blur-2xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
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
          </div>
          {mode === 'drawer' && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center size-11 rounded-xl hover:bg-white/10 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              aria-label="Close menu"
            >
              <X className="size-5 text-white/75" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40 pointer-events-none" />
          <input
            type="search"
            placeholder="पुस्तक खोज्नुहोस्..."
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
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-white/50">अक्षर आकार</span>
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-church-blue/45 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close sidebar overlay"
      />
      <div className="relative h-full animate-in slide-in-from-left duration-200">
        {content}
      </div>
    </div>
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
        className="w-full flex items-center justify-between min-h-11 px-2.5 py-2 text-[11px] font-semibold text-white/45 uppercase tracking-[0.14em] hover:text-white/70 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
      >
        <span className="flex items-center gap-2 font-nepali normal-case tracking-wide">
          {title}
          <span className="tracking-normal font-medium text-white/30 tabular-nums text-[10px]">
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

function BookLink({
  abbr,
  active,
  onNavigate,
}: {
  abbr: string
  active: boolean
  onNavigate?: () => void
}) {
  return (
    <Link
      href={`/bible/${abbr}`}
      onClick={onNavigate}
      className={`group flex items-center gap-2.5 min-h-11 px-3 py-2.5 rounded-xl text-[13px] font-nepali transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 ${
        active
          ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
          : 'text-white/65 hover:bg-white/[0.08] hover:text-white'
      }`}
    >
      <BookOpen
        className={`size-4 shrink-0 ${
          active ? 'text-gold' : 'text-white/35 group-hover:text-white/55'
        }`}
      />
      <span className="truncate leading-snug">{BOOK_NAMES[abbr]}</span>
      {active && (
        <span className="ml-auto size-1.5 rounded-full bg-gold shrink-0" aria-hidden />
      )}
    </Link>
  )
}
