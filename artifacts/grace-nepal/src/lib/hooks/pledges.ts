import { createResourceHooks } from './factory'

export interface Pledge {
  id: string
  campaignId: string
  personName: string
  personEmail: string
  amount: number
  fulfilledAmount: number
  status: string
  notes: string
  createdAt?: string
  updatedAt?: string
}

export const pledgeHooks = createResourceHooks<Pledge>('pledges')
export const { useList: usePledges, useGet: usePledge, useCreate: useCreatePledge, useUpdate: useUpdatePledge, useDelete: useDeletePledge } = pledgeHooks
