import { useQuery } from '@tanstack/react-query'
import api from '../admin/api'

export interface UploadItem {
  filename: string
  url: string
  originalName: string
  contentType: string
  size: number
  createdAt: string
}

export function useUploads() {
  return useQuery({
    queryKey: ['uploads'],
    queryFn: () => api.get<UploadItem[]>('/uploads').then(r => r.data),
  })
}
