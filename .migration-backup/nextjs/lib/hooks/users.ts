import { createResourceHooks } from './factory'

export interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt?: string
  updatedAt?: string
}

export const userHooks = createResourceHooks<User>('users')
export const { useList: useUsers, useGet: useUser, useCreate: useCreateUser, useUpdate: useUpdateUser, useDelete: useDeleteUser } = userHooks
