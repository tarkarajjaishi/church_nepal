import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../admin/api'

export interface Broadcast {
  id: string
  subject: string
  body: string
  broadcastType: string
  status: string
  recipientGroup: string
  recipientCount: number
  sentAt?: string
  createdAt?: string
  updatedAt?: string
}

export function useBroadcasts() {
  return useQuery({
    queryKey: ['broadcasts'],
    queryFn: () => api.get<Broadcast[]>('/broadcasts').then(r => r.data),
  })
}

export function useCreateBroadcast() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Broadcast>) => api.post<Broadcast>('/broadcasts', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['broadcasts'] }),
  })
}

export function useSendBroadcast() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/broadcasts/${id}/send`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['broadcasts'] }),
  })
}

export function useDeleteBroadcast() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/broadcasts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['broadcasts'] }),
  })
}
