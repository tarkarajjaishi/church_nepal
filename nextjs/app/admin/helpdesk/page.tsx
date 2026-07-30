'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Ticket, Inbox, AlertTriangle, Clock, CheckCircle2, RotateCcw,
  Timer, ArrowRight, Users, Star,
} from 'lucide-react'
import { helpdeskApi, duration, breachReason, PRIORITY_TONE } from '@/lib/helpdesk/api'
import { CARD, PageHeader, StatTile, EmptyState, ErrorState, Chip } from '@/components/offerings/ui'

export default function HelpdeskDashboardPage() {
  const { data: d, isLoading, error, refetch } = useQuery({
    queryKey: ['helpdesk', 'dashboard'],
    queryFn: helpdeskApi.dashboard,
  })

  if (error) {
    return (
      <>
        <PageHeader title="Help Desk" subtitle="What is broken, who is on it, and what is overdue" />
        <div className={CARD}>
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        </div>
      </>
    )
  }

  const maxCategory = Math.max(1, ...(d?.byCategory ?? []).map((c) => c.count))
  const maxAgent = Math.max(1, ...(d?.agents ?? []).map((a) => a.openTickets))

  return (
    <>
      <PageHeader
        title="Help Desk"
        subtitle="What is broken, who is on it, and what is overdue"
        actions={
          <>
            <Link href="/admin/helpdesk/unassigned" className="inline-flex items-center gap-1.5 min-h-10 px-4 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-colors">
              <Inbox className="size-4" aria-hidden /> Queue
            </Link>
            <Link href="/admin/helpdesk/tickets?new=1" className="inline-flex items-center gap-1.5 min-h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Ticket className="size-4" aria-hidden /> Raise a ticket
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <StatTile
          label="Open"
          value={d?.open ?? 0}
          hint={d ? `${d.inProgress} in progress, ${d.waiting} waiting` : undefined}
          icon={Ticket}
          loading={isLoading}
        />
        <StatTile
          label="Unclaimed"
          value={d?.unassigned ?? 0}
          hint={d?.unassigned ? 'Nobody has picked these up' : 'Everything has an owner'}
          icon={Inbox}
          tone={d?.unassigned ? 'warn' : 'good'}
          loading={isLoading}
        />
        <StatTile
          label="Past SLA"
          value={d?.breaching ?? 0}
          hint={d?.urgentOpen ? `${d.urgentOpen} urgent still open` : 'Within target'}
          icon={AlertTriangle}
          tone={d?.breaching ? 'bad' : 'good'}
          loading={isLoading}
        />
        <StatTile
          label="Awaiting first reply"
          value={d?.awaitingFirstReply ?? 0}
          hint="Nobody has answered the reporter yet"
          icon={Clock}
          tone={d?.awaitingFirstReply ? 'warn' : 'good'}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-5 mb-6">
        <StatTile label="Resolved this month" value={d?.resolvedThisMonth ?? 0} icon={CheckCircle2} tone="good" loading={isLoading} />
        <StatTile
          label="What reporters said"
          value={d?.avgSatisfaction === null || d?.avgSatisfaction === undefined ? '—' : `${d.avgSatisfaction} / 5`}
          hint={d?.ratedCount ? `From ${d.ratedCount} rating${d.ratedCount === 1 ? '' : 's'}` : 'Nobody has rated a fix yet'}
          icon={Star}
          tone={d?.avgSatisfaction !== null && d?.avgSatisfaction !== undefined && d.avgSatisfaction < 3 ? 'warn' : 'default'}
          loading={isLoading}
        />
        <StatTile
          label="Typical first reply"
          value={duration(d?.avgResponseHours)}
          hint="Averaged over answered tickets only"
          icon={Timer}
          loading={isLoading}
        />
        <StatTile
          label="Typical time to fix"
          value={duration(d?.avgResolveHours)}
          hint="Averaged over resolved tickets only"
          icon={Timer}
          loading={isLoading}
        />
        <StatTile
          label="Came back"
          value={d?.reopened ?? 0}
          hint={d?.reopened ? 'The fix did not hold' : 'Nothing reopened'}
          icon={RotateCcw}
          tone={d?.reopened ? 'warn' : 'default'}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Needs a reply */}
        <section className={`${CARD} p-4 sm:p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="size-4 text-amber-700" aria-hidden /> Nobody has replied yet
            </h2>
            <Link href="/admin/helpdesk/tickets?view=awaiting_reply" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              All <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : !d?.needsReply.length ? (
            <EmptyState title="Everyone has had an answer" subtitle="No reporter is waiting on a first reply." />
          ) : (
            <ul className="divide-y divide-border">
              {d.needsReply.map((t) => (
                <li key={t.id} className="py-2.5">
                  <Link href={`/admin/helpdesk/tickets/${t.id}`} className="flex items-start justify-between gap-3 group">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{t.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.reporterName} · {t.assigneeName || 'unclaimed'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Chip className={PRIORITY_TONE[t.priority]}>{t.priority}</Chip>
                      <p className={`text-xs mt-1 ${t.responseBreached ? 'text-red-700 font-medium' : 'text-muted-foreground'}`}>
                        {duration(t.ageHours)} old
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Oldest open */}
        <section className={`${CARD} p-4 sm:p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-700" aria-hidden /> Been open longest
            </h2>
            <Link href="/admin/helpdesk/breaching" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Past SLA <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : !d?.oldestOpen.length ? (
            <EmptyState title="Nothing is open" subtitle="The queue is empty." />
          ) : (
            <ul className="divide-y divide-border">
              {d.oldestOpen.map((t) => {
                const reason = breachReason(t)
                return (
                  <li key={t.id} className="py-2.5">
                    <Link href={`/admin/helpdesk/tickets/${t.id}`} className="flex items-start justify-between gap-3 group">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{t.subject}</p>
                        <p className={`text-xs truncate ${reason ? 'text-red-700' : 'text-muted-foreground'}`}>
                          {reason || `${t.assigneeName || 'unclaimed'} · ${t.categoryName ?? 'uncategorised'}`}
                        </p>
                      </div>
                      <p className={`text-sm shrink-0 ${reason ? 'text-red-700 font-medium' : 'text-muted-foreground'}`}>
                        {duration(t.ageHours)}
                      </p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* By category */}
        <section className={`${CARD} p-4 sm:p-5`}>
          <h2 className="font-semibold mb-4">Open tickets by area</h2>
          {isLoading ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-7 rounded bg-muted animate-pulse" />)}
            </div>
          ) : !d?.byCategory.length ? (
            <EmptyState title="Nothing open" />
          ) : (
            <ul className="space-y-2.5">
              {d.byCategory.map((c) => (
                <li key={c.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="truncate">{c.label}</span>
                    <span className="text-muted-foreground tabular-nums shrink-0 ml-2">{c.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.count / maxCategory) * 100}%`, backgroundColor: c.color || 'var(--primary)' }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Team load */}
        <section className={`${CARD} p-4 sm:p-5`}>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" aria-hidden /> Who is carrying what
          </h2>
          {isLoading ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2].map((i) => <div key={i} className="h-7 rounded bg-muted animate-pulse" />)}
            </div>
          ) : !d?.agents.length ? (
            <EmptyState title="Nothing is assigned" subtitle="Every ticket is still in the unclaimed queue." />
          ) : (
            <ul className="space-y-3">
              {d.agents.map((a) => (
                <li key={a.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="truncate">{a.name}</span>
                    <span className="text-muted-foreground tabular-nums shrink-0 ml-2">
                      {a.openTickets} open
                      {a.breached > 0 && <span className="text-red-700"> · {a.breached} late</span>}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(a.openTickets / maxAgent) * 100}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {a.resolvedTickets} resolved
                    {a.avgResolveHours !== null && `, typically in ${duration(a.avgResolveHours)}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
