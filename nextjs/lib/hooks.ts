import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchAll, fetchOne } from "./api"
import api from "./admin/api"
import {
  serviceTimes as fallbackServiceTimes,
  sermons as fallbackSermons,
  ministries as fallbackMinistries,
  events as fallbackEvents,
  leaders as fallbackLeaders,
  gallery as fallbackGallery,
  testimonies as fallbackTestimonies,
  notices as fallbackNotices,
  members as fallbackMembers,
  verses as fallbackVerses,
  campaigns as fallbackCampaigns,
} from "./data"
import type {
  ServiceTime,
  Sermon,
  Ministry,
  ChurchEvent,
  Leader,
  GalleryItem,
  Testimony,
  Notice,
  Member,
} from "./data"

export interface Verse { text: string; ref: string; ne: string; }

export interface Campaign {
  id: string
  title: string
  raised: number
  goal: number
}

// Generic hook wrapper for react-query with loading/error properties
function wrapQuery<T>(query: any) {
  return {
    ...query,
    loading: query.isPending,
    error: query.error,
  }
}

// Admin-specific typed hooks (using generic fetch)
export function useBlogPosts() {
  const query = useQuery({
    queryKey: ["blog"],
    queryFn: () => api.get("/blog").then(r => r.data),
  })
  return wrapQuery(query)
}

export function useUsers() {
  const query = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get("/users").then(r => r.data),
  })
  return wrapQuery(query)
}

export function useServices() {
  const query = useQuery({
    queryKey: ["services"],
    queryFn: () => api.get("/services").then(r => r.data),
  })
  return wrapQuery(query)
}

export function usePortfolio() {
  const query = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => api.get("/portfolio").then(r => r.data),
  })
  return wrapQuery(query)
}

export function useDashboardStats() {
  const query = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api.get("/dashboard/stats").then(r => r.data),
  })
  return wrapQuery(query)
}

// Homepage hooks (existing)
export function useServiceTimes() {
  return useQuery({
    queryKey: ["service-times"],
    queryFn: () => fetchAll<ServiceTime>("service-times"),
    placeholderData: fallbackServiceTimes,
  })
}

export function useSermons() {
  return useQuery({
    queryKey: ["sermons"],
    queryFn: () => fetchAll<Sermon>("sermons"),
    placeholderData: fallbackSermons,
  })
}

export function useSermon(id: string | undefined) {
  return useQuery({
    queryKey: ["sermons", id],
    queryFn: () => fetchOne<Sermon>("sermons", id!),
    enabled: !!id,
    placeholderData: () => fallbackSermons.find((s) => s.id === id),
  })
}

export function useMinistries() {
  return useQuery({
    queryKey: ["ministries"],
    queryFn: () => fetchAll<Ministry>("ministries"),
    placeholderData: fallbackMinistries,
  })
}

export function useMinistry(id: string | undefined) {
  return useQuery({
    queryKey: ["ministries", id],
    queryFn: () => fetchOne<Ministry>("ministries", id!),
    enabled: !!id,
    placeholderData: () => fallbackMinistries.find((m) => m.id === id),
  })
}

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: () => fetchAll<ChurchEvent>("events"),
    placeholderData: fallbackEvents,
  })
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => fetchOne<ChurchEvent>("events", id!),
    enabled: !!id,
    placeholderData: () => fallbackEvents.find((e) => e.id === id),
  })
}

export function useLeaders() {
  return useQuery({
    queryKey: ["leaders"],
    queryFn: () => fetchAll<Leader>("leaders"),
    placeholderData: fallbackLeaders,
  })
}

export function useGallery() {
  return useQuery({
    queryKey: ["gallery"],
    queryFn: () => fetchAll<GalleryItem>("gallery"),
    placeholderData: fallbackGallery,
  })
}

export function useTestimonies() {
  return useQuery({
    queryKey: ["testimonies"],
    queryFn: () => fetchAll<Testimony>("testimonies"),
    placeholderData: fallbackTestimonies,
  })
}

