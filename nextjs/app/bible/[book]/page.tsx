'use client'

import { useState, use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, ChevronLeft, ChevronRight, Menu, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { BibleSidebar } from '@/components/bible/BibleSidebar'
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

export default function BibleBookPage({ params }: { params: Promise<{ book: string }> }) {
  const { book: rawBook } = use(params)
  const book = rawBook.toUpperCase()
  const [chapter, setChapter] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)

  const { data: chapterData, isLoading } = useQuery({
    queryKey: ['bible-chapter', book, chapter],
    queryFn: () => fetch(`/api/bible?book=${book}&chapter=${chapter}`).then(r => r.json()),
  })

  const bookName = BOOK_NAMES[book] || book
  const totalChapters = chapterData?.totalChapters || 50

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Menu className="size-5 text-gray-600" />
            </button>
            <Link href="/bible" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="size-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-[#0b3c5d]" style={{ fontFamily: 'var(--font-heading)' }}>
                {bookName}
              </h1>
              <p className="text-xs text-gray-400">पवित्र बाइबल — NNRV</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setChapter(Math.max(1, chapter - 1))} disabled={chapter <= 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors">
              <ChevronLeft className="size-5 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">अध्याय {chapter}</span>
            <button onClick={() => setChapter(Math.min(totalChapters, chapter + 1))} disabled={chapter >= totalChapters}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors">
              <ChevronRight className="size-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold text-[#0b3c5d] mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          {bookName} — अध्याय {chapter}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse h-14 bg-white rounded-lg" />
            ))}
          </div>
        ) : chapterData?.verses ? (
          <div className="space-y-1">
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

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <button onClick={() => setChapter(Math.max(1, chapter - 1))} disabled={chapter <= 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <ChevronLeft className="size-4" /><span className="text-sm">अघिल्लो</span>
          </button>
          <span className="text-sm text-gray-500">अध्याय {chapter}</span>
          <button onClick={() => setChapter(Math.min(totalChapters, chapter + 1))} disabled={chapter >= totalChapters}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <span className="text-sm">अर्को</span><ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <BibleSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} selectedBook={book} />
    </div>
  )
}
