import axios from 'axios'

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
  baseURL: 'http://localhost:3002/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
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
