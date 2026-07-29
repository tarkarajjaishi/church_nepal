import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../admin/api'

export interface Form {
  id: string
  title: string
  description: string
  fields: any[]
  status: string
  submitAction: string
  createdAt?: string
  updatedAt?: string
}

export function useFormList() {
  return useQuery({
    queryKey: ['forms'],
    queryFn: () => api.get<Form[]>('/forms').then(r => r.data),
  })
}

export function useFormSubmissions(formId: string | undefined) {
  return useQuery({
    queryKey: ['forms', formId, 'submissions'],
    queryFn: () => api.get(`/forms/${formId}/submissions`).then(r => r.data),
    enabled: !!formId,
  })
}

export function useCreateForm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Form>) => api.post<Form>('/forms', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forms'] }),
  })
}

export function useUpdateForm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Form> }) =>
      api.put<Form>(`/forms/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forms'] }),
  })
}

export function useDeleteForm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/forms/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forms'] }),
  })
}
