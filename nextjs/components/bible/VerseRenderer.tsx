'use client'

interface VerseRendererProps {
  text: string
  verseNumber?: number
  selected?: boolean
  onClick?: () => void
  book?: string
  chapter?: number
  onBookmark?: () => void
  isBookmarked?: boolean
}

export function VerseRenderer({ text, verseNumber, selected, onClick, book, chapter, onBookmark, isBookmarked }: VerseRendererProps) {
  const renderText = (raw: string) => {
    const parts = raw.split(/(<red>.*?<\/red>)/gs)
    return parts.map((part, i) => {
      if (part.startsWith('<red>') && part.endsWith('</red>')) {
        const redText = part.slice(5, -6)
        return (
          <span key={i} className="text-red-600 font-medium">
            {redText}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div
      onClick={onClick}
      className={`px-3 py-2 rounded-lg cursor-pointer transition-all text-sm leading-relaxed group ${
        selected ? 'bg-[#0b3c5d]/10 border border-[#0b3c5d]/30' : 'hover:bg-gray-50 border border-transparent'
      }`}
    >
      <span className="text-xs font-bold text-[#d4a017] mr-1.5">{verseNumber}</span>
      <span className="text-gray-700">{renderText(text)}</span>
    </div>
  )
}
