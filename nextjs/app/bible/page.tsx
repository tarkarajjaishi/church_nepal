'use client'

import { useState } from 'react'
import { BookOpen, Search, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { BibleSidebar } from '@/components/bible/BibleSidebar'
import { VerseRenderer } from '@/components/bible/VerseRenderer'

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

export default function BiblePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <BookOpen className="size-5 text-[#0b3c5d]" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#0b3c5d]" style={{ fontFamily: 'var(--font-heading)' }}>
                पवित्र बाइबल
              </h1>
              <p className="text-xs text-gray-400">NNRV — नेपाली नयाँ संशोधित संस्करण</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-[#0b3c5d] mb-4">
            <BookOpen className="size-8 text-[#d4a017]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0b3c5d]" style={{ fontFamily: 'var(--font-heading)' }}>
            पवित्र बाइबल (NE)
          </h2>
          <p className="text-gray-500 mt-2">Nepali New Revised Version — नेपाली नयाँ संशोधित संस्करण</p>
          <p className="text-sm text-gray-400 mt-1">Nepal Bible Society</p>
        </div>

        {/* Verse of the Day */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <p className="text-xs uppercase tracking-wider text-[#d4a017] font-semibold mb-4">आजको पद — यूहन्ना ३:१६</p>
          <VerseRenderer
            text='तर परमेश्वरले संसारलाई यति माया गर्नुभयो कि उहाँले आफ्नो एकलौता पुत्रलाई पठाउनुभयो, ताकि जो कोही उहाँमा विश्वास गर्छ, उ नष्ट नहोस्, उहाँमा अनन्त जीवन पाओस्।'
            verseNumber={16}
          />
        </div>

        {/* Old Testament */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-[#0b3c5d] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            पुरानो करार
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {OT_BOOKS.map(abbr => (
              <Link
                key={abbr}
                href={`/bible/${abbr}`}
                className="flex items-center justify-between px-3 py-2.5 bg-white rounded-lg border border-gray-100 hover:border-[#0b3c5d] hover:shadow-sm transition-all"
              >
                <span className="text-sm text-gray-700">{BOOK_NAMES[abbr]}</span>
                <ChevronRight className="size-4 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>

        {/* New Testament */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-[#0b3c5d] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            नयाँ करार
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {NT_BOOKS.map(abbr => (
              <Link
                key={abbr}
                href={`/bible/${abbr}`}
                className="flex items-center justify-between px-3 py-2.5 bg-white rounded-lg border border-gray-100 hover:border-[#0b3c5d] hover:shadow-sm transition-all"
              >
                <span className="text-sm text-gray-700">{BOOK_NAMES[abbr]}</span>
                <ChevronRight className="size-4 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <BibleSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  )
}
