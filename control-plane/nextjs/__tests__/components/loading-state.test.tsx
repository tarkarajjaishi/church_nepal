import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LoadingState } from '@/components/loading-state'

describe('LoadingState', () => {
  it('renders spinner variant by default', () => {
    render(<LoadingState />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders skeleton variant', () => {
    render(<LoadingState variant="skeleton" rows={2} />)
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('renders custom message', () => {
    render(<LoadingState message="Please wait..." />)
    expect(screen.getByText('Please wait...')).toBeInTheDocument()
  })
})
