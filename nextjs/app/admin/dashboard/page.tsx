'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import {
  Activity, ArrowRight, Banknote, BookOpen, Bell, Calendar, Clock, DollarSign,
  Download, HandCoins, Heart, Image, Quote, Settings, Shield, UserCheck, Users, BookMarked,
} from 'lucide-react'

import { useAuth } from '@/lib/auth'
import { useSettingsSections, useToggleSection } from '@/lib/hooks/settings'
import {
  useDashboardSermons, useDashboardEvents, useDashboardMinistries, useDashboardNotices,
  useDashboardLeaders, useDashboardGallery, useDashboardTestimonies, useDashboardMembers,
  useDashboardServiceTimes, useDashboardVerses, useDashboardCampaigns, useUsers,
} from '@/lib/hooks'
import { reportsApi, presets, formatCell, type Report } from '@/lib/reports/api'
import {
  Card, CardHeader, Progress, StatCard, TrendChart, Unavailable, NO_VALUE,
} from '@/components/admin/dashboard/widgets'

/**
 * Admin dashboard.
 *
 * The figures come from the reporting endpoints rather than from counting rows
 * in the browser: those are the same numbers the reports and the exports show,
 * so the dashboard cannot quietly disagree with them.
 *
 * Two rules run through this page. Colours are theme tokens, so light and dark
 * are the same markup. And a tile only prints a number when one was actually
 * returned — a failed request shows a dash, never a zero.
 */

const REPORTS = ['giving-summary', 'attendance', 'membership', 'campaign-progress'] as const

