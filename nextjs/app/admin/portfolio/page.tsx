'use client'

import { PyCrudPage } from '@/components/admin/PyCrudPage'

const fields = [
  { key: 'title', label: 'Title', type: 'text' as const },
  { key: 'category', label: 'Category', type: 'text' as const },
  { key: 'client', label: 'Client', type: 'text' as const },
  { key: 'year', label: 'Year', type: 'text' as const },
  { key: 'url', label: 'URL', type: 'text' as const },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'image', label: 'Image URL', type: 'text' as const },
]

export default function PortfolioAdminPage() {
  return <PyCrudPage endpoint="portfolio" title="Portfolio Projects" fields={fields} />
}
