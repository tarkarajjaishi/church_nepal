import { createResourceHooks } from './factory'

export interface Sermon {
  id: string
  title: string
  speaker: string
  date: string
  duration: string
  series: string
  topic: string
  image: string
  description: string
  enabled?: boolean
  sortOrder?: number
  createdAt?: string
  updatedAt?: string
}

export const sermonHooks = createResourceHooks<Sermon>('sermons')
export const { useList: useSermons, useGet: useSermon, useCreate: useCreateSermon, useUpdate: useUpdateSermon, useDelete: useDeleteSermon, useToggle: useToggleSermon, useReorder: useReorderSermon } = sermonHooks
