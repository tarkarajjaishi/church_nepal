'use client'

import Link from 'next/link'
import { useQuery, useQueries } from '@tanstack/react-query'
import { Target, TrendingUp, Users, ArrowRight, Wallet } from 'lucide-react'
import api, { asList } from '@/lib/api'

import {
  CARD, PageHeader, StatTile, EmptyState, ErrorState, TableSkeleton, Chip,
} from '@/components/offerings/ui'

/**
 * Campaigns and pledges are stored in **rupees**, not the paisa the rest of the
 * offering module uses: the public giving form posts what the donor typed, and
 * `campaigns.raised` is a SUM of that. Formatting these with the offering
 * module's `money()` would divide by a hundred and show Rs 3,800 where
 * /admin/campaigns shows Rs 380,000 — two pages disagreeing about one campaign.
 */
const rupees = (n: number) => `Rs ${(n || 0).toLocaleString('en-IN')}`

/**
 * Campaign progress, from the giving side.
 *
 * Editing a campaign still lives at /admin/campaigns — this view is about how
 * one is doing, not about changing it. `raised` and pledges are read from the
 * campaign stats endpoint so the figures match the campaigns page exactly
 * rather than being recomputed a second way.
 */

interface Campaign {
  id: string
  title: string
  goal: number
  raised: number
  enabled: boolean | null
}

interface Stats {
  pledgeAmount: number
  pledgeCount: number
  donationAmount: number
  donationCount: number
  raised: number
  goal: number
  totalTowardGoal: number
  progressPercent: number
}

export default function CampaignsPage() {
  const { data, isLoading, isError, error, failureReason, refetch, isFetching } = useQuery({
    queryKey: ['campaigns'],
    // /campaigns paginates.
    queryFn: () => api.get('/campaigns').then((r) => asList<Campaign>(r.data)),
  })
  const failure = (error ?? failureReason) as (Error & { isForbidden?: boolean }) | null
  const campaigns = data ?? []

  const statsQueries = useQueries({
    queries: campaigns.map((c) => ({
      queryKey: ['campaign-stats', c.id],
      queryFn: () => api.get<Stats>(`/campaigns/${c.id}/stats`).then((r) => r.data),
      // The card falls back to the campaign's own figures if this fails, so a
      // broken stats call must not blank the page.
      retry: 1,
    })),
  })

  const statsFor = (i: number) => statsQueries[i]?.data

  const totalGoal = campaigns.reduce((s, c) => s + (c.goal || 0), 0)
  const totalRaised = campaigns.reduce((s, c, i) => s + (statsFor(i)?.raised ?? c.raised ?? 0), 0)
  const totalPledged = campaigns.reduce((s, _c, i) => s + (statsFor(i)?.pledgeAmount ?? 0), 0)

  return (
    <>
      <PageHeader
        title="Campaigns"
        subtitle="Fundraising progress"
        actions={
          <Link href="/admin/campaigns" className="inline-flex items-center gap-1.5 min-h-10 px-4 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-colors">
            Manage campaigns <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <StatTile label="Campaigns" value={campaigns.length} icon={Target} loading={isLoading} />
        <StatTile label="Raised" value={rupees(totalRaised)} icon={TrendingUp} loading={isLoading} />
        <StatTile label="Pledged" value={rupees(totalPledged)} hint="Promised, not yet received" icon={Users} loading={isLoading} />
        <StatTile
          label="Combined goal"
          value={rupees(totalGoal)}
          hint={totalGoal ? `${Math.round((totalRaised / totalGoal) * 100)}% raised` : undefined}
          icon={Wallet}
          loading={isLoading}
        />
      </div>

      {isError || (!isLoading && !isFetching && !data) ? (
        <div className={CARD}>
          <ErrorState message={failure?.message} forbidden={failure?.isForbidden} onRetry={() => refetch()} />
        </div>
      ) : isLoading || !data ? (
        <div className={CARD}><TableSkeleton cols={3} /></div>
      ) : !campaigns.length ? (
        <div className={CARD}>
          <EmptyState
            icon={Target}
            title="No campaigns yet"
            subtitle="Create one to track a goal and what has come in against it."
            action={<Link href="/admin/campaigns" className="inline-flex items-center min-h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Create a campaign</Link>}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((c, i) => {
            const s = statsFor(i)
            const raised = s?.raised ?? c.raised ?? 0
            const pledged = s?.pledgeAmount ?? 0
            const goal = c.goal || 0
            // The real figure is shown as text; the bar is capped, because a
            // Progress bar given 270 draws straight past its track.
            const rawPct = goal ? Math.round((raised / goal) * 100) : 0
            const rawPledgePct = goal ? Math.round(((raised + pledged) / goal) * 100) : 0

            return (
              <section key={c.id} className={`${CARD} p-4 sm:p-5`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold truncate">{c.title}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {rupees(raised)} of {rupees(goal)}
                    </p>
                  </div>
                  <Chip className={c.enabled !== false ? 'bg-green-100 text-green-800 border-green-200' : 'bg-muted text-muted-foreground border-border'}>
                    {c.enabled !== false ? 'Active' : 'Draft'}
                  </Chip>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Received</span>
                    <span className="font-medium tabular-nums">{rawPct}%</span>
                  </div>
                  <span className="block h-2 rounded-full bg-muted overflow-hidden" aria-hidden>
                    <span className="block h-full bg-primary" style={{ width: `${Math.min(100, rawPct)}%` }} />
                  </span>
                  {pledged > 0 && (
                    <>
                      <div className="flex justify-between text-xs pt-1">
                        <span className="text-muted-foreground">With pledges</span>
                        <span className="font-medium tabular-nums">{rawPledgePct}%</span>
                      </div>
                      <span className="block h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden>
                        <span className="block h-full bg-primary/50" style={{ width: `${Math.min(100, rawPledgePct)}%` }} />
                      </span>
                    </>
                  )}
                </div>

                <dl className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Donations</dt>
                    <dd className="font-medium tabular-nums">{rupees(s?.donationAmount ?? 0)}</dd>
                    <dd className="text-xs text-muted-foreground">{s?.donationCount ?? 0} payments</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Pledges</dt>
                    <dd className="font-medium tabular-nums">{rupees(pledged)}</dd>
                    <dd className="text-xs text-muted-foreground">{s?.pledgeCount ?? 0} committed</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Still needed</dt>
                    <dd className="font-medium tabular-nums">{rupees(Math.max(0, goal - raised))}</dd>
                  </div>
                </dl>

                <Link
                  href={`/admin/reports?report=campaign-progress`}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-4"
                >
                  Campaign progress report <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}
