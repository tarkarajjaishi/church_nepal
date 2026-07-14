'use client'

import { useState } from 'react'
import { Search, BookOpen, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'

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

interface BibleSidebarProps {
  open: boolean
  onClose: () => void
  selectedBook?: string
}

export function BibleSidebar({ open, onClose, selectedBook }: BibleSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOT = OT_BOOKS.filter(abbr => 
    BOOK_NAMES[abbr].includes(searchQuery) || abbr.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredNT = NT_BOOKS.filter(abbr => 
    BOOK_NAMES[abbr].includes(searchQuery) || abbr.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Sidebar */}
      <div className="relative w-80 bg-white shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#0b3c5d] flex items-center justify-center">
              <BookOpen className="size-5 text-[#d4a017]" />
            </div>
            <div>
              <h2 className="font-bold text-[#0b3c5d]" style={{ fontFamily: 'var(--font-heading)' }}>
                पवित्र बाइबल
              </h2>
              <p className="text-[10px] text-gray-400">NNRV — नेपाली नयाँ संशोधित संस्करण</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="size-5 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="पुस्तक खोज्नुहोस्..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]"
            />
          </div>
        </div>

        {/* Book List */}
        <div className="flex-1 overflow-y-auto">
          {/* Old Testament */}
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">पुरानो करार</p>
            <div className="space-y-0.5">
              {filteredOT.map(abbr => (
                <Link
                  key={abbr}
                  href={`/bible/${abbr}`}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedBook === abbr
                      ? 'bg-[#0b3c5d] text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{BOOK_NAMES[abbr]}</span>
                  <ChevronRight className="size-4 text-gray-400" />
                </Link>
              ))}
            </div>
          </div>

          {/* New Testament */}
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">नयाँ करार</p>
            <div className="space-y-0.5">
              {filteredNT.map(abbr => (
                <Link
                  key={abbr}
                  href={`/bible/${abbr}`}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedBook === abbr
                      ? 'bg-[#0b3c5d] text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{BOOK_NAMES[abbr]}</span>
                  <ChevronRight className="size-4 text-gray-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
