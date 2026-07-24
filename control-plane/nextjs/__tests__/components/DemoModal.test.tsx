import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DemoModal } from '@/components/landing/demo-modal'

describe('DemoModal', () => {
  it('renders the open button', () => {
    render(<DemoModal />)
    expect(screen.getByText('Book a demo')).toBeInTheDocument()
  })

  it('opens modal when button is clicked', async () => {
    render(<DemoModal />)
    const openButton = screen.getByText('Book a demo')
    fireEvent.click(openButton)
    expect(await screen.findByText('Schedule a Demo')).toBeInTheDocument()
  })

  it('closes modal when cancel is clicked', async () => {
    render(<DemoModal />)
    fireEvent.click(screen.getByText('Book a demo'))
    await screen.findByText('Schedule a Demo')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => {
      expect(screen.queryByText('Schedule a Demo')).not.toBeInTheDocument()
    })
  })

  it('closes modal when close icon is clicked', async () => {
    render(<DemoModal />)
    fireEvent.click(screen.getByText('Book a demo'))
    await screen.findByText('Schedule a Demo')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => {
      expect(screen.queryByText('Schedule a Demo')).not.toBeInTheDocument()
    })
  })

  it('shows validation errors when form is submitted empty', async () => {
    render(<DemoModal />)
    fireEvent.click(screen.getByText('Book a demo'))
    await screen.findByText('Schedule a Demo')
    fireEvent.click(screen.getByRole('button', { name: 'Send Request' }))
    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(await screen.findByText('Church name is required')).toBeInTheDocument()
    expect(await screen.findByText('Email is required')).toBeInTheDocument()
  })

  it('validates email format', async () => {
    render(<DemoModal />)
    fireEvent.click(screen.getByText('Book a demo'))
    await screen.findByText('Schedule a Demo')
    fireEvent.change(screen.getByLabelText('Your Name *'), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText('Church Name *'), { target: { value: 'Church' } })
    fireEvent.change(screen.getByLabelText('Email Address *'), { target: { value: 'invalid' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send Request' }))
    expect(await screen.findByText('Email is invalid')).toBeInTheDocument()
  })
})
