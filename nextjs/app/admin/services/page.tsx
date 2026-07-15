'use client'

import { PyCrudPage } from '@/components/admin/PyCrudPage'

const fields = [
  { key: 'title', label: 'Title', type: 'text' as const },
  { key: 'category', label: 'Category', type: 'text' as const },
  { key: 'price', label: 'Price', type: 'number' as const },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'image', label: 'Image URL', type: 'text' as const },
]

export default function ServicesAdminPage() {
  return <PyCrudPage endpoint="services" title="Services" fields={fields} />
}
