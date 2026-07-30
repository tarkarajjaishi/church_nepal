'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CornerDownLeft } from 'lucide-react'
import type { NavGroup, NavLink } from './nav'

/**
 * Jump anywhere by typing.
 *
 * With sixty pages behind six groups, the fastest route to any of them is not
 * a better tree — it is not using the tree. Opened with ⌘K, / or the button in
 * the sidebar.
 */

type Hit = NavLink & { group: string; score: number }

/** Rank by where the match lands: a label that starts with what you typed is
 *  almost always the one you meant. */
function rank(q: string, groups: NavGroup[]): Hit[] {
  const needle = q.trim().toLowerCase()
  if (!needle) {
    return groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label, score: 0 })))
  }
  const hits: Hit[] = []
  for (const g of groups) {
    for (const i of g.items) {
      const label = i.label.toLowerCase()
      const where = label.indexOf(needle)
      let score = -1
      if (where === 0) score = 100
      else if (where > 0) score = 60
      else if (label.replace(/[^a-z]/g, '').includes(needle)) score = 40
      else if (i.keywords?.includes(needle)) score = 30
      else if (g.label.toLowerCase().includes(needle)) score = 10
      if (score >= 0) hits.push({ ...i, group: g.label, score })
    }
  }
  return hits.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
}

export function CommandPalette({
  groups,
  open,
  onClose,
}: {
  groups: NavGroup[]
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const hits = useMemo(() => rank(q, groups).slice(0, 40), [q, groups])

  // A new search always starts from the top result, otherwise Enter fires
  // whatever happened to be selected against the previous query.
  useEffect(() => setCursor(0), [q])
  useEffect(() => { if (open) { setQ(''); setCursor(0) } }, [open])

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [cursor, hits])

  if (!open) return null

  const go = (to: string) => { onClose(); router.push(to) }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, hits.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (hits[cursor]) go(hits[cursor].to) }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh] bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Search the admin"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="size-4 text-muted-foreground shrink-0" aria-hidden />
          <input
            autoFocus
            className="flex-1 h-14 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            placeholder="Go to… (try “tickets”, “rota”, “tithes”)"
            aria-label="Search the admin"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
          />
          <kbd className="hidden sm:block text-[11px] text-muted-foreground border border-border rounded px-1.5 py-0.5">esc</kbd>
        </div>

        {!hits.length ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nothing matches “{q}”.
          </p>
        ) : (
          <ul ref={listRef} className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
            {hits.map((h, i) => (
              <li key={h.to}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === cursor}
                  data-active={i === cursor}
                  onMouseMove={() => setCursor(i)}
                  onClick={() => go(h.to)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    i === cursor ? 'bg-muted' : ''
                  }`}
                >
                  <h.icon className="size-4 text-muted-foreground shrink-0" aria-hidden />
                  <span className="truncate">{h.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground shrink-0">{h.group}</span>
                  {i === cursor && (
                    <CornerDownLeft className="size-3.5 text-muted-foreground shrink-0" aria-hidden />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/** ⌘K / Ctrl-K anywhere, and `/` when you are not already typing. */
export function useCommandKey(onOpen: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing = !!el && (
        el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' ||
        el.isContentEditable
      )
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onOpen() }
      else if (e.key === '/' && !typing) { e.preventDefault(); onOpen() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onOpen])
}
