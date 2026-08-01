export const BOOK_NAMES: Record<string, string> = {
  GEN: 'उत्‍पत्ति',
  EXO: 'प्रस्‍थान',
  LEV: 'लेवीहरू',
  NUM: 'गन्ती',
  DEU: 'व्यवस्था',
  JOS: 'यहोशू',
  JDG: 'न्यायकर्ताहरू',
  RUT: 'रूथ',
  '1SA': '१ शमूएल',
  '2SA': '२ शमूएल',
  '1KI': '१ राजाहरू',
  '2KI': '२ राजाहरू',
  '1CH': '१ इतिहास',
  '2CH': '२ इतिहास',
  EZR: 'एज्रा',
  NEH: 'नहेम्‍याह',
  EST: 'एस्‍तर',
  JOB: 'अय्‍यूब',
  PSA: 'भजनसंग्रह',
  PRO: 'हितोपदेश',
  ECC: 'उपदेशक',
  SON: 'श्रेष्‍ठगीत',
  SNG: 'श्रेष्‍ठगीत',
  ISA: 'यशैया',
  JER: 'यर्मिया',
  LAM: 'विलाप',
  EZK: 'इजकिएल',
  DAN: 'दानिएल',
  HOS: 'होशे',
  JOL: 'योएल',
  AMO: 'आमोस',
  OBA: 'ओबदिया',
  JON: 'योना',
  MIC: 'मीका',
  NAM: 'नहूम',
  HAB: 'हबकूक',
  ZEP: 'सपन्‍याह',
  HAG: 'हाग्‍गै',
  ZEC: 'जकरिया',
  MAL: 'मलाकी',
  MAT: 'मत्ती',
  MRK: 'मर्कूस',
  LUK: 'लूका',
  JHN: 'यूहन्‍ना',
  ACT: 'प्रेरित',
  ROM: 'रोमी',
  '1CO': '१ कोरिन्थी',
  '2CO': '२ कोरिन्थी',
  GAL: 'गलाती',
  EPH: 'एफिसी',
  PHP: 'फिलिप्पी',
  COL: 'कलस्सी',
  '1TH': '१ थेसलोनिकी',
  '2TH': '२ थेसलोनिकी',
  '1TI': '१ तिमोथी',
  '2TI': '२ तिमोथी',
  TIT: 'तीतस',
  PHM: 'फिलेमोन',
  HEB: 'हिब्रू',
  JAS: 'याकूब',
  '1PE': '१ पत्रुस',
  '2PE': '२ पत्रुस',
  '1JN': '१ यूहन्‍ना',
  '2JN': '२ यूहन्‍ना',
  '3JN': '३ यूहन्‍ना',
  JUD: 'यहूदा',
  REV: 'प्रकाश',
}

export const OT_BOOKS = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT',
  '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH',
  'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER',
  'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON',
  'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
] as const

export const NT_BOOKS = [
  'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO',
  'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI',
  'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN',
  '3JN', 'JUD', 'REV',
] as const

export const POPULAR_BOOKS = [
  { abbr: 'JHN', name: 'यूहन्‍ना' },
  { abbr: 'MAT', name: 'मत्ती' },
  { abbr: 'PSA', name: 'भजनसंग्रह' },
  { abbr: 'ROM', name: 'रोमी' },
  { abbr: 'GEN', name: 'उत्‍पत्ति' },
  { abbr: 'PHP', name: 'फिलिप्पी' },
  { abbr: 'PRO', name: 'हितोपदेश' },
  { abbr: 'ISA', name: 'यशैया' },
] as const

export const RANDOM_VERSES = [
  {
    book: 'JHN',
    chapter: 3,
    verse: 16,
    text: 'तर परमेश्वरले संसारलाई यति माया गर्नुभयो कि उहाँले आफ्नो एकलौता पुत्रलाई पठाउनुभयो, ताकि जो कोही उहाँमा विश्वास गर्छ, उ नष्ट नहोस्, उहाँमा अनन्त जीवन पाओस्।',
  },
  {
    book: 'PSA',
    chapter: 23,
    verse: 1,
    text: 'प्रभु मेरो चरवाहा हुनुहुन्छ; म फिर्ता फर्कने छैन।',
  },
  {
    book: 'ROM',
    chapter: 8,
    verse: 28,
    text: 'हामीले जान्छौं कि जसले परमेश्वरलाई माया गर्छ, जसलाई उहाँले आफ्नो योजना अनुसार बोलाउनुभएको छ, उनीहरूलाई सबै कुरा राम्रोसँग हुन्छ।',
  },
  {
    book: 'PHP',
    chapter: 4,
    verse: 13,
    text: 'मैले सबै कुरा गर्न सक्छु, उनले मलाई शक्ति दिनुभएकोले।',
  },
  {
    book: 'ISA',
    chapter: 40,
    verse: 31,
    text: 'तर जसले प्रभुमा भरोसा राख्छ, उनले नयाँ शक्ति पाउँछन्।',
  },
] as const

