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
