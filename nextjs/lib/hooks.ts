import { useQuery, useMutation } from "@tanstack/react-query"
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
