import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ verses: [{ text: 'Test verse' }], book: 'JHN', chapter: 3 }),
    }),
  },
}))

import { BibleModal } from '@/components/site/BibleModal'

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

describe('BibleModal', () => {
  it('renders nothing when closed', () => {
    const { container } = renderWithQuery(<BibleModal open={false} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders modal when open', () => {
    renderWithQuery(<BibleModal open={true} onClose={() => {}} />)
    expect(screen.getByText('पवित्र बाइबल')).toBeInTheDocument()
  })

  it('shows read and search tabs', () => {
    renderWithQuery(<BibleModal open={true} onClose={() => {}} />)
    expect(screen.getByRole('tab', { name: /पढ्नुहोस्/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /खोज्नुहोस्/ })).toBeInTheDocument()
  })

  it('switches tabs when clicked', async () => {
    renderWithQuery(<BibleModal open={true} onClose={() => {}} />)
    const searchTab = screen.getByRole('tab', { name: /खोज्नुहोस्/ })
    fireEvent.click(searchTab)
    expect(screen.getByPlaceholderText('खोज्नुहोस्...')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    renderWithQuery(<BibleModal open={true} onClose={onClose} />)
    const closeButton = screen.getByLabelText('Close Bible modal')
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders book picker when clicked', async () => {
    renderWithQuery(<BibleModal open={true} onClose={() => {}} />)
    const bookButton = screen.getByText('यूहन्ना')
    fireEvent.click(bookButton)
    await waitFor(() => {
      expect(screen.getByText('पुरानो करार')).toBeInTheDocument()
      expect(screen.getByText('नयाँ करार')).toBeInTheDocument()
    })
  })
})
