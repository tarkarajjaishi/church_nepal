import { createResourceHooks } from './factory'

export interface Fund {
  id: string
  name: string
  description: string
  fundType: string
  isActive: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export const fundHooks = createResourceHooks<Fund>('funds')
export const { useList: useFunds, useGet: useFund, useCreate: useCreateFund, useUpdate: useUpdateFund, useDelete: useDeleteFund } = fundHooks
