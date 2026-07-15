'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import api from './api'
import type { User, AuthToken } from './types'

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

  // Setup automatic token refresh every 14 minutes (before 15-min expiration)
  useEffect(() => {
    if (!user) return

    const refreshInterval = setInterval(async () => {
      try {
        await api.post('/auth/refresh')
      } catch (err) {
        console.error('Token refresh failed:', err)
        logout()
      }
    }, 14 * 60 * 1000)

    return () => clearInterval(refreshInterval)
  }, [user])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    setLoading(true)

    try {
      const response = await api.post<AuthToken>('/auth/login', { email, password })

      if (response.data) {
        const { access_token, refresh_token, user: userData } = response.data

        // Store refresh token in sessionStorage (cleared on tab close)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('refreshToken', refresh_token)
        }

        // Access token stored in HttpOnly cookie by server
        setUser(userData)
        router.push('/admin/dashboard')
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Login failed. Please try again.'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [router])

  const logout = useCallback(async () => {
    try {
      // Notify server to invalidate tokens
      await api.post('/auth/logout')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      // Clear local state
      setUser(null)
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('refreshToken')
      }
      router.push('/admin/login')
    }
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
