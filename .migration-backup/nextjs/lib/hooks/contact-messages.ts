import { createResourceHooks } from './factory'

export interface ContactMessage {
  id: string
  messageType: string
  name: string
  email: string
  phone: string
  message: string
  category: string
  anonymous: boolean
  visitDate: string
  status: string
  createdAt?: string
}

export const contactMessageHooks = createResourceHooks<ContactMessage>('contact-messages')
export const { useList: useContactMessages, useGet: useContactMessage, useCreate: useCreateContactMessage, useDelete: useDeleteContactMessage } = contactMessageHooks
