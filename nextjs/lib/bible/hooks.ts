'use client'

import { useState, useEffect, useCallback } from 'react'

// Bookmarks
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<{book: string, chapter: number, verse: number, text: string, reference: string}[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('bible_bookmarks')
    if (saved) setBookmarks(JSON.parse(saved))
  }, [])

  const addBookmark = (bookmark: {book: string, chapter: number, verse: number, text: string, reference: string}) => {
    const exists = bookmarks.some(b => b.book === bookmark.book && b.chapter === bookmark.chapter && b.verse === bookmark.verse)
    if (!exists) {
      const updated = [...bookmarks, bookmark]
      setBookmarks(updated)
      localStorage.setItem('bible_bookmarks', JSON.stringify(updated))
    }
  }

  const removeBookmark = (book: string, chapter: number, verse: number) => {
    const updated = bookmarks.filter(b => !(b.book === book && b.chapter === chapter && b.verse === verse))
    setBookmarks(updated)
    localStorage.setItem('bible_bookmarks', JSON.stringify(updated))
  }

  const isBookmarked = (book: string, chapter: number, verse: number) => {
    return bookmarks.some(b => b.book === book && b.chapter === chapter && b.verse === verse)
  }

  return { bookmarks, addBookmark, removeBookmark, isBookmarked }
}

/**
 * Verse highlighting, the way a reader marks a paper Bible.
 *
 * Colours are stored as an id, not as a CSS value, so a highlight made today
 * still resolves correctly if the palette is ever retuned — and so the same
 * mark can be rendered differently in light and dark mode. Highlighting is
 * separate from bookmarking on purpose: a bookmark is "come back to this", a
 * highlight is "this matters", and readers use both on different verses.
 */
export const HIGHLIGHT_COLORS = [
  // Each swatch carries its own ink. The verse text is --foreground, which is
  // near-white in dark mode — on a pale marker that is unreadable, and the
  // marker is exactly where the reader is looking. Pinning the ink to the
  // swatch means legibility never depends on getting the theme lookup right.
  { id: 'yellow', label: 'पहेँलो', light: '#fef08a', lightInk: '#3f2d00', dark: '#78621a', darkInk: '#fdf6df' },
  { id: 'green', label: 'हरियो', light: '#bbf7d0', lightInk: '#093a22', dark: '#1c5136', darkInk: '#e6fbee' },
  { id: 'blue', label: 'निलो', light: '#bfdbfe', lightInk: '#0b2d55', dark: '#1e416e', darkInk: '#e8f2ff' },
  { id: 'pink', label: 'गुलाबी', light: '#fbcfe8', lightInk: '#4d0f31', dark: '#6b2b4d', darkInk: '#fdeaf5' },
] as const

export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number]['id']

export interface Highlight {
  book: string
  chapter: number
  verse: number
  color: HighlightColor
  reference: string
}

export function useHighlights() {
  const [highlights, setHighlights] = useState<Highlight[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bible_highlights')
      if (saved) setHighlights(JSON.parse(saved))
    } catch {
      /* a corrupt entry must not take the reader down with it */
    }
  }, [])

  const persist = useCallback((next: Highlight[]) => {
    setHighlights(next)
    try {
      localStorage.setItem('bible_highlights', JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }, [])

  const same = (h: Highlight, book: string, chapter: number, verse: number) =>
    h.book === book && h.chapter === chapter && h.verse === verse

  /** Re-picking the colour already on a verse clears it, so one control toggles. */
  const setHighlight = useCallback(
    (h: Highlight) => {
      const existing = highlights.find((x) => same(x, h.book, h.chapter, h.verse))
      if (existing && existing.color === h.color) {
        persist(highlights.filter((x) => !same(x, h.book, h.chapter, h.verse)))
        return
      }
      persist([...highlights.filter((x) => !same(x, h.book, h.chapter, h.verse)), h])
    },
    [highlights, persist]
  )

  const removeHighlight = useCallback(
    (book: string, chapter: number, verse: number) =>
      persist(highlights.filter((x) => !same(x, book, chapter, verse))),
    [highlights, persist]
  )

  const getHighlight = useCallback(
    (book: string, chapter: number, verse: number): HighlightColor | null =>
      highlights.find((x) => same(x, book, chapter, verse))?.color ?? null,
    [highlights]
  )

  return { highlights, setHighlight, removeHighlight, getHighlight }
}

// Reading History
export function useReadingHistory() {
  const [history, setHistory] = useState<{book: string, chapter: number, timestamp: number}[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('bible_history')
    if (saved) setHistory(JSON.parse(saved))
  }, [])

  const addToHistory = useCallback((book: string, chapter: number) => {
    setHistory((prev) => {
      const updated = [
        { book, chapter, timestamp: Date.now() },
        ...prev.filter((h) => !(h.book === book && h.chapter === chapter)),
      ].slice(0, 50)
      try {
        localStorage.setItem('bible_history', JSON.stringify(updated))
      } catch {
        /* ignore */
      }
      return updated
    })
  }, [])

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('bible_history')
  }

  return { history, addToHistory, clearHistory }
}

// Reading Progress
export function useReadingProgress() {
  const [progress, setProgress] = useState<Record<string, number>>({})

  useEffect(() => {
    const saved = localStorage.getItem('bible_progress')
    if (saved) setProgress(JSON.parse(saved))
  }, [])

  const updateProgress = useCallback((book: string, chapter: number, totalChapters: number) => {
    const percent = Math.round((chapter / totalChapters) * 100)
    setProgress((prev) => {
      // Keep the highest progress reached for each book
      const nextPct = Math.max(prev[book] || 0, percent)
      const updated = { ...prev, [book]: nextPct }
      try {
        localStorage.setItem('bible_progress', JSON.stringify(updated))
      } catch {
        /* ignore */
      }
      return updated
    })
  }, [])

  const getProgress = useCallback((book: string) => progress[book] || 0, [progress])

  return { progress, updateProgress, getProgress }
}
