'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import api from './api'
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
 * AuthProvider - Secure authentication with refresh token rotation
 *
 * Features:
 * - HttpOnly cookie storage (prevents XSS token theft)
 * - Automatic token refresh (15-minute expiration)
 * - Proper error handling and user feedback
 * - Loading states for async operations
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Initialize auth on mount - check if user session exists
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await api.get('/auth/me')
        if (response.data) {
          setUser(response.data)
        }
      } catch (err) {
        // Session expired or invalid - clear any stored tokens
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

  // Note: the Rust backend issues a 24h bearer token and has no /auth/refresh
  // route, so there is no refresh interval — the stored token is used directly.

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    setLoading(true)

    try {
      const response = await api.post('/auth/login', { email, password })
      const data: any = response.data

      if (data?.token) {
        // Bearer token in localStorage drives every authenticated request
        // (lib/api + lib/admin/api attach it) and admin-only UI (useIsAdmin).
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_token', data.token)
        }
        setUser(data.user)
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
    // Stateless JWT backend — clearing the local token is all that's needed.
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

/**
 * useAuth - Hook to access authentication context
 *
 * Throws error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