/** Normalize Song of Songs / Song of Solomon codes */
export function normalizeBookCode(code: string): string {
  const upper = code.toUpperCase()
  if (upper === 'SON') return 'SNG'
  return upper
}

export function getBookName(code: string): string {
  const normalized = normalizeBookCode(code)
  return BOOK_NAMES[normalized] || BOOK_NAMES[code.toUpperCase()] || code
}

export function isOT(code: string): boolean {
  return (OT_BOOKS as readonly string[]).includes(normalizeBookCode(code))
}

/**
 * Chapter count per book (excluding the introduction at index 0).
 * Generated from the NNRV source files so the sidebar can show a chapter
 * grid without fetching each book first.
 */
export const CHAPTER_COUNTS: Record<string, number> = {
  "GEN": 50, "EXO": 40, "LEV": 27, "NUM": 36, "DEU": 34, "JOS": 24,
  "JDG": 21, "RUT": 4, "1SA": 31, "2SA": 24, "1KI": 22, "2KI": 25,
  "1CH": 29, "2CH": 36, "EZR": 10, "NEH": 13, "EST": 10, "JOB": 42,
  "PSA": 150, "PRO": 31, "ECC": 12, "SNG": 8, "ISA": 66, "JER": 52,
  "LAM": 5, "EZK": 48, "DAN": 12, "HOS": 14, "JOL": 3, "AMO": 9,
  "OBA": 1, "JON": 4, "MIC": 7, "NAM": 3, "HAB": 3, "ZEP": 3,
  "HAG": 2, "ZEC": 14, "MAL": 4, "MAT": 28, "MRK": 16, "LUK": 24,
  "JHN": 21, "ACT": 28, "ROM": 16, "1CO": 16, "2CO": 13, "GAL": 6,
  "EPH": 6, "PHP": 4, "COL": 4, "1TH": 5, "2TH": 3, "1TI": 6,
  "2TI": 4, "TIT": 3, "PHM": 1, "HEB": 13, "JAS": 5, "1PE": 5,
  "2PE": 3, "1JN": 5, "2JN": 1, "3JN": 1, "JUD": 1, "REV": 22,
}

/**
 * Reading faces offered by the Bible reader.
 *
 * The stack always ends in Noto Sans Devanagari, the site's own Devanagari
 * face, so a chosen font that fails to load still renders Nepali correctly
 * rather than dropping to a Latin default that cannot draw the script.
 *
 * Annapurna SIL is published by SIL rather than Google Fonts, so it is
 * resolved with local() only: readers who have it installed get it, everyone
 * else falls through to Noto. It is listed because it is a scripture face
 * many Nepali readers already have.
 */
export interface BibleFont {
  id: string
  label: string
  stack: string
  /** True when the face is not web-delivered and depends on a local install. */
  localOnly?: boolean
}

export const BIBLE_FONTS: BibleFont[] = [
  { id: 'noto', label: 'Noto Sans Devanagari', stack: "'Noto Sans Devanagari', sans-serif" },
  { id: 'anek', label: 'Anek Devanagari', stack: "'Anek Devanagari', 'Noto Sans Devanagari', sans-serif" },
  { id: 'khand', label: 'Khand', stack: "'Khand', 'Noto Sans Devanagari', sans-serif" },
  { id: 'yatra', label: 'Yatra One', stack: "'Yatra One', 'Noto Sans Devanagari', sans-serif" },
  { id: 'annapurna', label: 'Annapurna SIL', stack: "'Annapurna SIL', 'Noto Sans Devanagari', sans-serif", localOnly: true },
  { id: 'gotu', label: 'Gotu', stack: "'Gotu', 'Noto Sans Devanagari', sans-serif" },
]

// Anek Devanagari is the reader's default face: it is a contemporary
// Devanagari design with better fitted conjuncts at reading sizes than the
// Noto fallback. A visitor's own choice still wins — it is restored from
// localStorage on load and only this initial value is affected.
export const DEFAULT_BIBLE_FONT = 'anek'

/** Unknown/absent ids fall back to the default rather than to no font at all. */
export function fontStack(id: string | null | undefined): string {
  const fallback = BIBLE_FONTS.find((f) => f.id === DEFAULT_BIBLE_FONT) ?? BIBLE_FONTS[0]
  return (BIBLE_FONTS.find((f) => f.id === id) ?? fallback).stack
}
