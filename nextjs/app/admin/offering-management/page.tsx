'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import {
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  TrendingUp,
  Heart,
  Globe,
  Banknote,
  Landmark,
  ClipboardCheck,
  Target,
  Users,
  PlusCircle,
  Calculator,
} from 'lucide-react'
import { offeringsApi, money, methodLabel } from '@/lib/offerings/api'
import {
  CARD,
  PageHeader,
  StatTile,
  EmptyState,
  ErrorState,
  btn,
} from '@/components/offerings/ui'

/** Chart palette drawn from the brand tokens so charts match the theme. */
const SERIES = [
  'var(--church-blue)',
  'var(--gold)',
  '#0891b2',
  '#7c3aed',
  '#16a34a',
  '#ea580c',
  '#db2777',
  '#0f766e',
]

function ChartCard({
  title,
  subtitle,
  children,
  empty,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  empty?: boolean
}) {
  return (
    <div className={`${CARD} p-4 sm:p-5`}>
      <div className="mb-4">
        <h2 className="font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {empty ? (
        <EmptyState
          title="No data yet"
          subtitle="Record an offering and this chart will fill in."
        />
      ) : (
        <div className="h-64">{children}</div>
      )}
    </div>
  )
}

/** Recharts tooltip styled to the theme; the default is white-on-white in dark mode. */
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

export default function OfferingDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['offering-dashboard'],
    queryFn: offeringsApi.dashboard,
    // Finance figures should not sit stale on screen while someone is counting.
    refetchInterval: 60_000,
  })

  const cur = data?.currency === 'NPR' ? 'Rs' : (data?.currency ?? 'Rs')
  const m = (v?: number, compact = false) => money(v ?? 0, { currency: cur, compact })

  if (isError) {
    return (
      <>
        <PageHeader title="Offering Dashboard" />
        <div className={CARD}>
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        </div>
      </>
    )
  }

  const tiles = [
    { label: "Today's Offering", value: m(data?.today), icon: CalendarDays },
    { label: 'This Week', value: m(data?.thisWeek), icon: CalendarRange },
    { label: 'This Month', value: m(data?.thisMonth), icon: CalendarCheck },
    { label: 'This Year', value: m(data?.thisYear, true), icon: TrendingUp },
    { label: 'Total Donations', value: m(data?.totalDonations, true), icon: Heart },
    { label: 'Online Giving', value: m(data?.onlineGiving, true), icon: Globe, hint: 'Year to date' },
    { label: 'Cash Giving', value: m(data?.cashGiving, true), icon: Banknote, hint: 'Year to date' },
    {
      label: 'Pending Deposits',
      value: m(data?.pendingDeposits, true),
      icon: Landmark,
      tone: (data?.pendingDepositCount ?? 0) > 0 ? ('warn' as const) : ('default' as const),
      hint: `${data?.pendingDepositCount ?? 0} awaiting bank`,
    },
    {
      label: 'Pending Approval',
      value: data?.pendingApprovalCount ?? 0,
      icon: ClipboardCheck,
      tone: (data?.pendingApprovalCount ?? 0) > 0 ? ('warn' as const) : ('good' as const),
    },
    { label: 'Active Campaigns', value: data?.activeCampaigns ?? 0, icon: Target },
    { label: 'Total Donors', value: data?.totalDonors ?? 0, icon: Users },
  ]

  return (
    <>
      <PageHeader
        title="Offering Dashboard"
        subtitle="Giving at a glance — updates every minute"
        actions={
          <>
            <Link href="/admin/offering-management/cash-counting" className={btn.secondary}>
              <Calculator className="size-4" aria-hidden />
              Cash Counting
            </Link>
            <Link href="/admin/offering-management/new" className={btn.primary}>
              <PlusCircle className="size-4" aria-hidden />
              Record Offering
            </Link>
          </>
        }
      />

      <section aria-label="Key figures" className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 mb-6">
        {tiles.map((t) => (
          <StatTile key={t.label} {...t} loading={isLoading} />
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2 mb-4">
        <ChartCard
          title="Monthly Giving Trend"
          subtitle="Last 12 months"
          empty={!isLoading && !data?.monthlyTrend?.length}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.monthlyTrend ?? []}>
              <defs>
                <linearGradient id="giving" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--church-blue)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--church-blue)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => money(v, { currency: '', compact: true }).trim()}
                width={56}
              />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [m(v), 'Given']} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="var(--church-blue)"
                strokeWidth={2}
                fill="url(#giving)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Daily Offering"
          subtitle="Last 30 days"
          empty={!isLoading && !data?.dailyTrend?.length}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.dailyTrend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => money(v, { currency: '', compact: true }).trim()}
                width={56}
              />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [m(v), 'Given']} />
              <Bar dataKey="amount" fill="var(--gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Category Breakdown"
          subtitle="Year to date"
          empty={!isLoading && !data?.byCategory?.length}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data?.byCategory ?? []}
                dataKey="amount"
                nameKey="label"
                innerRadius={52}
                outerRadius={88}
                paddingAngle={2}
              >
                {(data?.byCategory ?? []).map((c, i) => (
                  <Cell key={c.label} fill={c.color || SERIES[i % SERIES.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v: number, n) => [m(v), n as string]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Payment Methods"
          subtitle="Year to date"
          empty={!isLoading && !data?.byPaymentMethod?.length}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={(data?.byPaymentMethod ?? []).map((d) => ({
                ...d,
                label: methodLabel(d.label),
              }))}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => money(v, { currency: '', compact: true }).trim()}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                width={96}
              />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [m(v), 'Given']} />
              <Bar dataKey="amount" fill="var(--church-blue)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard
        title="Weekly Comparison"
        subtitle="Last 8 weeks"
        empty={!isLoading && !data?.weeklyComparison?.length}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data?.weeklyComparison ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => money(v, { currency: '', compact: true }).trim()}
              width={56}
            />
            <Tooltip {...tooltipStyle} formatter={(v: number) => [m(v), 'Given']} />
            <Bar dataKey="amount" fill="var(--gold)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  )
}
