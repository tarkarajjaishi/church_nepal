'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import api from './api'
import type { User } from '@/lib/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await api.get('/auth/me')
        if (response.data) {
          setUser(response.data)
        }
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const logout = useCallback(async () => {
    setUser(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token')
      sessionStorage.removeItem('refreshToken')
    }
    router.push('/portal/login')
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function usePortalAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('usePortalAuth must be used within PortalAuthProvider')
  }
  return context
}
