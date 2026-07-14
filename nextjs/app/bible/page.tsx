'use client'

import { useState, use, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { BookOpen, ChevronLeft, ChevronRight, Home, Search, Church, ChevronDown, Minus, Plus, Bookmark, BookmarkCheck, Share2, Clock, TrendingUp, Sparkles } from 'lucide-react'
import { VerseRenderer } from '@/components/bible/VerseRenderer'
import { useBookmarks, useReadingHistory, useReadingProgress } from '@/lib/bible/hooks'

const BOOK_NAMES: Record<string, string> = {
  'GEN': 'उत्‍पत्ति', 'EXO': 'प्रस्‍थान', 'LEV': 'लेवीहरू', 'NUM': 'गन्ती',
  'DEU': 'व्यवस्था', 'JOS': 'यहोशू', 'JDG': 'न्यायकर्ताहरू', 'RUT': 'रूथ',
  '1SA': '१ शमूएल', '2SA': '२ शमूएल', '1KI': '१ राजाहरू', '2KI': '२ राजाहरू',
  '1CH': '१ इतिहास', '2CH': '२ इतिहास', 'EZR': 'एज्रा', 'NEH': 'नहेम्‍याह',
  'EST': 'एस्‍तर', 'JOB': 'अय्‍यूब', 'PSA': 'भजनसंग्रह', 'PRO': 'हितोपदेश',
  'ECC': 'उपदेशक', 'SON': 'श्रेष्‍ठगीत', 'ISA': 'यशैया', 'JER': 'यर्मिया',
  'LAM': 'विलाप', 'EZK': 'इजकिएल', 'DAN': 'दानिएल', 'HOS': 'होशे',
  'JOL': 'योएल', 'AMO': 'आमोस', 'OBA': 'ओबदिया', 'JON': 'योना',
  'MIC': 'मीका', 'NAM': 'नहूम', 'HAB': 'हबकूक', 'ZEP': 'सपन्‍याह',
  'HAG': 'हाग्‍गै', 'ZEC': 'जकरिया', 'MAL': 'मलाकी',
  'MAT': 'मत्ती', 'MRK': 'मर्कूस', 'LUK': 'लूका', 'JHN': 'यूहन्‍ना',
  'ACT': 'प्रेरित', 'ROM': 'रोमी', '1CO': '१ कोरिन्थी', '2CO': '२ कोरिन्थी',
  'GAL': 'गलाती', 'EPH': 'एफिसी', 'PHP': 'फिलिप्पी', 'COL': 'कलस्सी',
  '1TH': '१ थेसलोनिकी', '2TH': '२ थेसलोनिकी', '1TI': '१ तिमोथी', '2TI': '२ तिमोथी',
  'TIT': 'तीतस', 'PHM': 'फिलेमोन', 'HEB': 'हिब्रू', 'JAS': 'याकूब',
  '1PE': '१ पत्रुस', '2PE': '२ पत्रुस', '1JN': '१ यूहन्‍ना', '2JN': '२ यूहन्‍ना',
  '3JN': '३ यूहन्‍ना', 'JUD': 'यहूदा', 'REV': 'प्रकाश'
}

const OT_BOOKS = ['GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SON','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL']
const NT_BOOKS = ['MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV']

const RANDOM_VERSES = [
  { book: 'JHN', chapter: 3, verse: 16, text: 'तर परमेश्वरले संसारलाई यति माया गर्नुभयो कि उहाँले आफ्नो एकलौता पुत्रलाई पठाउनुभयो, ताकि जो कोही उहाँमा विश्वास गर्छ, उ नष्ट नहोस्, उहाँमा अनन्त जीवन पाओस्।' },
  { book: 'PSA', chapter: 23, verse: 1, text: 'प्रभु मेरो चरवाहा हुनुहुन्छ; म फिर्ता फर्कने छैन।' },
  { book: 'ROM', chapter: 8, verse: 28, text: 'हामीले जान्छौं कि जसले परमेश्वरलाई माया गर्छ, जसलाई उहाँले आफ्नो योजना अनुसार बोलाउनुभएको छ, उनीहरूलाई सबै कुरा राम्रोसँग हुन्छ।' },
  { book: 'PHP', chapter: 4, verse: 13, text: 'मैले सबै कुरा गर्न सक्छु, उनले मलाई शक्ति दिनुभएकोले।' },
  { book: 'ISA', chapter: 40, verse: 31, text: 'तर जसले प्रभुमा भरोसा राख्छ, उनले नयाँ शक्ति पाउँछन्।' },
]

export default function BiblePage({ params }: { params: Promise<{ book?: string }> }) {
  const resolvedParams = use(params)
  const [selectedBook, setSelectedBook] = useState(resolvedParams?.book?.toUpperCase() || 'EXO')
  const [displayChapter, setDisplayChapter] = useState(1)
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [otOpen, setOtOpen] = useState(true)
  const [ntOpen, setNtOpen] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [showStats, setShowStats] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [activeTab, setActiveTab] = useState<'read' | 'stats' | 'history' | 'bookmarks'>('read')

  const { bookmarks, addBookmark, removeBookmark, isBookmarked } = useBookmarks()
  const { history, addToHistory, clearHistory } = useReadingHistory()
  const { getProgress } = useReadingProgress()

  const realChapter = displayChapter + 1

  const { data: chapterData, isLoading } = useQuery({
    queryKey: ['bible-chapter', selectedBook, realChapter],
    queryFn: () => fetch(`/api/bible?book=${selectedBook}&chapter=${realChapter}`).then(r => r.json()),
  })

  const bookName = BOOK_NAMES[selectedBook] || selectedBook
  const totalDisplayChapters = Math.max(1, (chapterData?.totalChapters || 50) - 1)

  const filteredOT = OT_BOOKS.filter(abbr =>
    BOOK_NAMES[abbr].includes(searchQuery) || abbr.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredNT = NT_BOOKS.filter(abbr =>
    BOOK_NAMES[abbr].includes(searchQuery) || abbr.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    if (chapterData) {
      addToHistory(selectedBook, realChapter)
      updateProgress(selectedBook, realChapter, chapterData.totalChapters)
    }
  }, [chapterData, selectedBook, realChapter])

  const { updateProgress } = useReadingProgress()

  const handleRandomVerse = () => {
    const random = RANDOM_VERSES[Math.floor(Math.random() * RANDOM_VERSES.length)]
    setSelectedBook(random.book)
    setDisplayChapter(random.chapter - 1)
    setSelectedVerse(random.verse)
  }

  const handleShare = () => {
    if (chapterData?.verses && selectedVerse) {
      const verse = chapterData.verses[selectedVerse - 1]
      const text = `${bookName} ${realChapter}:${selectedVerse} - ${verse.text}`
      if (navigator.share) {
        navigator.share({ title: bookName, text })
      } else {
        navigator.clipboard.writeText(text)
      }
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0b3c5d] text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Church className="size-6 text-[#d4a017]" />
            <div>
              <div className="font-bold text-sm">Grace Nepal Church</div>
              <div className="text-[11px] text-white/60">पवित्र बाइबल</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-white/40" />
            <input type="text" placeholder="खोज्नुहोस्..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#d4a017]" />
          </div>
        </div>

        {/* Book List */}
        <nav className="flex-1 overflow-y-auto py-1">
          <div className="px-3 py-1">
            <button onClick={() => setOtOpen(!otOpen)} className="w-full flex items-center justify-between text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-1 hover:text-white/50">
              <span>पुरानो करार</span>
              <ChevronDown className={`size-3 transition-transform ${otOpen ? 'rotate-180' : ''}`} />
            </button>
            {otOpen && filteredOT.map(abbr => (
              <Link key={abbr} href={`/bible/${abbr}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${selectedBook === abbr ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                <BookOpen className="size-3" />
                <span>{BOOK_NAMES[abbr]}</span>
              </Link>
            ))}
          </div>
          <div className="px-3 py-1 border-t border-white/10">
            <button onClick={() => setNtOpen(!ntOpen)} className="w-full flex items-center justify-between text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-1 hover:text-white/50">
              <span>नयाँ करार</span>
              <ChevronDown className={`size-3 transition-transform ${ntOpen ? 'rotate-180' : ''}`} />
            </button>
            {ntOpen && filteredNT.map(abbr => (
              <Link key={abbr} href={`/bible/${abbr}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${selectedBook === abbr ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                <BookOpen className="size-3" />
                <span>{BOOK_NAMES[abbr]}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Font Size + Home */}
        <div className="px-3 py-2 border-t border-white/10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors">
            <Home className="size-3.5" /> मुख्य पृष्ठ
          </Link>
          <div className="flex items-center gap-1">
            <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="p-1 rounded hover:bg-white/10">
              <Minus className="size-3 text-white/60" />
            </button>
            <span className="text-[10px] text-white/40 w-6 text-center">{fontSize}</span>
            <button onClick={() => setFontSize(Math.min(24, fontSize + 2))} className="p-1 rounded hover:bg-white/10">
              <Plus className="size-3 text-white/60" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header with tabs */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0b3c5d]" style={{ fontFamily: 'var(--font-heading)' }}>{bookName}</h1>
              <p className="text-sm text-gray-500">पवित्र बाइबल — NNRV</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRandomVerse} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4a017] text-white text-sm hover:bg-[#d4a017]/90 transition-colors">
                <Sparkles className="size-4" /> यादृच्छिक पद
              </button>
              {selectedVerse && (
                <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors">
                  <Share2 className="size-4" /> साझा गर्नुहोस्
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'read' as const, label: 'पढ्नुहोस्', icon: BookOpen },
              { key: 'stats' as const, label: 'तथ्यांक', icon: TrendingUp },
              { key: 'history' as const, label: 'इतिहास', icon: Clock },
              { key: 'bookmarks' as const, label: 'बुकमार्क', icon: Bookmark },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${activeTab === key ? 'bg-white text-[#0b3c5d] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>

          {activeTab === 'read' ? (
            <>
              {/* Chapter Selector */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">अध्याय:</span>
                    <button onClick={() => setDisplayChapter(Math.max(1, displayChapter - 1))} disabled={displayChapter <= 1}
                      className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm">←</button>
                    <select value={displayChapter} onChange={(e) => setDisplayChapter(Number(e.target.value))}
                      className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]">
                      {Array.from({ length: totalDisplayChapters }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                    <button onClick={() => setDisplayChapter(Math.min(totalDisplayChapters, displayChapter + 1))} disabled={displayChapter >= totalDisplayChapters}
                      className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm">→</button>
                  </div>
                  <div className="text-sm text-gray-500">अध्याय {displayChapter} / {totalDisplayChapters}</div>
                </div>
              </div>

              {/* Chapter Content */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-[#0b3c5d] mb-4" style={{ fontFamily: 'var(--font-heading)', fontSize: `${fontSize}px` }}>
                  {bookName} — अध्याय {displayChapter}
                </h2>
                {isLoading ? (
                  <div className="space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-lg" />)}</div>
                ) : chapterData?.verses ? (
                  <div className="space-y-1" style={{ fontSize: `${fontSize}px` }}>
                    {chapterData.verses.map((v: { text: string }, i: number) => (
                      <VerseRenderer key={i} text={v.text} verseNumber={i + 1} selected={selectedVerse === i + 1}
                        onClick={() => setSelectedVerse(selectedVerse === i + 1 ? null : i + 1)} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400"><BookOpen className="size-12 mx-auto mb-4 text-gray-300" /><p>अध्याय भेटिएन</p></div>
                )}
              </div>
            </>
          ) : activeTab === 'stats' ? (
            /* Statistics Tab */
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-[#0b3c5d] mb-4">बाइबल तथ्यांक</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-[#0b3c5d]">66</div><div className="text-sm text-gray-500">पुस्तकहरू</div></div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-[#0b3c5d]">39</div><div className="text-sm text-gray-500">पुरानो करार</div></div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-[#0b3c5d]">27</div><div className="text-sm text-gray-500">नयाँ करार</div></div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-[#d4a017]">NNRV</div><div className="text-sm text-gray-500">संस्करण</div></div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-[#0b3c5d] mb-4">तपाईंको प्रगति</h3>
                <div className="space-y-3">
                  {OT_BOOKS.slice(0, 5).map(abbr => {
                    const prog = getProgress(abbr)
                    return (
                      <div key={abbr} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 w-24">{BOOK_NAMES[abbr]}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2"><div className="bg-[#0b3c5d] h-2 rounded-full transition-all" style={{ width: `${prog}%` }} /></div>
                        <span className="text-xs text-gray-500 w-10 text-right">{prog}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : activeTab === 'history' ? (
            /* History Tab */
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#0b3c5d]">पढाइको इतिहास</h3>
                <button onClick={clearHistory} className="text-sm text-red-500 hover:text-red-700">सबै मेटाउनुहोस्</button>
              </div>
              {history.length > 0 ? (
                <div className="space-y-2">
                  {history.slice(0, 20).map((h, i) => (
                    <Link key={i} href={`/bible/${h.book}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <Clock className="size-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-700">{BOOK_NAMES[h.book]} — अध्याय {h.chapter}</div>
                        <div className="text-xs text-gray-400">{new Date(h.timestamp).toLocaleDateString('ne-NP')}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">कुनै इतिहास छैन</p>
              )}
            </div>
          ) : (
            /* Bookmarks Tab */
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-[#0b3c5d] mb-4">बुकमार्कहरू</h3>
              {bookmarks.length > 0 ? (
                <div className="space-y-2">
                  {bookmarks.map((b, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <BookmarkCheck className="size-4 text-[#d4a017]" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">{BOOK_NAMES[b.book]} {b.chapter}:{b.verse}</div>
                        <div className="text-xs text-gray-400 truncate">{b.text.substring(0, 60)}...</div>
                      </div>
                      <button onClick={() => removeBookmark(b.book, b.chapter, b.verse)} className="text-red-400 hover:text-red-600">
                        <Bookmark className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">कुनै बुकमार्क छैन। पदमा क्लिक गरेर बुकमार्क गर्नुहोस्।</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
