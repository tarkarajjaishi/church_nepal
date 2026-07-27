import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockApiClientPost = vi.fn()
const mockSetAuthToken = vi.fn()
let tokenStore: string | null = null
let refreshTokenStore: string | null = null

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: mockApiClientPost,
  },
  setAuthToken: (...args: any[]) => {
    tokenStore = args[0]
    if (args[1]) refreshTokenStore = args[1]
    mockSetAuthToken(...args)
  },
  getAuthToken: () => tokenStore,
  getRefreshToken: () => refreshTokenStore,
}))

import { useLogin } from '@/components/hooks/use-auth'

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

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient?.clear()
    tokenStore = null
    refreshTokenStore = null
    mockApiClientPost.mockReset()
  })

  it('calls login mutation with credentials', async () => {
    mockApiClientPost.mockResolvedValue({ data: { token: 'abc123', email: 'admin@test.com' } })
    const { result } = renderHook(() => useLogin(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ email: 'admin@test.com', password: 'secret' })
    })
    expect(mockApiClientPost).toHaveBeenCalledWith('/auth/login', { email: 'admin@test.com', password: 'secret' }, { _skipAuthRefresh: true })
  })

  it('stores token on success', async () => {
    mockApiClientPost.mockResolvedValue({ data: { token: 'tok-1', email: 'admin@test.com' } })
    const { result } = renderHook(() => useLogin(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ email: 'admin@test.com', password: 'secret' })
    })
    expect(tokenStore).toBe('tok-1')
    expect(mockSetAuthToken).toHaveBeenCalledWith('tok-1', undefined)
  })
})
