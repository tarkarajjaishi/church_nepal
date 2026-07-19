import { createResourceHooks } from './factory'

export interface ChurchEvent {
  id: string
  title: string
  date: string
  displayDate: string
  time: string
  location: string
  image: string
  description: string
  enabled?: boolean
  sortOrder?: number
  createdAt?: string
}

export const eventHooks = createResourceHooks<ChurchEvent>('events')
export const { useList: useEvents, useGet: useEvent, useCreate: useCreateEvent, useUpdate: useUpdateEvent, useDelete: useDeleteEvent, useToggle: useToggleEvent, useReorder: useReorderEvent } = eventHooks
