'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, MessageSquareQuote, ChevronDown } from 'lucide-react'
import { helpdeskApi } from '@/lib/helpdesk/api'
import { btn } from '@/components/offerings/ui'

/**
 * The two things that make answering fast: a phrase you have typed forty times
 * before, and the article that already answers the question.
 */

export function CannedReplies({ onPick }: { onPick: (body: string) => void }) {
  const [open, setOpen] = useState(false)
  const { data = [] } = useQuery({
    queryKey: ['helpdesk', 'replies'],
    queryFn: helpdeskApi.replies,
    // These change about once a year.
    staleTime: 10 * 60 * 1000,
  })

  if (!data.length) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={btn.secondary}
      >
        <MessageSquareQuote className="size-4" aria-hidden /> Standard reply
        <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <>
          {/* Click anywhere else to dismiss. */}
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <ul className="absolute z-20 bottom-full mb-2 w-80 max-h-72 overflow-y-auto rounded-xl border border-border bg-card shadow-lg p-1">
            {data.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(r.body)
                    // Fire and forget: only the ordering depends on it.
                    helpdeskApi.replyUsed(r.id).catch(() => {})
                    setOpen(false)
                  }}
                  className="w-full text-left rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                >
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{r.body}</p>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

/**
 * Articles that may already answer this, while you type.
 *
 * Debounced, because the alternative is a query per keystroke; and hidden
 * entirely when nothing scores well enough, because a suggestion box that
 * always suggests something is one people stop reading.
 */
export function ArticleHints({ text }: { text: string }) {
  const [q, setQ] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 400)
    return () => clearTimeout(t)
  }, [text])

  const { data = [] } = useQuery({
    queryKey: ['helpdesk', 'suggest', q],
    queryFn: () => helpdeskApi.suggest(q),
    enabled: q.length >= 4,
  })

  if (!data.length) return null

  return (
    <div className="rounded-xl border border-border bg-muted/50 p-3">
      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
        <BookOpen className="size-3.5" aria-hidden /> This may already be written up
      </p>
      <ul className="space-y-1">
        {data.map((a) => (
          <li key={a.id}>
            <a
              href={`/admin/helpdesk/knowledge#${a.slug}`}
              className="text-sm hover:text-primary transition-colors"
            >
              {a.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
