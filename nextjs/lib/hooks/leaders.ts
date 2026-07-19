import { createResourceHooks } from './factory'

export interface Leader {
  id: string
  name: string
  role: string
  category: string
  image: string
  bio: string
  socialLinks?: any
  enabled?: boolean
  sortOrder?: number
  createdAt?: string
}

export const leaderHooks = createResourceHooks<Leader>('leaders')
export const { useList: useLeaders, useGet: useLeader, useCreate: useCreateLeader, useUpdate: useUpdateLeader, useDelete: useDeleteLeader, useToggle: useToggleLeader, useReorder: useReorderLeader } = leaderHooks
