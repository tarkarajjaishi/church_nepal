import { createResourceHooks } from './factory'

export interface Notice {
  id: string
  title: string
  date: string
  category: string
  text: string
  urgent: boolean
  enabled?: boolean
  sortOrder?: number
  createdAt?: string
}

export const noticeHooks = createResourceHooks<Notice>('notices')
export const { useList: useNotices, useGet: useNotice, useCreate: useCreateNotice, useUpdate: useUpdateNotice, useDelete: useDeleteNotice, useToggle: useToggleNotice, useReorder: useReorderNotice } = noticeHooks