function greeting(d = new Date()): string {
  const h = d.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: sections = {} } = useSettingsSections()
  const { toggleSection } = useToggleSection()
  const sec = sections as Record<string, boolean>

  const periods = useMemo(() => presets(), [])
  const [periodIdx, setPeriodIdx] = useState(3) // "This year"
  const period = periods[periodIdx]

  const results = useQueries({
    queries: REPORTS.map((key) => ({
      queryKey: ['report', key, period.from, period.to],
      queryFn: () => reportsApi.run(key, period.from, period.to),
      // A report the signed-in role may not read returns 403. Retrying it just
      // delays the honest "not available" state.
      retry: false,
      staleTime: 60_000,
    })),
  })

  const [giving, attendance, membership, campaigns] = results
  const byKey = (i: number) => {
    const r = results[i]
    return {
      report: r.data as Report | undefined,
      loading: r.isLoading,
      // No data and not loading means the request failed or was refused.
      failed: !r.isLoading && !r.data,
    }
  }

  const g = byKey(0), a = byKey(1), m = byKey(2), c = byKey(3)

  /** Pick a named stat out of a report without assuming its position. */
  const stat = (r: Report | undefined, label: string) =>
    r?.stats.find((s) => s.label.toLowerCase() === label.toLowerCase())

  const kpis = [
    { src: g, label: 'Total given', icon: <Banknote className="size-4" />, stat: stat(g.report, 'Total given') },
    { src: g, label: 'Donors', icon: <HandCoins className="size-4" />, stat: stat(g.report, 'Donors') },
    { src: a, label: 'Average attendance', icon: <Users className="size-4" />, stat: stat(a.report, 'Average attendance') },
    { src: a, label: 'Services held', icon: <Calendar className="size-4" />, stat: stat(a.report, 'Services held') },
    { src: m, label: 'On the roll', icon: <UserCheck className="size-4" />, stat: stat(m.report, 'On the roll') },
    { src: c, label: 'Campaigns running', icon: <DollarSign className="size-4" />, stat: stat(c.report, 'Campaigns running') },
  ]

  // Content counts still come from the list endpoints — they are inventory, not
  // analytics, and there is no report that covers them.
  const sermons = useDashboardSermons()
  const events = useDashboardEvents()
  const ministries = useDashboardMinistries()
  const notices = useDashboardNotices()
  const leaders = useDashboardLeaders()
  const gallery = useDashboardGallery()
  const testimonies = useDashboardTestimonies()
  const members = useDashboardMembers()
  const serviceTimes = useDashboardServiceTimes()
  const verses = useDashboardVerses()
  const dashCampaigns = useDashboardCampaigns()
  const users = useUsers()

  const inventory = [
    { label: 'Sermons', q: sermons, icon: BookOpen, link: '/admin/sermons' },
    { label: 'Events', q: events, icon: Calendar, link: '/admin/events' },
    { label: 'Ministries', q: ministries, icon: Users, link: '/admin/ministries' },
    { label: 'Notices', q: notices, icon: Bell, link: '/admin/notices' },
    { label: 'Leaders', q: leaders, icon: UserCheck, link: '/admin/leaders' },
    { label: 'Gallery', q: gallery, icon: Image, link: '/admin/gallery' },
    { label: 'Testimonies', q: testimonies, icon: Quote, link: '/admin/testimonies' },
    { label: 'Members', q: members, icon: Users, link: '/admin/members' },
    { label: 'Verses', q: verses, icon: BookMarked, link: '/admin/verses' },
    { label: 'Campaigns', q: dashCampaigns, icon: DollarSign, link: '/admin/campaigns' },
    { label: 'Service times', q: serviceTimes, icon: Clock, link: '/admin/service-times' },
    { label: 'Users', q: users, icon: Shield, link: '/admin/users' },
  ]

  const topDonors = (g.report?.rows ?? []).slice(0, 6)
  const donorCols = g.report?.columns ?? []

  const exportHref = g.report
    ? `/api${reportsApi.exportUrl('giving-summary', period.from, period.to)}`
    : null

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting()}, <span className="text-primary">{user?.name || 'Admin'}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {period.from} to {period.to} · your church at a glance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="dash-period" className="sr-only">Reporting period</label>
          <select
            id="dash-period"
            value={periodIdx}
            onChange={(e) => setPeriodIdx(Number(e.target.value))}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {periods.map((p, i) => (
              <option key={p.label} value={i}>{p.label}</option>
            ))}
          </select>

          {exportHref && (
            <a
              href={exportHref}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Download className="size-4" aria-hidden="true" />
              Export giving
            </a>
          )}
        </div>
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map(({ label, icon, stat: s, src }) => (
          <StatCard
            key={label}
            label={s?.label ?? label}
            value={s ? s.value : null}
            kind={s?.kind ?? 'number'}
            hint={s?.hint}
            change={s?.change ?? null}
            icon={icon}
            loading={src.loading}
            unavailable={!!src.report?.unavailable}
          />
        ))}
      </div>

      {/* ── Giving trend + campaign progress ───────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Giving over time"
            subtitle={g.report?.description}
            action={
              <Link href="/admin/reports" className="shrink-0 text-sm text-primary hover:underline">
                Reports
              </Link>
            }
          />
          {g.loading ? (
            <div className="h-[260px] animate-pulse rounded-xl bg-muted" />
          ) : g.failed ? (
            <Unavailable reason="Giving figures could not be loaded." />
          ) : g.report?.unavailable ? (
            <Unavailable reason={g.report.unavailable} />
          ) : (
            <TrendChart series={g.report?.series ?? []} kind="money" variant="area" />
          )}
        </Card>

        <Card>
          {/* `raised` here is what came in DURING the selected period, not the
              appeal's lifetime total (the campaigns table keeps that
              separately). Without saying so, a quiet period reads as an appeal
              that has raised nothing at all. */}
          <CardHeader title="Campaigns" subtitle="Received in this period, against each target" />
          {c.loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}
            </div>
          ) : c.failed ? (
            <Unavailable reason="Campaign figures could not be loaded." />
          ) : (c.report?.rows.length ?? 0) === 0 ? (
            <Unavailable reason="No campaigns are running." />
          ) : (
            <div className="space-y-4">
              {c.report!.rows.slice(0, 5).map((row, i) => (
                <Progress
                  key={String(row.campaign ?? row.name ?? i)}
                  label={String(row.campaign ?? row.name ?? 'Campaign')}
                  value={Number(row.raised ?? 0)}
                  target={Number(row.goal ?? row.target ?? 0)}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Attendance + membership ────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Attendance" subtitle={a.report?.description} />
          {a.loading ? (
            <div className="h-[240px] animate-pulse rounded-xl bg-muted" />
          ) : a.failed ? (
            <Unavailable reason="Attendance could not be loaded." />
          ) : a.report?.unavailable ? (
            <Unavailable reason={a.report.unavailable} />
          ) : (
            <TrendChart series={a.report?.series ?? []} kind="number" variant="bar" height={240} />
          )}
        </Card>

        <Card>
          <CardHeader title="Who is on the roll" />
          {m.loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-muted" />)}
            </div>
          ) : m.failed ? (
            <Unavailable reason="Membership could not be loaded." />
          ) : (
            <dl className="divide-y divide-border">
              {(m.report?.stats ?? []).map((s) => (
                <div key={s.label} className="flex items-baseline justify-between gap-3 py-2.5">
                  <dt className="truncate text-sm text-muted-foreground" title={s.hint ?? undefined}>{s.label}</dt>
                  <dd className="shrink-0 font-semibold tabular-nums text-card-foreground">
                    {formatCell(s.value, s.kind)}
                  </dd>
                </div>
              ))}
              {(m.report?.stats.length ?? 0) === 0 && (
                <p className="py-2 text-sm text-muted-foreground">{NO_VALUE}</p>
              )}
            </dl>
          )}
        </Card>
      </div>

      {/* ── Top donors ─────────────────────────────────────────────────── */}
      {topDonors.length > 0 && (
        <Card padded={false}>
          <div className="p-5 pb-0">
            <CardHeader
              title="Who gave most"
              subtitle={`${g.report?.totalRows ?? 0} donors in this period`}
              action={
                <Link href="/admin/giving" className="shrink-0 text-sm text-primary hover:underline">
                  Giving
                </Link>
              }
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {donorCols.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className={`px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground ${
                        col.kind === 'money' || col.kind === 'number' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topDonors.map((row, i) => (
                  <tr key={i} className="transition-colors hover:bg-muted/60">
                    {donorCols.map((col) => (
                      <td
                        key={col.key}
                        className={`px-5 py-3 ${
                          col.kind === 'money' || col.kind === 'number'
                            ? 'text-right tabular-nums text-card-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {formatCell(row[col.key], col.kind)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Content inventory ──────────────────────────────────────────── */}
      <Card>
        <CardHeader title="Content" subtitle="What is published on the site" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {inventory.map(({ label, q, icon: Icon, link }) => (
            <Link
              key={label}
              href={link}
              className="group rounded-xl border border-border p-3 transition-colors hover:border-primary hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate text-xs">{label}</span>
              </div>
              <div className="mt-1.5 text-xl font-bold text-card-foreground">
                {q.isLoading ? (
                  <span className="inline-block h-6 w-8 animate-pulse rounded bg-muted align-middle" />
                ) : q.data ? (
                  q.data.length
                ) : (
                  <span className="text-muted-foreground" title="Could not be loaded">{NO_VALUE}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* ── Homepage visibility ────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title="Homepage sections"
          subtitle="Which sections appear on the public homepage"
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[
            { key: 'hero', apiKey: 'hero', label: 'Hero', icon: Activity },
            { key: 'serviceTimes', apiKey: 'service_times', label: 'Service times', icon: Clock },
            { key: 'whatToExpect', apiKey: 'what_to_expect', label: 'What to expect', icon: Users },
            { key: 'welcome', apiKey: 'welcome', label: 'Welcome', icon: UserCheck },
            { key: 'whatWeBelieve', apiKey: 'what_we_believe', label: 'What we believe', icon: BookOpen },
            { key: 'watchOnline', apiKey: 'watch_online', label: 'Watch online', icon: Activity },
            { key: 'prayerCta', apiKey: 'prayer_cta', label: 'Prayer CTA', icon: Heart },
            { key: 'sermons', apiKey: 'sermons', label: 'Sermons', icon: BookOpen },
            { key: 'ministries', apiKey: 'ministries', label: 'Ministries', icon: Users },
            { key: 'events', apiKey: 'events', label: 'Events', icon: Calendar },
            { key: 'notices', apiKey: 'notices', label: 'Notices', icon: Bell },
            { key: 'testimonies', apiKey: 'testimonies', label: 'Testimonies', icon: Quote },
            { key: 'leaders', apiKey: 'leaders', label: 'Leaders', icon: UserCheck },
            { key: 'gallery', apiKey: 'gallery', label: 'Gallery', icon: Image },
            { key: 'members', apiKey: 'members', label: 'Members', icon: Users },
            { key: 'verses', apiKey: 'verses', label: 'Verses', icon: BookMarked },
            { key: 'campaigns', apiKey: 'campaigns', label: 'Campaigns', icon: DollarSign },
          ].map(({ key, apiKey, label, icon: Icon }) => {
            const enabled = sec[key] === true
            return (
              <button
                key={key}
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() =>
                  toggleSection(apiKey, {
                    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'sections'] }),
                  })
                }
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon
                    className={`size-4 shrink-0 ${enabled ? 'text-primary' : 'text-muted-foreground'}`}
                    aria-hidden="true"
                  />
                  <span className="truncate text-sm text-card-foreground">{label}</span>
                </span>
                {/* Off is not an error: a plain muted track, not a red one. */}
                <span
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                    enabled ? 'bg-primary' : 'bg-muted-foreground/35'
                  }`}
                >
                  <span
                    className={`inline-block size-3.5 transform rounded-full bg-card shadow transition-transform ${
                      enabled ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
                    }`}
                  />
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* ── Quick actions ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader title="Quick actions" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Add sermon', icon: BookOpen, link: '/admin/sermons' },
            { label: 'Add event', icon: Calendar, link: '/admin/events' },
            { label: 'Add notice', icon: Bell, link: '/admin/notices' },
            { label: 'People', icon: Users, link: '/admin/people' },
            { label: 'Gallery', icon: Image, link: '/admin/gallery' },
            { label: 'Settings', icon: Settings, link: '/admin/settings' },
          ].map(({ label, icon: Icon, link }) => (
            <Link
              key={label}
              href={link}
              className="flex items-center gap-2 rounded-xl border border-border px-3 py-3 text-sm font-medium text-card-foreground transition-colors hover:border-primary hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate">{label}</span>
              <ArrowRight className="ml-auto size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
