import { createResourceHooks } from './factory'

export interface Todo {
  id: string
  title: string
  description: string
  priority: string
  status: string
  dueDate: string
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export const todoHooks = createResourceHooks<Todo>('todos')
export const { useList: useTodos, useGet: useTodo, useCreate: useCreateTodo, useUpdate: useUpdateTodo, useDelete: useDeleteTodo, useToggle: useToggleTodo, useReorder: useReorderTodo } = todoHooks
