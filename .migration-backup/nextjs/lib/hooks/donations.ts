import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../admin/api'

export interface Donation {
  id: string
  donorName: string
  donorEmail: string
  donorPhone: string
  amount: number
  paymentMethod: string
  campaignId: string
  fundId: string
  transactionId: string
  status: string
  notes: string
  createdAt?: string
  updatedAt?: string
}

export function useDonations(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['donations', params],
    queryFn: () => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get<Donation[]>(`/donations${qs}`).then(r => r.data)
    },
  })
}

export function useDonationStats(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['donations', 'stats', params],
    queryFn: () => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get(`/donations/stats${qs}`).then(r => r.data)
    },
  })
}

export function useDonationsByDonor(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['donations', 'by-donor', params],
    queryFn: () => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return api.get(`/donations/by-donor${qs}`).then(r => r.data)
    },
  })
}

export function useCreateDonation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Donation>) => api.post<Donation>('/donations', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['donations'] }),
  })
}
