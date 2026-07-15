'use client'

import { PyCrudPage } from '@/components/admin/PyCrudPage'

const fields = [
  { key: 'name', label: 'Name', type: 'text' as const },
  { key: 'role', label: 'Role', type: 'text' as const },
  { key: 'category', label: 'Category', type: 'text' as const, placeholder: 'pastors, staff, volunteers' },
  { key: 'bio', label: 'Bio', type: 'textarea' as const },
  { key: 'image', label: 'Image URL', type: 'text' as const },
]

export default function TeamAdminPage() {
  return <PyCrudPage endpoint="team" title="Team Members" fields={fields} />
}
