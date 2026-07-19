import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../admin/api'

export interface MemberApplication {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  dateOfBirth: string
  gender: string
  maritalStatus: string
  baptismStatus: string
  churchBackground: string
  howFound: string
  interestAreas: string
  testimony: string
  status: string
  reviewedBy: string
  reviewedAt: string
  notes: string
  createdAt?: string
  updatedAt?: string
}

export function useMemberApplications() {
  return useQuery({
    queryKey: ['member-applications'],
    queryFn: () => api.get<MemberApplication[]>('/member-applications').then(r => r.data),
  })
}

export function useMemberApplicationStats() {
  return useQuery({
    queryKey: ['member-applications', 'stats'],
    queryFn: () => api.get('/member-applications/stats').then(r => r.data),
  })
}

export function useUpdateMemberApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MemberApplication> }) =>
      api.put(`/member-applications/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['member-applications'] }),
  })
}

export function useDeleteMemberApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/member-applications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['member-applications'] }),
  })
}
