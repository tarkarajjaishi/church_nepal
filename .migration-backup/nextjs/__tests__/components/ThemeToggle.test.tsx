import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import { ThemeToggle } from '@/components/site/ThemeToggle'

describe('ThemeToggle', () => {
  it('renders theme toggle button', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system">
        <ThemeToggle />
      </ThemeProvider>
    )
    expect(screen.getByRole('button', { name: /toggle color theme/i })).toBeInTheDocument()
  })

  it('renders theme options in dropdown', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system">
        <ThemeToggle />
      </ThemeProvider>
    )
    expect(screen.getByText('Light')).toBeInTheDocument()
    expect(screen.getByText('Dark')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
  })
})
