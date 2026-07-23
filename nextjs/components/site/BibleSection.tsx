'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'

interface VerseData {
  book: string
  bookAbbreviation: string
  chapter: number
  verse: number
  text: string
  reference: string
}

interface ChapterData {
  book: string
  bookAbbreviation: string
  chapter: number
  verses: { text: string }[]
}

// Popular books for quick access
const POPULAR_BOOKS = [
  { abbr: 'JHN', name: 'यूहन्ना' },
  { abbr: 'MAT', name: 'मत्ती' },
  { abbr: 'PSA', name: 'भजनसंग्रह' },
  { abbr: 'ROM', name: 'रोमनहरू' },
  { abbr: 'GEN', name: 'उत्पत्ति' },
  { abbr: 'PHP', name: 'फिलिप्पीहरू' },
]

export function BibleSection() {
  const [selectedBook, setSelectedBook] = useState('JHN')
  const [selectedChapter, setSelectedChapter] = useState(3)
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)

  // Fetch verse of the day (John 3:16)
  const { data: verseOfDay, isLoading: verseLoading } = useQuery({
    queryKey: ['bible-verse-of-day'],
    queryFn: () => fetch('/api/bible?book=JHN&chapter=3&verse=16').then(r => r.json()),
  })

  // Fetch selected chapter
  const { data: chapterData, isLoading: chapterLoading } = useQuery({
    queryKey: ['bible-chapter', selectedBook, selectedChapter],
    queryFn: () => fetch(`/api/bible?book=${selectedBook}&chapter=${selectedChapter}`).then(r => r.json()),
  })

  // Fetch selected verse
  const { data: verseDetail } = useQuery({
    queryKey: ['bible-verse', selectedBook, selectedChapter, selectedVerse],
    queryFn: () => fetch(`/api/bible?book=${selectedBook}&chapter=${selectedChapter}&verse=${selectedVerse}`).then(r => r.json()),
    enabled: selectedVerse !== null,
  })

  const maxChapters = 22 // Default, varies by book

  return (
    <section className="py-16 bg-[#f7f9fc]">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#0b3c5d]/10 rounded-full px-4 py-1.5 mb-4">
            <BookOpen className="size-4 text-[#0b3c5d]" />
            <span className="text-sm font-medium text-[#0b3c5d]">पवित्र बाइबल</span>
          </div>
          <h2 className="text-3xl font-bold text-[#0b3c5d]" style={{ fontFamily: 'var(--font-heading)' }}>
            पवित्र बाइबल (NE)
          </h2>
          <p className="text-gray-600 mt-2">Nepali New Revised Version (NNRV) — नेपाली नयाँ संशोधित संस्करण</p>
        </div>

        {/* Verse of the Day */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 text-center">
          <p className="text-xs uppercase tracking-wider text-[#d4a017] font-semibold mb-3">आजको पद</p>
          {verseLoading ? (
            <div className="animate-pulse h-20 bg-gray-100 rounded-lg" />
          ) : (
            <>
              <p className="text-xl md:text-2xl text-[#0b3c5d] leading-relaxed mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                &ldquo;{verseOfDay?.text}&rdquo;
              </p>
              <p className="text-sm text-gray-500">— {verseOfDay?.reference}</p>
            </>
          )}
        </div>

        {/* Book Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {POPULAR_BOOKS.map((book) => (
            <button
              key={book.abbr}
              onClick={() => { setSelectedBook(book.abbr); setSelectedChapter(1); setSelectedVerse(null) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedBook === book.abbr
                  ? 'bg-[#0b3c5d] text-white'
                  : 'bg-white text-[#0b3c5d] border border-gray-200 hover:border-[#0b3c5d]'
              }`}
            >
              {book.name}
            </button>
          ))}
        </div>

        {/* Chapter Navigation */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => setSelectedChapter(Math.max(1, selectedChapter - 1))}
            disabled={selectedChapter <= 1}
            aria-label="Previous chapter"
            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="size-5" />
          </button>
          <span className="text-lg font-semibold text-[#0b3c5d]">
            {chapterData?.book} {selectedChapter}
          </span>
          <button
            onClick={() => setSelectedChapter(selectedChapter + 1)}
            disabled={selectedChapter >= maxChapters}
            aria-label="Next chapter"
            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {/* Chapter Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          {chapterLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-12 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {chapterData?.verses.map((v: { text: string }, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedVerse(selectedVerse === i + 1 ? null : i + 1)}
                  className={`w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-all text-sm leading-relaxed ${
                    selectedVerse === i + 1
                      ? 'bg-[#0b3c5d]/10 border border-[#0b3c5d]/30'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <span className="text-xs font-bold text-[#d4a017] mr-2">{i + 1}</span>
                  <span className="text-gray-700 leading-relaxed">{v.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
