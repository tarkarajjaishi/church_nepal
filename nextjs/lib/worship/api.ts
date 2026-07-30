'use client'

import api from '@/lib/api'

/**
 * Worship Management client API.
 *
 * Composite responses in this module are explicitly nested (`{ service, items,
 * team }`), unlike the presentation module which flattens with
 * `#[serde(flatten)]`. That is deliberate — flattening cost four separate
 * client bugs there where a wrapper was assumed and undefined was read.
 */

export interface WorshipRole {
  id: string
  name: string
  slug: string
  category: string
  icon: string
  sortOrder: number
  isActive: boolean
}

export interface WorshipMember {
  id: string
  personId: string | null
  name: string
  photo: string
  phone: string
  email: string
  voiceType: string
  experience: string
  emergencyContact: string
  emergencyPhone: string
  notes: string
  isLeader: boolean
  isActive: boolean
  roles: string[]
  roleIds: string[]
}

export interface WorshipService {
  id: string
  name: string
  serviceDate: string
  startTime: string | null
  endTime: string | null
  theme: string
  speaker: string
  serviceType: string
  description: string
  status: string
  worshipLeader: string
  notes: string
  playlistId: string | null
}

export interface WorshipServiceRow {
  id: string
  name: string
  serviceDate: string
  startTime: string | null
  theme: string
  speaker: string
  serviceType: string
  status: string
  worshipLeader: string
  itemCount: number
  songCount: number
  teamCount: number
  plannedSeconds: number
}

export interface ServicePlanItem {
  id: string
  serviceId: string
  sortOrder: number
  itemKind: string
  title: string
  songId: string | null
  songTitle: string | null
  songDefaultKey: string | null
  songBpm: number | null
  /** Per-service transposition; the song's own key is left alone. */
  songKey: string
  leader: string
  plannedSeconds: number
  actualSeconds: number | null
  notes: string
}

export interface ServiceAssignment {
  id: string
  serviceId: string
  memberId: string
  memberName: string
  memberPhoto: string
  roleId: string | null
  roleName: string | null
  roleCategory: string | null
  status: string
  notes: string
}

export interface ServicePlan {
  service: WorshipService
  items: ServicePlanItem[]
  team: ServiceAssignment[]
  plannedSeconds: number
  actualSeconds: number
}

export interface Rehearsal {
  id: string
  serviceId: string | null
  serviceName: string | null
  title: string
  rehearsalDate: string
  startTime: string | null
  endTime: string | null
  location: string
  agenda: string
  notes: string
  status: string
  invitedCount: number
  presentCount: number
}

export interface WorshipDashboard {
  upcomingServices: WorshipServiceRow[]
  nextRehearsal: Rehearsal | null
  activeMembers: number
  totalMembers: number
  leaders: number
  songsTotal: number
  servicesThisMonth: number
  pendingInvites: number
  mostUsedSongs: { id: string; title: string; songKey: string; useCount: number; lastUsedAt: string | null }[]
  uncoveredRoles: { roleName: string; memberCount: number }[]
}

