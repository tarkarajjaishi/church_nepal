import axios from 'axios'
import { API_ORIGIN } from './apiBase'

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
  baseURL: `${API_ORIGIN}/api`,
})

// Attach the admin bearer token (stored at login) so authenticated endpoints
// like /auth/me work. Harmless for public GETs (header simply omitted).
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Normalize all API responses from snake_case to camelCase
api.interceptors.response.use((res) => {
  res.data = toCamelCase(res.data)
  return res
})

// On 401, clear token and redirect to login (avoid redirect loop on login page)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('admin_token')
      if (!window.location.pathname.startsWith('/admin/login')) {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

// ── Public API mock (dev / demo when backend is offline) ──────────────────────
// When a network error occurs (no backend running), return realistic mock data
// so every public page renders fully without a live API.
import { getMockPublicResponse } from './publicMockData'

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.message === 'Network Error')
    if (isNetworkError && error.config?.url) {
      const mockData = getMockPublicResponse(error.config.url)
      if (mockData !== null) {
        return Promise.resolve({
          data: mockData,
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

// Public API — no auth needed for reading
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export async function fetchAll<T>(endpoint: string): Promise<T[]> {
  const { data } = await api.get<PaginatedResponse<T>>(`/${endpoint}`)
  // Handle both paginated responses and direct arrays (for backwards compatibility)
  return Array.isArray(data) ? data : data.data
}

export async function fetchOne<T>(endpoint: string, id: string): Promise<T> {
  const { data } = await api.get<T>(`/${endpoint}/${id}`)
  return data
}

export default api
