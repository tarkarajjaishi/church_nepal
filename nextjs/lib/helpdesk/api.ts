'use client'

import api from '@/lib/api'

/**
 * Help Desk client API.
 *
 * `ageHours`, `responseHoursTaken`, `responseBreached` and `resolveBreached`
 * are computed by the server on every read. They are correct at the instant
 * of the response and stale a minute later — never cache them, and never
 * recompute them here from a different clock.
 *
 * The axios interceptor camelCases every response key but leaves requests
 * alone, so request bodies stay snake_case.
 */

export type Priority = 'low' | 'normal' | 'high' | 'urgent'
export type Status = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed' | 'cancelled'

export interface HelpdeskCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  responseHours: number
  resolveHours: number
  sortOrder: number
  isActive: boolean
  openCount: number
}

export interface Ticket {
  id: string
  ticketCode: string
  subject: string
  body: string
  categoryId: string | null
  categoryName: string | null
  categoryColor: string | null
  personId: string | null
  reporterName: string
  reporterContact: string
  assetId: string | null
  assetName: string | null
  location: string
  priority: Priority
  status: Status
  assigneeName: string
  assigneeContact: string
  openedAt: string
  firstRespondedAt: string | null
  resolvedAt: string | null
  closedAt: string | null
  dueAt: string | null
  resolution: string
  reopenCount: number
  commentCount: number
  responseTargetHours: number
  resolveTargetHours: number
  ageHours: number
  responseHoursTaken: number | null
  responseBreached: boolean
  resolveBreached: boolean
}

export interface TicketPage {
  data: Ticket[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface Comment {
  id: string
  ticketId: string
  authorName: string
  body: string
  isInternal: boolean
  /** Empty for a person typing; set for status/assignment events. */
  eventKind: string
  createdAt: string
}

export interface TicketBrief {
  id: string
  ticketCode: string
  subject: string
  status: Status
  openedAt: string
}

export interface TicketDetail {
  ticket: Ticket
  comments: Comment[]
  related: TicketBrief[]
}

export interface Article {
  id: string
  title: string
  slug: string
  body: string
  categoryId: string | null
  categoryName: string | null
  keywords: string
  isPublished: boolean
  viewCount: number
  helpfulCount: number
  updatedAt: string
}

export interface AgentLoad {
  name: string
  openTickets: number
  resolvedTickets: number
  breached: number
  avgResolveHours: number | null
}

export interface LabelCount {
  label: string
  color: string | null
  count: number
}

export interface HelpdeskDashboard {
  open: number
  unassigned: number
  inProgress: number
  waiting: number
  resolvedThisMonth: number
  urgentOpen: number
  breaching: number
  awaitingFirstReply: number
  reopened: number
  avgResponseHours: number | null
  avgResolveHours: number | null
  byCategory: LabelCount[]
  byPriority: LabelCount[]
  agents: AgentLoad[]
  oldestOpen: Ticket[]
  needsReply: Ticket[]
}

export interface TicketFilters {
  search?: string
  status?: string
  priority?: string
  category_id?: string
  assignee?: string
  view?: 'unassigned' | 'breached' | 'awaiting_reply'
  page?: number
  per_page?: number
  sort?: string
  dir?: 'asc' | 'desc'
}

const clean = (o: object) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ''))

export const helpdeskApi = {
  dashboard: () => api.get<HelpdeskDashboard>('/helpdesk/dashboard').then((r) => r.data),
  categories: () => api.get<HelpdeskCategory[]>('/helpdesk/categories').then((r) => r.data),
  createCategory: (body: Record<string, unknown>) =>
    api.post('/helpdesk/categories', body).then((r) => r.data),

  tickets: (f: TicketFilters = {}) =>
    api.get<TicketPage>('/helpdesk/tickets', { params: clean(f) }).then((r) => r.data),
  ticket: (id: string) => api.get<TicketDetail>(`/helpdesk/tickets/${id}`).then((r) => r.data),
  createTicket: (body: Record<string, unknown>) =>
    api.post('/helpdesk/tickets', body).then((r) => r.data),
  updateTicket: (id: string, body: Record<string, unknown>) =>
    api.put(`/helpdesk/tickets/${id}`, body).then((r) => r.data),
  claim: (id: string, body: Record<string, unknown>) =>
    api.post(`/helpdesk/tickets/${id}/claim`, body).then((r) => r.data),
  release: (id: string) => api.post(`/helpdesk/tickets/${id}/release`).then((r) => r.data),
  setStatus: (id: string, body: Record<string, unknown>) =>
    api.post(`/helpdesk/tickets/${id}/status`, body).then((r) => r.data),
  comment: (id: string, body: Record<string, unknown>) =>
    api.post(`/helpdesk/tickets/${id}/comments`, body).then((r) => r.data),

  articles: (p: { search?: string; category_id?: string } = {}) =>
    api.get<Article[]>('/helpdesk/articles', { params: clean(p) }).then((r) => r.data),
  createArticle: (body: Record<string, unknown>) =>
    api.post('/helpdesk/articles', body).then((r) => r.data),
  markHelpful: (id: string) =>
    api.post(`/helpdesk/articles/${id}/helpful`).then((r) => r.data),
}

/** "3d 4h", "6h", "just now" — an age a person can read at a glance. */
export function duration(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return '—'
  if (hours < 1) return 'under an hour'
  if (hours < 24) return `${hours}h`
  const d = Math.floor(hours / 24)
  const h = hours % 24
  return h ? `${d}d ${h}h` : `${d}d`
}

export const PRIORITY_TONE: Record<Priority, string> = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-amber-100 text-amber-800 border-amber-200',
  normal: 'bg-muted text-foreground border-border',
  low: 'bg-muted text-muted-foreground border-border',
}

export const STATUS_TONE: Record<Status, string> = {
  open: 'bg-church-blue-surface text-church-blue-ink border-transparent',
  in_progress: 'bg-amber-100 text-amber-800 border-amber-200',
  waiting: 'bg-muted text-muted-foreground border-border',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-muted text-muted-foreground border-border',
}

export const STATUS_LABEL: Record<Status, string> = {
  open: 'Open',
  in_progress: 'In progress',
  waiting: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
  cancelled: 'Cancelled',
}

/** Why a ticket is flagged, in words. Empty when it is fine. */
export function breachReason(t: Ticket): string {
  if (t.responseBreached && t.resolveBreached) return 'Past both the reply and fix targets'
  if (t.responseBreached) {
    return t.responseHoursTaken === null
      ? `No reply after ${duration(t.ageHours)} (target ${t.responseTargetHours}h)`
      : `First reply took ${duration(t.responseHoursTaken)} (target ${t.responseTargetHours}h)`
  }
  if (t.resolveBreached) return `Past the ${t.resolveTargetHours}h fix target`
  return ''
}
