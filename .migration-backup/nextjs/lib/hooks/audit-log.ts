import { useQuery } from '@tanstack/react-query'
import api from '../admin/api'

export function useAuditLog(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['audit-log', params],
    queryFn: () => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get(`/audit-log${qs}`).then(r => r.data)
    },
  })
}
