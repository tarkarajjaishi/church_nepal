import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../admin/api'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data),
  })
}

export function useSetting(key: string) {
  return useQuery({
    queryKey: ['settings', key],
    queryFn: () => api.get(`/settings/${key}`).then(r => r.data),
    enabled: !!key,
  })
}

export function useUpsertSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.put(`/settings/${key}`, { value }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

export function useSettingsSections() {
  return useQuery({
    queryKey: ['settings', 'sections'],
    queryFn: () => api.get('/settings/sections').then(r => r.data),
  })
}

export function useToggleSection() {
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: (section: string) => api.put(`/settings/sections/${section}/toggle`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
  return { toggleSection: mutation.mutate, ...mutation }
}
