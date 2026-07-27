import axios from 'axios'
import { API_ORIGIN } from '../apiBase'
import { getMockResponse } from '../adminMockData'

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

// On 401 Unauthorized, clear the token and redirect to login
// On network errors (backend offline), return mock data so the admin works in demo mode
api.interceptors.response.use(
  (res) => res,
  (error) => {
    // 401 → force logout
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('admin_token')
      if (!window.location.pathname.startsWith('/admin/login')) {
        window.location.href = '/admin/login'
      }
      return Promise.reject(error)
    }

    // Network / connection error → return rich mock data so every admin page
    // works without the Rust backend running (demo / dev mode).
    const isNetworkError =
      !error.response ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNREFUSED' ||
      error.message === 'Network Error'

    if (isNetworkError && error.config) {
      const method = (error.config.method ?? 'get').toUpperCase()
      const url = error.config.url ?? ''
      let bodyData: any
      try {
        bodyData = error.config.data ? JSON.parse(error.config.data) : undefined
      } catch {
        bodyData = error.config.data
      }

      const mockData = getMockResponse(method, url, bodyData)
      if (mockData !== null) {
        // Return a synthetic axios-like successful response
        return Promise.resolve({
          data: toCamelCase(mockData),
          status: 200,
          statusText: 'OK (mock)',
          headers: {},
          config: error.config,
        })
      }
    }

    return Promise.reject(error)
  }
)

export default api

// Generic CRUD helpers
export function createCrudHooks<T extends { id: string }>(endpoint: string) {
  return {
    list: async () => {
      const { data } = await api.get<T[]>(`/${endpoint}`)
      return Array.isArray(data) ? data : (data as any).data ?? []
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
    // Mock successful upload in demo mode
    return {
      url: URL.createObjectURL(file),
      filename: file.name,
      original_name: file.name,
      content_type: file.type,
      size: file.size,
    }
  }
  return res.json()
}
