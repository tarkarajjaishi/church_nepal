import { createResourceHooks } from './factory'

export interface Verse {
  id: string
  text: string
  refText: string
  ne: string
  enabled?: boolean
  sortOrder?: number
  isPinned?: boolean
  createdAt?: string
}

export const verseHooks = createResourceHooks<Verse>('verses')
export const { useList: useVerses, useGet: useVerse, useCreate: useCreateVerse, useUpdate: useUpdateVerse, useDelete: useDeleteVerse, useToggle: useToggleVerse, useReorder: useReorderVerse } = verseHooks
