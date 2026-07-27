import { createResourceHooks } from './factory'

export interface Testimony {
  id: string
  name: string
  role: string
  quote: string
  image: string
  rating: number
  enabled?: boolean
  sortOrder?: number
  createdAt?: string
}

export const testimonyHooks = createResourceHooks<Testimony>('testimonies')
export const { useList: useTestimonies, useGet: useTestimony, useCreate: useCreateTestimony, useUpdate: useUpdateTestimony, useDelete: useDeleteTestimony, useToggle: useToggleTestimony, useReorder: useReorderTestimony } = testimonyHooks
