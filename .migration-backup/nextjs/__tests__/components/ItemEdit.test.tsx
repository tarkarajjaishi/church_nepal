import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ItemEdit } from '@/components/site/ItemEdit'

describe('ItemEdit', () => {
  it('renders children and not the edit link when user is not admin', () => {
    render(<ItemEdit href="/admin/items/1">Child Content</ItemEdit>)
    expect(screen.getByText('Child Content')).toBeInTheDocument()
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
  })
})
