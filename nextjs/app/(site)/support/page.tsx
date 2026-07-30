'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LifeBuoy, Send, CheckCircle2, Copy, Search } from 'lucide-react'
import { API_ORIGIN } from '@/lib/apiBase'

/**
 * Report a fault, without an account.
 *
 * The person who notices the broken tap is almost never the person with an
 * admin login, so this is the whole point of having a help desk at all —
 * everything else in the module exists to answer what arrives here.
 */

type Category = { id: string; name: string; description: string }

export default function SupportPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [f, setF] = useState({
    subject: '', body: '', categoryId: '', name: '', contact: '', location: '',
  })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ code: string; token: string } | null>(null)
  const [lookup, setLookup] = useState('')

  useEffect(() => {
    fetch(`${API_ORIGIN}/api/support/categories`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setCategories)
      // A category list that fails to load must not stop someone reporting a
      // fault. The field simply becomes optional.
      .catch(() => setCategories([]))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch(`${API_ORIGIN}/api/support/report`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          subject: f.subject.trim(),
          body: f.body.trim(),
          category_id: f.categoryId || undefined,
          reporter_name: f.name.trim(),
          reporter_contact: f.contact.trim(),
          location: f.location.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Something went wrong')
      setDone({ code: data.ticket_code, token: data.token })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  const field =
    'w-full min-h-11 px-3 rounded-xl border border-border bg-background text-foreground ' +
    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'

  if (done) {
    const link = `/support/${done.token}`
    return (
      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-green-100">
            <CheckCircle2 className="size-7 text-green-700" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold">Thank you</h1>
          <p className="text-muted-foreground mt-2">
            We have logged this as <strong className="text-foreground">{done.code}</strong> and
            someone will look at it.
          </p>

          {/* The link is the only way back in. Said plainly, and shown before
              anything else, because a token nobody saved is a ticket the
              reporter can never follow. */}
          <div className="mt-6 rounded-xl bg-muted p-4 text-left">
            <p className="text-sm font-medium">Keep this link to follow it</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              It is the only way back to your report, and we have emailed it to you if you
              gave us an email address.
            </p>
            <div className="flex gap-2">
              <input readOnly className={`${field} text-xs`} value={link} aria-label="Your tracking link" />
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${link}`)}
                className="inline-flex items-center gap-1.5 min-h-11 px-3 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted"
              >
                <Copy className="size-4" aria-hidden /> Copy
              </button>
            </div>
          </div>

          <Link
            href={link}
            className="inline-flex items-center justify-center gap-1.5 min-h-11 px-5 mt-6 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90"
          >
            See how it is going
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-2">
        <LifeBuoy className="size-7 text-primary" aria-hidden />
        <h1 className="text-3xl font-semibold">Report a problem</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Something broken, missing or not working? Tell us here and it goes straight to the
        people who can fix it.
      </p>

      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-1.5">
            What is wrong? <span className="text-destructive">*</span>
          </label>
          <input
            id="subject"
            required
            maxLength={300}
            className={field}
            placeholder="The tap in the ladies toilet is dripping"
            value={f.subject}
            onChange={(e) => setF((s) => ({ ...s, subject: e.target.value }))}
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium mb-1.5">Anything else that would help</label>
          <textarea
            id="body"
            rows={4}
            className={`${field} py-2`}
            placeholder="When it started, whether it happens every time, anything you have already tried."
            value={f.body}
            onChange={(e) => setF((s) => ({ ...s, body: e.target.value }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {categories.length > 0 && (
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1.5">What sort of thing is it?</label>
              <select
                id="category"
                className={field}
                value={f.categoryId}
                onChange={(e) => setF((s) => ({ ...s, categoryId: e.target.value }))}
              >
                <option value="">Not sure</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-1.5">Where is it?</label>
            <input
              id="location"
              className={field}
              placeholder="Main hall, ground floor…"
              value={f.location}
              onChange={(e) => setF((s) => ({ ...s, location: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5">
              Your name <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              required
              className={field}
              value={f.name}
              onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="contact" className="block text-sm font-medium mb-1.5">
              Email or phone <span className="text-destructive">*</span>
            </label>
            <input
              id="contact"
              required
              className={field}
              placeholder="you@example.com"
              value={f.contact}
              onChange={(e) => setF((s) => ({ ...s, contact: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              So we can tell you when it is fixed.
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">{error}</p>
        )}

        <button
          type="submit"
          disabled={sending || !f.subject.trim() || !f.name.trim() || !f.contact.trim()}
          className="inline-flex items-center justify-center gap-1.5 min-h-11 px-5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Send className="size-4" aria-hidden />
          {sending ? 'Sending…' : 'Send it'}
        </button>
      </form>

      {/* Already reported something */}
      <div className="rounded-2xl border border-border bg-card p-5 mt-6">
        <h2 className="font-medium mb-1">Already reported something?</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Paste the link we gave you to see how it is going.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            // Accept the whole link or just the token — people paste both.
            const token = lookup.trim().split('/').filter(Boolean).pop() ?? ''
            if (token) window.location.href = `/support/${token}`
          }}
          className="flex gap-2"
        >
          <input
            className={field}
            aria-label="Your tracking link"
            placeholder="/support/…"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 min-h-11 px-4 rounded-xl border border-border bg-card font-medium hover:bg-muted"
          >
            <Search className="size-4" aria-hidden /> Find it
          </button>
        </form>
      </div>
    </main>
  )
}