export function useNotices() {
  return useQuery({
    queryKey: ["notices"],
    queryFn: () => fetchAll<Notice>("notices"),
    placeholderData: fallbackNotices,
  })
}

export function useMembers() {
  return useQuery({
    queryKey: ["members"],
    queryFn: () => fetchAll<Member>("members"),
    placeholderData: fallbackMembers,
  })
}

export function useVerses() {
  return useQuery({
    queryKey: ["verses"],
    queryFn: () => fetchAll<Verse>("verses"),
    placeholderData: fallbackVerses,
  })
}

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: () => fetchAll<Campaign>("campaigns"),
    placeholderData: fallbackCampaigns,
  })
}

// Enabled-only variants for homepage (filter by enabled=true)
export function useEnabledServiceTimes() {
  const q = useServiceTimes()
  return { ...q, data: (q.data ?? []).filter((s: any) => s.enabled !== false) }
}
export function useEnabledSermons() {
  const q = useSermons()
  return { ...q, data: (q.data ?? []).filter((s: any) => s.enabled !== false) }
}
export function useEnabledMinistries() {
  const q = useMinistries()
  return { ...q, data: (q.data ?? []).filter((m: any) => m.enabled !== false) }
}
export function useEnabledEvents() {
  const q = useEvents()
  return { ...q, data: (q.data ?? []).filter((e: any) => e.enabled !== false) }
}
export function useEnabledTestimonies() {
  const q = useTestimonies()
  return { ...q, data: (q.data ?? []).filter((t: any) => t.enabled !== false) }
}
export function useEnabledGallery() {
  const q = useGallery()
  return { ...q, data: (q.data ?? []).filter((g: any) => g.enabled !== false) }
}
export function useEnabledCampaigns() {
  const q = useCampaigns()
  return { ...q, data: (q.data ?? []).filter((c: any) => c.enabled !== false) }
}

// Groups
export function useGroups() {
  const query = useQuery({
    queryKey: ["groups"],
    queryFn: () => api.get("/groups").then(r => r.data),
  })
  return wrapQuery(query)
}

export function useEnabledGroups() {
  const q = useGroups()
  return { ...q, data: (q.data ?? []).filter((g: any) => g.enabled !== false) }
}

export function useEnabledVerses() {
  const q = useVerses()
  return { ...q, data: (q.data ?? []).filter((v: any) => v.enabled !== false) }
}
export function useEnabledNotices() {
  const q = useNotices()
  return { ...q, data: (q.data ?? []).filter((n: any) => n.enabled !== false) }
}
export function useEnabledMembers() {
  const q = useMembers()
  return { ...q, data: (q.data ?? []).filter((m: any) => m.enabled !== false) }
}

// Section-level enabled settings (master toggle per section)
export function useSections() {
  return useQuery({
    queryKey: ["settings", "sections"],
    queryFn: () => api.get("/settings/sections").then(r => r.data),
    placeholderData: {} as Record<string, boolean>,
  })
}

export function useToggleSection() {
  const { mutate, ...rest } = useMutation({
    mutationFn: (section: string) =>
      api.put(`/settings/sections/${section}/toggle`).then(r => r.data),
  })
  return { toggleSection: mutate, ...rest }
}

// Content blocks for homepage sections (hero, what_to_expect, welcome, etc.)
export interface ContentBlock {
  id: string
  sectionKey: string
  title: string
  subtitle: string | null
  body: string | null
  image: string | null
  icon: string | null
  items: any
  enabled: boolean | null
  sortOrder: number | null
}

export function useContentBlocks() {
  return useQuery({
    queryKey: ["content-blocks"],
    queryFn: async () => {
      const { data } = await api.get("/content-blocks")
      // Handle both paginated responses and direct arrays
      return Array.isArray(data) ? (data as ContentBlock[]) : (data as any).data ?? []
    },
    placeholderData: [] as ContentBlock[],
  })
}

export function useContentBlock(key: string) {
  const { data: blocks = [] } = useContentBlocks()
  return blocks.find((b: ContentBlock) => b.sectionKey === key) ?? null
}

