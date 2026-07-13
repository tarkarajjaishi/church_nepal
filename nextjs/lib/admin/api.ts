import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3002/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api

// Generic CRUD helpers
export function createCrudHooks<T extends { id: string }>(endpoint: string) {
  return {
    list: async () => {
      const { data } = await api.get<T[]>(`/${endpoint}`)
      return data
    },
    get: async (id: string) => {
      const { data } = await api.get<T>(`/${endpoint}/${id}`)
      return data
    },
    create: async (input: Partial<T>) => {
      const { data } = await api.post<T>(`/${endpoint}`, input)
      return data
    },
    update: async (id: string, input: Partial<T>) => {
      const { data } = await api.put<T>(`/${endpoint}/${id}`, input)
      return data
    },
    remove: async (id: string) => {
      await api.delete(`/${endpoint}/${id}`)
    },
  }
}
