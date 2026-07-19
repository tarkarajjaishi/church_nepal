import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../admin/api'

export interface AttendanceRecord {
  id: string
  eventId: string
  personId: string
  name: string
  serviceDate: string
  serviceName: string
  checkedInAt?: string
}

export function useAttendanceList(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: () => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get<AttendanceRecord[]>(`/attendance${qs}`).then(r => r.data)
    },
  })
}

export function useAttendanceStats() {
  return useQuery({
    queryKey: ['attendance', 'stats'],
    queryFn: () => api.get('/attendance/stats').then(r => r.data),
  })
}

export function useCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<AttendanceRecord>) => api.post('/attendance', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attendance'] }) },
  })
}
