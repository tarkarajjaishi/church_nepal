'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import {
  Package, TrendingDown, CheckCircle2, ArrowLeftRight, Wrench,
  AlertTriangle, ShieldAlert, CalendarCheck, Banknote, Clock, ArrowRight,
} from 'lucide-react'
import { assetsApi, STATUS_STYLE, WARRANTY_STYLE } from '@/lib/assets/api'
import { money } from '@/lib/offerings/api'
import { CARD, PageHeader, StatTile, EmptyState, ErrorState, Chip, btn } from '@/components/offerings/ui'

const SERIES = ['var(--church-blue)', 'var(--gold)', '#0891b2', '#7c3aed', '#16a34a', '#ea580c', '#db2777', '#0f766e']

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

export default function AssetDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['asset-dashboard'],
    queryFn: assetsApi.dashboard,
    refetchInterval: 120_000,
  })

  if (isError) {
    return (
      <>
        <PageHeader title="Assets" />
        <div className={CARD}>
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        </div>
      </>
    )
  }

  const depreciationPct =
    data && data.totalCost > 0 ? Math.round((data.totalDepreciation / data.totalCost) * 100) : 0

  return (
    <>
      <PageHeader
        title="Assets"
        subtitle="Church inventory, value and upkeep"
        actions={
          <>
            <Link href="/admin/assets/maintenance" className={btn.secondary}>
              <Wrench className="size-4" aria-hidden />
              Maintenance
            </Link>
            <Link href="/admin/assets/register" className={btn.primary}>
              <Package className="size-4" aria-hidden />
              Asset Register
            </Link>
          </>
        }
      />

      <section className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 mb-4">
        <StatTile label="Total Assets" value={data?.totalAssets ?? 0} icon={Package} loading={isLoading} />
        <StatTile label="Purchase Cost" value={money(data?.totalCost ?? 0, { compact: true })} icon={Banknote} loading={isLoading} />
        <StatTile
          label="Current Value"
          value={money(data?.totalCurrentValue ?? 0, { compact: true })}
          hint="Computed, never stored"
          icon={Banknote}
          loading={isLoading}
        />
        <StatTile
          label="Depreciation"
          value={money(data?.totalDepreciation ?? 0, { compact: true })}
          hint={`${depreciationPct}% of cost`}
          icon={TrendingDown}
          loading={isLoading}
        />
        <StatTile label="Available" value={data?.available ?? 0} icon={CheckCircle2} tone="good" loading={isLoading} />
        <StatTile label="Checked Out" value={data?.assigned ?? 0} icon={ArrowLeftRight} loading={isLoading} />
        <StatTile
          label="Overdue Returns"
          value={data?.overdueReturns ?? 0}
          icon={AlertTriangle}
          tone={(data?.overdueReturns ?? 0) > 0 ? 'bad' : 'good'}
          loading={isLoading}
        />
        <StatTile
          label="In Maintenance"
          value={data?.inMaintenance ?? 0}
          icon={Wrench}
          tone={(data?.inMaintenance ?? 0) > 0 ? 'warn' : 'default'}
          loading={isLoading}
        />
        <StatTile
          label="Maintenance Due"
          value={data?.maintenanceDue ?? 0}
          hint="Next 30 days"
          icon={Clock}
          tone={(data?.maintenanceDue ?? 0) > 0 ? 'warn' : 'good'}
          loading={isLoading}
        />
        <StatTile
          label="Warranty Expiring"
          value={data?.warrantyExpiring ?? 0}
          hint="Next 60 days"
          icon={ShieldAlert}
          tone={(data?.warrantyExpiring ?? 0) > 0 ? 'warn' : 'good'}
          loading={isLoading}
        />
        <StatTile
          label="Pending Bookings"
          value={data?.pendingReservations ?? 0}
          icon={CalendarCheck}
          tone={(data?.pendingReservations ?? 0) > 0 ? 'warn' : 'default'}
          loading={isLoading}
        />
        <StatTile
          label="Upkeep This Year"
          value={money(data?.maintenanceSpendYear ?? 0, { compact: true })}
          icon={Wrench}
          loading={isLoading}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2 mb-4">
        <div className={`${CARD} p-4 sm:p-5`}>
          <h2 className="font-semibold mb-4">Value by Category</h2>
          {!isLoading && !data?.byCategory.length ? (
            <EmptyState icon={Package} title="No assets yet" subtitle="Register assets to see their value here." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.byCategory ?? []} layout="vertical">
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
                    width={120}
                  />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [money(v), 'Cost']} />
                  <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                    {(data?.byCategory ?? []).map((c, i) => (
                      <Cell key={c.label} fill={c.color || SERIES[i % SERIES.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={`${CARD} p-4 sm:p-5`}>
          <h2 className="font-semibold mb-4">Assets by Status</h2>
          {!isLoading && !data?.byStatus.length ? (
            <EmptyState icon={Package} title="No assets yet" />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.byStatus ?? []}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={56}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {(data?.byStatus ?? []).map((s, i) => (
                      <Cell key={s.label} fill={SERIES[i % SERIES.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(v: number, n) => [v, n as string]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${CARD} overflow-hidden`}>
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3">
            <h2 className="font-semibold">Upcoming Maintenance</h2>
            <Link href="/admin/assets/maintenance" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
          {!data?.upcomingMaintenance.length ? (
            <EmptyState icon={Wrench} title="Nothing scheduled" subtitle="Schedule preventive maintenance to see it here." />
          ) : (
            <ul className="divide-y divide-border">
              {data.upcomingMaintenance.map((m) => (
                <li key={m.id} className="px-4 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.title || m.maintenanceKind}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {m.assetName} · {m.assetCode}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {m.scheduledFor ?? m.nextDue ?? '—'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`${CARD} overflow-hidden`}>
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3">
            <h2 className="font-semibold">Warranties Expiring</h2>
            <Link href="/admin/assets/register?warranty=expiring" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
          {!data?.expiringWarranties.length ? (
            <EmptyState icon={ShieldAlert} title="No warranties expiring" subtitle="Nothing lapses in the next 60 days." />
          ) : (
            <ul className="divide-y divide-border">
              {data.expiringWarranties.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.assetCode} · {a.categoryName ?? '—'}</p>
                  </div>
                  <Chip className={WARRANTY_STYLE[a.warrantyStatus] ?? WARRANTY_STYLE.none}>
                    {a.warrantyExpires}
                  </Chip>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
