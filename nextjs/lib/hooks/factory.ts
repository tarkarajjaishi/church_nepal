import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../admin/api'

/**
 * Factory that generates standard react-query hooks for a resource.
 * All hooks use the admin api instance (bearer token + snake↔camel mapping).
 *
 * Usage:
 *   const { useList, useGet, useCreate, useUpdate, useDelete, useToggle } =
 *     createResourceHooks<Sermon>('sermons')
 */
export function createResourceHooks<T extends { id: string }>(endpoint: string) {
  const key = endpoint // react-query cache key

  function useList(params?: Record<string, string>, pagination?: { page?: number; per_page?: number }) {
    return useQuery({
      queryKey: [key, params, pagination],
      queryFn: () => {
        const allParams: Record<string, string> = { ...params }
        if (pagination?.page) allParams.page = String(pagination.page)
        if (pagination?.per_page) allParams.per_page = String(pagination.per_page)
        const qs = Object.keys(allParams).length ? '?' + new URLSearchParams(allParams).toString() : ''
        return api.get<T[]>(`/${endpoint}${qs}`).then(r => r.data)
      },
    })
  }

  function useGet(id: string | undefined) {
    return useQuery({
      queryKey: [key, id],
      queryFn: () => api.get<T>(`/${endpoint}/${id}`).then(r => r.data),
      enabled: !!id,
    })
  }

  function useCreate() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (data: Partial<T>) => api.post<T>(`/${endpoint}`, data).then(r => r.data),
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
    })
  }

  function useUpdate() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<T> }) =>
        api.put<T>(`/${endpoint}/${id}`, data).then(r => r.data),
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
    })
  }

  function useDelete() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => api.delete(`/${endpoint}/${id}`),
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
    })
  }

  function useToggle() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => api.put(`/${endpoint}/${id}/toggle`),
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
    })
  }

  function useReorder() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: ({ id, sortOrder }: { id: string; sortOrder: number }) =>
        api.put(`/${endpoint}/${id}/reorder`, { sortOrder }),
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
    })
  }

  function usePin() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => api.put(`/${endpoint}/${id}/pin`),
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
    })
  }

  return { useList, useGet, useCreate, useUpdate, useDelete, useToggle, useReorder, usePin }
}
