import { createResourceHooks } from './factory'

export interface GalleryItem {
  id: string
  title: string
  category: string
  image: string
  enabled?: boolean
  sortOrder?: number
  createdAt?: string
}

export const galleryHooks = createResourceHooks<GalleryItem>('gallery')
export const { useList: useGalleryItems, useGet: useGalleryItem, useCreate: useCreateGalleryItem, useUpdate: useUpdateGalleryItem, useDelete: useDeleteGalleryItem, useToggle: useToggleGalleryItem, useReorder: useReorderGalleryItem } = galleryHooks
