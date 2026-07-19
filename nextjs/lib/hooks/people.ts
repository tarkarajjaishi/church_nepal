import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../admin/api'

export interface Person {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  photo: string
  memberStatus: string
  householdId: string
  notes: string
  joinedDate: string
  enabled: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export function usePeople(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['people', params],
    queryFn: () => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get<Person[]>(`/people${qs}`).then(r => r.data)
    },
  })
}

export function usePerson(id: string | undefined) {
  return useQuery({
    queryKey: ['people', id],
    queryFn: () => api.get<Person>(`/people/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function usePeopleStats() {
  return useQuery({
    queryKey: ['people', 'stats'],
    queryFn: () => api.get('/people/stats').then(r => r.data),
  })
}

export function useCreatePerson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Person>) => api.post<Person>('/people', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people'] }) },
  })
}

export function useUpdatePerson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Person> }) =>
      api.put<Person>(`/people/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people'] }) },
  })
}

export function useDeletePerson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/people/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people'] }) },
  })
}

export function useTogglePerson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.put(`/people/${id}/toggle`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['people'] }) },
  })
}

// Person notes
export function usePersonNotes(personId: string | undefined) {
  return useQuery({
    queryKey: ['people', personId, 'notes'],
    queryFn: () => api.get(`/people/${personId}/notes`).then(r => r.data),
    enabled: !!personId,
  })
}

export function useAddPersonNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ personId, note }: { personId: string; note: string }) =>
      api.post(`/people/${personId}/notes`, { note }).then(r => r.data),
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['people', vars.personId, 'notes'] }) },
  })
}

export function useDeletePersonNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ personId, noteId }: { personId: string; noteId: string }) =>
      api.delete(`/people/${personId}/notes/${noteId}`),
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['people', vars.personId, 'notes'] }) },
  })
}

// Person tags
export function usePersonTags(personId: string | undefined) {
  return useQuery({
    queryKey: ['people', personId, 'tags'],
    queryFn: () => api.get(`/people/${personId}/tags`).then(r => r.data),
    enabled: !!personId,
  })
}

export function useAddPersonTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ personId, tagId }: { personId: string; tagId: string }) =>
      api.post(`/people/${personId}/tags/${tagId}`),
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['people', vars.personId, 'tags'] }) },
  })
}

export function useRemovePersonTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ personId, tagId }: { personId: string; tagId: string }) =>
      api.delete(`/people/${personId}/tags/${tagId}`),
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['people', vars.personId, 'tags'] }) },
  })
}
