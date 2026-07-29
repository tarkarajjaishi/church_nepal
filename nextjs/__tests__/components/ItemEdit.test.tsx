import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ItemEdit } from '@/components/site/ItemEdit'

// ItemEdit calls useIsAdmin(), which uses react-query — rendering it without a
// provider throws "No QueryClient set".
function renderWithQuery(ui: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('ItemEdit', () => {
  it('renders children and not the edit link when user is not admin', () => {
    renderWithQuery(<ItemEdit href="/admin/items/1">Child Content</ItemEdit>)
    expect(screen.getByText('Child Content')).toBeInTheDocument()
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
  })
})
