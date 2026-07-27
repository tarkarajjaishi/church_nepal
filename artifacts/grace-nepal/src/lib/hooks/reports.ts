import { useQuery } from '@tanstack/react-query'
import api from '../admin/api'

export function useGivingSummary(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['reports', 'giving-summary', params],
    queryFn: () => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get(`/reports/giving-summary${qs}`).then(r => r.data)
    },
  })
}

export function usePeopleSummary(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['reports', 'people-summary', params],
    queryFn: () => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get(`/reports/people-summary${qs}`).then(r => r.data)
    },
  })
}
