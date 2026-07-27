import { createResourceHooks } from './factory'

export interface Ministry {
  id: string
  name: string
  nameNe: string
  description: string
  leader: string
  meeting: string
  image: string
  icon: string
  enabled?: boolean
  sortOrder?: number
  createdAt?: string
}

export const ministryHooks = createResourceHooks<Ministry>('ministries')
export const { useList: useMinistries, useGet: useMinistry, useCreate: useCreateMinistry, useUpdate: useUpdateMinistry, useDelete: useDeleteMinistry, useToggle: useToggleMinistry, useReorder: useReorderMinistry } = ministryHooks
