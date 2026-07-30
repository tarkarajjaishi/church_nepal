'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  LifeBuoy, Send, CheckCircle2, Clock, MessageSquare, Star, AlertCircle, Camera,
} from 'lucide-react'
import { API_ORIGIN } from '@/lib/apiBase'

/**
 * Follow your own ticket, without an account.
 *
 * Everything shown here comes from the public endpoint, which returns a strict
 * subset — internal notes, the assignee's details and the system timeline stay
 * on the admin side. Nothing on this page filters anything out itself, because
 * a client-side filter is a leak waiting for someone to open the network tab.
 */

type Reply = { author_name: string; body: string; created_at: string }
type Ticket = {
  ticket_code: string
  subject: string
  body: string
  status: string
  status_label: string
  category_name: string | null
  location: string
  opened_at: string
  resolved_at: string | null
  resolution: string
  replies: Reply[]
  attachments: { url: string; filename: string }[]
  can_rate: boolean
  satisfaction: number | null
}

const TONE: Record<string, string> = {
  open: 'bg-church-blue-surface text-church-blue-ink',
  in_progress: 'bg-amber-100 text-amber-800',
  waiting: 'bg-muted text-muted-foreground',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
}

export default function TrackPage() {
  const { token } = useParams<{ token: string }>()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [rated, setRated] = useState(false)
  const [note, setNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_ORIGIN}/api/support/${token}`)
      if (!res.ok) { setNotFound(true); return }
      setTicket(await res.json())
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await fetch(`${API_ORIGIN}/api/support/${token}/reply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: reply.trim() }),
      })
      setReply('')
      await load()
    } finally {
      setBusy(false)
    }
  }

  const addPhoto = async (file: File) => {
    setUploading(true)
    setUploadError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API_ORIGIN}/api/support/${token}/attach`, {
        method: 'POST',
        body: form,
      })
      const data = await res.json().catch(() => ({}))
      // The server checks the actual bytes, not the file extension, so this is
      // where a renamed non-image is caught. Say why rather than just failing.
      if (!res.ok) throw new Error(data?.error ?? 'That photo could not be added')
      await load()
    } catch (err) {
      setUploadError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const rate = async (score: number) => {
    setBusy(true)
    try {
      await fetch(`${API_ORIGIN}/api/support/${token}/rate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ score, note: note.trim() }),
      })
      setRated(true)
      await load()
    } finally {
      setBusy(false)
    }
  }

  const card = 'rounded-2xl border border-border bg-card'
  const field =
    'w-full min-h-11 px-3 rounded-xl border border-border bg-background text-foreground ' +
    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16" aria-busy="true">
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      </main>
    )
  }

  if (notFound || !ticket) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className={`${card} p-8`}>
          <AlertCircle className="size-10 text-muted-foreground mx-auto mb-3" aria-hidden />
          <h1 className="text-xl font-semibold">We could not find that</h1>
          <p className="text-muted-foreground mt-2">
            The link may be incomplete. Check the message we sent you, or report it again.
          </p>
          <Link
            href="/support"
            className="inline-flex items-center gap-1.5 min-h-11 px-5 mt-5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90"
          >
            <LifeBuoy className="size-4" aria-hidden /> Report a problem
          </Link>
        </div>
      </main>
    )
  }

  const fixed = ticket.status === 'resolved' || ticket.status === 'closed'

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/support" className="text-sm text-muted-foreground hover:text-foreground">
        ← Report something else
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mt-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {ticket.ticket_code} · reported {ticket.opened_at.slice(0, 10)}
            {ticket.location && ` · ${ticket.location}`}
            {ticket.category_name && ` · ${ticket.category_name}`}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${TONE[ticket.status] ?? TONE.open}`}>
          {fixed ? <CheckCircle2 className="size-4" aria-hidden /> : <Clock className="size-4" aria-hidden />}
          {ticket.status_label}
        </span>
      </div>

      {ticket.body && (
        <section className={`${card} p-5 mb-4`}>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">What you told us</h2>
          <p className="whitespace-pre-wrap">{ticket.body}</p>
        </section>
      )}

      {ticket.resolution && (
        <section className="rounded-2xl border border-green-200 bg-green-50 p-5 mb-4">
          <h2 className="text-sm font-medium text-green-900 mb-2 flex items-center gap-2">
            <CheckCircle2 className="size-4" aria-hidden /> What was done
          </h2>
          <p className="whitespace-pre-wrap text-green-900">{ticket.resolution}</p>
        </section>
      )}

      <section className={`${card} p-5 mb-4`}>
        <h2 className="font-medium mb-1 flex items-center gap-2">
          <Camera className="size-4 text-muted-foreground" aria-hidden /> Photos
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          A picture of the problem usually saves someone a trip to come and look.
        </p>

        {ticket.attachments.length > 0 && (
          <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
            {ticket.attachments.map((a) => (
              <li key={a.url}>
                <a href={`${API_ORIGIN}${a.url}`} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${API_ORIGIN}${a.url}`}
                    alt="A photo you sent with this report"
                    className="aspect-square w-full rounded-xl object-cover border border-border"
                    loading="lazy"
                  />
                </a>
              </li>
            ))}
          </ul>
        )}

        <input
          type="file"
          id="photo"
          accept="image/jpeg,image/png,image/gif,image/webp"
          capture="environment"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) addPhoto(f); e.target.value = '' }}
        />
        <label
          htmlFor="photo"
          className="inline-flex items-center gap-1.5 min-h-11 px-4 rounded-xl border border-border bg-card font-medium hover:bg-muted cursor-pointer"
        >
          <Camera className="size-4" aria-hidden />
          {uploading ? 'Adding…' : ticket.attachments.length ? 'Add another photo' : 'Add a photo'}
        </label>
        {uploadError && <p role="alert" className="text-sm text-destructive mt-2">{uploadError}</p>}
      </section>

      <section className={`${card} p-5 mb-4`}>
        <h2 className="font-medium mb-3 flex items-center gap-2">
          <MessageSquare className="size-4 text-muted-foreground" aria-hidden /> Messages
        </h2>
        {!ticket.replies.length ? (
          <p className="text-sm text-muted-foreground">
            Nothing yet. We will write here when there is news.
          </p>
        ) : (
          <ul className="space-y-3">
            {ticket.replies.map((r, i) => (
              <li key={i} className="rounded-xl bg-muted p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs font-medium">{r.author_name || 'Grace Nepal Church'}</p>
                  <p className="text-xs text-muted-foreground">{r.created_at.slice(0, 16).replace('T', ' ')}</p>
                </div>
                <p className="text-sm whitespace-pre-wrap">{r.body}</p>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={send} className="mt-4 pt-4 border-t border-border space-y-3">
          <label htmlFor="reply" className="block text-sm font-medium">Add something</label>
          <textarea
            id="reply"
            rows={3}
            className={`${field} py-2`}
            placeholder={fixed ? 'If it is not right, tell us here and we will look again.' : 'Anything else we should know?'}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          {fixed && (
            <p className="text-xs text-muted-foreground">
              Writing here reopens the report, so nothing gets forgotten.
            </p>
          )}
          <button
            type="submit"
            disabled={!reply.trim() || busy}
            className="inline-flex items-center gap-1.5 min-h-11 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Send className="size-4" aria-hidden /> Send
          </button>
        </form>
      </section>

      {/* Asked once, and only after it is fixed. Rating work that has not
          happened yet measures nothing. */}
      {ticket.can_rate && !rated && (
        <section className={`${card} p-5`}>
          <h2 className="font-medium mb-1">Did that sort it?</h2>
          <p className="text-sm text-muted-foreground mb-3">
            It helps us know whether we are actually helping.
          </p>
          <div className="flex gap-1.5 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => rate(n)}
                disabled={busy}
                aria-label={`${n} out of 5`}
                className="inline-flex items-center justify-center size-11 rounded-xl border border-border hover:bg-muted transition-colors"
              >
                <Star className="size-5 text-amber-500" aria-hidden />
              </button>
            ))}
          </div>
          <input
            className={field}
            placeholder="Anything you would like to add (optional)"
            aria-label="A note with your rating"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </section>
      )}

      {ticket.satisfaction !== null && (
        <p className="text-sm text-muted-foreground text-center mt-4">
          Thank you for rating this {ticket.satisfaction} out of 5.
        </p>
      )}
    </main>
  )
}
