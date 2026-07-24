import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSettingsSections, useToggleSection } from '@/lib/hooks/settings'

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
  })

  it('fetches sections data', async () => {
    const mockData = { homepage: true, events: false }
    vi.doMock('@/lib/admin/api', () => ({
      default: {
        get: vi.fn().mockResolvedValue({ data: mockData }),
      },
    }))
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
