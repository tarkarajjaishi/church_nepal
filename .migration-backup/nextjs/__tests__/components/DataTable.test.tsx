import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DataTable } from '@/components/admin/DataTable'
import { type ColumnDef } from '@tanstack/react-table'

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

describe('DataTable', () => {
  const columns: ColumnDef<any, any>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => row.original.name,
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => row.original.role,
    },
  ]

  it('renders empty state when no data is provided', () => {
    renderWithQuery(<DataTable data={[]} columns={columns} />)
    expect(screen.getByText('No results.')).toBeInTheDocument()
  })

  it('renders rows with data', () => {
    const data = [
      { id: '1', name: 'Alice', role: 'Admin' },
      { id: '2', name: 'Bob', role: 'User' },
    ]
    renderWithQuery(<DataTable data={data} columns={columns} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('shows loading skeleton when isLoading is true', () => {
    renderWithQuery(<DataTable data={[]} columns={columns} isLoading={true} />)
    expect(screen.getByText('No results.')).not.toBeInTheDocument()
  })

  it('shows search input when searchKey is provided', () => {
    renderWithQuery(<DataTable data={[]} columns={columns} searchKey="name" />)
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('shows pagination when data exceeds page size', () => {
    const data = Array.from({ length: 25 }, (_, i) => ({ id: String(i), name: `Person ${i}` }))
    renderWithQuery(<DataTable data={data} columns={columns} pageSize={10} />)
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
  })
})
