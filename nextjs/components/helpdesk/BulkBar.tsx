'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Check } from 'lucide-react'
import { helpdeskApi, type HelpdeskCategory } from '@/lib/helpdesk/api'
import { btn, field } from '@/components/offerings/ui'

const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const

/**
 * One change across a selection.
 *
 * Appears only when something is selected, and reports what actually changed
 * rather than what was asked for — "closed 1 of 3" is the useful sentence,
 * because closing skips anything not yet resolved.
 */
export function BulkBar({
  ids,
  categories,
  onDone,
}: {
  ids: string[]
  categories?: HelpdeskCategory[]
  onDone: () => void
}) {
  const qc = useQueryClient()
  const [assignee, setAssignee] = useState('')

  const run = useMutation({
    mutationFn: (body: { action: string; value?: string; category_id?: string }) =>
      helpdeskApi.bulk({ ids, ...body }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['helpdesk'] })
      if (r.changed === 0) {
        toast.error('Nothing changed — none of those were ready for that')
      } else if (r.skipped > 0) {
        toast.success(`Changed ${r.changed} of ${r.requested} — ${r.skipped} were skipped`)
      } else {
        toast.success(`Changed ${r.changed}`)
      }
      setAssignee('')
      onDone()
    },
    onError: (e: Error) => toast.error(e.message || 'Could not apply that'),
  })

  if (!ids.length) return null

  return (
    <div className="sticky bottom-4 z-20 rounded-2xl border border-border bg-card shadow-lg p-3 mb-4 flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium px-1">
        {ids.length} selected
      </span>

      <select
        className={`${field} max-w-[10rem]`}
        aria-label="Set priority"
        defaultValue=""
        onChange={(e) => { if (e.target.value) run.mutate({ action: 'priority', value: e.target.value }) }}
      >
        <option value="">Priority…</option>
        {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
      </select>

      {!!categories?.length && (
        <select
          className={`${field} max-w-[12rem]`}
          aria-label="Set area"
          defaultValue=""
          onChange={(e) => { if (e.target.value) run.mutate({ action: 'category', category_id: e.target.value }) }}
        >
          <option value="">Area…</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); if (assignee.trim()) run.mutate({ action: 'assign', value: assignee.trim() }) }}
        className="flex gap-2"
      >
        <input
          className={`${field} max-w-[12rem]`}
          placeholder="Assign to…"
          aria-label="Assign these to"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
        />
        <button type="submit" disabled={!assignee.trim() || run.isPending} className={btn.secondary}>
          <Check className="size-4" aria-hidden /> Assign
        </button>
      </form>

      <button
        type="button"
        onClick={() => run.mutate({ action: 'close' })}
        disabled={run.isPending}
        className={btn.secondary}
        title="Only tickets already marked resolved will close"
      >
        Close resolved
      </button>

      <button type="button" onClick={onDone} className={`${btn.ghost} ml-auto`} aria-label="Clear the selection">
        <X className="size-4" aria-hidden /> Clear
      </button>
    </div>
  )
}
