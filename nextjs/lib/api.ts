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
    // A refused request answers 403 with an empty body, so axios reports it as
    // "Request failed with status code 403" — which a page then shows, or
    // worse, renders as an empty list that reads as "your church has none".
    // Say what actually happened instead.
    if (error.response?.status === 403) {
      error.message = 'You do not have permission to view this. Ask an administrator for access.'
      error.isForbidden = true
    }
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('admin_token')
      // Only bounce to the login page from inside the admin area. A 401 from a
      // public content fetch must NOT redirect the public site to admin/login.
      const path = window.location.pathname
      if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

/**
 * Read a list endpoint without having to know whether it paginates.
 *
 * Some endpoints answer with a bare array and some with `{data, total, page}`,
 * and there is no way to tell from the URL. Reading an enveloped one as an
 * array throws "x.map is not a function" — which the error boundary catches,
 * so the whole page becomes "Something went wrong" and never says which call
 * was wrong. That has now cost three pages: /admin/content-blocks,
 * /admin/rsvps and /admin/pledges.
 */
export function asList<T = any>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  if (res && typeof res === 'object' && Array.isArray((res as { data?: unknown }).data)) {
    return (res as { data: T[] }).data
  }
  return []
}

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
