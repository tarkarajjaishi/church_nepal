import { createResourceHooks } from './factory'

export interface ServiceTime {
  id: string
  name: string
  nameNe: string
  day: string
  time: string
  icon: string
  sortOrder: number
  enabled?: boolean
}

export const serviceTimeHooks = createResourceHooks<ServiceTime>('service-times')
export const { useList: useServiceTimes, useGet: useServiceTime, useCreate: useCreateServiceTime, useUpdate: useUpdateServiceTime, useDelete: useDeleteServiceTime, useToggle: useToggleServiceTime, useReorder: useReorderServiceTime } = serviceTimeHooks
