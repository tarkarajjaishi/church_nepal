import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../admin/api'
import { createResourceHooks } from './factory'

export interface Offering {
  id: string
  serviceDate: string
  serviceName: string
  offeringType: string
  totalAmount: number
  currency: string
  recordedBy: string
  notes: string
  createdAt?: string
  updatedAt?: string
}

export const offeringHooks = createResourceHooks<Offering>('offerings')
export const { useList: useOfferings, useGet: useOffering, useCreate: useCreateOffering, useUpdate: useUpdateOffering, useDelete: useDeleteOffering } = offeringHooks

export function useOfferingStats() {
  return useQuery({
    queryKey: ['offerings', 'stats'],
    queryFn: () => api.get('/offerings/stats').then(r => r.data),
  })
}
