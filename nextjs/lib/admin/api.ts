import axios from 'axios'
import { API_ORIGIN } from '../apiBase'

function toCamelCase(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(toCamelCase)
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, val]) => {
        const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
        return [camel, toCamelCase(val)]
      })
    )
  }
  return obj
}

function toSnakeCase(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(toSnakeCase)
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, val]) => {
        const snake = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
        return [snake, toSnakeCase(val)]
      })
    )
  }
  return obj
}

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
})

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Convert camelCase request bodies to snake_case for the Rust API
  if (config.data && typeof config.data === 'object') {
    config.data = toSnakeCase(config.data)
  }
  return config
})

// Normalize snake_case responses to camelCase
api.interceptors.response.use((res) => {
  res.data = toCamelCase(res.data)
  return res
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

// File upload helper
export async function uploadFile(file: File): Promise<{ url: string; filename: string; original_name: string; content_type: string; size: number }> {
  const formData = new FormData()
  formData.append('file', file)
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
  const res = await fetch(`${API_ORIGIN}/api/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(err.error || 'Upload failed')
  }
  return res.json()
}
