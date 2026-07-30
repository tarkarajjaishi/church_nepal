'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarRange, Users, Music, CalendarClock, UserCheck, Mail,
  AlertTriangle, ArrowRight, Clock,
} from 'lucide-react'
import { worshipApi, duration, STATUS_STYLE } from '@/lib/worship/api'
import { CARD, PageHeader, StatTile, EmptyState, ErrorState, Chip, btn } from '@/components/offerings/ui'

export default function WorshipDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['worship-dashboard'],
    queryFn: worshipApi.dashboard,
    refetchInterval: 120_000,
  })

  if (isError) {
    return (
      <>
        <PageHeader title="Worship" />
        <div className={CARD}>
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Worship"
        subtitle="Service planning, team rostering and rehearsals"
        actions={
          <>
            <Link href="/admin/worship/team" className={btn.secondary}>
              <Users className="size-4" aria-hidden />
              Team
            </Link>
            <Link href="/admin/worship/services" className={btn.primary}>
              <CalendarRange className="size-4" aria-hidden />
              Plan a Service
            </Link>
          </>
        }
      />

      <section className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-4">
        <StatTile label="Active Team" value={data?.activeMembers ?? 0} icon={Users}
          hint={`${data?.totalMembers ?? 0} total`} loading={isLoading} />
        <StatTile label="Leaders" value={data?.leaders ?? 0} icon={UserCheck} loading={isLoading} />
        <StatTile label="Songs" value={data?.songsTotal ?? 0} icon={Music} loading={isLoading} />
        <StatTile label="Services This Month" value={data?.servicesThisMonth ?? 0} icon={CalendarRange} loading={isLoading} />
        <StatTile label="Pending Invites" value={data?.pendingInvites ?? 0} icon={Mail}
          tone={(data?.pendingInvites ?? 0) > 0 ? 'warn' : 'good'} loading={isLoading} />
        <StatTile label="Uncovered Roles" value={data?.uncoveredRoles.length ?? 0} icon={AlertTriangle}
          tone={(data?.uncoveredRoles.length ?? 0) > 0 ? 'warn' : 'good'} loading={isLoading} />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Upcoming services */}
        <div className={`${CARD} overflow-hidden lg:col-span-2`}>
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3">
            <h2 className="font-semibold">Upcoming Services</h2>
            <Link href="/admin/worship/services" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
          {!data?.upcomingServices.length ? (
            <EmptyState
              icon={CalendarRange}
              title="No services planned"
              subtitle="Plan a service to build its running order and roster the band."
              action={<Link href="/admin/worship/services" className={btn.primary}>Plan a Service</Link>}
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.upcomingServices.map((s) => (
                <li key={s.id}>
                  <Link href={`/admin/worship/services?id=${s.id}`} className="block px-4 py-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.serviceDate}
                          {s.startTime && ` · ${s.startTime.slice(0, 5)}`}
                          {s.theme && ` · ${s.theme}`}
                        </p>
                      </div>
                      <Chip className={STATUS_STYLE[s.status] ?? STATUS_STYLE.draft}>{s.status}</Chip>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>{s.itemCount} items</span>
                      <span>{s.songCount} songs</span>
                      <span>{s.teamCount} on team</span>
                      {s.plannedSeconds > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" aria-hidden />
                          {duration(s.plannedSeconds)}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          {/* Next rehearsal */}
          <div className={`${CARD} overflow-hidden`}>
            <div className="p-4 border-b border-border flex items-center justify-between gap-3">
              <h2 className="font-semibold">Next Rehearsal</h2>
              <Link href="/admin/worship/rehearsals" className="text-xs text-primary hover:underline">All</Link>
            </div>
            {!data?.nextRehearsal ? (
              <EmptyState icon={CalendarClock} title="None scheduled" subtitle="Schedule a practice for an upcoming service." />
            ) : (
              <div className="p-4">
                <p className="font-medium">{data.nextRehearsal.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {data.nextRehearsal.rehearsalDate}
                  {data.nextRehearsal.startTime && ` · ${data.nextRehearsal.startTime.slice(0, 5)}`}
                  {data.nextRehearsal.location && ` · ${data.nextRehearsal.location}`}
                </p>
                {data.nextRehearsal.serviceName && (
                  <p className="text-xs text-muted-foreground mt-1">For {data.nextRehearsal.serviceName}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {data.nextRehearsal.invitedCount} invited
                </p>
              </div>
            )}
          </div>

          {/* Uncovered roles — the gap to fix before rostering */}
          <div className={`${CARD} overflow-hidden`}>
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold">Coverage Gaps</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Roles nobody active can cover</p>
            </div>
            {!data?.uncoveredRoles.length ? (
              <div className="p-4">
                <p className="text-sm text-muted-foreground">Every role has someone who can play it.</p>
              </div>
            ) : (
              <div className="p-4 flex flex-wrap gap-1.5">
                {data.uncoveredRoles.map((r) => (
                  <Chip key={r.roleName} className="bg-amber-100 text-amber-800 border-amber-200">
                    {r.roleName}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          {/* Most used songs */}
          <div className={`${CARD} overflow-hidden`}>
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold">Most Used Songs</h2>
            </div>
            {!data?.mostUsedSongs.length ? (
              <EmptyState icon={Music} title="No songs used yet" subtitle="Add songs to a service plan to build this." />
            ) : (
              <ul className="divide-y divide-border">
                {data.mostUsedSongs.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{s.title}</p>
                      {s.songKey && <p className="text-xs text-muted-foreground">Key {s.songKey}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">{s.useCount}×</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
