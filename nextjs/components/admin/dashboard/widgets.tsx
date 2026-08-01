'use client'

import { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { ColumnKind, Series, Stat } from '@/lib/reports/api'
import { formatCell } from '@/lib/reports/api'

/**
 * Dashboard widgets.
 *
 * Every colour here is a theme token — never `bg-white`, `text-gray-900` or a
 * literal hex. The old dashboard hardcoded the light palette and only looked
 * right in dark mode because a pile of global `!important` remaps rewrote it
 * afterwards. Tokens mean the same markup is correct in both themes with no
 * second rulebook.
 *
 * The other rule: a number is only ever shown when the API actually returned
 * one. A tile that prints `0` because a request failed is worse than a blank —
 * it is a wrong number presented as a fact.
 */

/** Shown wherever a value could not be loaded, so absence never reads as zero. */
export const NO_VALUE = '—'

export function Card({
  children, className = '', padded = true,
}: { children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border bg-card shadow-sm ${padded ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({
  title, subtitle, action,
}: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate font-semibold text-card-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/**
 * A KPI tile.
 *
 * `change` is null whenever the report has no comparable baseline, and then no
 * delta chip is drawn at all. Rendering "0%" for "we don't know" was the single
 * most common way these dashboards told a confident lie.
 */
export function StatCard({
  label, value, kind, hint, change, icon, loading, unavailable,
}: {
  label: string
  value: number | null
  kind: ColumnKind
  hint?: string | null
  change?: number | null
  icon?: ReactNode
  loading?: boolean
  unavailable?: boolean
}) {
  const known = !loading && !unavailable && value !== null && value !== undefined
  return (
    <Card className="min-w-0">
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground" title={label}>
          {label}
        </p>
        {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      </div>

      {loading ? (
        <div className="mt-3 h-8 w-24 animate-pulse rounded bg-muted" />
      ) : known ? (
        <p className="mt-2 text-2xl font-bold text-card-foreground">{formatCell(value, kind)}</p>
      ) : (
        <p className="mt-2 text-2xl font-bold text-muted-foreground" title={unavailable ? 'This module is not installed for this church' : 'Could not be loaded'}>
          {NO_VALUE}
        </p>
      )}

      <div className="mt-1 flex items-center gap-1.5 text-xs">
        {known && change !== null && change !== undefined ? (
          <Delta change={change} />
        ) : hint ? (
          <span className="truncate text-muted-foreground" title={hint}>{hint}</span>
        ) : null}
      </div>
    </Card>
  )
}

/** Up is not automatically good, so this is neutral about meaning — only direction. */
function Delta({ change }: { change: number }) {
  const flat = Math.abs(change) < 0.05
  const Icon = flat ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight
  const tone = flat
    ? 'text-muted-foreground'
    : change > 0
      ? 'text-[var(--good)]'
      : 'text-[var(--danger)]'
  return (
    <span className={`inline-flex items-center gap-0.5 font-medium ${tone}`}>
      <Icon className="size-3.5" aria-hidden="true" />
      {flat ? 'no change' : `${Math.abs(change).toFixed(1)}%`}
      <span className="ml-1 font-normal text-muted-foreground">vs previous period</span>
    </span>
  )
}

const tooltipStyle = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '0.75rem',
  color: 'var(--foreground)',
  fontSize: '12px',
}

/** Recharts needs one row per x with a column per series. */
function toRows(series: Series[]): Record<string, string | number>[] {
  const primary = series[0]
  if (!primary) return []
  return primary.points.map((p, i) => {
    const row: Record<string, string | number> = { x: p.x, [primary.name]: p.y }
    series.slice(1).forEach((s) => {
      const point = s.points[i]
      if (point) row[s.name] = point.y
    })
    return row
  })
}

export function TrendChart({
  series, kind, height = 260, variant = 'area',
}: { series: Series[]; kind: ColumnKind; height?: number; variant?: 'area' | 'line' | 'bar' }) {
  const rows = toRows(series)
  const hasData = rows.length > 0 && series.some((s) => s.points.some((p) => p.y !== 0))

  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground"
        style={{ height }}
      >
        Nothing recorded in this period
      </div>
    )
  }

  const axis = { fontSize: 11, fill: 'var(--muted-foreground)' }
  const fmt = (v: number) => formatCell(v, kind)
  const names = series.map((s) => s.name)
  // The comparison window is drawn muted and dashed so it reads as background.
  const colourFor = (i: number) => (series[i]?.comparison ? 'var(--muted-foreground)' : 'var(--primary)')

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {variant === 'bar' ? (
          <BarChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="x" tick={axis} stroke="var(--border)" tickLine={false} />
            <YAxis tick={axis} stroke="var(--border)" tickLine={false} width={72} tickFormatter={fmt} />
            <Tooltip formatter={fmt} contentStyle={tooltipStyle} cursor={{ fill: 'var(--muted)' }} />
            {names.map((n, i) => (
              <Bar key={n} dataKey={n} fill={colourFor(i)} radius={[6, 6, 0, 0]} />
            ))}
          </BarChart>
        ) : variant === 'line' ? (
          <LineChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="x" tick={axis} stroke="var(--border)" tickLine={false} />
            <YAxis tick={axis} stroke="var(--border)" tickLine={false} width={56} tickFormatter={fmt} />
            <Tooltip formatter={fmt} contentStyle={tooltipStyle} />
            {names.map((n, i) => (
              <Line
                key={n}
                type="monotone"
                dataKey={n}
                stroke={colourFor(i)}
                strokeWidth={2}
                strokeDasharray={series[i]?.comparison ? '4 4' : undefined}
                dot={{ r: 3, strokeWidth: 0, fill: colourFor(i) }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        ) : (
          <AreaChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="x" tick={axis} stroke="var(--border)" tickLine={false} />
            <YAxis tick={axis} stroke="var(--border)" tickLine={false} width={72} tickFormatter={fmt} />
            <Tooltip formatter={fmt} contentStyle={tooltipStyle} />
            {names.map((n, i) =>
              series[i]?.comparison ? (
                <Line key={n} type="monotone" dataKey={n} stroke="var(--muted-foreground)"
                  strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              ) : (
                <Area key={n} type="monotone" dataKey={n} stroke="var(--primary)" strokeWidth={2}
                  fill="url(#dashFill)" dot={false} activeDot={{ r: 5 }} />
              ),
            )}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

/** A labelled progress bar — used for campaign targets. */
export function Progress({
  label, value, target, kind = 'money',
}: { label: string; value: number; target: number; kind?: ColumnKind }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate text-card-foreground">{label}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {formatCell(value, kind)} <span aria-hidden="true">/</span> {formatCell(target, kind)}
        </span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${Math.round(pct)}% of target`}
      >
        <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/** Empty-state copy that distinguishes "nothing yet" from "not installed". */
export function Unavailable({ reason }: { reason: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {reason}
    </div>
  )
}
