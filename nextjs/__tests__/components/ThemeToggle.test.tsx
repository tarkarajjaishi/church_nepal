import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'next-themes'
import { ThemeToggle } from '@/components/site/ThemeToggle'

function renderToggle() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="system">
      <ThemeToggle />
    </ThemeProvider>
  )
}

describe('ThemeToggle', () => {
  it('renders theme toggle button', () => {
    renderToggle()
    expect(screen.getByRole('button', { name: /toggle color theme/i })).toBeInTheDocument()
  })

  it('renders theme options in dropdown', async () => {
    const user = userEvent.setup()
    renderToggle()

    // The options live in DropdownMenuContent, which Radix only mounts once the
    // menu is open — asserting on them without opening it always fails.
    await user.click(screen.getByRole('button', { name: /toggle color theme/i }))

    expect(await screen.findByText('Light')).toBeInTheDocument()
    expect(screen.getByText('Dark')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
  })
})
