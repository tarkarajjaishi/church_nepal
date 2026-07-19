import { createResourceHooks } from './factory'

export interface Member {
  id: string
  name: string
  role: string
  since: string
  image: string
  enabled?: boolean
  sortOrder?: number
  createdAt?: string
}

export const memberHooks = createResourceHooks<Member>('members')
export const { useList: useMembers, useGet: useMember, useCreate: useCreateMember, useUpdate: useUpdateMember, useDelete: useDeleteMember, useToggle: useToggleMember, useReorder: useReorderMember } = memberHooks
