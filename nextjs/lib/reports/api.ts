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
}

export const reportsApi = {
  catalogue: () => api.get<ReportInfo[]>('/reports').then((r) => r.data),
  run: (key: string, from: string, to: string) =>
    api.get<Report>(`/reports/${key}`, { params: { from, to } }).then((r) => r.data),
  exportUrl: (key: string, from: string, to: string) =>
    `/reports/${key}/export?from=${from}&to=${to}`,
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
