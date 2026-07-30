'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Paperclip, Upload, Trash2, Eye, EyeOff, UserPlus, X, GitMerge, Star,
} from 'lucide-react'
import api from '@/lib/api'
import { API_ORIGIN } from '@/lib/apiBase'
import { helpdeskApi, type Attachment, type Watcher, type TicketBrief } from '@/lib/helpdesk/api'
import { CARD, btn, field } from '@/components/offerings/ui'

/**
 * The panels beside a ticket: photos, watchers, duplicates and the merge
 * control. Split out of the page because the page was already long, not
 * because anything else will ever use them.
 */

const invalidate = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: ['helpdesk'] })

// ---------------------------------------------------------------------------

export function Attachments({ id, items }: { id: string; items: Attachment[] }) {
  const qc = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const add = async (file: File) => {
    setBusy(true)
    try {
      // Two steps because the upload route is shared with the rest of the
      // admin: store the file, then link it to this ticket.
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post<{ url: string; originalName: string }>('/upload', form)
      await helpdeskApi.attach(id, { url: data.url, filename: file.name })
      invalidate(qc)
      toast.success('Photo added')
    } catch (e) {
      toast.error((e as Error).message || 'Could not add that photo')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  const remove = useMutation({
    mutationFn: (attachmentId: string) => helpdeskApi.detach(attachmentId),
    onSuccess: () => { invalidate(qc); toast.success('Removed') },
    onError: (e: Error) => toast.error(e.message || 'Could not remove that'),
  })

  return (
    <section className={`${CARD} p-4 sm:p-5`}>
      <h2 className="font-semibold mb-3 flex items-center gap-2">
        <Paperclip className="size-4 text-muted-foreground" aria-hidden />
        Photos {items.length > 0 && <span className="text-muted-foreground font-normal">({items.length})</span>}
      </h2>

      {items.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 mb-3">
          {items.map((a) => (
            <li key={a.id} className="relative group">
              {/* The files are served by the API, not by Next — a bare
                  `/uploads/...` here resolves against the wrong origin and
                  renders as a broken image. */}
              <a href={`${API_ORIGIN}${a.url}`} target="_blank" rel="noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${API_ORIGIN}${a.url}`}
                  alt={`Attached by ${a.uploadedBy || 'the reporter'}`}
                  className="aspect-square w-full rounded-lg object-cover border border-border"
                  loading="lazy"
                />
              </a>
              <button
                type="button"
                onClick={() => remove.mutate(a.id)}
                aria-label={`Remove ${a.filename}`}
                className="absolute top-1 right-1 rounded-lg bg-background/90 border border-border p-1.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
              >
                <Trash2 className="size-3.5 text-destructive" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        id={`attach-${id}`}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) add(f) }}
      />
      <label htmlFor={`attach-${id}`} className={`${btn.secondary} w-full cursor-pointer`}>
        <Upload className="size-4" aria-hidden />
        {busy ? 'Uploading…' : items.length ? 'Add another' : 'Add a photo'}
      </label>
      {!items.length && (
        <p className="text-xs text-muted-foreground mt-2">
          A photo of the fault usually saves a trip to go and look at it.
        </p>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------

export function Watchers({ id, items }: { id: string; items: Watcher[] }) {
  const qc = useQueryClient()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)

  const add = useMutation({
    mutationFn: () => helpdeskApi.watch(id, { email: email.trim(), name: name.trim() || undefined }),
    onSuccess: (r: { added: boolean }) => {
      invalidate(qc)
      toast.success(r.added ? 'They will be kept in the loop' : 'They were already following this')
      setEmail(''); setName(''); setOpen(false)
    },
    onError: (e: Error) => toast.error(e.message || 'Could not add them'),
  })

  const drop = useMutation({
    mutationFn: (e: string) => helpdeskApi.unwatch(id, e),
    onSuccess: () => invalidate(qc),
    onError: (e: Error) => toast.error(e.message || 'Could not remove them'),
  })

  return (
    <section className={`${CARD} p-4 sm:p-5`}>
      <h2 className="font-semibold mb-1 flex items-center gap-2">
        <Eye className="size-4 text-muted-foreground" aria-hidden /> Also being told
      </h2>
      <p className="text-xs text-muted-foreground mb-3">
        Anyone here gets the same updates as the person who reported it.
      </p>

      {items.length > 0 ? (
        <ul className="space-y-1.5 mb-3">
          {items.map((w) => (
            <li key={w.email} className="flex items-center gap-2 text-sm">
              <span className="truncate">{w.name || w.email}</span>
              <button
                type="button"
                onClick={() => drop.mutate(w.email)}
                aria-label={`Stop telling ${w.name || w.email}`}
                className="ml-auto shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1.5">
          <EyeOff className="size-3.5" aria-hidden /> Only the reporter.
        </p>
      )}

      {open ? (
        <form
          onSubmit={(e) => { e.preventDefault(); if (email.trim()) add.mutate() }}
          className="space-y-2"
        >
          <input
            className={field}
            type="email"
            required
            autoFocus
            placeholder="their@email.address"
            aria-label="Their email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={field}
            placeholder="Their name (optional)"
            aria-label="Their name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className={btn.secondary}>Cancel</button>
            <button type="submit" disabled={!email.trim() || add.isPending} className={`${btn.primary} flex-1`}>
              Add
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className={`${btn.secondary} w-full`}>
          <UserPlus className="size-4" aria-hidden /> Tell someone else
        </button>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------

export function Duplicates({
  id,
  ticketCode,
  duplicates,
}: {
  id: string
  ticketCode: string
  duplicates: TicketBrief[]
}) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Only open tickets are offered: merging into something already closed
  // would put the survivors' reports somewhere nobody is looking.
  const { data } = useQuery({
    queryKey: ['helpdesk', 'merge-search', search],
    queryFn: () => helpdeskApi.tickets({ search, status: 'open', per_page: 8 }),
    enabled: open && search.trim().length >= 2,
  })

  const merge = useMutation({
    mutationFn: (into: string) => helpdeskApi.merge(id, into),
    onSuccess: (r: { target: string }) => {
      invalidate(qc)
      toast.success(`Folded into ${r.target}`)
      setOpen(false); setSearch('')
    },
    onError: (e: Error) => toast.error(e.message || 'Could not merge these'),
  })

  return (
    <section className={`${CARD} p-4 sm:p-5`}>
      <h2 className="font-semibold mb-1 flex items-center gap-2">
        <GitMerge className="size-4 text-muted-foreground" aria-hidden /> Duplicates
      </h2>

      {duplicates.length > 0 ? (
        <>
          <p className="text-xs text-muted-foreground mb-3">
            {duplicates.length + 1} people reported this — worth doing sooner.
          </p>
          <ul className="space-y-2 mb-3">
            {duplicates.map((d) => (
              <li key={d.id}>
                <Link href={`/admin/helpdesk/tickets/${d.id}`} className="text-sm hover:text-primary transition-colors block truncate">
                  <span className="font-mono text-xs text-muted-foreground mr-2">{d.ticketCode}</span>
                  {d.subject}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-xs text-muted-foreground mb-3">
          If someone else reported the same fault, fold this into theirs — both
          reporters still hear when it is fixed.
        </p>
      )}

      {open ? (
        <div className="space-y-2">
          <input
            className={field}
            autoFocus
            placeholder="Find the original…"
            aria-label="Search for the ticket this duplicates"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul className="space-y-1 max-h-52 overflow-y-auto">
            {(data?.data ?? []).filter((t) => t.id !== id).map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => merge.mutate(t.id)}
                  disabled={merge.isPending}
                  className="w-full text-left rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                >
                  <span className="font-mono text-xs text-muted-foreground mr-2">{t.ticketCode}</span>
                  {t.subject}
                </button>
              </li>
            ))}
            {search.trim().length >= 2 && !data?.data?.length && (
              <li className="text-sm text-muted-foreground px-2 py-1.5">Nothing matching.</li>
            )}
          </ul>
          <button type="button" onClick={() => { setOpen(false); setSearch('') }} className={`${btn.secondary} w-full`}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className={`${btn.secondary} w-full`}>
          <GitMerge className="size-4" aria-hidden /> Mark {ticketCode} a duplicate
        </button>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------

/** What the reporter said about the fix, once they have said it. */
export function Satisfaction({ score, note }: { score: number; note: string }) {
  return (
    <section className={`${CARD} p-4 sm:p-5`}>
      <h2 className="font-semibold mb-2">The reporter&apos;s verdict</h2>
      <div className="flex items-center gap-1 mb-2" aria-label={`${score} out of 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={n <= score ? 'size-4 fill-amber-400 text-amber-400' : 'size-4 text-border'}
            aria-hidden
          />
        ))}
        <span className="ml-1.5 text-sm text-muted-foreground">{score} of 5</span>
      </div>
      {note && <p className="text-sm whitespace-pre-wrap">{note}</p>}
    </section>
  )
}
