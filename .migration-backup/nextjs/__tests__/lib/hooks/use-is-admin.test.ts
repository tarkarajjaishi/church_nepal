import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useIsAdmin } from '@/lib/useIsAdmin'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = createQueryClient()
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useIsAdmin', () => {
  it('returns isAdmin false when no token is present', async () => {
    const originalLocalStorage = globalThis.localStorage
    ;(globalThis as any).localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    }
    const { result } = renderHook(() => useIsAdmin(), { wrapper })
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isLoading).toBe(false)
    ;(globalThis as any).localStorage = originalLocalStorage
  })
})
