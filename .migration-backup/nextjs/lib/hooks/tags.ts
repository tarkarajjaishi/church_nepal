import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../admin/api'

export interface Tag {
  id: string
  name: string
  color: string
  createdAt?: string
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get<Tag[]>('/tags').then(r => r.data),
  })
}

export function useCreateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Tag>) => api.post<Tag>('/tags', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })
}

export function useDeleteTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tags/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })
}
