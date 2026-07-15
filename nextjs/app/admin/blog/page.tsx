'use client'

import { PyCrudPage } from '@/components/admin/PyCrudPage'

const fields = [
  { key: 'title', label: 'Title', type: 'text' as const },
  { key: 'slug', label: 'Slug', type: 'text' as const, placeholder: 'auto-generated-from-title' },
  { key: 'author', label: 'Author', type: 'text' as const },
  { key: 'category', label: 'Category', type: 'text' as const },
  { key: 'excerpt', label: 'Excerpt', type: 'text' as const },
  { key: 'content', label: 'Content', type: 'textarea' as const },
  { key: 'image', label: 'Image URL', type: 'text' as const },
  { key: 'published', label: 'Published', type: 'checkbox' as const },
]

export default function BlogAdminPage() {
  return <PyCrudPage endpoint="blog" title="Blog Posts" fields={fields} />
}
