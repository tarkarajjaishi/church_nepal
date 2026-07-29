import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// InvoicesTable calls apiClient.get<Invoice[]>("/invoices") and reads
// `response.data` as the array. The mock therefore needs the axios shape
// ({ data: [...] }), not a nested { data: { data: [...] } }.
// vi.hoisted, because vi.mock factories are hoisted above normal const
// declarations — referencing a plain const from inside one throws
// "Cannot access '...' before initialization".
const { INVOICES } = vi.hoisted(() => ({
  INVOICES: [
    { id: '1', church_id: 'Grace Nepal', amount: 5000, status: 'paid', created_at: '2024-01-15' },
    { id: '2', church_id: 'Grace Kathmandu', amount: 3000, status: 'pending', created_at: '2024-02-01' },
  ],
}))

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: INVOICES }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

import InvoicesTable from '@/components/admin/invoices-table'

function renderWithQuery(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('InvoicesTable', () => {
  it('renders empty state when there are no invoices', async () => {
    vi.resetModules()
    vi.doMock('@/lib/api-client', () => ({
      apiClient: {
        get: vi.fn().mockResolvedValue({ data: [] }),
        post: vi.fn().mockResolvedValue({ data: {} }),
      },
    }))
    const { default: EmptyTable } = await import('@/components/admin/invoices-table')
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
