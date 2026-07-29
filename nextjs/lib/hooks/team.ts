import { createResourceHooks } from './factory'

export interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  image: string
  category: string
  featured: boolean
  enabled: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export const teamHooks = createResourceHooks<TeamMember>('team')
export const { useList: useTeamMembers, useGet: useTeamMember, useCreate: useCreateTeamMember, useUpdate: useUpdateTeamMember, useDelete: useDeleteTeamMember, useToggle: useToggleTeamMember, useReorder: useReorderTeamMember } = teamHooks
