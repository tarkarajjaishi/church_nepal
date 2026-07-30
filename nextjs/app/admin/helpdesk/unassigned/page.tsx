'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { helpdeskApi } from '@/lib/helpdesk/api'
import { TicketTable } from '@/components/helpdesk/TicketTable'
import { CARD, PageHeader, btn, field } from '@/components/offerings/ui'

export default function UnassignedPage() {
  const qc = useQueryClient()
  const [me, setMe] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['helpdesk', 'tickets', 'unassigned'],
    queryFn: () => helpdeskApi.tickets({ view: 'unassigned', per_page: 100 }),
  })

  const claimNext = useMutation({
    mutationFn: async () => {
      const first = data?.data[0]
      if (!first) throw new Error('Nothing left in the queue')
      return helpdeskApi.claim(first.id, { assignee_name: me.trim() })
    },
    onSuccess: (r: { assignedTo: string }) => {
      qc.invalidateQueries({ queryKey: ['helpdesk'] })
      toast.success(`Assigned to ${r.assignedTo}`)
    },
    // A 409 means a colleague claimed it in the seconds since this list
    // loaded. Refreshing is the right response, not an error dialog.
    onError: (e: Error) => {
      toast.error(e.message || 'Could not claim that one')
      refetch()
    },
  })

  return (
    <>
      <PageHeader
        title="Unclaimed"
        subtitle="Reported, but nobody has picked it up yet"
        actions={
          <form
            onSubmit={(e) => { e.preventDefault(); if (me.trim()) claimNext.mutate() }}
            className="flex gap-2"
          >
            <input
              className={`${field} w-40`}
              placeholder="Your name"
              aria-label="Your name"
              value={me}
              onChange={(e) => setMe(e.target.value)}
            />
            <button
              type="submit"
              disabled={!me.trim() || !data?.data.length || claimNext.isPending}
              className={btn.primary}
            >
              <UserPlus className="size-4" aria-hidden />
              {claimNext.isPending ? 'Claiming…' : 'Take the oldest'}
            </button>
          </form>
        }
      />

      <div className={`${CARD} overflow-hidden`}>
        <TicketTable
          data={data?.data}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          emptyTitle="Every ticket has an owner"
          emptySubtitle="Nothing is sitting in the queue waiting to be picked up."
        />
      </div>
    </>
  )
}
