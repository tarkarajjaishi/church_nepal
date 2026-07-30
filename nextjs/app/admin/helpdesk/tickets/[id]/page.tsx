'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ChevronLeft, Send, UserPlus, UserMinus, CheckCircle2, AlertTriangle,
  Lock, Settings2, MapPin, Package, Clock,
} from 'lucide-react'
import {
  helpdeskApi, duration, breachReason, PRIORITY_TONE, STATUS_TONE, STATUS_LABEL,
  type Status,
} from '@/lib/helpdesk/api'
import { CARD, PageHeader, ErrorState, Chip, btn, field, Label } from '@/components/offerings/ui'

const NEXT_STATUS: { key: Status; label: string }[] = [
  { key: 'in_progress', label: 'Working on it' },
  { key: 'waiting', label: 'Waiting on someone' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Close' },
  { key: 'cancelled', label: 'Cancel' },
  { key: 'open', label: 'Reopen' },
]

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [reply, setReply] = useState('')
  const [internal, setInternal] = useState(false)
  const [author, setAuthor] = useState('')
  const [claimer, setClaimer] = useState('')
  const [resolving, setResolving] = useState(false)
  const [resolution, setResolution] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['helpdesk', 'ticket', id],
    queryFn: () => helpdeskApi.ticket(id),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['helpdesk'] })

  const comment = useMutation({
    mutationFn: () =>
      helpdeskApi.comment(id, {
        body: reply.trim(),
        author_name: author.trim() || undefined,
        is_internal: internal,
      }),
    onSuccess: (r: { countedAsFirstResponse: boolean }) => {
      invalidate()
      // Worth saying out loud: this is the reply the SLA is measured against,
      // and it can never be moved afterwards.
      toast.success(r.countedAsFirstResponse ? 'Sent — this is the first reply on record' : 'Sent')
      setReply('')
    },
    onError: (e: Error) => toast.error(e.message || 'Could not post this'),
  })

  const claim = useMutation({
    mutationFn: (force: boolean) =>
      helpdeskApi.claim(id, { assignee_name: claimer.trim(), force }),
    onSuccess: (r: { assignedTo: string }) => {
      invalidate()
      toast.success(`Assigned to ${r.assignedTo}`)
      setClaimer('')
    },
    // A 409 here means a colleague got there first — a normal outcome, and
    // the message names them.
    onError: (e: Error) => toast.error(e.message || 'Could not assign this ticket'),
  })

  const release = useMutation({
    mutationFn: () => helpdeskApi.release(id),
    onSuccess: () => { invalidate(); toast.success('Back in the queue') },
    onError: (e: Error) => toast.error(e.message || 'Could not release this ticket'),
  })

  const setStatus = useMutation({
    mutationFn: (v: { status: Status; resolution?: string }) =>
      helpdeskApi.setStatus(id, { status: v.status, resolution: v.resolution }),
    onSuccess: (r: { status: string; reopened: boolean }) => {
      invalidate()
      toast.success(r.reopened ? 'Reopened' : `Marked ${STATUS_LABEL[r.status as Status]}`)
      setResolving(false)
      setResolution('')
    },
    onError: (e: Error) => toast.error(e.message || 'Could not change the status'),
  })

  if (error) {
    return (
      <div className={CARD}>
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      </div>
    )
  }
  if (isLoading || !data) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-8 w-64 rounded bg-muted animate-pulse" />
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      </div>
    )
  }

  const { ticket: t, comments, related } = data
  const reason = breachReason(t)
  const live = !['resolved', 'closed', 'cancelled'].includes(t.status)

  return (
    <>
      <Link href="/admin/helpdesk/tickets" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
        <ChevronLeft className="size-3.5" aria-hidden /> Back to tickets
      </Link>

      <PageHeader
        title={t.subject}
        subtitle={`${t.ticketCode} · raised by ${t.reporterName}${t.reporterContact ? ` (${t.reporterContact})` : ''}`}
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Chip className={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Chip>
        <Chip className={PRIORITY_TONE[t.priority]}>{t.priority}</Chip>
        {t.categoryName && (
          <Chip className="bg-muted text-foreground border-border" dot={t.categoryColor}>{t.categoryName}</Chip>
        )}
        {t.location && (
          <Chip className="bg-muted text-foreground border-border">
            <MapPin className="size-3" aria-hidden />{t.location}
          </Chip>
        )}
        {t.assetName && (
          <Chip className="bg-muted text-foreground border-border">
            <Package className="size-3" aria-hidden />{t.assetName}
          </Chip>
        )}
        <Chip className="bg-muted text-muted-foreground border-border">
          <Clock className="size-3" aria-hidden />{duration(t.ageHours)} old
        </Chip>
        {t.reopenCount > 0 && (
          <Chip className="bg-amber-100 text-amber-800 border-amber-200">Reopened {t.reopenCount}×</Chip>
        )}
      </div>

      {reason && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 mb-4 flex items-start gap-3">
          <AlertTriangle className="size-5 shrink-0 text-red-700 mt-0.5" aria-hidden />
          <div className="text-sm text-red-900">
            <p className="font-medium">Past its service target</p>
            <p className="mt-0.5">{reason}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {t.body && (
            <section className={`${CARD} p-4 sm:p-5`}>
              <h2 className="font-semibold mb-2">What was reported</h2>
              <p className="text-sm whitespace-pre-wrap">{t.body}</p>
            </section>
          )}

          {/* Timeline */}
          <section className={`${CARD} p-4 sm:p-5`}>
            <h2 className="font-semibold mb-4">Timeline</h2>
            {!comments.length ? (
              <p className="text-sm text-muted-foreground">Nothing has been said yet.</p>
            ) : (
              <ul className="space-y-3">
                {comments.map((c) => (
                  <li
                    key={c.id}
                    className={
                      c.eventKind
                        ? 'text-xs text-muted-foreground flex items-center gap-2'
                        : `rounded-xl p-3 ${c.isInternal ? 'bg-amber-50 border border-amber-200' : 'bg-muted'}`
                    }
                  >
                    {c.eventKind ? (
                      <>
                        <span className="size-1.5 rounded-full bg-border shrink-0" aria-hidden />
                        <span>{c.body}</span>
                        <span className="ml-auto tabular-nums">{c.createdAt.slice(0, 16).replace('T', ' ')}</span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-xs font-medium">
                            {c.authorName || 'Someone'}
                            {c.isInternal && (
                              <span className="ml-2 inline-flex items-center gap-1 text-amber-800">
                                <Lock className="size-3" aria-hidden /> internal note
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {c.createdAt.slice(0, 16).replace('T', ' ')}
                          </p>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Reply */}
            <form
              onSubmit={(e) => { e.preventDefault(); if (reply.trim()) comment.mutate() }}
              className="mt-4 pt-4 border-t border-border space-y-3"
            >
              <div>
                <Label htmlFor="c-body">Reply</Label>
                <textarea
                  id="c-body"
                  rows={3}
                  className={`${field} py-2`}
                  placeholder={internal ? 'Only the team will see this' : 'The reporter will see this'}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  className={`${field} max-w-[14rem]`}
                  placeholder="Your name"
                  aria-label="Your name"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4 rounded border-border" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                  Internal note
                </label>
                {!t.firstRespondedAt && !internal && (
                  <p className="text-xs text-muted-foreground">This will be recorded as the first reply.</p>
                )}
                <button type="submit" disabled={!reply.trim() || comment.isPending} className={`${btn.primary} ml-auto`}>
                  <Send className="size-4" aria-hidden />
                  {comment.isPending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          </section>

          {t.resolution && (
            <section className={`${CARD} p-4 sm:p-5`}>
              <h2 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-700" aria-hidden /> How it was fixed
              </h2>
              <p className="text-sm whitespace-pre-wrap">{t.resolution}</p>
            </section>
          )}
        </div>

        <div className="space-y-4">
          {/* Ownership */}
          <section className={`${CARD} p-4 sm:p-5`}>
            <h2 className="font-semibold mb-3">Owner</h2>
            {t.assigneeName ? (
              <>
                <p className="text-sm font-medium">{t.assigneeName}</p>
                {t.assigneeContact && <p className="text-xs text-muted-foreground">{t.assigneeContact}</p>}
                <button type="button" onClick={() => release.mutate()} disabled={release.isPending} className={`${btn.secondary} mt-3 w-full`}>
                  <UserMinus className="size-4" aria-hidden /> Return to the queue
                </button>
              </>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if (claimer.trim()) claim.mutate(false) }} className="space-y-2">
                <p className="text-sm text-muted-foreground">Nobody has picked this up.</p>
                <input className={field} placeholder="Your name" aria-label="Who is taking it" value={claimer} onChange={(e) => setClaimer(e.target.value)} />
                <button type="submit" disabled={!claimer.trim() || claim.isPending} className={`${btn.primary} w-full`}>
                  <UserPlus className="size-4" aria-hidden />
                  {claim.isPending ? 'Claiming…' : 'Assign to me'}
                </button>
              </form>
            )}
          </section>

          {/* Status */}
          <section className={`${CARD} p-4 sm:p-5`}>
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Settings2 className="size-4 text-muted-foreground" aria-hidden /> Move it along
            </h2>
            <div className="flex flex-wrap gap-2">
              {NEXT_STATUS.filter((s) => s.key !== t.status)
                .filter((s) => (s.key === 'open' ? !live : true))
                .map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => (s.key === 'resolved' ? setResolving(true) : setStatus.mutate({ status: s.key }))}
                    disabled={setStatus.isPending}
                    className={btn.secondary}
                  >
                    {s.label}
                  </button>
                ))}
            </div>

            {resolving && (
              <form
                onSubmit={(e) => { e.preventDefault(); if (resolution.trim()) setStatus.mutate({ status: 'resolved', resolution: resolution.trim() }) }}
                className="mt-3 pt-3 border-t border-border space-y-2"
              >
                <Label htmlFor="res" required hint="Required — the next person needs to know">What fixed it</Label>
                <textarea id="res" rows={3} className={`${field} py-2`} value={resolution} onChange={(e) => setResolution(e.target.value)} />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setResolving(false)} className={btn.secondary}>Cancel</button>
                  <button type="submit" disabled={!resolution.trim() || setStatus.isPending} className={btn.primary}>
                    <CheckCircle2 className="size-4" aria-hidden /> Mark resolved
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Service targets */}
          <section className={`${CARD} p-4 sm:p-5`}>
            <h2 className="font-semibold mb-3">Service targets</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Reply within</dt>
                <dd className="tabular-nums">{t.responseTargetHours}h</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">First reply</dt>
                <dd className={t.responseBreached ? 'text-red-700 font-medium' : ''}>
                  {t.responseHoursTaken === null ? 'not yet' : duration(t.responseHoursTaken)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Fix within</dt>
                <dd className="tabular-nums">{t.resolveTargetHours}h</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t.resolvedAt ? 'Fixed in' : 'Open for'}</dt>
                <dd className={t.resolveBreached ? 'text-red-700 font-medium' : ''}>{duration(t.ageHours)}</dd>
              </div>
            </dl>
          </section>

          {related.length > 0 && (
            <section className={`${CARD} p-4 sm:p-5`}>
              <h2 className="font-semibold mb-1">Same equipment</h2>
              <p className="text-xs text-muted-foreground mb-3">
                {related.length + 1} tickets against this item — worth asking whether it needs replacing.
              </p>
              <ul className="space-y-2">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link href={`/admin/helpdesk/tickets/${r.id}`} className="text-sm hover:text-primary transition-colors block truncate">
                      <span className="font-mono text-xs text-muted-foreground mr-2">{r.ticketCode}</span>
                      {r.subject}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
