import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionHeading } from '@/components/site/SectionHeading'

describe('SectionHeading', () => {
  it('renders heading and subtitle', () => {
    render(<SectionHeading title="Welcome" subtitle="Join us" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Welcome' })).toBeInTheDocument()
    expect(screen.getByText('Join us')).toBeInTheDocument()
  })

  it('renders eyebrow when provided', () => {
    render(<SectionHeading title="Welcome" eyebrow="News" />)
    expect(screen.getByText('News')).toBeInTheDocument()
  })
})
