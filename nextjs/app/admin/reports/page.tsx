'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  BarChart3, FileDown, Printer, TrendingUp, TrendingDown, Minus, PackageOpen, Search,
  Bookmark, BookmarkPlus, Pencil, Trash2, Users, FileText, Mail,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import Link from 'next/link'
import api from '@/lib/api'
import {
  reportsApi, savedApi, formatCell, isNumeric, presets, DRILLABLE,
  type Report, type Stat, type SavedReport,
} from '@/lib/reports/api'
import { SaveViewDialog } from '@/components/reports/SaveViewDialog'
import { DrillPanel } from '@/components/reports/DrillPanel'
import {
  CARD, PageHeader, EmptyState, ErrorState, TableSkeleton, Chip, btn, field, Label,
} from '@/components/offerings/ui'

/**
 * One page for every report.
 *
 * The server sends typed columns, so this renders any report — including ones
 * added later — without a line of code here. That is the whole reason the
 * envelope is shared.
 */

function Movement({ change }: { change: number | null }) {
  // No baseline is not a flat result and certainly not a 100% rise. It gets a
  // dash and a tooltip, because "—" invites the question and "0%" does not.
  if (change === null) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-muted-foreground"
        title="Nothing in the period before to compare with"
      >
        <Minus className="size-3" aria-hidden /> no baseline
      </span>
    )
  }
  const up = change > 0
  const flat = change === 0
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown
  const tone = flat ? 'text-muted-foreground' : up ? 'text-green-700' : 'text-red-700'
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${tone}`}>
      <Icon className="size-3" aria-hidden />
      {change > 0 ? '+' : ''}{change}%
    </span>
  )
}

function StatCard({ stat }: { stat: Stat }) {
  return (
    <div className={`${CARD} p-4`}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
      <p className="text-2xl font-semibold mt-1.5 tabular-nums">{formatCell(stat.value, stat.kind)}</p>
      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
        <Movement change={stat.change} />
        {stat.hint && <span className="text-xs text-muted-foreground">{stat.hint}</span>}
      </div>
    </div>
  )
}

function Chart({ report }: { report: Report }) {
  const series = report.series.find((s) => !s.comparison)
  const prior = report.series.find((s) => s.comparison)
  if (!series?.points.length) return null

  // A line for anything over time, bars for a breakdown by name. Both read the
  // same points; only the shape differs.
  const overTime = series.points.length > 3
  const divisor = series.kind === 'money' ? 100 : 1
  // The comparison is aligned by index, not by label — its months carry the
  // previous window's names, and plotting those on the axis would put "Jan"
  // and "Jul" side by side on the same tick.
  const data = series.points.map((p, i) => ({
    name: p.x,
    value: p.y / divisor,
    prior: prior ? (prior.points[i]?.y ?? 0) / divisor : undefined,
    priorName: prior?.points[i]?.x,
  }))
  const label = (v: number) =>
    series.kind === 'money'
      ? `Rs ${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
      : v.toLocaleString('en-IN')

  const tooltip = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    color: 'var(--foreground)',
  }
  const named = (v: number, key: string, item: { payload?: { priorName?: string } }) =>
    [label(v), key === 'prior' ? item?.payload?.priorName ?? 'Previous' : series.name] as [string, string]

  return (
    <section className={`${CARD} p-4 sm:p-5 mb-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="font-semibold">{series.name}</h2>
        {prior && (
          // The label comes from the series, not from the report's own
          // comparison dates: the chart shifts by whole months so its buckets
          // line up, while the headline figures compare day-for-day. Two
          // different windows, both correct — so each says which it is rather
          // than one borrowing the other's dates.
          <p className="text-xs text-muted-foreground flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded bg-primary" aria-hidden />
              {series.points[0]?.x}
              {series.points.length > 1 ? ` – ${series.points[series.points.length - 1]?.x}` : ''}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded border-t-2 border-dashed border-muted-foreground" aria-hidden />
              {prior.name}
            </span>
          </p>
        )}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {overTime ? (
            <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={70} tickFormatter={label} />
              <Tooltip formatter={named} contentStyle={tooltip} />
              {prior && (
                <Line
                  type="monotone"
                  dataKey="prior"
                  stroke="var(--muted-foreground)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}
              <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={70} tickFormatter={label} />
              <Tooltip formatter={named} cursor={{ fill: 'var(--muted)' }} contentStyle={tooltip} />
              <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export default function ReportsPage() {
  const qc = useQueryClient()
  const [key, setKey] = useState('giving-summary')
  // Which saved view is open, if any. `null` means an ad-hoc run of `key`.
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingView, setEditingView] = useState<SavedReport | null>(null)
  const [search, setSearch] = useState('')
  const p = useMemo(() => presets(), [])
  const [range, setRange] = useState({ from: p[3].from, to: p[3].to })
  const [downloading, setDownloading] = useState(false)
  const [drill, setDrill] = useState<string | null>(null)

  const { data: catalogue, isLoading: catLoading } = useQuery({
    queryKey: ['report-catalogue'],
    queryFn: reportsApi.catalogue,
  })
  const { data: saved } = useQuery({ queryKey: ['saved-reports'], queryFn: savedApi.list })

  const removeView = useMutation({
    mutationFn: (id: string) => savedApi.remove(id),
    onSuccess: (r: { schedulesStopped: number }) => {
      qc.invalidateQueries({ queryKey: ['saved-reports'] })
      setSavedId(null)
      toast.success(
        r.schedulesStopped > 0
          ? `View deleted — ${r.schedulesStopped} schedule(s) stopped`
          : 'View deleted'
      )
    },
    onError: (e: Error) => toast.error(e.message || 'Could not delete this view'),
  })

  // Follow the catalogue rather than assume: a librarian's first report is
  // whatever they can actually run, not the giving summary they cannot.
  const available = catalogue ?? []
  const selectedKey = available.some((r) => r.key === key) ? key : available[0]?.key ?? ''

  const openView = saved?.find((v) => v.id === savedId) ?? null

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: savedId
      ? ['report', 'saved', savedId]
      : ['report', selectedKey, range.from, range.to],
    queryFn: () =>
      savedId ? savedApi.run(savedId) : reportsApi.run(selectedKey, range.from, range.to),
    enabled: savedId ? true : !!selectedKey,
  })

  const download = async (format: 'csv' | 'pdf') => {
    if (!data) return
    setDownloading(true)
    try {
      // Fetched through the axios client so the bearer token and tenant host
      // are the same ones the table used. A bare <a href> would be
      // unauthenticated and quietly download a login page as a .csv.
      const route = savedId
        ? savedApi.exportUrl(savedId, format)
        : reportsApi.exportUrl(selectedKey, range.from, range.to, format)
      const res = await api.get(route, {
        // `arraybuffer`, not `blob` — a PDF that goes through any text
        // decoding on the way is a file no reader will open.
        responseType: 'arraybuffer',
        transformResponse: [(d) => d],
      })
      const mime = format === 'pdf' ? 'application/pdf' : 'text/csv'
      const href = URL.createObjectURL(new Blob([res.data as BlobPart], { type: mime }))
      const a = document.createElement('a')
      a.href = href
      a.download = savedId
        ? `${openView?.name ?? 'report'}.${format}`
        : `${selectedKey}-${range.from}-to-${range.to}.${format}`
      a.click()
      URL.revokeObjectURL(href)
      toast.success('Downloaded')
    } catch (e) {
      toast.error((e as Error).message || 'Could not export this report')
    } finally {
      setDownloading(false)
    }
  }

  const groups = available.reduce<Record<string, typeof available>>((acc, r) => {
    ;(acc[r.group] ??= []).push(r)
    return acc
  }, {})

  const q = search.trim().toLowerCase()
  const rows = (data?.rows ?? []).filter(
    (row) => !q || Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q))
  )

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Figures for a period, next to the period before it"
        actions={
          <>
            {/* A treasurer takes this to a board meeting. The print stylesheet
                below drops the chrome so the page comes out as a report
                rather than a screenshot of an admin panel. */}
            <Link href="/admin/reports/schedules" className={btn.secondary}>
              <Mail className="size-4" aria-hidden /> Scheduled
            </Link>
            <button
              type="button"
              onClick={() => { setEditingView(openView); setSaving(true) }}
              disabled={!data || !!data.unavailable}
              className={btn.secondary}
            >
              {openView ? <Pencil className="size-4" aria-hidden /> : <BookmarkPlus className="size-4" aria-hidden />}
              {openView ? 'Edit view' : 'Save view'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!data || !!data.unavailable}
              className={btn.secondary}
            >
              <Printer className="size-4" aria-hidden /> Print
            </button>
            <button
              type="button"
              onClick={() => download('pdf')}
              disabled={!data || downloading || !!data.unavailable}
              className={btn.secondary}
            >
              <FileText className="size-4" aria-hidden /> PDF
            </button>
            <button
              type="button"
              onClick={() => download('csv')}
              disabled={!data || downloading || !!data.unavailable}
              className={btn.secondary}
            >
              <FileDown className="size-4" aria-hidden />
              {downloading ? 'Preparing…' : 'CSV'}
            </button>
          </>
        }
      />

      {/* Period */}
      <div className={`${CARD} p-3 sm:p-4 mb-4 print:hidden`}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-1.5">
            {p.map((preset) => {
              const active = range.from === preset.from && range.to === preset.to
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setRange({ from: preset.from, to: preset.to })}
                  aria-pressed={active}
                  className={`min-h-9 px-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
          <div className="flex items-end gap-2 ml-auto">
            <div>
              <Label htmlFor="from">From</Label>
              <input id="from" type="date" className={field} value={range.from} onChange={(e) => setRange((s) => ({ ...s, from: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="to">To</Label>
              <input id="to" type="date" className={field} value={range.to} onChange={(e) => setRange((s) => ({ ...s, to: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Report picker */}
        <aside className="hidden lg:block w-60 shrink-0 print:hidden">
          <div className={`${CARD} p-2 sticky top-4`}>
            {catLoading ? (
              <div className="p-2 space-y-2" aria-busy="true">
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-8 rounded bg-muted animate-pulse" />)}
              </div>
            ) : !available.length ? (
              <p className="p-3 text-sm text-muted-foreground">No reports are available to you.</p>
            ) : (
              <>
              {!!saved?.length && (
                <div className="mb-3">
                  <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                    Saved views
                  </p>
                  <ul className="space-y-0.5">
                    {saved.map((v) => (
                      <li key={v.id} className="group flex items-center">
                        <button
                          type="button"
                          onClick={() => { setSavedId(v.id); setKey(v.reportKey) }}
                          aria-current={savedId === v.id ? 'page' : undefined}
                          title={v.description || v.reportName}
                          className={`flex-1 text-left flex items-center gap-2 min-h-9 px-3 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            savedId === v.id
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          <Bookmark className="size-3.5 shrink-0" aria-hidden />
                          <span className="truncate">{v.name}</span>
                          {v.scheduleCount > 0 && (
                            <span className="ml-auto text-[10px] text-muted-foreground shrink-0" title={`${v.scheduleCount} schedule(s)`}>
                              ✉ {v.scheduleCount}
                            </span>
                          )}
                          {!v.isShared && (
                            <Users className="ml-auto size-3 shrink-0 opacity-40" aria-label="Only you" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeView.mutate(v.id)}
                          disabled={removeView.isPending}
                          aria-label={`Delete ${v.name}`}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded text-muted-foreground hover:text-destructive transition-opacity"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="mb-3 last:mb-0">
                  <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                    {group}
                  </p>
                  <ul className="space-y-0.5">
                    {items.map((r) => (
                      <li key={r.key}>
                        <button
                          type="button"
                          onClick={() => { setKey(r.key); setSavedId(null) }}
                          aria-current={!savedId && selectedKey === r.key ? 'page' : undefined}
                          className={`w-full text-left flex items-center gap-2 min-h-9 px-3 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            !savedId && selectedKey === r.key
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          <span className="truncate">{r.name}</span>
                          {!r.available && (
                            <Chip className="ml-auto bg-muted text-muted-foreground border-border">off</Chip>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              </>
            )}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Mobile picker */}
          <select
            className={`${field} lg:hidden mb-4 print:hidden`}
            aria-label="Report"
            value={selectedKey}
            onChange={(e) => setKey(e.target.value)}
          >
            {available.map((r) => (
              <option key={r.key} value={r.key}>{r.group} — {r.name}</option>
            ))}
          </select>

          {error ? (
            <div className={CARD}><ErrorState message={(error as Error).message} onRetry={() => refetch()} /></div>
          ) : isLoading || !data ? (
            <div className="space-y-4" aria-busy="true">
              <div className="grid gap-4 sm:grid-cols-4">
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
              </div>
              <div className="h-64 rounded-2xl bg-muted animate-pulse" />
            </div>
          ) : data.unavailable ? (
            <div className={CARD}>
              <EmptyState
                icon={PackageOpen}
                title="This module is not installed"
                subtitle={data.unavailable}
              />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="font-semibold">{data.name}</h2>
                <p className="text-sm text-muted-foreground">{data.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.from} to {data.to}, compared with {data.compareFrom} to {data.compareTo}
                </p>
              </div>

              {data.stats.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
                  {data.stats.map((s) => <StatCard key={s.label} stat={s} />)}
                </div>
              )}

              <Chart report={data} />

              <div className={`${CARD} overflow-hidden`}>
                {data.rows.length > 12 && (
                  <div className="p-3 border-b border-border relative print:hidden">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden />
                    <input
                      className={`${field} pl-9`}
                      placeholder={`Filter ${data.rows.length} rows`}
                      aria-label="Filter rows"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                )}
                {!rows.length ? (
                  <EmptyState
                    icon={BarChart3}
                    title={q ? 'Nothing matches that' : 'Nothing in this period'}
                    subtitle={q ? undefined : 'Try a wider date range.'}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                        <tr>
                          {data.columns.map((c) => (
                            <th
                              key={c.key}
                              scope="col"
                              className={`px-4 py-3 font-medium text-muted-foreground whitespace-nowrap ${isNumeric(c.kind) ? 'text-right' : 'text-left'}`}
                            >
                              {c.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => {
                          const drillCol = DRILLABLE[data.key]
                          const drillValue = drillCol ? String(row[drillCol] ?? '') : ''
                          const canDrill = !!drillValue
                          return (
                          <tr
                            key={i}
                            onClick={canDrill ? () => setDrill(drillValue) : undefined}
                            className={`border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${canDrill ? 'cursor-pointer' : ''}`}
                            title={canDrill ? `See the records behind ${drillValue}` : undefined}
                          >
                            {data.columns.map((c) => (
                              <td
                                key={c.key}
                                className={`px-4 py-2.5 whitespace-nowrap ${isNumeric(c.kind) ? 'text-right tabular-nums' : ''}`}
                              >
                                {formatCell(row[c.key], c.kind)}
                              </td>
                            ))}
                          </tr>
                        )})}
                      </tbody>
                      {/* Totals over the rows actually shown, sent by the
                          server so the footer cannot disagree with the body
                          above it. Percentages are shares and have no
                          meaningful sum, so they are left blank. */}
                      {Object.keys(data.totals ?? {}).length > 0 && (
                        <tfoot className="border-t-2 border-border bg-muted/40">
                          <tr>
                            {data.columns.map((c, i) => (
                              <td
                                key={c.key}
                                className={`px-4 py-2.5 font-medium whitespace-nowrap ${isNumeric(c.kind) ? 'text-right tabular-nums' : ''}`}
                              >
                                {i === 0
                                  ? (q ? 'Total shown' : 'Total')
                                  : c.key in (data.totals ?? {})
                                  ? formatCell(data.totals[c.key], c.kind)
                                  : ''}
                              </td>
                            ))}
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
                {rows.length > 0 && (
                  <p className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
                    {rows.length}
                    {rows.length !== data.totalRows ? ` of ${data.totalRows}` : ''} row
                    {rows.length === 1 ? '' : 's'}
                    {data.rows.length !== data.totalRows && (
                      <span className="ml-1">
                        · {data.totalRows - data.rows.length} hidden by this view&apos;s filters
                      </span>
                    )}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {drill && data && (
        <DrillPanel
          reportKey={data.key}
          value={drill}
          from={data.from}
          to={data.to}
          onClose={() => setDrill(null)}
        />
      )}

      <SaveViewDialog
        open={saving}
        onClose={() => { setSaving(false); setEditingView(null) }}
        reportKey={openView?.reportKey ?? selectedKey}
        reportName={data?.name ?? ''}
        columns={openView?.columns ?? []}
        filters={openView?.filters ?? []}
        sortColumn={openView?.sortColumn ?? ''}
        sortDesc={openView?.sortDesc ?? false}
        editing={editingView}
      />
    </>
  )
}
