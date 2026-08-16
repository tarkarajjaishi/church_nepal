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
  /** Optional because the API never sends it: `ChurchEvent` in the backend has
   *  no category column. The "Filter by category" select on /events therefore
   *  always renders empty — the UI was built ahead of the field. */
  category?: string
  capacity?: number
  enabled?: boolean
  sortOrder?: number
  createdAt?: string
}

export const eventHooks = createResourceHooks<ChurchEvent>('events')
export const { useList: useEvents, useGet: useEvent, useCreate: useCreateEvent, useUpdate: useUpdateEvent, useDelete: useDeleteEvent, useToggle: useToggleEvent, useReorder: useReorderEvent } = eventHooks
