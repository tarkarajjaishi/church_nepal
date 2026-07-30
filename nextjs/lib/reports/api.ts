'use client'

import api from '@/lib/api'
import { money } from '@/lib/offerings/api'
import { duration } from '@/lib/helpdesk/api'

/**
 * Reporting client.
 *
 * Every report arrives in the same envelope with typed columns, so this file
 * has one formatter and the page has one renderer. Nine bespoke shapes would
 * mean nine components and nine chances for one of them to divide money by a
 * hundred twice.
 */

export type ColumnKind = 'text' | 'money' | 'number' | 'date' | 'percent' | 'duration'

export interface Column {
  key: string
  label: string
  kind: ColumnKind
}

export interface Stat {
  label: string
  value: number
  kind: ColumnKind
  hint: string | null
  /** Percentage against the comparison period; null when there is no baseline. */
  change: number | null
}

export interface Point { x: string; y: number }
export interface Series {
  name: string
  kind: ColumnKind
  points: Point[]
  /** The equal window before this report's period, aligned point-for-point. */
  comparison: boolean
}

export interface ReportInfo {
  key: string
  name: string
  description: string
  group: string
  permission: string
  /** False when this church has no tables for the module the report reads. */
  available: boolean
}

export interface Report {
  key: string
  name: string
  description: string
  from: string
  to: string
  compareFrom: string
  compareTo: string
  stats: Stat[]
  columns: Column[]
  rows: Record<string, unknown>[]
  series: Series[]
  /** Set when the module is not installed — an empty table means nothing here. */
  unavailable: string | null
  /** Rows before filters; `rows.length` is what survived them. */
  totalRows: number
  /** Column key → sum over the rows actually shown. */
  totals: Record<string, number>
}

export interface Filter {
  column: string
  /** eq · ne · contains · gt · gte · lt · lte · empty · not_empty */
  op: string
  value: string
}

export interface View {
  columns: string[]
  filters: Filter[]
  sort_column: string
  sort_desc: boolean
}

export const EMPTY_VIEW: View = { columns: [], filters: [], sort_column: '', sort_desc: false }

/** True when the view narrows or reorders anything. */
export function viewIsSet(v: View): boolean {
  return v.columns.length > 0 || v.filters.length > 0 || v.sort_column !== ''
}

/** Serialise for the query string. Empty means "the report's own view". */
export function viewParam(v: View): string | undefined {
  return viewIsSet(v) ? JSON.stringify(v) : undefined
}

export interface SavedReport {
  id: string
  name: string
  description: string
  reportKey: string
  period: string
  customFrom: string | null
  customTo: string | null
  columns: string[]
  filters: Filter[]
  sortColumn: string
  sortDesc: boolean
  isShared: boolean
  createdBy: string
  updatedAt: string
  reportName: string
  runnable: boolean
  scheduleCount: number
}

export const FILTER_OPS: { value: string; label: string; needsValue: boolean }[] = [
  { value: 'eq', label: 'is', needsValue: true },
  { value: 'ne', label: 'is not', needsValue: true },
  { value: 'contains', label: 'contains', needsValue: true },
  { value: 'gt', label: 'is more than', needsValue: true },
  { value: 'gte', label: 'is at least', needsValue: true },
  { value: 'lt', label: 'is less than', needsValue: true },
  { value: 'lte', label: 'is at most', needsValue: true },
  { value: 'empty', label: 'is blank', needsValue: false },
  { value: 'not_empty', label: 'is not blank', needsValue: false },
]

/**
 * Named periods, stored on a saved view instead of two dates.
 *
 * "This month" saved in July has to still mean this month in December — a
 * schedule that emails a fixed 1–31 July window every week is a stuck clock,
 * not a report.
 */
export const PERIODS: { value: string; label: string }[] = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'last_12_months', label: 'Last 12 months' },
  { value: 'this_year', label: 'This year' },
  { value: 'last_year', label: 'Last year' },
  { value: 'custom', label: 'Fixed dates' },
]

export interface ReportSchedule {
  id: string
  savedReportId: string
  frequency: 'daily' | 'weekly' | 'monthly'
  dayOfWeek: number
  dayOfMonth: number
  hour: number
  recipients: string
  isActive: boolean
  nextRunAt: string
  lastRunAt: string | null
  lastStatus: string
  lastError: string
  runCount: number
  createdBy: string
  reportName: string
}

