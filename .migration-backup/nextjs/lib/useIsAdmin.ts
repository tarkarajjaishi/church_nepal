'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/admin/api'

/**
 * Returns whether the current browser user is a logged-in admin.
 * Reads admin_token from localStorage, verifies via /auth/me, result is cached.
 * Returns { isAdmin, isLoading }.
 */
export function useIsAdmin() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null

  const { data, isLoading } = useQuery({
    queryKey: ['admin-auth-check', token],
    queryFn: () => api.get('/auth/me').then(r => r.data),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    retry: false,
  })

  return {
    isAdmin: !!token && data?.role === 'admin',
    isLoading: !!token && isLoading,
  }
}
