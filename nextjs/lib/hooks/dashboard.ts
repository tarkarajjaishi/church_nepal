import { useQuery } from '@tanstack/react-query'
import api from '../admin/api'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data),
  })
}

export function useDashboardSermons() {
  return useQuery({
    queryKey: ['dashboard', 'sermons'],
    queryFn: () => api.get('/sermons').then(r => r.data),
  })
}

export function useDashboardEvents() {
  return useQuery({
    queryKey: ['dashboard', 'events'],
    queryFn: () => api.get('/events').then(r => r.data),
  })
}

export function useDashboardMinistries() {
  return useQuery({
    queryKey: ['dashboard', 'ministries'],
    queryFn: () => api.get('/ministries').then(r => r.data),
  })
}

export function useDashboardNotices() {
  return useQuery({
    queryKey: ['dashboard', 'notices'],
    queryFn: () => api.get('/notices').then(r => r.data),
  })
}
