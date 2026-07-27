
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from '@/lib/navigation'
import api from './api'
import adminApi from './admin/api'
import { MOCK_USER, MOCK_TOKEN } from './adminMockData'
import type { User } from './types'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider — Secure auth with automatic demo/offline fallback.
 *
 * When the Rust backend is unreachable the mock interceptor in lib/admin/api
 * returns MOCK_USER for /auth/me so the admin works seamlessly in dev mode.
 * Any email/password combination that reaches the mock handler logs in as
 * the demo admin.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Initialize auth on mount — check for an existing session.
  // In dev/demo mode (no VITE_API_URL configured), auto-login as the demo
  // admin so the entire admin panel is immediately accessible without a real
  // backend. The mock interceptor in lib/admin/api handles all API calls.
  useEffect(() => {
    const initAuth = async () => {
      // Demo mode: no real API configured → auto-login as demo admin
      const isDemoMode = !import.meta.env.VITE_API_URL
      if (isDemoMode) {
        // Ensure demo token is set so admin API calls include Authorization header
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_token', MOCK_TOKEN)
        }
        setUser(MOCK_USER as unknown as User)
        setLoading(false)
        return
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const response = await adminApi.get('/auth/me')
        if (response.data) {
          setUser(response.data as User)
        }
      } catch {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('refreshToken')
        }
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    setLoading(true)

    try {
      // Tries the real API; falls back to mock token/user via the mock interceptor
      const response = await adminApi.post('/auth/login', { email, password })
      const data: any = response.data

      if (data?.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_token', data.token)
        }
        setUser(data.user as User)
        router.push('/admin/dashboard')
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error || err?.response?.data?.detail || 'Login failed. Please try again.'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [router])

  const logout = useCallback(async () => {
    setUser(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token')
      sessionStorage.removeItem('refreshToken')
    }
    router.push('/admin/login')
  }, [router])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    error,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
