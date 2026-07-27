'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X, BookOpen, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import api from '@/lib/api'

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

const BOOK_NAMES: Record<string, string> = {
  'GEN': 'उत्पत्ति', 'EXO': 'निर्गमन', 'LEV': 'लेवीयलेवु', 'NUM': 'गणना',
  'DEU': 'व्यवस्थापन', 'JOS': 'यहोशू', 'JDG': 'न्यायकर्ता', 'RUT': 'रूत',
  '1SA': '१ शमूएल', '2SA': '२ शमूएल', '1KI': '१ राजा', '2KI': '२ राजा',
  '1CH': '१ इतिहास', '2CH': '२ इतिहास', 'EZR': 'एज्रा', 'NEH': 'नहेम्याह',
  'EST': 'एस्तेर', 'JOB': 'अय्यूब', 'PSA': 'भजनसंग्रह', 'PRO': 'हितोपदेश',
  'ECC': 'सभावाक्त', 'SON': 'श्रेष्ठगीत', 'ISA': 'यशायाह', 'JER': 'यिर्मयाह',
  'LAM': 'विलापगीत', 'EZK': 'हेजक्केल', 'DAN': 'दानियेल', 'HOS': 'होशे',
  'JOE': 'योएल', 'AMO': 'आमोस', 'OBA': 'ओबद्याह', 'JON': 'योना',
  'MIC': 'मीखा', 'NAH': 'नहूम', 'HAB': 'हबक्कूक', 'ZEP': 'सपन्याह',
  'HAG': 'हाग्गै', 'ZEC': 'जकर्याह', 'MAL': 'मलाकी',
  'MAT': 'मत्ती', 'MRK': 'मर्कुस', 'LUK': 'लूका', 'JHN': 'यूहन्ना',
  'ACT': 'प्रेरितहरू', 'ROM': 'रोमनहरू', '1CO': '१ करिन्थी', '2CO': '२ करिन्थी',
  'GAL': 'गलातीहरू', 'EPH': 'इफिसीहरू', 'PHP': 'फिलिप्पीहरू', 'COL': 'कोलोस्सीहरू',
  '1TH': '१ थिस्सलोनिकी', '2TH': '२ थिस्सलोनिकी', '1TI': '१ तिमोथी', '2TI': '२ तिमोथी',
  'TIT': 'तीतस', 'PHM': 'फिलेमोन', 'HEB': 'इब्रानीहरू', 'JAS': 'याकूब',
  '1PE': '१ पेत्रस', '2PE': '२ पेत्रस', '1JN': '१ यूहन्ना', '2JN': '२ यूहन्ना',
  '3JN': '३ यूहन्ना', 'JUD': 'यहूदा', 'REV': 'प्रकाशितवाक्य'
}

const OT_BOOKS = ['GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SON','ISA','JER','LAM','EZK','DAN','HOS','JOE','AMO','OBA','JON','MIC','NAH','HAB','ZEP','HAG','ZEC','MAL']
const NT_BOOKS = ['MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV']

interface BibleModalProps {
  open: boolean
  onClose: () => void
}