export interface ReportDelivery {
  id: string
  reportName: string
  recipients: string
  status: string
  error: string
  periodFrom: string | null
  periodTo: string | null
  rowCount: number
  sentAt: string
}

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** "Every Monday at 07:00" — a schedule should read as a sentence. */
export function describeSchedule(s: ReportSchedule): string {
  const hour = `${String(s.hour).padStart(2, '0')}:00`
  if (s.frequency === 'daily') return `Every day at ${hour}`
  if (s.frequency === 'monthly') {
    const n = s.dayOfMonth
    const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'
    return `The ${n}${suffix} of each month at ${hour}`
  }
  return `Every ${DAYS[s.dayOfWeek] ?? 'Monday'} at ${hour}`
}

export const schedulesApi = {
  list: () => api.get<ReportSchedule[]>('/reports/schedules').then((r) => r.data),
  create: (body: Record<string, unknown>) =>
    api.post('/reports/schedules', body).then((r) => r.data),
  update: (id: string, body: Record<string, unknown>) =>
    api.put(`/reports/schedules/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/reports/schedules/${id}`).then((r) => r.data),
  sendNow: (id: string) => api.post(`/reports/schedules/${id}/send`).then((r) => r.data),
  deliveries: () => api.get<ReportDelivery[]>('/reports/deliveries').then((r) => r.data),
}

export const savedApi = {
  list: () => api.get<SavedReport[]>('/reports/saved').then((r) => r.data),
  create: (body: Record<string, unknown>) =>
    api.post('/reports/saved', body).then((r) => r.data),
  update: (id: string, body: Record<string, unknown>) =>
    api.put(`/reports/saved/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/reports/saved/${id}`).then((r) => r.data),
  run: (id: string) => api.get<Report>(`/reports/saved/${id}/run`).then((r) => r.data),
  exportUrl: (id: string, format = 'csv') => `/reports/saved/${id}/export?format=${format}`,
}

export interface DrillDown {
  label: string
  columns: Column[]
  rows: Record<string, unknown>[]
  total: number
  /** Where the full records live — a drill-down is a look, not the module. */
  link: string | null
}

/** Reports whose rows have records underneath them. */
export const DRILLABLE: Record<string, string> = {
  'giving-summary': 'donor',
  'giving-by-fund': 'fund',
  'offering-collections': 'category',
  membership: 'status',
  'worship-team': 'name',
  'asset-register': 'category',
  'library-circulation': 'title',
  'helpdesk-performance': 'area',
}

export const reportsApi = {
  catalogue: () => api.get<ReportInfo[]>('/reports').then((r) => r.data),
  drill: (key: string, value: string, from: string, to: string) =>
    api.get<DrillDown>(`/reports/${key}/drill`, { params: { value, from, to } })
      .then((r) => r.data),
  run: (key: string, from: string, to: string, view?: View) =>
    api.get<Report>(`/reports/${key}`, {
      params: { from, to, view: view ? viewParam(view) : undefined },
    }).then((r) => r.data),
  exportUrl: (key: string, from: string, to: string, format = 'csv', view?: View) => {
    const v = view ? viewParam(view) : undefined
    // The export carries the same view as the screen. One that ignored it
    // would be the most convincing wrong spreadsheet in the building.
    return `/reports/${key}/export?from=${from}&to=${to}&format=${format}` +
      (v ? `&view=${encodeURIComponent(v)}` : '')
  },
}

/**
 * Render a value the way its column says to.
 *
 * `money` is i64 minor units — divided here and nowhere else, which is why
 * every report can carry paisa all the way to the screen without each one
 * remembering to convert.
 */
export function formatCell(value: unknown, kind: ColumnKind): string {
  if (value === null || value === undefined || value === '') return '—'
  switch (kind) {
    case 'money':
      return money(Number(value))
    case 'percent':
      return `${Number(value).toFixed(1)}%`
    case 'duration':
      return duration(Number(value))
    case 'number':
      return Number(value).toLocaleString('en-IN')
    default:
      return String(value)
  }
}

/** Right-align anything numeric so columns of figures line up. */
export function isNumeric(kind: ColumnKind): boolean {
  return kind === 'money' || kind === 'number' || kind === 'percent' || kind === 'duration'
}

/** Named periods, so nobody has to type two dates to see last month. */
export function presets(today = new Date()): { label: string; from: string; to: string }[] {
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const y = today.getFullYear()
  const m = today.getMonth()
  const firstOf = (year: number, month: number) => new Date(Date.UTC(year, month, 1))
  const lastOf = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0))
  return [
    { label: 'This month', from: iso(firstOf(y, m)), to: iso(today) },
    { label: 'Last month', from: iso(firstOf(y, m - 1)), to: iso(lastOf(y, m - 1)) },
    { label: 'Last 3 months', from: iso(firstOf(y, m - 2)), to: iso(today) },
    { label: 'This year', from: iso(firstOf(y, 0)), to: iso(today) },
    { label: 'Last year', from: iso(firstOf(y - 1, 0)), to: iso(lastOf(y - 1, 11)) },
  ]
}
