'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Menu,
  Share2,
  Clock,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  LayoutGrid,
  X,
  ArrowRight,
  Home,
  Info,
  Sun,
  Moon,
  Columns2,
  AlignJustify,
  Maximize2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { stripHtml } from '@/lib/sanitize-html'
import { VerseRenderer } from '@/components/bible/VerseRenderer'
import { BibleSidebar } from '@/components/bible/BibleSidebar'
import { VersePresenter } from '@/components/bible/VersePresenter'
import { useBookmarks, useReadingHistory, useReadingProgress, useHighlights, type HighlightColor } from '@/lib/bible/hooks'
import {
  BOOK_NAMES,
  OT_BOOKS,
  NT_BOOKS,
  POPULAR_BOOKS,
  getBookName,
  normalizeBookCode,
  BIBLE_FONTS,
  DEFAULT_BIBLE_FONT,
  fontStack,
} from '@/lib/bible/books'

type TabKey = 'read' | 'stats' | 'history' | 'bookmarks'

const TABS = [
  { key: 'read', label: 'पढ्नुहोस्', icon: BookOpen },
  { key: 'stats', label: 'प्रगति', icon: TrendingUp },
  { key: 'history', label: 'इतिहास', icon: Clock },
  { key: 'bookmarks', label: 'बुकमार्क', icon: Bookmark },
] as const satisfies readonly { key: TabKey; label: string; icon: unknown }[]

interface BibleAppProps {
  initialBook?: string
  initialChapter?: number
}

const iconBtn =
  'inline-flex items-center justify-center size-11 rounded-xl bg-church-blue/5 hover:bg-church-blue/10 text-church-blue disabled:opacity-35 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45'

const cardShell =
  'rounded-2xl border border-church-blue/8 bg-white shadow-sm'

/**
 * Light/dark switch for the reader.
 *
 * /bible sits outside the (site) route group, so it never had the site
 * header's theme control — a reader on this page could not change the mode at
 * all. `resolvedTheme` rather than `theme`, because the stored value is often
 * "system" and the button has to reflect what is actually on screen.
 *
 * Rendered only after mount: on the server there is no way to know the
 * visitor's preference, and guessing produces a hydration mismatch.
 */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Before mount `resolvedTheme` is undefined, so gate the LABEL on `mounted`
  // too — gating only the icon announced "switch to dark" to a screen reader
  // while the page was already dark.
  const isDark = mounted && resolvedTheme === 'dark'
  const label = !mounted ? 'रङ मोड बदल्नुहोस्' : isDark ? 'उज्यालो मोड' : 'अँध्यारो मोड'
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={iconBtn}
      aria-label={label}
      title={label}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  )
}