// Contact Info hook
export interface ContactInfo {
  id: string
  address: string
  phone: string
  email: string
  hours: string
  mapUrl: string
}

export function useContactInfo() {
  return useQuery({
    queryKey: ["contact-info"],
    queryFn: () => fetchAll<ContactInfo>("contact-info"),
  })
}

// ── Admin dashboard list hooks (authenticated reads) ────────────────────────
function useDashboardList(endpoint: string) {
  const query = useQuery({
    queryKey: ["dashboard", endpoint],
    queryFn: async () => {
      const { data } = await api.get(`/${endpoint}`)
      // Handle both paginated responses and direct arrays
      return Array.isArray(data) ? data : (data as any).data ?? []
    },
  })
  return wrapQuery(query)
}
export function useDashboardSermons() { return useDashboardList("sermons") }
export function useDashboardEvents() { return useDashboardList("events") }
export function useDashboardMinistries() { return useDashboardList("ministries") }
export function useDashboardNotices() { return useDashboardList("notices") }
export function useDashboardLeaders() { return useDashboardList("leaders") }
export function useDashboardGallery() { return useDashboardList("gallery") }
export function useDashboardTestimonies() { return useDashboardList("testimonies") }
export function useDashboardMembers() { return useDashboardList("members") }
export function useDashboardServiceTimes() { return useDashboardList("service-times") }
export function useDashboardVerses() { return useDashboardList("verses") }
export function useDashboardCampaigns() { return useDashboardList("campaigns") }

// ── Settings ────────────────────────────────────────────────────────────────
export function useSettings() {
  const query = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get("/settings").then(r => r.data),
  })
  return wrapQuery(query)
}
export function useUpsertSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { key: string; value: string }) =>
      api.put(`/settings/${payload.key}`, { value: payload.value }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  })
}

// ── Report summaries ─────────────────────────────────────────────────────────
export function useGivingSummary() {
  return useQuery({
    queryKey: ["reports", "giving-summary"],
    queryFn: () => api.get("/reports/giving-summary").then(r => r.data),
  })
}
export function usePeopleSummary() {
  return useQuery({
    queryKey: ["reports", "people-summary"],
    queryFn: () => api.get("/reports/people-summary").then(r => r.data),
  })
}

// ── Generic CRUD hook factory (used by admin CrudPage) ──────────────────────
export function createResourceHooks<T = any>(endpoint: string) {
  const base = `/${endpoint}`
  const key = [endpoint]
  const invalidate = (qc: ReturnType<typeof useQueryClient>) =>
    qc.invalidateQueries({ queryKey: key })

  return {
    useList: () =>
      wrapQuery(useQuery({
        queryKey: key,
        queryFn: async () => {
          const { data } = await api.get(`${base}`)
          // Handle both paginated responses and direct arrays
          return Array.isArray(data) ? data : (data as any).data ?? []
        }
      })),
    useCreate: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: (data: Partial<T>) => api.post(base, data).then(r => r.data),
        onSuccess: () => invalidate(qc),
      })
    },
    useUpdate: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: (vars: { id: string; data: Partial<T> }) =>
          api.put(`${base}/${vars.id}`, vars.data).then(r => r.data),
        onSuccess: () => invalidate(qc),
      })
    },
    useDelete: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: (id: string) => api.delete(`${base}/${id}`).then(r => r.data),
        onSuccess: () => invalidate(qc),
      })
    },
    useToggle: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: (id: string) => api.put(`${base}/${id}/toggle`).then(r => r.data),
        onSuccess: () => invalidate(qc),
      })
    },
    useReorder: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: (vars: { id: string; sortOrder?: number; sort_order?: number }) =>
          api.put(`${base}/${vars.id}/reorder`, { sort_order: vars.sortOrder ?? vars.sort_order }).then(r => r.data),
        onSuccess: () => invalidate(qc),
      })
    },
    usePin: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: (id: string) => api.put(`${base}/${id}/pin`).then(r => r.data),
        onSuccess: () => invalidate(qc),
      })
    },
  }
}


