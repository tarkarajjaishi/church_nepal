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