export function BibleModal({ open, onClose }: BibleModalProps) {
  const [selectedBook, setSelectedBook] = useState('JHN')
  const [selectedChapter, setSelectedChapter] = useState(3)
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showBookPicker, setShowBookPicker] = useState(false)
  const [activeTab, setActiveTab] = useState<'read' | 'search'>('read')
  const modalRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const { data: chapterData, isLoading: chapterLoading } = useQuery({
    queryKey: ['bible-chapter', selectedBook, selectedChapter],
    queryFn: () => fetch(`/api/bible?book=${selectedBook}&chapter=${selectedChapter}`).then(r => r.json()),
  })

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['bible-search', searchQuery],
    queryFn: () => fetch(`/api/bible?book=${searchQuery}`).then(r => r.json()),
    enabled: searchQuery.length > 2,
  })

  const handleBookSelect = (abbr: string) => {
    setSelectedBook(abbr)
    setSelectedChapter(1)
    setSelectedVerse(null)
    setShowBookPicker(false)
  }

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previouslyFocused?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#0b3c5d] flex items-center justify-center">
              <BookOpen className="size-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-[#0b3c5d] text-sm">पवित्र बाइबल</span>
              <p className="text-[10px] text-gray-400">NNRV — नेपाली नयाँ संशोधित संस्करण</p>
            </div>
          </div>
          <button onClick={onClose} ref={closeRef} aria-label="Close Bible modal" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="size-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0" role="tablist" aria-label="Bible tabs">
          <button
            role="tab"
            aria-selected={activeTab === 'read'}
            aria-controls="bible-read-panel"
            id="bible-read-tab"
            onClick={() => setActiveTab('read')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'read' ? 'text-[#0b3c5d] border-b-2 border-[#0b3c5d]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            पढ्नुहोस्
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'search'}
            aria-controls="bible-search-panel"
            id="bible-search-tab"
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'search' ? 'text-[#0b3c5d] border-b-2 border-[#0b3c5d]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            खोज्नुहोस्
          </button>
        </div>

        {activeTab === 'read' ? (
          <div id="bible-read-panel" role="tabpanel" aria-labelledby="bible-read-tab">
            {/* Book & Chapter Selector */}
            <div className="px-4 py-2.5 flex items-center gap-2 border-b border-gray-100 shrink-0">
              <button
                onClick={() => setShowBookPicker(!showBookPicker)}
                aria-haspopup="listbox" aria-expanded={showBookPicker}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#0b3c5d]/10 rounded-lg text-sm font-medium text-[#0b3c5d] hover:bg-[#0b3c5d]/20 transition-colors"
              >
                {BOOK_NAMES[selectedBook] || selectedBook}
                <ChevronDown className="size-4" />
              </button>
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => setSelectedChapter(Math.max(1, selectedChapter - 1))}
                  aria-label="Previous chapter"
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="size-4 text-gray-500" />
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-[70px] text-center">
                  अध्याय {selectedChapter}
                </span>
                <button
                  onClick={() => setSelectedChapter(selectedChapter + 1)}
                  aria-label="Next chapter"
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="size-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Book Picker Dropdown */}
            {showBookPicker && (
              <div className="border-b border-gray-100 max-h-60 overflow-y-auto shrink-0">
                <div className="px-4 py-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">पुरानो करार</p>
                  <div className="grid grid-cols-4 gap-1">
                    {OT_BOOKS.map(abbr => (
                      <button
                        key={abbr}
                        onClick={() => handleBookSelect(abbr)}
                        className={`px-2 py-1.5 text-xs rounded text-center transition-colors ${
                          selectedBook === abbr ? 'bg-[#0b3c5d] text-white' : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {BOOK_NAMES[abbr]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">नयाँ करार</p>
                  <div className="grid grid-cols-4 gap-1">
                    {NT_BOOKS.map(abbr => (
                      <button
                        key={abbr}
                        onClick={() => handleBookSelect(abbr)}
                        className={`px-2 py-1.5 text-xs rounded text-center transition-colors ${
                          selectedBook === abbr ? 'bg-[#0b3c5d] text-white' : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {BOOK_NAMES[abbr]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chapter Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {chapterLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse h-10 bg-gray-100 rounded-lg" />
                  ))}
                </div>
               ) : chapterData?.verses ? (
                 <div className="space-y-1">
                   {chapterData.verses.map((v: { text: string }, i: number) => (
                     <button
                       key={i}
                       onClick={() => setSelectedVerse(selectedVerse === i + 1 ? null : i + 1)}
                       className={`w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-all text-sm leading-relaxed ${
                         selectedVerse === i + 1
                           ? 'bg-[#0b3c5d]/10 border border-[#0b3c5d]/30'
                           : 'hover:bg-gray-50 border border-transparent'
                       }`}
                     >
                       <span className="text-xs font-bold text-[#d4a017] mr-1.5">{i + 1}</span>
                       <span className="text-gray-700">{v.text}</span>
                     </button>
                   ))}
                 </div>
              ) : (
                <p className="text-center text-gray-400 text-sm py-8">अध्याय भेटिएन</p>
              )}
            </div>
          </div>
        ) : (
          <div id="bible-search-panel" role="tabpanel" aria-labelledby="bible-search-tab">
            {/* Search Tab */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="खोज्नुहोस्..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]"
              />
            </div>
            {searchLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg" />
                ))}
              </div>
            ) : searchResults?.verses ? (
              <div className="space-y-2">
                {searchResults.verses.map((v: { text: string }, i: number) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-[#d4a017] mb-1">{i + 1}</p>
                    <p className="text-sm text-gray-700">{v.text}</p>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <p className="text-center text-gray-400 text-sm py-8">खोज फल भेटिएन</p>
            ) : (
              <p className="text-center text-gray-400 text-sm py-8">खोज गर्न कुनै शब्द लेख्नुहोस्</p>
            )}
          </div>
          </div>
        )}
      </div>
    </div>
  )
}