const qs = (o: Record<string, unknown>) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const worshipApi = {
  dashboard: async (): Promise<WorshipDashboard> => (await api.get('/worship/dashboard')).data,

  roles: async (): Promise<WorshipRole[]> => (await api.get('/worship/roles')).data,

  members: async (f: { roleId?: string; active?: boolean; search?: string } = {}): Promise<WorshipMember[]> =>
    (await api.get(`/worship/members${qs({ role_id: f.roleId, active: f.active, search: f.search })}`)).data,

  createMember: async (b: Record<string, unknown>): Promise<WorshipMember> =>
    (await api.post('/worship/members', b)).data,

  updateMember: async (id: string, b: Record<string, unknown>): Promise<WorshipMember> =>
    (await api.put(`/worship/members/${id}`, b)).data,

  deleteMember: async (id: string) => (await api.delete(`/worship/members/${id}`)).data,

  services: async (f: { upcoming?: boolean; status?: string } = {}): Promise<WorshipServiceRow[]> =>
    (await api.get(`/worship/services${qs(f)}`)).data,

  service: async (id: string): Promise<ServicePlan> => (await api.get(`/worship/services/${id}`)).data,

  createService: async (b: Record<string, unknown>): Promise<WorshipService> =>
    (await api.post('/worship/services', b)).data,

  updateService: async (id: string, b: Record<string, unknown>): Promise<WorshipService> =>
    (await api.put(`/worship/services/${id}`, b)).data,

  deleteService: async (id: string) => (await api.delete(`/worship/services/${id}`)).data,

  /** Body carries the new date; a blank name derives one from the source. */
  duplicateService: async (id: string, b: { name: string; service_date: string }): Promise<ServicePlan> =>
    (await api.post(`/worship/services/${id}/duplicate`, b)).data,

  addItem: async (serviceId: string, b: Record<string, unknown>): Promise<ServicePlanItem> =>
    (await api.post(`/worship/services/${serviceId}/items`, b)).data,

  updateItem: async (id: string, b: Record<string, unknown>) =>
    (await api.put(`/worship/items/${id}`, b)).data,

  deleteItem: async (id: string) => (await api.delete(`/worship/items/${id}`)).data,

  reorderItems: async (serviceId: string, ids: string[]) =>
    (await api.put(`/worship/services/${serviceId}/items/reorder`, { ids })).data,

  assign: async (serviceId: string, b: { member_id: string; role_id?: string; status?: string }) =>
    (await api.post(`/worship/services/${serviceId}/assign`, b)).data,

  unassign: async (id: string) => (await api.delete(`/worship/assignments/${id}`)).data,

  assignmentStatus: async (id: string, status: string) =>
    (await api.post(`/worship/assignments/${id}/status/${status}`, {})).data,

  rehearsals: async (): Promise<Rehearsal[]> => (await api.get('/worship/rehearsals')).data,

  createRehearsal: async (b: Record<string, unknown>): Promise<Rehearsal> =>
    (await api.post('/worship/rehearsals', b)).data,

  deleteRehearsal: async (id: string) => (await api.delete(`/worship/rehearsals/${id}`)).data,

  setAttendance: async (rehearsalId: string, b: { member_id: string; status: string }) =>
    (await api.post(`/worship/rehearsals/${rehearsalId}/attendance`, b)).data,
}

/** Running-order item kinds, in the order a service usually runs. */
export const ITEM_KINDS = [
  { value: 'countdown', label: 'Countdown', seconds: 300 },
  { value: 'welcome', label: 'Welcome', seconds: 180 },
  { value: 'prayer', label: 'Prayer', seconds: 120 },
  { value: 'song', label: 'Song', seconds: 300 },
  { value: 'announcements', label: 'Announcements', seconds: 240 },
  { value: 'offering', label: 'Offering', seconds: 300 },
  { value: 'reading', label: 'Bible Reading', seconds: 180 },
  { value: 'special', label: 'Special Music', seconds: 300 },
  { value: 'sermon', label: 'Message', seconds: 1800 },
  { value: 'communion', label: 'Communion', seconds: 600 },
  { value: 'dismissal', label: 'Benediction', seconds: 120 },
  { value: 'other', label: 'Other', seconds: 180 },
] as const

export const SERVICE_TYPES = [
  { value: 'sunday', label: 'Sunday Service' },
  { value: 'midweek', label: 'Midweek' },
  { value: 'youth', label: 'Youth' },
  { value: 'prayer', label: 'Prayer Meeting' },
  { value: 'special', label: 'Special Service' },
]

export const SERVICE_STATUSES = ['draft', 'planned', 'confirmed', 'completed', 'cancelled']

export const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  planned: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

export const ASSIGNMENT_STYLE: Record<string, string> = {
  invited: 'bg-amber-100 text-amber-800 border-amber-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
}

export const VOICE_TYPES = ['none', 'soprano', 'alto', 'tenor', 'bass']
export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced']

/** Seconds to "1h 08m" / "8m 30s" for plan durations. */
export function duration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return sec > 0 ? `${m}m ${String(sec).padStart(2, '0')}s` : `${m}m`
  return `${sec}s`
}
