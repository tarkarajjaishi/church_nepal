import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSettingsSections, useToggleSection } from '@/lib/hooks/settings'
import api from '@/lib/admin/api'

const mockData = { homepage: true, events: false }

// vi.mock is hoisted above the imports, so it replaces the module the hook
// actually uses. The previous vi.doMock() ran inside the test body, after
// '@/lib/hooks/settings' had already imported the real api, so it never applied
// and the hook resolved to {}.
vi.mock('@/lib/admin/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
}))

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

describe('useSettingsSections', () => {
  beforeEach(() => {
    queryClient?.clear()
    vi.mocked(api.get).mockResolvedValue({ data: mockData })
  })

  it('fetches sections data', async () => {
    const { result } = renderHook(() => useSettingsSections(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockData)
  })
})

describe('useToggleSection', () => {
  it('returns a toggleSection function', () => {
    const { result } = renderHook(() => useToggleSection(), { wrapper })
    expect(result.current.toggleSection).toBeDefined()
    expect(typeof result.current.toggleSection).toBe('function')
  })
})
