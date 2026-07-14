import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const BIBLE_DIR = path.join(process.cwd(), 'nnrv_bible-main')

// Book name mapping (abbreviation to full Nepali name)
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
  'MAT': 'मत्ती', 'MAR': 'मर्कुस', 'LUK': 'लूका', 'JHN': 'यूहन्ना',
  'ACT': 'प्रेरितहरू', 'ROM': 'रोमनहरू', '1CO': '१ करिन्थी', '2CO': '२ करिन्थी',
  'GAL': 'गलातीहरू', 'EPH': 'इफिसीहरू', 'PHP': 'फिलिप्पीहरू', 'COL': 'कोलोस्सीहरू',
  '1TH': '१ थिस्सलोनिकी', '2TH': '२ थिस्सलोनिकी', '1TI': '१ तिमोथी', '2TI': '२ तिमोथी',
  'TIT': 'तीतस', 'PHM': 'फिलेमोन', 'HEB': 'इब्रानीहरू', 'JAS': 'याकूब',
  '1PE': '१ पेत्रस', '2PE': '२ पेत्रस', '1JN': '१ यूहन्ना', '2JN': '२ यूहन्ना',
  '3JN': '३ यूहन्ना', 'JUD': 'यहूदा', 'REV': 'प्रकाशितवाक्य'
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const book = searchParams.get('book')?.toUpperCase()
  const chapter = parseInt(searchParams.get('chapter') || '1')
  const verse = searchParams.get('verse')

  if (!book) {
    // Return list of all books
    const files = fs.readdirSync(BIBLE_DIR).filter(f => f.endsWith('.json'))
    const books = files.map(f => {
      const abbr = f.replace('.json', '')
      return {
        abbreviation: abbr,
        name: BOOK_NAMES[abbr] || abbr,
        chapters: 0 // Will be populated on demand
      }
    })
    return NextResponse.json({ books })
  }

  const filePath = path.join(BIBLE_DIR, `${book}.json`)
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  const bookData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const chapterData = bookData.chapters[chapter - 1]

  if (!chapterData) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  if (verse) {
    const verseNum = parseInt(verse)
    const verseData = chapterData.verses[verseNum - 1]
    if (!verseData) {
      return NextResponse.json({ error: 'Verse not found' }, { status: 404 })
    }
    return NextResponse.json({
      book: BOOK_NAMES[book] || book,
      bookAbbreviation: book,
      chapter,
      verse: verseNum,
      text: verseData.text,
      reference: `${BOOK_NAMES[book] || book} ${chapter}:${verse}`
    })
  }

  return NextResponse.json({
    book: BOOK_NAMES[book] || book,
    bookAbbreviation: book,
    chapter,
    verses: chapterData.verses
  })
}
