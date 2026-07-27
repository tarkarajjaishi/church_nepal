import { createResourceHooks } from './factory'

export interface ContactInfoRecord {
  id: string
  address: string
  phone: string
  email: string
  hours: string
  mapUrl: string
  createdAt?: string
  updatedAt?: string
}

export const contactInfoHooks = createResourceHooks<ContactInfoRecord>('contact-info')
export const { useList: useContactInfoRecords, useGet: useContactInfoRecord, useCreate: useCreateContactInfo, useUpdate: useUpdateContactInfo, useDelete: useDeleteContactInfo } = contactInfoHooks
