import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../admin/api'

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
  createdAt?: string
  updatedAt?: string
}

export function useContentBlocks() {
  return useQuery({
    queryKey: ['content-blocks'],
    queryFn: () => api.get<ContentBlock[]>('/content-blocks').then(r => r.data),
  })
}

export function useContentBlockByKey(key: string) {
  return useQuery({
    queryKey: ['content-blocks', 'key', key],
    queryFn: () => api.get<ContentBlock>(`/content-blocks/key/${key}`).then(r => r.data),
    enabled: !!key,
  })
}

export function useEnabledContentBlocks() {
  return useQuery({
    queryKey: ['content-blocks', 'enabled'],
    queryFn: () => api.get<ContentBlock[]>('/content-blocks/enabled').then(r => r.data),
  })
}

export function useCreateContentBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<ContentBlock>) => api.post<ContentBlock>('/content-blocks', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-blocks'] }),
  })
}

export function useUpdateContentBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContentBlock> }) =>
      api.put<ContentBlock>(`/content-blocks/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-blocks'] }),
  })
}

export function useDeleteContentBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/content-blocks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-blocks'] }),
  })
}

export function useToggleContentBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.put(`/content-blocks/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-blocks'] }),
  })
}

export function useBatchReorderContentBlocks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (blocks: { id: string; sortOrder: number }[]) =>
      api.patch('/content-blocks/reorder', blocks),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-blocks'] }),
  })
}
