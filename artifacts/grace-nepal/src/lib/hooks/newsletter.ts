import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../admin/api'

export function useNewsletterSubscribers() {
  return useQuery({
    queryKey: ['newsletter', 'subscribers'],
    queryFn: () => api.get('/newsletter/subscribers').then(r => r.data),
  })
}

export function useNewsletterCount() {
  return useQuery({
    queryKey: ['newsletter', 'count'],
    queryFn: () => api.get('/newsletter/count').then(r => r.data),
  })
}

export function useSubscribeNewsletter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { email: string; name?: string }) =>
      api.post('/newsletter/subscribe', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['newsletter'] }),
  })
}

export function useUnsubscribeNewsletter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (email: string) => api.post(`/newsletter/unsubscribe/${encodeURIComponent(email)}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['newsletter'] }),
  })
}
