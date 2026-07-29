import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../admin/api'

export interface VolunteerTeam {
  id: string
  name: string
  description: string
  color: string
  enabled: boolean
  sortOrder: number
  createdAt?: string
}

export interface VolunteerShift {
  id: string
  teamId: string
  title: string
  shiftDate: string
  startTime: string
  endTime: string
  location: string
  slots: number
  notes: string
  createdAt?: string
}

export interface VolunteerAssignment {
  id: string
  shiftId: string
  personId: string
  name: string
  status: string
  notes: string
  createdAt?: string
}

// Teams
export function useVolunteerTeams() {
  return useQuery({
    queryKey: ['volunteer-teams'],
    queryFn: () => api.get<VolunteerTeam[]>('/volunteer-teams').then(r => r.data),
  })
}

export function useCreateVolunteerTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<VolunteerTeam>) => api.post<VolunteerTeam>('/volunteer-teams', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volunteer-teams'] }),
  })
}

export function useUpdateVolunteerTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VolunteerTeam> }) =>
      api.put<VolunteerTeam>(`/volunteer-teams/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volunteer-teams'] }),
  })
}

export function useToggleVolunteerTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.put(`/volunteer-teams/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volunteer-teams'] }),
  })
}

export function useDeleteVolunteerTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/volunteer-teams/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volunteer-teams'] }),
  })
}

// Shifts
export function useVolunteerShifts(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['volunteer-shifts', params],
    queryFn: () => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get<VolunteerShift[]>(`/volunteer-shifts${qs}`).then(r => r.data)
    },
  })
}

export function useCreateVolunteerShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<VolunteerShift>) => api.post<VolunteerShift>('/volunteer-shifts', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volunteer-shifts'] }),
  })
}

export function useUpdateVolunteerShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VolunteerShift> }) =>
      api.put<VolunteerShift>(`/volunteer-shifts/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volunteer-shifts'] }),
  })
}

export function useDeleteVolunteerShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/volunteer-shifts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volunteer-shifts'] }),
  })
}

// Assignments
export function useVolunteerAssignments(shiftId: string | undefined) {
  return useQuery({
    queryKey: ['volunteer-shifts', shiftId],
    queryFn: () => api.get<VolunteerShift>(`/volunteer-shifts/${shiftId}`).then(r => r.data),
    enabled: !!shiftId,
  })
}

export function useCreateVolunteerAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<VolunteerAssignment>) => api.post('/volunteer-assignments', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volunteer-shifts'] }),
  })
}

export function useDeleteVolunteerAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/volunteer-assignments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volunteer-shifts'] }),
  })
}
