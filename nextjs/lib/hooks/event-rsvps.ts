import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../admin/api'

export interface EventRsvp {
  id: string
  eventId: string
  name: string
  email: string
  phone?: string
  guests: number
  status: string
  createdAt?: string
}

export function useEventRsvps(eventId: string | undefined) {
  return useQuery({
    queryKey: ['events', eventId, 'rsvps'],
    queryFn: () => api.get<EventRsvp[]>(`/events/${eventId}/rsvps`).then(r => r.data),
    enabled: !!eventId,
  })
}

export function useCreateEventRsvp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: Partial<EventRsvp> }) =>
      api.post<EventRsvp>(`/events/${eventId}/rsvps`, data).then(r => r.data),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['events', vars.eventId, 'rsvps'] }),
  })
}

export function useDeleteEventRsvp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/rsvps/${id}`),
    onSuccess: () => qc.invalidateQueries({ predicate: (q: any) => Array.isArray(q.queryKey) && q.queryKey[0] === 'events' }),
  })
}
