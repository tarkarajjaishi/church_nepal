'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { helpdeskApi } from '@/lib/helpdesk/api'
import { TicketTable } from '@/components/helpdesk/TicketTable'
import { CARD, PageHeader, StatTile } from '@/components/offerings/ui'

export default function BreachingPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['helpdesk', 'tickets', 'breached'],
    queryFn: () => helpdeskApi.tickets({ view: 'breached', per_page: 100, sort: 'opened', dir: 'asc' }),
  })

  const noReply = data?.data.filter((t) => t.responseHoursTaken === null).length ?? 0

  return (
    <>
      <PageHeader
        title="Past service target"
        subtitle="Tickets that have missed the reply or fix time their category promises"
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <StatTile label="Past target" value={data?.total ?? 0} icon={AlertTriangle} tone={data?.total ? 'bad' : 'good'} loading={isLoading} />
        <StatTile label="Never answered" value={noReply} hint="The reporter has heard nothing" tone={noReply ? 'bad' : 'good'} loading={isLoading} />
        <StatTile
          label="Answered but unfixed"
          value={(data?.data.length ?? 0) - noReply}
          hint="Someone replied, the problem remains"
          tone={(data?.data.length ?? 0) - noReply ? 'warn' : 'good'}
          loading={isLoading}
        />
      </div>

      <div className={`${CARD} overflow-hidden`}>
        <TicketTable
          data={data?.data}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          emptyTitle="Nothing is late"
          emptySubtitle="Every open ticket is still inside the reply and fix targets for its area."
        />
      </div>
    </>
  )
}
