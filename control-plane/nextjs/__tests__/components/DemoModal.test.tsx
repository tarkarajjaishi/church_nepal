import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DemoModal from '@/components/landing/demo-modal'

/**
 * The trigger used to open a "Schedule a Demo" form. It now links straight to a
 * live church on the platform, so the modal is unreachable and the tests that
 * drove it (open, close, validate email, submit) were asserting behaviour no
 * visitor can reach. What matters now is that the link says the right thing and
 * points at the right place.
 */
describe('DemoModal trigger', () => {
  it('renders a Watch Demo link', () => {
    render(<DemoModal />)
    expect(screen.getByText('Watch Demo')).toBeInTheDocument()
  })

  it('points at a real church site and opens in a new tab safely', () => {
    render(<DemoModal />)
    const link = screen.getByText('Watch Demo').closest('a')
    expect(link).toHaveAttribute('href', 'https://gracechurchkathmandu.churchnepal.com/')
    expect(link).toHaveAttribute('target', '_blank')
    // Without noopener the opened page gets a handle on window.opener.
    expect(link?.getAttribute('rel')).toContain('noopener')
  })

  it('does not open a dialog', () => {
    render(<DemoModal />)
    expect(screen.queryByText('Schedule a Demo')).not.toBeInTheDocument()
  })
})