export function BibleApp({ initialBook = 'JHN', initialChapter = 1 }: BibleAppProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedBook = normalizeBookCode(initialBook)

  // `|| initialChapter` would swallow chapter 0 (the book introduction),
  // since 0 is falsy — parse explicitly instead.
  const rawChapter = searchParams.get('chapter')
  const parsedChapter = rawChapter === null ? NaN : Number(rawChapter)
  const queryChapter =
    Number.isInteger(parsedChapter) && parsedChapter >= 0 ? parsedChapter : initialChapter
  const queryVerse = Number(searchParams.get('verse') || '') || null

  const [chapter, setChapter] = useState(queryChapter)
  const [selectedVerse, setSelectedVerse] = useState<number | null>(queryVerse)
  const [fontSize, setFontSize] = useState(17)
  const [fontId, setFontId] = useState(DEFAULT_BIBLE_FONT)
  // Two columns by default, the way a printed Bible sets scripture: at full
  // width a single column runs to ~150 characters a line, which is well past
  // a comfortable measure. Below lg the layout forces one column regardless.
  const [columns, setColumns] = useState<1 | 2>(2)
  // Distraction-free reading: the same idea as the verse presenter, but for a
  // whole chapter. Implemented by hiding the chrome rather than rendering a
  // second copy of the verse list, so selection, highlighting and the font
  // controls keep working and cannot drift out of sync with the normal view.
  const [fullscreen, setFullscreen] = useState(false)
  // Both the restore and the persist effect fire on mount. Without this guard
  // the persist one wrote the DEFAULT over the reader's saved face before the
  // restore one had read it, so a chosen font survived exactly until the next
  // page load. Only writes made after the restore has run are real choices.
  const fontRestored = useRef(false)
  const [activeTab, setActiveTab] = useState<TabKey>('read')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chapterPickerOpen, setChapterPickerOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [presenting, setPresenting] = useState<number | null>(null)

  const { bookmarks, addBookmark, removeBookmark, isBookmarked } = useBookmarks()
  const { setHighlight, getHighlight } = useHighlights()
  const { history, addToHistory, clearHistory } = useReadingHistory()
  const { getProgress, updateProgress, progress } = useReadingProgress()

  // Sync from route + query when book / deep-link changes
  useEffect(() => {
    setChapter(queryChapter)
    setSelectedVerse(queryVerse)
    setActiveTab('read')
  }, [selectedBook, queryChapter, queryVerse])

  const goToChapter = useCallback(
    (next: number, verse: number | null = null) => {
      // 0 is the book introduction ("पुस्तक परिचय"), which sits before
      // chapter 1 — not an out-of-range value to be clamped away.
      const safe = Math.max(0, next)
      setChapter(safe)
      setSelectedVerse(verse)
      const params = new URLSearchParams()
      if (safe !== 1) params.set('chapter', String(safe))
      if (verse) params.set('verse', String(verse))
      const qs = params.toString()
      router.replace(`/bible/${selectedBook}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [router, selectedBook]
  )

  // Persist font size
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bible_font_size')
      if (saved) setFontSize(Number(saved) || 17)
      // The chosen face is the reader's default on every later visit, which is
      // the point of choosing one — so it is restored here, not just applied.
      const savedFont = localStorage.getItem('bible_font_family')
      if (savedFont && BIBLE_FONTS.some((f) => f.id === savedFont)) setFontId(savedFont)
      const savedCols = localStorage.getItem('bible_columns')
      if (savedCols === '1' || savedCols === '2') setColumns(Number(savedCols) as 1 | 2)
    } catch {
      /* ignore */
    } finally {
      fontRestored.current = true
    }
  }, [])

  useEffect(() => {
    if (!fontRestored.current) return
    try {
      localStorage.setItem('bible_columns', String(columns))
    } catch {
      /* ignore */
    }
  }, [columns])

  useEffect(() => {
    if (!fontRestored.current) return
    try {
      localStorage.setItem('bible_font_family', fontId)
    } catch {
      /* ignore */
    }
  }, [fontId])

  useEffect(() => {
    try {
      localStorage.setItem('bible_font_size', String(fontSize))
    } catch {
      /* ignore */
    }
  }, [fontSize])

  const { data: chapterData, isLoading, isError } = useQuery({
    queryKey: ['bible-chapter', selectedBook, chapter],
    queryFn: async () => {
      const r = await fetch(`/api/bible?book=${selectedBook}&chapter=${chapter}`)
      if (!r.ok) throw new Error('Failed to load chapter')
      return r.json()
    },
  })

  const bookName = getBookName(selectedBook)
  const totalChapters = chapterData?.totalChapters || 1
  const isIntro = chapter === 0
  // The source ships a per-chapter title; fall back only if it is absent.
  const chapterTitle: string | null = chapterData?.title ?? null

  useEffect(() => {
    if (chapterData?.totalChapters) {
      addToHistory(selectedBook, chapter)
      updateProgress(selectedBook, chapter, chapterData.totalChapters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only track reading when chapter data arrives
  }, [chapterData, selectedBook, chapter])

  // Arrow keys move between tabs and move focus with the selection, per the
  // WAI-ARIA tabs pattern. Without this the tablist was keyboard-inert.
  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const delta =
        e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
      if (!delta && e.key !== 'Home' && e.key !== 'End') return
      e.preventDefault()

      const current = TABS.findIndex((t) => t.key === activeTab)
      const next =
        e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? TABS.length - 1
            : (current + delta + TABS.length) % TABS.length

      setActiveTab(TABS[next].key)
      document.getElementById(`bible-tab-${TABS[next].key}`)?.focus()
    },
    [activeTab]
  )

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [fullscreen])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2000)
  }, [])


  const getVerseText = (verseNum: number) => {
    const plain = chapterData?.verses?.[verseNum - 1]?.text?.replace(/<\/?red>/g, '') || ''
    return plain
  }

  const handleShareVerse = async (verseNum?: number | null) => {
    const v = verseNum ?? selectedVerse
    if (!v || !chapterData?.verses) return
    const text = `${bookName} ${chapter}:${v} — ${getVerseText(v)}`
    try {
      if (navigator.share) {
        await navigator.share({ title: `${bookName} ${chapter}:${v}`, text })
      } else {
        await navigator.clipboard.writeText(text)
        showToast('पद क्लिपबोर्डमा कपी भयो')
      }
    } catch {
      /* user cancelled share */
    }
  }

  const handleHighlight = (verseNum: number, color: HighlightColor) => {
    setHighlight({
      book: selectedBook,
      chapter,
      verse: verseNum,
      color,
      reference: `${bookName} ${chapter}:${verseNum}`,
    })
  }

  const handleToggleBookmark = (verseNum: number) => {
    if (isBookmarked(selectedBook, chapter, verseNum)) {
      removeBookmark(selectedBook, chapter, verseNum)
      showToast('बुकमार्क हटाइयो')
    } else {
      addBookmark({
        book: selectedBook,
        chapter,
        verse: verseNum,
        text: getVerseText(verseNum),
        reference: `${bookName} ${chapter}:${verseNum}`,
      })
      showToast('बुकमार्क थपियो')
    }
  }

  const overallProgress = useMemo(() => {
    const all = [...OT_BOOKS, ...NT_BOOKS]
    const sum = all.reduce((acc, b) => acc + (progress[b] || 0), 0)
    return Math.round(sum / all.length)
  }, [progress])

  const booksWithProgress = useMemo(() => {
    return [...OT_BOOKS, ...NT_BOOKS]
      .map((abbr) => ({ abbr, name: BOOK_NAMES[abbr], pct: getProgress(abbr) }))
      .filter((b) => b.pct > 0)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 12)
  }, [getProgress, progress])

  return (
    <div className="flex h-[100dvh] bg-section-bg overflow-hidden">
      {/* Desktop sidebar */}
      <div className={`${fullscreen ? 'hidden' : 'hidden lg:flex'} h-full`}>
        <BibleSidebar
          selectedBook={selectedBook}
          open
          onClose={() => {}}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
        fontId={fontId}
        onFontChange={setFontId}
          mode="desktop"
        />
      </div>

      {/* Mobile drawer */}
      <BibleSidebar
        selectedBook={selectedBook}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        fontId={fontId}
        onFontChange={setFontId}
        mode="drawer"
      />

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top bar */}
        <header className={`${fullscreen ? 'hidden' : ''} shrink-0 z-20 border-b border-church-blue/8 bg-white/90 backdrop-blur-md`}>
          <div className="relative px-3 sm:px-5 py-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden ${iconBtn}`}
              aria-label="Open books menu"
            >
              <Menu className="size-5" />
            </button>

            {/* /bible sits outside the (site) route group, so it has no site
                header. Without this the only way back was to open the drawer
                and find the home link inside it. */}
            <Link href="/" className={`lg:hidden ${iconBtn}`} aria-label="मुख्य पृष्ठ">
              <Home className="size-5" />
            </Link>

            {/* Centred on the same axis as the chapter control below it.
                `flex-1` alone only centres when both sides weigh the same, and
                they do not — the left holds two icon buttons on mobile and
                nothing on desktop, the right holds the theme toggle. So the
                block is centred against the header box itself and the actions
                are taken out of the flow with absolute positioning. */}
            <div className="min-w-0 flex-1 text-center">
              <div className="flex items-center justify-center gap-2 min-w-0">
                <h1
                  className="text-lg sm:text-xl font-bold text-church-blue truncate font-nepali"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {bookName}
                </h1>
                <span className="hidden sm:inline-flex shrink-0 items-center rounded-full bg-gold/12 text-accent-foreground border border-gold/25 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide">
                  NNRV
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate font-nepali mt-0.5">
                पवित्र बाइबल — नेपाली नयाँ संशोधित संस्करण
              </p>

              {/* Chapter controls live in the header rather than in a bar of
                  their own below the tabs: it is the same axis as the title,
                  costs no extra band of height, and stays reachable without
                  the reader scrolling back up. */}
              <div className="mt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => goToChapter(Math.max(0, chapter - 1))}
                  disabled={chapter <= 0}
                  className={iconBtn}
                  aria-label="Previous chapter"
                >
                  <ChevronLeft className="size-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setChapterPickerOpen(true)}
                  className="inline-flex items-center gap-2 min-h-11 rounded-xl border border-church-blue/12 bg-section-bg hover:bg-church-blue/5 px-3.5 text-sm font-semibold text-church-blue font-nepali transition-colors min-w-[8rem] justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45"
                >
                  <LayoutGrid className="size-4 text-gold" />
                  {isIntro ? 'पुस्तक परिचय' : `अध्याय ${chapter}`}
                </button>

                <button
                  type="button"
                  onClick={() => goToChapter(Math.min(totalChapters, chapter + 1))}
                  disabled={chapter >= totalChapters}
                  className={iconBtn}
                  aria-label="Next chapter"
                >
                  <ChevronRight className="size-5" />
                </button>

                <span className="hidden sm:inline text-xs text-muted-foreground tabular-nums font-nepali ml-1">
                  {isIntro ? 'परिचय' : `${chapter} / ${totalChapters}`}
                </span>
              </div>
            </div>

            <div className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Single / double column. Hidden under lg because two columns
                  on a phone gives ~20 characters a line, which is worse than
                  the problem it solves. */}
              <div className="hidden lg:inline-flex items-center rounded-xl border border-church-blue/12 bg-card p-0.5">
                {([1, 2] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setColumns(n)}
                    aria-pressed={columns === n}
                    aria-label={n === 1 ? 'एकल स्तम्भ' : 'दोहोरो स्तम्भ'}
                    title={n === 1 ? 'एकल स्तम्भ' : 'दोहोरो स्तम्भ'}
                    className={`inline-flex items-center justify-center size-10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45 ${
                      columns === n
                        ? 'bg-church-blue/10 text-church-blue'
                        : 'text-muted-foreground hover:text-church-blue'
                    }`}
                  >
                    {n === 1 ? <AlignJustify className="size-5" /> : <Columns2 className="size-5" />}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setFullscreen(true)}
                aria-label="पूर्ण स्क्रिन"
                title="पूर्ण स्क्रिन"
                className={`hidden lg:inline-flex ${iconBtn}`}
              >
                <Maximize2 className="size-5" />
              </button>
              <ThemeToggle />
              {selectedVerse && (
                <button
                  type="button"
                  onClick={() => handleShareVerse()}
                  className="inline-flex items-center justify-center gap-1.5 min-h-11 rounded-xl bg-church-blue/5 hover:bg-church-blue/10 text-church-blue text-xs sm:text-sm font-medium px-3 sm:px-3.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45"
                >
                  <Share2 className="size-4" />
                  <span className="hidden sm:inline font-nepali">साझा</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="px-3 sm:px-5 pb-3">
            <div
              className="flex gap-1 p-1 rounded-2xl bg-church-blue/[0.05] border border-church-blue/6"
              role="tablist"
              aria-label="बाइबल दृश्य"
              onKeyDown={handleTabKeyDown}
            >
              {TABS.map(({ key, label, icon: Icon }) => {
                const active = activeTab === key
                return (
                  <button
                    key={key}
                    id={`bible-tab-${key}`}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`bible-panel-${key}`}
                    // Roving tabindex: one Tab stop for the whole set, then
                    // arrow keys move between tabs (WAI-ARIA tabs pattern).
                    tabIndex={active ? 0 : -1}
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 min-w-0 min-h-11 flex items-center justify-center gap-1.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-medium font-nepali transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45 ${
                      active
                        ? 'bg-white text-church-blue shadow-sm ring-1 ring-church-blue/8'
                        : 'text-muted-foreground hover:text-church-blue'
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div
            // max-w-3xl alone left roughly a third of a 1568px window empty on
            // either side of the text. Widening in steps fills that back in
            // without letting a line of Devanagari run past a comfortable
            // measure: 4xl is about 90 characters at the default 17px, which is
            // the top of the readable range, so it stops there rather than
            // stretching to the full column.
            className="w-full px-3 sm:px-5 lg:px-8 py-4 sm:py-6 pb-24"
            role="tabpanel"
            id={`bible-panel-${activeTab}`}
            aria-labelledby={`bible-tab-${activeTab}`}
            tabIndex={0}
          >
            {activeTab === 'read' && (
              <ReadTab
                bookName={bookName}
                isIntro={isIntro}
                chapterTitle={chapterTitle}
                selectedBook={selectedBook}
                chapter={chapter}
                goToChapter={goToChapter}
                totalChapters={totalChapters}
                isLoading={isLoading}
                isError={isError}
                chapterData={chapterData}
                selectedVerse={selectedVerse}
                setSelectedVerse={setSelectedVerse}
                fontSize={fontSize}
                fontFamily={fontStack(fontId)}
                getHighlight={(v: number) => getHighlight(selectedBook, chapter, v)}
                onHighlight={handleHighlight}
                columns={columns}
                onPresent={setPresenting}
                chapterPickerOpen={chapterPickerOpen}
                setChapterPickerOpen={setChapterPickerOpen}
                isBookmarked={isBookmarked}
                onToggleBookmark={handleToggleBookmark}
                onShare={handleShareVerse}
                history={history}
              />
            )}

            {activeTab === 'stats' && (
              <StatsTab
                overallProgress={overallProgress}
                booksWithProgress={booksWithProgress}
                bookmarkCount={bookmarks.length}
                historyCount={history.length}
              />
            )}

            {activeTab === 'history' && (
              <HistoryTab history={history} clearHistory={clearHistory} />
            )}

            {activeTab === 'bookmarks' && (
              <BookmarksTab
                bookmarks={bookmarks}
                removeBookmark={removeBookmark}
              />
            )}
          </div>
        </div>
      </main>

      {fullscreen && (
        <button
          type="button"
          onClick={() => setFullscreen(false)}
          aria-label="पूर्ण स्क्रिनबाट बाहिर"
          title="बाहिर निस्कनुहोस् (Esc)"
          className="fixed right-4 top-4 z-[80] inline-flex items-center justify-center size-11 rounded-xl bg-card/90 backdrop-blur border border-border text-muted-foreground hover:text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/50"
        >
          <X className="size-6" />
        </button>
      )}

      {presenting !== null && chapterData?.verses?.[presenting - 1] && (
        <VersePresenter
          text={getVerseText(presenting)}
          reference={`${bookName} ${chapter}:${presenting}`}
          fontFamily={fontStack(fontId)}
          onClose={() => setPresenting(null)}
          // Undefined rather than a no-op at the ends, so the component hides
          // the arrow instead of showing a dead control.
          onPrev={presenting > 1 ? () => setPresenting(presenting - 1) : undefined}
          onNext={
            presenting < (chapterData?.verses?.length ?? 0)
              ? () => setPresenting(presenting + 1)
              : undefined
          }
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-full bg-church-blue text-white text-sm font-nepali shadow-lg shadow-church-blue/30 animate-in fade-in slide-in-from-bottom-2"
        >
          {toast}
        </div>
      )}
    </div>
  )
}

/* ---------- Read tab ---------- */

function ReadTab({
  bookName,
  isIntro,
  chapterTitle,
  selectedBook,
  chapter,
  goToChapter,
  totalChapters,
  isLoading,
  isError,
  chapterData,
  selectedVerse,
  setSelectedVerse,
  fontSize,
  fontFamily,
  getHighlight,
  onHighlight,
  onPresent,
  columns,
  chapterPickerOpen,
  setChapterPickerOpen,
  isBookmarked,
  onToggleBookmark,
  onShare,
  history,
}: {
  bookName: string
  isIntro: boolean
  chapterTitle: string | null
  selectedBook: string
  chapter: number
  goToChapter: (n: number, verse?: number | null) => void
  totalChapters: number
  isLoading: boolean
  isError: boolean
  chapterData: { verses?: { text: string }[]; totalChapters?: number } | undefined
  selectedVerse: number | null
  setSelectedVerse: (n: number | null) => void
  fontSize: number
  fontFamily: string
  columns: 1 | 2
  onPresent: (verse: number) => void
  getHighlight: (verse: number) => HighlightColor | null
  onHighlight: (verse: number, color: HighlightColor) => void
  chapterPickerOpen: boolean
  setChapterPickerOpen: (v: boolean) => void
  isBookmarked: (book: string, chapter: number, verse: number) => boolean
  onToggleBookmark: (verse: number) => void
  onShare: (verse?: number | null) => void
  history: { book: string; chapter: number; timestamp: number }[]
}) {
  const lastRead = history[0]

  return (
    <>
      {/* Quick books — mobile only. From lg up the full book sidebar is
          permanently on screen, so this row repeats a navigation the reader
          already has and costs a whole band of vertical space above the text. */}
      <div className="lg:hidden mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {POPULAR_BOOKS.map((b) => {
          const active = selectedBook === b.abbr
          return (
            <Link
              key={b.abbr}
              href={`/bible/${b.abbr}`}
              className={`shrink-0 inline-flex items-center min-h-11 rounded-full px-4 text-sm font-medium font-nepali border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45 ${
                active
                  // --church-blue lightens in dark mode, so white-on-it drops to
                  // ~2.2:1. --church-blue-ink is the partner that stays navy in
                  // both themes, which is what a solid chip needs. It is not
                  // registered in tailwind.config, hence the arbitrary value.
                  ? 'bg-[var(--church-blue-ink)] text-white border-[var(--church-blue-ink)] shadow-sm'
                  : 'bg-card text-church-blue border-church-blue/12 hover:border-church-blue/30 hover:bg-church-blue/[0.03]'
              }`}
            >
              {b.name}
            </Link>
          )
        })}
      </div>

      {/* Continue reading chip */}
      {lastRead && !(lastRead.book === selectedBook && lastRead.chapter === chapter) && (
        <Link
          href={`/bible/${lastRead.book}?chapter=${lastRead.chapter}`}
          className="mb-4 flex items-center gap-3 min-h-[3.25rem] rounded-2xl border border-gold/25 bg-gradient-to-r from-accent to-card px-4 py-3 hover:shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
        >
          <div className="size-10 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
            <Clock className="size-4 text-accent-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-accent-foreground uppercase tracking-wide">
              पढाइ जारी राख्नुहोस्
            </p>
            <p className="text-sm text-church-blue font-medium truncate font-nepali">
              {getBookName(lastRead.book)} — अध्याय {lastRead.chapter}
            </p>
          </div>
          <ArrowRight className="size-4 text-gold shrink-0" />
        </Link>
      )}

      {/* Chapter controls */}
      {/* Reading card.
          The decorative banner that used to sit here (gold eyebrow, repeated
          "Book · Chapter N" heading and a rainbow rule) restated what the
          chapter bar directly above already says, and cost a screenful of
          height before the first verse. The book and chapter live in the top
          bar and the chapter selector; scripture starts at the top now.
          `sr-only` keeps a real heading for screen readers and the document
          outline, which the visual block was the only thing providing. */}
      <article className={`${cardShell} overflow-hidden`}>
        <h2 className="sr-only">
          {isIntro ? chapterTitle || 'पुस्तक परिचय' : `${bookName} · अध्याय ${chapter}`}
        </h2>

        <div className="px-2 sm:px-4 py-4 sm:py-5">
          {isLoading ? (
            <LoadingSkeleton />
          ) : isError ? (
            <EmptyState
              icon={<BookOpen className="size-10 text-church-blue/20" />}
              title="अध्याय लोड गर्न सकिएन"
              subtitle="कृपया फेरि प्रयास गर्नुहोस्"
            />
          ) : isIntro && chapterData?.verses?.length ? (
            // The introduction is prose, not scripture. Numbering its
            // paragraphs and offering bookmark/share per "verse" would imply
            // it is addressable text, which it is not.
            <div className="px-3 sm:px-4 py-1 space-y-4">
              {chapterData.verses.map((v: { text: string }, i: number) => (
                <p
                  key={i}
                  className="text-foreground font-nepali"
                  style={{ fontSize: `${fontSize}px`, fontFamily, lineHeight: 1.9, letterSpacing: '0.01em' }}
                >
                  {stripHtml(v.text.replace(/<\/?red>/g, ''))}
                </p>
              ))}
            </div>
          ) : chapterData?.verses?.length ? (
            <div
              className={`space-y-0.5 ${columns === 2 ? 'lg:columns-2 lg:gap-10' : ''}`}
            >
              {chapterData.verses.map((v: { text: string }, i: number) => {
                const verseNum = i + 1
                return (
                  <VerseRenderer
                    key={verseNum}
                    text={v.text}
                    verseNumber={verseNum}
                    selected={selectedVerse === verseNum}
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                    highlight={getHighlight(verseNum)}
                    onHighlight={(c) => onHighlight(verseNum, c)}
                    onPresent={() => onPresent(verseNum)}
                    onClick={() =>
                      setSelectedVerse(selectedVerse === verseNum ? null : verseNum)
                    }
                    isBookmarked={isBookmarked(selectedBook, chapter, verseNum)}
                    onBookmark={() => onToggleBookmark(verseNum)}
                    onShare={() => onShare(verseNum)}
                  />
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen className="size-10 text-church-blue/20" />}
              title="अध्याय भेटिएन"
              subtitle="अर्को पुस्तक वा अध्याय छान्नुहोस्"
            />
          )}
        </div>

        {/* Bottom chapter nav */}
        {chapterData?.verses && (
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-church-blue/6 bg-section-bg/80">
            <button
              type="button"
              disabled={chapter <= 0}
              onClick={() => goToChapter(Math.max(0, chapter - 1))}
              className="inline-flex items-center gap-1.5 min-h-11 rounded-xl px-3.5 text-sm font-medium font-nepali text-church-blue hover:bg-white border border-transparent hover:border-church-blue/10 disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45"
            >
              <ChevronLeft className="size-4" />
              अघिल्लो
            </button>
            <span className="text-xs text-muted-foreground tabular-nums font-nepali">
              {isIntro ? 'परिचय' : `${chapter} / ${totalChapters}`}
            </span>
            <button
              type="button"
              disabled={chapter >= totalChapters}
              onClick={() => goToChapter(Math.min(totalChapters, chapter + 1))}
              className="inline-flex items-center gap-1.5 min-h-11 rounded-xl px-3.5 text-sm font-medium font-nepali text-church-blue hover:bg-white border border-transparent hover:border-church-blue/10 disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45"
            >
              अर्को
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </article>

      {/* Chapter picker — Radix Dialog supplies the focus trap, Escape
          handling and focus restore the hand-rolled overlay was missing. */}
      <Dialog open={chapterPickerOpen} onOpenChange={setChapterPickerOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden max-h-[80dvh]">
          <DialogHeader className="px-5 py-4 border-b border-church-blue/8 text-left space-y-0.5">
            <DialogTitle
              className="font-bold text-church-blue font-nepali"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              अध्याय छान्नुहोस्
            </DialogTitle>
            <DialogDescription className="text-xs font-nepali">
              {bookName} · {totalChapters} अध्याय
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 overflow-y-auto max-h-[60dvh] grid grid-cols-5 sm:grid-cols-6 gap-2">
            {/* Introduction first, as an ⓘ tile — it is published content
                that sits ahead of chapter 1, not a chapter of its own. */}
            <button
              type="button"
              aria-current={chapter === 0 ? 'true' : undefined}
              aria-label="पुस्तक परिचय"
              title="पुस्तक परिचय"
              onClick={() => {
                goToChapter(0)
                setChapterPickerOpen(false)
              }}
              className={`aspect-square min-h-11 rounded-xl flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45 ${
                chapter === 0
                  ? 'bg-church-blue text-white shadow-md shadow-church-blue/25 scale-[1.03]'
                  : 'bg-gold/12 text-accent-foreground hover:bg-gold/20 border border-gold/25'
              }`}
            >
              <Info className="size-4" />
            </button>
            {Array.from({ length: totalChapters }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                aria-current={n === chapter ? 'true' : undefined}
                onClick={() => {
                  goToChapter(n)
                  setChapterPickerOpen(false)
                }}
                className={`aspect-square min-h-11 rounded-xl text-sm font-semibold tabular-nums transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45 ${
                  n === chapter
                    ? 'bg-church-blue text-white shadow-md shadow-church-blue/25 scale-[1.03]'
                    : 'bg-section-bg text-church-blue hover:bg-church-blue/10 border border-church-blue/6'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 px-2" aria-busy="true" aria-label="Loading chapter">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex gap-3 items-start animate-pulse">
          <div className="size-7 rounded-lg bg-gold-soft/50 shrink-0" />
          <div
            className="h-12 rounded-xl bg-gradient-to-r from-muted via-card to-muted"
            style={{ width: `${88 - (i % 3) * 8}%` }}
          />
        </div>
      ))}
    </div>
  )
}

/* ---------- Stats tab ---------- */

function StatsTab({
  overallProgress,
  booksWithProgress,
  bookmarkCount,
  historyCount,
}: {
  overallProgress: number
  booksWithProgress: { abbr: string; name: string; pct: number }[]
  bookmarkCount: number
  historyCount: number
}) {
  return (
    <div className="space-y-4">
      <div className={`${cardShell} p-5 sm:p-6 overflow-hidden relative`}>
        <div className="absolute -top-10 -right-10 size-32 rounded-full bg-gold/10 blur-2xl pointer-events-none" />
        <h3
          className="font-bold text-church-blue mb-4 font-nepali"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          बाइबल अवलोकन
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: '66', label: 'पुस्तकहरू', accent: 'text-church-blue' },
            { value: '39', label: 'पुरानो करार', accent: 'text-church-blue' },
            { value: '27', label: 'नयाँ करार', accent: 'text-church-blue' },
            { value: 'NNRV', label: 'संस्करण', accent: 'text-gold' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 rounded-2xl bg-gradient-to-b from-section-bg to-card border border-church-blue/6"
            >
              <div
                className={`text-2xl font-bold ${stat.accent}`}
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-nepali">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={`${cardShell} p-5 sm:p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3
            className="font-bold text-church-blue font-nepali"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            तपाईंको प्रगति
          </h3>
          <span className="text-sm font-semibold text-gold tabular-nums">{overallProgress}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-church-blue/8 overflow-hidden mb-5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-church-blue to-sky-blue transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl bg-section-bg border border-church-blue/6 p-3.5 text-center">
            <div className="text-lg font-bold text-church-blue">{bookmarkCount}</div>
            <div className="text-[11px] text-muted-foreground font-nepali">बुकमार्क</div>
          </div>
          <div className="rounded-xl bg-section-bg border border-church-blue/6 p-3.5 text-center">
            <div className="text-lg font-bold text-church-blue">{historyCount}</div>
            <div className="text-[11px] text-muted-foreground font-nepali">पढाइ इतिहास</div>
          </div>
        </div>

        {booksWithProgress.length > 0 ? (
          <div className="space-y-3">
            {booksWithProgress.map((b) => (
              <div key={b.abbr} className="flex items-center gap-3">
                <Link
                  href={`/bible/${b.abbr}`}
                  className="text-sm text-church-blue font-medium font-nepali w-28 sm:w-32 truncate hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45 rounded"
                >
                  {b.name}
                </Link>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-church-blue transition-all"
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                  {b.pct}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<TrendingUp className="size-10 text-church-blue/20" />}
            title="अध्याय पढ्न सुरु गर्नुहोस्"
            subtitle="प्रगति यहाँ देखिनेछ"
          />
        )}
      </div>
    </div>
  )
}

/* ---------- History tab ---------- */

function HistoryTab({
  history,
  clearHistory,
}: {
  history: { book: string; chapter: number; timestamp: number }[]
  clearHistory: () => void
}) {
  return (
    <div className={`${cardShell} p-5 sm:p-6`}>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3
          className="font-bold text-church-blue font-nepali"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          पढाइको इतिहास
        </h3>
        {history.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="min-h-11 px-3 text-xs sm:text-sm text-destructive hover:text-destructive/90 font-medium font-nepali transition-colors rounded-lg hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
          >
            सबै मेटाउनुहोस्
          </button>
        )}
      </div>
      {history.length > 0 ? (
        <div className="space-y-1.5">
          {history.slice(0, 30).map((h, i) => (
            <Link
              key={`${h.book}-${h.chapter}-${h.timestamp}-${i}`}
              href={`/bible/${h.book}?chapter=${h.chapter}`}
              className="flex items-center gap-3 min-h-14 p-3 rounded-xl hover:bg-section-bg border border-transparent hover:border-church-blue/8 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45"
            >
              <div className="size-10 rounded-xl bg-church-blue/5 flex items-center justify-center group-hover:bg-church-blue/10 transition-colors shrink-0">
                <Clock className="size-4 text-church-blue/50" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-church-blue truncate font-nepali">
                  {getBookName(h.book)} — अध्याय {h.chapter}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {new Date(h.timestamp).toLocaleString('ne-NP', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </div>
              </div>
              <ChevronRight className="size-4 text-slate-300 group-hover:text-church-blue transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Clock className="size-10 text-church-blue/20" />}
          title="कुनै इतिहास छैन"
          subtitle="अध्याय पढ्दा यहाँ देखा पर्नेछ"
        />
      )}
    </div>
  )
}

/* ---------- Bookmarks tab ---------- */

function BookmarksTab({
  bookmarks,
  removeBookmark,
}: {
  bookmarks: {
    book: string
    chapter: number
    verse: number
    text: string
    reference: string
  }[]
  removeBookmark: (book: string, chapter: number, verse: number) => void
}) {
  return (
    <div className={`${cardShell} p-5 sm:p-6`}>
      <h3
        className="font-bold text-church-blue mb-4 font-nepali"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        बुकमार्कहरू
      </h3>
      {bookmarks.length > 0 ? (
        <div className="space-y-2">
          {bookmarks.map((b, i) => (
            <div
              key={`${b.book}-${b.chapter}-${b.verse}-${i}`}
              className="flex items-start gap-3 p-3.5 rounded-xl border border-church-blue/6 hover:border-gold/30 hover:bg-accent/30 transition-all"
            >
              <div className="size-10 rounded-xl bg-gold/15 flex items-center justify-center shrink-0 mt-0.5">
                <BookmarkCheck className="size-4 text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/bible/${b.book}?chapter=${b.chapter}&verse=${b.verse}`}
                  className="text-sm font-semibold text-church-blue font-nepali hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45 rounded"
                >
                  {getBookName(b.book)} {b.chapter}:{b.verse}
                </Link>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2 font-nepali">
                  {b.text}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeBookmark(b.book, b.chapter, b.verse)}
                className="inline-flex items-center justify-center size-11 rounded-xl text-slate-300 hover:text-destructive hover:bg-destructive/5 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
                aria-label="Remove bookmark"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bookmark className="size-10 text-church-blue/20" />}
          title="कुनै बुकमार्क छैन"
          subtitle="पदमा क्लिक गरेर बुकमार्क गर्नुहोस्"
        />
      )}
    </div>
  )
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="text-center py-14 px-4">
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-section-bg border border-church-blue/6">
        {icon}
      </div>
      <p className="text-muted-foreground font-medium font-nepali">{title}</p>
      <p className="text-sm text-muted-foreground/80 mt-1.5 font-nepali">{subtitle}</p>
    </div>
  )
}
