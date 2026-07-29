import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// vi.hoisted — vi.mock factories run before plain const declarations, so
// closing over them directly leaves the mock with `get: undefined`.
const { mockApiClientGet, mockSetAuthToken } = vi.hoisted(() => ({
  mockApiClientGet: vi.fn(),
  mockSetAuthToken: vi.fn(),
}))

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: mockApiClientGet,
  },
  setAuthToken: mockSetAuthToken,
  getAuthToken: () => 'test-token',
}))

import { useMe } from '@/components/hooks/use-auth'

let queryClient: QueryClient

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function wrapper({ children }: { children: React.ReactNode }) {
  queryClient = createQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useMe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient?.clear()
    mockApiClientGet.mockReset()
  })

  it('starts loading and then fetches user data', async () => {
    mockApiClientGet.mockResolvedValue({
      data: { id: '1', email: 'admin@test.com', twofa_enabled: false },
    })
    const { result } = renderHook(() => useMe(), { wrapper })
    expect(result.current.isLoading || result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.data).toEqual({ id: '1', email: 'admin@test.com', twofa_enabled: false }))
    expect(mockApiClientGet).toHaveBeenCalledWith('/auth/me')
  })
})
