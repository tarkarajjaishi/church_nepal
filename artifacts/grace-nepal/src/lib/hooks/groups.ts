import { createResourceHooks } from './factory'

export interface Group {
  id: string
  slug: string
  name: string
  description: string
  meetingDay: string
  meetingTime: string
  location: string
  leaderId: number
  category: string
  imageUrl: string
  maxMembers: number
  enabled: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export const groupHooks = createResourceHooks<Group>('groups')
export const { useList: useGroups, useGet: useGroup, useCreate: useCreateGroup, useUpdate: useUpdateGroup, useDelete: useDeleteGroup, useToggle: useToggleGroup, useReorder: useReorderGroup } = groupHooks
