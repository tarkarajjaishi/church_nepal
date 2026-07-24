import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/lib/useIsAdmin', () => ({
  useIsAdmin: () => ({ isAdmin: false, isLoading: false }),
}))

import { EditableBlock } from '@/components/site/EditableBlock'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function renderWithQuery(ui: React.ReactNode) {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('EditableBlock', () => {
  it('renders children when user is not admin', () => {
    renderWithQuery(<EditableBlock block={null}>Child Content</EditableBlock>)
    expect(screen.getByText('Child Content')).toBeInTheDocument()
  })
})
