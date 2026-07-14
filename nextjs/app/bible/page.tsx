'use client'

import { useState, use } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { BookOpen, ChevronLeft, ChevronRight, Home, Search, Church, ChevronDown, Minus, Plus } from 'lucide-react'
import { VerseRenderer } from '@/components/bible/VerseRenderer'

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

export default function BiblePage({ params }: { params: Promise<{ book?: string }> }) {
  const resolvedParams = use(params)
  const [selectedBook, setSelectedBook] = useState(resolvedParams?.book?.toUpperCase() || 'EXO')
  // Real chapter = display chapter + 1 (skip chapter 1)
  const [displayChapter, setDisplayChapter] = useState(1)
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [otOpen, setOtOpen] = useState(true)
  const [ntOpen, setNtOpen] = useState(false)
  const [fontSize, setFontSize] = useState(16)

  const realChapter = displayChapter + 1 // Chapter 2 in data = "अध्याय 1" display

  const { data: chapterData, isLoading } = useQuery({
    queryKey: ['bible-chapter', selectedBook, realChapter],
    queryFn: () => fetch(`/api/bible?book=${selectedBook}&chapter=${realChapter}`).then(r => r.json()),
  })

  const bookName = BOOK_NAMES[selectedBook] || selectedBook
  const totalDisplayChapters = Math.max(1, (chapterData?.totalChapters || 50) - 1) // Skip chapter 1

  const filteredOT = OT_BOOKS.filter(abbr =>
    BOOK_NAMES[abbr].includes(searchQuery) || abbr.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredNT = NT_BOOKS.filter(abbr =>
    BOOK_NAMES[abbr].includes(searchQuery) || abbr.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <input
              type="text"
              placeholder="खोज्नुहोस्..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#d4a017]"
            />
          </div>
        </div>

        {/* Book List */}
        <nav className="flex-1 overflow-y-auto py-1">
          {/* पुरानो करार - Collapsible */}
          <div className="px-3 py-1">
            <button
              onClick={() => setOtOpen(!otOpen)}
              className="w-full flex items-center justify-between text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-1 hover:text-white/50"
            >
              <span>पुरानो करार</span>
              <ChevronDown className={`size-3 transition-transform ${otOpen ? 'rotate-180' : ''}`} />
            </button>
            {otOpen && (
              <div className="space-y-0.5">
                {filteredOT.map(abbr => (
                  <Link key={abbr} href={`/bible/${abbr}`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
                      selectedBook === abbr ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}>
                    <BookOpen className="size-3" />
                    <span>{BOOK_NAMES[abbr]}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* नयाँ करार - Collapsible */}
          <div className="px-3 py-1 border-t border-white/10">
            <button
              onClick={() => setNtOpen(!ntOpen)}
              className="w-full flex items-center justify-between text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-1 hover:text-white/50"
            >
              <span>नयाँ करार</span>
              <ChevronDown className={`size-3 transition-transform ${ntOpen ? 'rotate-180' : ''}`} />
            </button>
            {ntOpen && (
              <div className="space-y-0.5">
                {filteredNT.map(abbr => (
                  <Link key={abbr} href={`/bible/${abbr}`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
                      selectedBook === abbr ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}>
                    <BookOpen className="size-3" />
                    <span>{BOOK_NAMES[abbr]}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Font Size Controls */}
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0b3c5d]" style={{ fontFamily: 'var(--font-heading)' }}>
                {bookName}
              </h1>
              <p className="text-sm text-gray-500">पवित्र बाइबल — NNRV</p>
            </div>
          </div>

          {/* Chapter Selector */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">अध्याय:</span>
                <button onClick={() => setDisplayChapter(Math.max(1, displayChapter - 1))} disabled={displayChapter <= 1}
                  className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm">
                  ←
                </button>
                <select value={displayChapter} onChange={(e) => setDisplayChapter(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]">
                  {Array.from({ length: totalDisplayChapters }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
                <button onClick={() => setDisplayChapter(Math.min(totalDisplayChapters, displayChapter + 1))} disabled={displayChapter >= totalDisplayChapters}
                  className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm">
                  →
                </button>
              </div>
              <div className="text-sm text-gray-500">
                अध्याय {displayChapter} / {totalDisplayChapters}
              </div>
            </div>
          </div>

          {/* Chapter Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#0b3c5d] mb-4" style={{ fontFamily: 'var(--font-heading)', fontSize: `${fontSize}px` }}>
              {bookName} — अध्याय {displayChapter}
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-lg" />
                ))}
              </div>
            ) : chapterData?.verses ? (
              <div className="space-y-1" style={{ fontSize: `${fontSize}px` }}>
                {chapterData.verses.map((v: { text: string }, i: number) => (
                  <VerseRenderer key={i} text={v.text} verseNumber={i + 1}
                    selected={selectedVerse === i + 1}
                    onClick={() => setSelectedVerse(selectedVerse === i + 1 ? null : i + 1)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <BookOpen className="size-12 mx-auto mb-4 text-gray-300" />
                <p>अध्याय भेटिएन</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
