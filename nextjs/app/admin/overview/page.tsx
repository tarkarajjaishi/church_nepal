'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import {
  Users, UserPlus, UserCheck, CalendarDays, Cake, Heart, HandHeart,
  CheckSquare, Bell, Mail, TrendingUp, TrendingDown, Banknote,
  Landmark, ClipboardCheck, Home, Boxes, Package, BookMarked,
  LifeBuoy, ArrowRight, Clock, AlertTriangle, Church,
} from 'lucide-react'
import { dashboardApi, ago, type ActivityItem } from '@/lib/dashboard/api'
import { money } from '@/lib/offerings/api'
import { CARD, PageHeader, StatTile, EmptyState, ErrorState, btn } from '@/components/offerings/ui'

const tooltipStyle = {
  contentStyle: {
    background: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    color: 'var(--popover-foreground)',
    fontSize: 12,
  },
  labelStyle: { color: 'var(--muted-foreground)', fontSize: 11 },
} as const

const ACTIVITY_ICON: Record<string, typeof Users> = {
  person: UserPlus,
  attendance: UserCheck,
  offering: Banknote,
  donation: Heart,
  prayer: HandHeart,
  volunteer: Users,
}

function Section({
  title,
  href,
  linkLabel = 'View all',
  children,
  className = '',
}: {
  title: string
  href?: string
  linkLabel?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`${CARD} overflow-hidden ${className}`}>
      <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {href && (
          <Link href={href} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            {linkLabel} <ArrowRight className="size-3" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

/**
 * A module that has no tables in this database.
 *
 * Deliberately not a zero. "0 open tickets" and "no ticketing system exists"
 * are completely different facts, and a leader glancing at a dashboard cannot
 * tell them apart if both render as 0.
 */
function ModuleAbsent({ label, icon: Icon }: { label: string; icon: typeof Users }) {
  return (
    <div className={`${CARD} p-4 sm:p-5 border-dashed`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <Icon className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">Not installed</p>
      <p className="mt-0.5 text-xs text-muted-foreground/70">No data to report</p>
    </div>
  )
}

export default function ChurchOverviewPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['church-dashboard'],
    queryFn: dashboardApi.overview,
    refetchInterval: 60_000,
  })

  if (isError) {
    return (
      <>
        <PageHeader title="Church Overview" />
        <div className={CARD}>
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        </div>
      </>
    )
  }

  const a = data?.attendance
  const p = data?.people
  const f = data?.finance
  const c = data?.care
  const t = data?.tasks
  const m = data?.modules
  const cur = f?.currency === 'NPR' ? 'Rs' : (f?.currency ?? 'Rs')

  const growth = a?.growthPct ?? 0

  return (
    <>
      <PageHeader
        title="Church Overview"
        subtitle={
          data
            ? `Updated ${ago(data.generatedAt)} · refreshes every minute`
            : 'Loading church activity'
        }
        actions={
          <>
            <Link href="/admin/attendance" className={btn.secondary}>
              <UserCheck className="size-4" aria-hidden />
              Attendance
            </Link>
            <Link href="/admin/offering-management" className={btn.primary}>
              <Banknote className="size-4" aria-hidden />
              Giving
            </Link>
          </>
        }
      />

      {/* KPI row */}
      <section aria-label="Key figures" className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 mb-4">
        <StatTile label="Attendance Today" value={a?.today ?? 0} icon={UserCheck} loading={isLoading} />
        <StatTile label="This Week" value={a?.thisWeek ?? 0} icon={CalendarDays} loading={isLoading} />
        <StatTile label="This Month" value={a?.thisMonth ?? 0} icon={CalendarDays} loading={isLoading} />
        <StatTile
          label="Attendance Growth"
          value={`${growth > 0 ? '+' : ''}${growth}%`}
          hint="Last 4 services vs previous 4"
          icon={growth >= 0 ? TrendingUp : TrendingDown}
          tone={growth > 0 ? 'good' : growth < 0 ? 'bad' : 'default'}
          loading={isLoading}
        />
        <StatTile label="Active Members" value={p?.activeMembers ?? 0} icon={Users} loading={isLoading} />
        <StatTile label="New This Month" value={p?.newThisMonth ?? 0} icon={UserPlus} loading={isLoading} />
        <StatTile label="Visitors" value={p?.visitors ?? 0} icon={UserPlus} loading={isLoading} />
        <StatTile label="Households" value={p?.households ?? 0} icon={Home} loading={isLoading} />
        <StatTile label="Offering Today" value={money(f?.offeringToday ?? 0, { currency: cur })} icon={Banknote} loading={isLoading} />
        <StatTile label="Offering This Month" value={money(f?.offeringThisMonth ?? 0, { currency: cur, compact: true })} icon={Banknote} loading={isLoading} />
        <StatTile
          label="Pending Deposits"
          value={money(f?.pendingDeposits ?? 0, { currency: cur, compact: true })}
          icon={Landmark}
          tone={(f?.pendingDeposits ?? 0) > 0 ? 'warn' : 'default'}
          loading={isLoading}
        />
        <StatTile
          label="Awaiting Approval"
          value={f?.pendingApproval ?? 0}
          icon={ClipboardCheck}
          tone={(f?.pendingApproval ?? 0) > 0 ? 'warn' : 'good'}
          loading={isLoading}
        />
        <StatTile
          label="Prayer Requests"
          value={c?.prayerPending ?? 0}
          hint={`${c?.prayerAnswered ?? 0} answered`}
          icon={HandHeart}
          tone={(c?.prayerPending ?? 0) > 0 ? 'warn' : 'default'}
          loading={isLoading}
        />
        <StatTile
          label="Open Tasks"
          value={t?.open ?? 0}
          hint={(t?.overdue ?? 0) > 0 ? `${t?.overdue} overdue` : undefined}
          icon={CheckSquare}
          tone={(t?.overdue ?? 0) > 0 ? 'bad' : 'default'}
          loading={isLoading}
        />
        <StatTile label="Unread Messages" value={c?.unreadMessages ?? 0} icon={Mail} loading={isLoading} />
        <StatTile label="Notifications" value={c?.unreadNotifications ?? 0} icon={Bell} loading={isLoading} />

        {/* Modules with no tables render as absent, never as zero. */}
        {m && !m.helpDesk && <ModuleAbsent label="Help Desk Tickets" icon={LifeBuoy} />}
        {m && !m.assets && <ModuleAbsent label="Assets Needing Service" icon={Package} />}
        {m && !m.library && <ModuleAbsent label="Books Borrowed" icon={BookMarked} />}
        {m && !m.expenses && <ModuleAbsent label="Expenses / Budget" icon={Boxes} />}
      </section>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2 mb-4">
        <Section title="Attendance Trend" href="/admin/attendance">
          <div className="p-4">
            {!isLoading && !a?.weeklyTrend?.length ? (
              <EmptyState
                icon={UserCheck}
                title="No attendance recorded"
                subtitle="Check people in on a service to build this trend."
                action={<Link href="/admin/attendance" className={btn.primary}>Record attendance</Link>}
              />
            ) : (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={a?.weeklyTrend ?? []}>
                      <defs>
                        <linearGradient id="att" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--church-blue)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--church-blue)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                      <Tooltip {...tooltipStyle} formatter={(v: number) => [v, 'Present']} />
                      <Area type="monotone" dataKey="value" stroke="var(--church-blue)" strokeWidth={2} fill="url(#att)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <dl className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border">
                  {[
                    ['Average', a?.average ?? 0],
                    ['Highest', a?.highest ?? 0],
                    ['Lowest', a?.lowest ?? 0],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="text-center">
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="font-semibold tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </div>
        </Section>

        <Section title="Attendance by Service">
          <div className="p-4 h-72">
            {!isLoading && !a?.byService?.length ? (
              <EmptyState icon={Church} title="No service data" subtitle="Attendance broken down by service appears here." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={a?.byService ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={120} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [v, 'Present']} />
                  <Bar dataKey="value" fill="var(--gold)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Section>
      </div>

      {/* People + events */}
      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <Section title="Today" className="lg:col-span-1">
          <div className="divide-y divide-border">
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                <Cake className="size-3.5" aria-hidden /> Birthdays
              </p>
              {!data?.birthdaysToday.length ? (
                <p className="text-sm text-muted-foreground">No birthdays today</p>
              ) : (
                <ul className="space-y-1.5">
                  {data.birthdaysToday.map((b) => (
                    <li key={b.id} className="flex items-center gap-2 text-sm">
                      <span className="size-1.5 rounded-full bg-gold shrink-0" aria-hidden />
                      <span className="truncate">{b.name}</span>
                      {b.detail && <span className="text-xs text-muted-foreground ml-auto shrink-0">{b.detail}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                <Heart className="size-3.5" aria-hidden /> Anniversaries
              </p>
              {!data?.anniversariesToday.length ? (
                <p className="text-sm text-muted-foreground">No anniversaries today</p>
              ) : (
                <ul className="space-y-1.5">
                  {data.anniversariesToday.map((b) => (
                    <li key={b.id} className="flex items-center gap-2 text-sm">
                      <span className="size-1.5 rounded-full bg-rose-500 shrink-0" aria-hidden />
                      <span className="truncate">{b.name}</span>
                      {b.detail && <span className="text-xs text-muted-foreground ml-auto shrink-0">{b.detail}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                <CalendarDays className="size-3.5" aria-hidden /> Events today
              </p>
              {!data?.eventsToday.length ? (
                <p className="text-sm text-muted-foreground">Nothing scheduled today</p>
              ) : (
                <ul className="space-y-1.5">
                  {data.eventsToday.map((e) => (
                    <li key={e.id} className="text-sm">
                      <p className="truncate font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {[e.time, e.location].filter(Boolean).join(' · ')}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Section>

        <Section title="Newest People" href="/admin/people" className="lg:col-span-1">
          {!data?.newestPeople.length ? (
            <EmptyState icon={Users} title="No people yet" subtitle="Add people to see them here." />
          ) : (
            <ul className="divide-y divide-border">
              {data.newestPeople.map((n) => (
                <li key={n.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {n.name.trim().charAt(0).toUpperCase() || '?'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{n.name || 'Unnamed'}</p>
                    {n.detail && <p className="text-xs text-muted-foreground capitalize">{n.detail}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Upcoming Events" href="/admin/events" className="lg:col-span-1">
          {!data?.eventsUpcoming.length ? (
            <EmptyState icon={CalendarDays} title="Nothing scheduled" subtitle="Upcoming events will appear here." />
          ) : (
            <ul className="divide-y divide-border">
              {data.eventsUpcoming.map((e) => (
                <li key={e.id} className="px-4 py-2.5">
                  <p className="text-sm font-medium truncate">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[e.displayDate ?? e.date.slice(0, 10), e.time, e.location].filter(Boolean).join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* Tasks, prayer, activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Tasks" href="/admin/todos">
          {!data?.tasks.items.length ? (
            <EmptyState icon={CheckSquare} title="Nothing outstanding" subtitle="Open tasks appear here." />
          ) : (
            <ul className="divide-y divide-border">
              {data.tasks.items.map((task) => {
                const overdue = task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10)
                return (
                  <li key={task.id} className="flex items-start gap-2.5 px-4 py-2.5">
                    {overdue ? (
                      <AlertTriangle className="size-4 text-red-600 shrink-0 mt-0.5" aria-hidden />
                    ) : (
                      <Clock className="size-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{task.title}</p>
                      <p className={`text-xs ${overdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {task.dueDate ? (overdue ? `Overdue — due ${task.dueDate}` : `Due ${task.dueDate}`) : 'No due date'}
                        {task.priority && ` · ${task.priority}`}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>

        <Section title="Prayer Requests" href="/admin/prayer-requests">
          {!data?.care.prayerRecent.length ? (
            <EmptyState icon={HandHeart} title="No prayer requests" subtitle="Requests from the site appear here." />
          ) : (
            <ul className="divide-y divide-border">
              {data.care.prayerRecent.map((r, i) => (
                <li key={`${r.at}-${i}`} className="px-4 py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <span className="text-xs text-muted-foreground shrink-0">{ago(r.at)}</span>
                  </div>
                  {r.detail && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{r.detail}</p>}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Recent Activity">
          {!data?.activity.length ? (
            <EmptyState icon={Clock} title="No activity yet" subtitle="Church activity appears here as it happens." />
          ) : (
            <ul className="divide-y divide-border max-h-[26rem] overflow-y-auto">
              {data.activity.map((item: ActivityItem, i) => {
                const Icon = ACTIVITY_ICON[item.kind] ?? Clock
                return (
                  <li key={`${item.at}-${i}`} className="flex items-start gap-2.5 px-4 py-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-3.5 text-muted-foreground" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{item.title || '—'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        <span className="capitalize">{item.kind}</span>
                        {item.detail && ` · ${item.detail}`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{ago(item.at)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>
      </div>
    </>
  )
}
