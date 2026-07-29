import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../admin/api'

export interface Household {
  id: string
  name: string
  address: string
  phone: string
  notes: string
  enabled: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export function useHouseholds() {
  return useQuery({
    queryKey: ['households'],
    queryFn: () => api.get<Household[]>('/households').then(r => r.data),
  })
}

export function useCreateHousehold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Household>) => api.post<Household>('/households', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['households'] }),
  })
}

export function useUpdateHousehold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Household> }) =>
      api.put<Household>(`/households/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['households'] }),
  })
}

export function useDeleteHousehold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/households/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['households'] }),
  })
}
