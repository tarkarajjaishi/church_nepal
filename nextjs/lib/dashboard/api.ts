'use client'

import api from '@/lib/api'

/**
 * Church dashboard client types.
 *
 * The API returns snake_case and lib/api.ts camelCases the response, so these
 * are the camelCase shapes. (Every composite in this codebase is flattened by
 * serde — see lib/presentation/api.ts for the lesson that taught.)
 */

export interface TrendPoint { label: string; value: number }
export interface Breakdown { label: string; value: number }

export interface PersonBrief {
  id: string
  name: string
  detail: string | null
  photo: string | null
}

export interface EventBrief {
  id: string
  title: string
  /** ISO-8601 text — events.date is VARCHAR, not a timestamp. */
  date: string
  displayDate: string | null
  time: string | null
  location: string | null
}

export interface TaskBrief {
  id: string
  title: string
  priority: string
  status: string
  dueDate: string | null
}

export interface ActivityItem {
  kind: 'person' | 'attendance' | 'offering' | 'donation' | 'prayer' | 'volunteer' | string
  title: string
  detail: string | null
  at: string
}

export interface ChurchDashboard {
  generatedAt: string
  attendance: {
    today: number
    thisWeek: number
    thisMonth: number
    average: number
    highest: number
    lowest: number
    growthPct: number
    weeklyTrend: TrendPoint[]
    byService: Breakdown[]
  }
  people: {
    total: number
    activeMembers: number
    visitors: number
    newThisMonth: number
    inactive: number
    pendingApplications: number
    households: number
    groups: number
  }
  finance: {
    offeringToday: number
    offeringThisMonth: number
    offeringThisYear: number
    pendingApproval: number
    pendingDeposits: number
    activeCampaigns: number
    currency: string
  }
  care: {
    prayerPending: number
    prayerAnswered: number
    prayerRecent: ActivityItem[]
    unreadNotifications: number
    unreadMessages: number
  }
  tasks: {
    open: number
    overdue: number
    dueToday: number
    completedThisWeek: number
    items: TaskBrief[]
  }
  birthdaysToday: PersonBrief[]
  anniversariesToday: PersonBrief[]
  newestPeople: PersonBrief[]
  eventsToday: EventBrief[]
  eventsUpcoming: EventBrief[]
  volunteerUpcoming: ActivityItem[]
  activity: ActivityItem[]
  /**
   * Which optional modules exist in this database. Used to render "not
   * installed" instead of a zero — a dashboard reporting "0 open tickets"
   * when no ticketing system exists is worse than reporting nothing.
   */
  modules: {
    helpDesk: boolean
    assets: boolean
    library: boolean
    expenses: boolean
    offerings: boolean
    presentation: boolean
  }
}

export const dashboardApi = {
  overview: async (): Promise<ChurchDashboard> => (await api.get('/church-dashboard')).data,
}

/** Relative time for activity feeds — "3m ago", "2h ago", "5d ago". */
export function ago(iso: string): string {
  // The API emits naive UTC timestamps without a zone, so treat them as UTC
  // rather than letting the browser read them as local time.
  const t = new Date(iso.endsWith('Z') ? iso : `${iso}Z`).getTime()
  const secs = Math.max(0, Math.round((Date.now() - t) / 1000))
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`
  return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}
