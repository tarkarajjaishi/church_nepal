import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({
      data: {
        data: [
          { id: '1', church_id: 'grace-nepal', amount: 5000, status: 'paid', created_at: '2024-01-15' },
          { id: '2', church_id: 'grace-kathmandu', amount: 3000, status: 'pending', created_at: '2024-02-01' },
        ],
      },
    }),
  },
}))

import { InvoicesTable } from '@/components/admin/invoices-table'

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

describe('InvoicesTable', () => {
  it('renders empty state when there are no invoices', async () => {
    vi.resetModules()
    vi.doMock('@/lib/api-client', () => ({
      apiClient: {
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
      },
    }))
    const { InvoicesTable: EmptyTable } = await import('@/components/admin/invoices-table')
    renderWithQuery(<EmptyTable />)
    expect(await screen.findByText('No Invoices Found')).toBeInTheDocument()
  })

  it('renders invoice rows', async () => {
    renderWithQuery(<InvoicesTable />)
    expect(await screen.findByText('Grace Nepal')).toBeInTheDocument()
    expect(screen.getByText('Rs. 3,000')).toBeInTheDocument()
  })

  it('shows pay button for pending invoices', async () => {
    renderWithQuery(<InvoicesTable />)
    const payButtons = await screen.findAllByRole('button', { name: 'Mark Paid' })
    expect(payButtons.length).toBeGreaterThan(0)
  })
})
