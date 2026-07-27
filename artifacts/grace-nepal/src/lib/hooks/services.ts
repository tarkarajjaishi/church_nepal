import { createResourceHooks } from './factory'

export interface Service {
  id: string
  title: string
  description: string
  category: string
  price: number
  image: string
  featured: boolean
  enabled: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export const serviceHooks = createResourceHooks<Service>('services')
export const { useList: useServices, useGet: useService, useCreate: useCreateService, useUpdate: useUpdateService, useDelete: useDeleteService, useToggle: useToggleService, useReorder: useReorderService } = serviceHooks
