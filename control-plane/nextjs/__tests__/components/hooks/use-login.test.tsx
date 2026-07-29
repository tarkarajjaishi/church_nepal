import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// vi.mock factories are hoisted above plain const/let declarations, so anything
// they close over must come from vi.hoisted — otherwise the bindings are still
// in the temporal dead zone and the mock ends up with `post: undefined`.
const { mockApiClientPost, mockSetAuthToken, store } = vi.hoisted(() => ({
  mockApiClientPost: vi.fn(),
  mockSetAuthToken: vi.fn(),
  store: { token: null as string | null, refreshToken: null as string | null },
}))

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: mockApiClientPost,
  },
  setAuthToken: (...args: any[]) => {
    store.token = args[0]
    if (args[1]) store.refreshToken = args[1]
    mockSetAuthToken(...args)
  },
  getAuthToken: () => store.token,
  getRefreshToken: () => store.refreshToken,
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
    store.token = null
    store.refreshToken = null
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
    expect(store.token).toBe('tok-1')
    // useLogin normalises a missing refresh_token to null, not undefined:
    // setAuthToken(data.token || null, data.refresh_token || null)
    expect(mockSetAuthToken).toHaveBeenCalledWith('tok-1', null)
  })
})
