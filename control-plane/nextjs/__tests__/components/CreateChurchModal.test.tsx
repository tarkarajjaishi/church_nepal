import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/components/hooks/use-churches', () => ({
  useCreateChurch: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  }),
}))

import { CreateChurchModal } from '@/components/admin/create-church-modal'

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

describe('CreateChurchModal', () => {
  it('renders nothing when closed', () => {
    const { container } = renderWithQuery(<CreateChurchModal open={false} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders form when open', () => {
    renderWithQuery(<CreateChurchModal open={true} onClose={() => {}} />)
    expect(screen.getByText('Create New Church')).toBeInTheDocument()
    expect(screen.getByLabelText('Church Name')).toBeInTheDocument()
  })

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn()
    renderWithQuery(<CreateChurchModal open={true} onClose={onClose} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('enables create button when name is entered', () => {
    renderWithQuery(<CreateChurchModal open={true} onClose={() => {}} />)
    const nameInput = screen.getByLabelText('Church Name')
    const createButton = screen.getByRole('button', { name: 'Create Church' })
    expect(createButton).toBeDisabled()
    fireEvent.change(nameInput, { target: { value: 'Grace Church' } })
    expect(createButton).not.toBeDisabled()
  })
})
