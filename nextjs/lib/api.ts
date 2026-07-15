import axios from 'axios'

// Convert snake_case keys to camelCase for a single object
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

const api = axios.create({
  baseURL: 'http://localhost:3002/api',
})

// Attach the JWT so authenticated endpoints (e.g. /auth/me) succeed.
// Without this, session restore on reload always 401s and logs the admin out.
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Normalize all API responses from snake_case to camelCase
api.interceptors.response.use((res) => {
  res.data = toCamelCase(res.data)
  return res
})

// Public API — no auth needed for reading
export async function fetchAll<T>(endpoint: string): Promise<T[]> {
  const { data } = await api.get<T[]>(`/${endpoint}`)
  return data
}

export async function fetchOne<T>(endpoint: string, id: string): Promise<T> {
  const { data } = await api.get<T>(`/${endpoint}/${id}`)
  return data
}

export default api
