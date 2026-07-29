import { useQuery } from '@tanstack/react-query'
import api from '../admin/api'
import type { PaginatedResponse } from './factory'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data),
  })
}

export function useDashboardSermons() {
  return useQuery({
    queryKey: ['dashboard', 'sermons'],
    queryFn: () => api.get<PaginatedResponse<any>>('/sermons').then(r => r.data.data),
  })
}

export function useDashboardEvents() {
  return useQuery({
    queryKey: ['dashboard', 'events'],
    queryFn: () => api.get<PaginatedResponse<any>>('/events').then(r => r.data.data),
  })
}

export function useDashboardMinistries() {
  return useQuery({
    queryKey: ['dashboard', 'ministries'],
    queryFn: () => api.get<PaginatedResponse<any>>('/ministries').then(r => r.data.data),
  })
}

export function useDashboardNotices() {
  return useQuery({
    queryKey: ['dashboard', 'notices'],
    queryFn: () => api.get<PaginatedResponse<any>>('/notices').then(r => r.data.data),
  })
}
