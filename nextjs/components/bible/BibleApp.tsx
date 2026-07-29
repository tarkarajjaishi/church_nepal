'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Menu,
  Sparkles,
  Share2,
  Clock,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  LayoutGrid,
  X,
  ArrowRight,
} from 'lucide-react'
import { VerseRenderer } from '@/components/bible/VerseRenderer'
import { BibleSidebar } from '@/components/bible/BibleSidebar'
import { useBookmarks, useReadingHistory, useReadingProgress } from '@/lib/bible/hooks'
import {
  BOOK_NAMES,
  OT_BOOKS,
  NT_BOOKS,
  POPULAR_BOOKS,
  RANDOM_VERSES,
  getBookName,
  normalizeBookCode,
} from '@/lib/bible/books'

type TabKey = 'read' | 'stats' | 'history' | 'bookmarks'

interface BibleAppProps {
  initialBook?: string
  initialChapter?: number
}

const iconBtn =
  'inline-flex items-center justify-center size-11 rounded-xl bg-church-blue/5 hover:bg-church-blue/10 text-church-blue disabled:opacity-35 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45'

const cardShell =
  'rounded-2xl border border-church-blue/8 bg-white shadow-sm'

export function BibleApp({ initialBook = 'JHN', initialChapter = 1 }: BibleAppProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedBook = normalizeBookCode(initialBook)

  const queryChapter = Number(searchParams.get('chapter') || '') || initialChapter
  const queryVerse = Number(searchParams.get('verse') || '') || null

  const [chapter, setChapter] = useState(queryChapter)
  const [selectedVerse, setSelectedVerse] = useState<number | null>(queryVerse)
  const [fontSize, setFontSize] = useState(17)
  const [activeTab, setActiveTab] = useState<TabKey>('read')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chapterPickerOpen, setChapterPickerOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const { bookmarks, addBookmark, removeBookmark, isBookmarked } = useBookmarks()
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
      const safe = Math.max(1, next)
      setChapter(safe)
      setSelectedVerse(verse)
      const params = new URLSearchParams()
      if (safe > 1) params.set('chapter', String(safe))
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
    } catch {
      /* ignore */
    }
  }, [])

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

  useEffect(() => {
    if (chapterData?.totalChapters) {
      addToHistory(selectedBook, chapter)
      updateProgress(selectedBook, chapter, chapterData.totalChapters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only track reading when chapter data arrives
  }, [chapterData, selectedBook, chapter])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2000)
  }, [])

  const handleRandomVerse = () => {
    const random = RANDOM_VERSES[Math.floor(Math.random() * RANDOM_VERSES.length)]
    router.push(`/bible/${random.book}?chapter=${random.chapter}&verse=${random.verse}`)
  }

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
      <div className="hidden lg:flex h-full">
        <BibleSidebar
          selectedBook={selectedBook}
          open
          onClose={() => {}}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
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
        mode="drawer"
      />

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top bar */}
        <header className="shrink-0 z-20 border-b border-church-blue/8 bg-white/90 backdrop-blur-md">
          <div className="px-3 sm:px-5 py-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden ${iconBtn}`}
              aria-label="Open books menu"
            >
              <Menu className="size-5" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h1
                  className="text-lg sm:text-xl font-bold text-church-blue truncate font-nepali"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {bookName}
                </h1>
                <span className="hidden sm:inline-flex items-center rounded-full bg-gold/12 text-accent-foreground border border-gold/25 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide">
                  NNRV
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate font-nepali mt-0.5">
                पवित्र बाइबल — नेपाली नयाँ संशोधित संस्करण
              </p>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRandomVerse}
                className="inline-flex items-center justify-center gap-1.5 min-h-11 rounded-xl bg-gold hover:bg-gold/90 text-white text-xs sm:text-sm font-medium px-3 sm:px-3.5 shadow-sm shadow-gold/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-1"
              >
                <Sparkles className="size-4" />
                <span className="hidden sm:inline font-nepali">यादृच्छिक पद</span>
              </button>
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
            >
              {(
                [
                  { key: 'read' as const, label: 'पढ्नुहोस्', icon: BookOpen },
                  { key: 'stats' as const, label: 'प्रगति', icon: TrendingUp },
                  { key: 'history' as const, label: 'इतिहास', icon: Clock },
                  { key: 'bookmarks' as const, label: 'बुकमार्क', icon: Bookmark },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 min-w-0 min-h-11 flex items-center justify-center gap-1.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-medium font-nepali transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45 ${
                    activeTab === key
                      ? 'bg-white text-church-blue shadow-sm ring-1 ring-church-blue/8'
                      : 'text-muted-foreground hover:text-church-blue'
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-3 sm:px-5 py-4 sm:py-6 pb-24">
            {activeTab === 'read' && (
              <ReadTab
                bookName={bookName}
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
  chapterPickerOpen,
  setChapterPickerOpen,
  isBookmarked,
  onToggleBookmark,
  onShare,
  history,
}: {
  bookName: string
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
      {/* Quick books */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {POPULAR_BOOKS.map((b) => {
          const active = selectedBook === b.abbr
          return (
            <Link
              key={b.abbr}
              href={`/bible/${b.abbr}`}
              className={`shrink-0 inline-flex items-center min-h-11 rounded-full px-4 text-sm font-medium font-nepali border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45 ${
                active
                  ? 'bg-church-blue text-white border-church-blue shadow-sm'
                  : 'bg-white text-church-blue border-church-blue/12 hover:border-church-blue/30 hover:bg-church-blue/[0.03]'
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
          className="mb-4 flex items-center gap-3 min-h-[3.25rem] rounded-2xl border border-gold/25 bg-gradient-to-r from-accent to-white px-4 py-3 hover:shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
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
      <div className="sticky top-0 z-10 mb-4 rounded-2xl border border-church-blue/8 bg-white/95 backdrop-blur-md shadow-sm p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToChapter(Math.max(1, chapter - 1))}
              disabled={chapter <= 1}
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
              अध्याय {chapter}
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
          </div>

          <div className="text-xs sm:text-sm text-muted-foreground tabular-nums font-nepali">
            <span className="font-medium text-church-blue">{chapter}</span>
            <span className="mx-1 text-muted-foreground/40">/</span>
            {totalChapters} अध्याय
          </div>
        </div>
      </div>

      {/* Reading card */}
      <article className={`${cardShell} overflow-hidden`}>
        <div className="relative px-5 sm:px-7 pt-6 pb-4 border-b border-church-blue/6 bg-gradient-to-br from-church-blue/[0.04] via-white to-gold/[0.06]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-church-blue via-sky-blue to-gold" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold mb-1.5">
            पवित्र शास्त्र
          </p>
          <h2
            className="text-xl sm:text-2xl font-bold text-church-blue font-nepali"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {bookName}
            <span className="text-muted-foreground/60 font-medium"> · </span>
            अध्याय {chapter}
          </h2>
        </div>

        <div className="px-2 sm:px-4 py-4 sm:py-5">
          {isLoading ? (
            <LoadingSkeleton />
          ) : isError ? (
            <EmptyState
              icon={<BookOpen className="size-10 text-church-blue/20" />}
              title="अध्याय लोड गर्न सकिएन"
              subtitle="कृपया फेरि प्रयास गर्नुहोस्"
            />
          ) : chapterData?.verses?.length ? (
            <div className="space-y-0.5">
              {chapterData.verses.map((v: { text: string }, i: number) => {
                const verseNum = i + 1
                return (
                  <VerseRenderer
                    key={verseNum}
                    text={v.text}
                    verseNumber={verseNum}
                    selected={selectedVerse === verseNum}
                    fontSize={fontSize}
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
              disabled={chapter <= 1}
              onClick={() => goToChapter(Math.max(1, chapter - 1))}
              className="inline-flex items-center gap-1.5 min-h-11 rounded-xl px-3.5 text-sm font-medium font-nepali text-church-blue hover:bg-white border border-transparent hover:border-church-blue/10 disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45"
            >
              <ChevronLeft className="size-4" />
              अघिल्लो
            </button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {chapter} / {totalChapters}
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

      {/* Chapter picker modal */}
      {chapterPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-church-blue/45 backdrop-blur-sm"
            onClick={() => setChapterPickerOpen(false)}
            aria-label="Close chapter picker"
          />
          <div className="relative w-full sm:max-w-md max-h-[80dvh] overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-church-blue/8">
              <div>
                <h3
                  className="font-bold text-church-blue font-nepali"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  अध्याय छान्नुहोस्
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-nepali">
                  {bookName} · {totalChapters} अध्याय
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChapterPickerOpen(false)}
                className="inline-flex items-center justify-center size-11 rounded-xl hover:bg-section-bg text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue/45"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60dvh] grid grid-cols-5 sm:grid-cols-6 gap-2">
              {Array.from({ length: totalChapters }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
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
          </div>
        </div>
      )}
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
            className="h-12 rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100"
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
              className="text-center p-4 rounded-2xl bg-gradient-to-b from-section-bg to-white border border-church-blue/6"
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
