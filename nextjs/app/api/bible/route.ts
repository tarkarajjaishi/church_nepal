import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const BIBLE_DIR = path.join(process.cwd(), 'nnrv_bible-main')

/**
 * Parsed books, kept in memory.
 *
 * Every chapter request used to `readFileSync` + `JSON.parse` the whole book:
 * 302KB for John, more for Psalms, out of 12MB of scripture on disk. Turning
 * a page re-read and re-parsed the entire book, which is why the reader sat on
 * skeletons for seconds before any verse appeared.
 *
 * The NNRV text is immutable — it cannot change between requests — so a plain
 * Map is the whole solution. Bounded at 66 books by construction, so it needs
 * no eviction policy.
 */
const bookCache = new Map<string, BookData>()

function loadBook(book: string): BookData | null {
  const cached = bookCache.get(book)
  if (cached) return cached
  const filePath = path.join(BIBLE_DIR, `${book}.json`)
  if (!fs.existsSync(filePath)) return null
  const parsed: BookData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  bookCache.set(book, parsed)
  return parsed
}

/** Scripture does not change, so let the browser keep it too. */
const IMMUTABLE = { 'Cache-Control': 'public, max-age=31536000, immutable' } as const

const BOOK_NAMES: Record<string, string> = {
  'GEN': 'उत्‍पत्ति', 'EXO': 'प्रस्‍थान', 'LEV': 'लेवीहरू', 'NUM': 'गन्ती',
  'DEU': 'व्यवस्था', 'JOS': 'यहोशू', 'JDG': 'न्यायकर्ताहरू', 'RUT': 'रूथ',
  '1SA': '१ शमूएल', '2SA': '२ शमूएल', '1KI': '१ राजाहरू', '2KI': '२ राजाहरू',
  '1CH': '१ इतिहास', '2CH': '२ इतिहास', 'EZR': 'एज्रा', 'NEH': 'नहेम्‍याह',
  'EST': 'एस्‍तर', 'JOB': 'अय्‍यूब', 'PSA': 'भजनसंग्रह', 'PRO': 'हितोपदेश',
  'ECC': 'उपदेशक', 'SNG': 'श्रेष्‍ठगीत', 'SON': 'श्रेष्‍ठगीत', 'ISA': 'यशैया', 'JER': 'यर्मिया',
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

const OT_BOOKS = ['GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL']
const NT_BOOKS = ['MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV']

function normalizeBook(book: string): string {
  const upper = book.toUpperCase()
  if (upper === 'SON') return 'SNG'
  return upper
}

/**
 * In every NNRV source file `chapters[0]` is the publisher's book
 * introduction (title "पुस्तक परिचय"), not chapter 1 — real chapter N lives
 * at `chapters[N]`.
 *
 * Indexing with `chapter - 1` therefore shifted the entire Bible by one: a
 * request for John 3:16 returned John 2:16, and chapter 1 of every book
 * rendered the introduction. Verified against all 66 files — each has exactly
 * one extra leading entry (John 22 vs 21, Psalms 151 vs 150, Genesis 51 vs 50).
 *
 * Chapter numbers are 1-based over real chapters. `chapter=0` addresses the
 * introduction, which is real published content and stays reachable — the
 * printed NNRV and other Bible readers both present it ahead of chapter 1.
 */
function getChapter(bookData: BookData, chapter: number): Chapter | null {
  if (!Number.isInteger(chapter) || chapter < 0) return null
  return bookData.chapters[chapter] ?? null
}

function chapterCount(bookData: BookData): number {
  return Math.max(0, bookData.chapters.length - 1)
}

interface Verse {
  id?: number
  text: string
}
interface Chapter {
  title?: string
  verses: Verse[]
}
interface BookData {
  chapters: Chapter[]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const book = searchParams.get('book') ? normalizeBook(searchParams.get('book')!) : null
  const chapter = parseInt(searchParams.get('chapter') || '1')
  const verse = searchParams.get('verse')

  if (!book) {
    const files = fs.readdirSync(BIBLE_DIR).filter(f => f.endsWith('.json'))
    const books = files.map(f => {
      const abbr = f.replace('.json', '')
      return {
        abbreviation: abbr,
        name: BOOK_NAMES[abbr] || abbr,
        testament: OT_BOOKS.includes(abbr) ? 'OT' : 'NT'
      }
    })
    return NextResponse.json({ books }, { headers: IMMUTABLE })
  }

  const bookData = loadBook(book)
  if (!bookData) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  if (verse) {
    const verseNum = parseInt(verse)
    const chapterData = getChapter(bookData, chapter)
    if (!chapterData) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }
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

  const chapterData = getChapter(bookData, chapter)
  if (!chapterData) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  return NextResponse.json({
    book: BOOK_NAMES[book] || book,
    bookAbbreviation: book,
    chapter,
    // The source carries a per-chapter title ("पुस्तक परिचय", "यूहन्‍ना 1").
    // It was never surfaced, so the reader had to synthesise its own heading.
    title: chapterData.title ?? null,
    isIntro: chapter === 0,
    totalChapters: chapterCount(bookData),
    verses: chapterData.verses
  }, { headers: IMMUTABLE })
}
