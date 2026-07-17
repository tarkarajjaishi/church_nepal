'use client'

import { CrudPage } from '@/components/admin/CrudPage'

const fields = [
  { key: 'name', label: 'Group Name', type: 'text' as const },
  { key: 'slug', label: 'Slug (auto-generated from name)', type: 'text' as const },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'category', label: 'Category (youth/women/men/couples/young-adults/seniors/general)', type: 'text' as const },
  { key: 'meeting_day', label: 'Meeting Day', type: 'select' as const, options: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
  { key: 'meeting_time', label: 'Meeting Time', type: 'text' as const },
  { key: 'location', label: 'Location', type: 'text' as const },
  { key: 'leader_id', label: 'Leader ID (from leaders table)', type: 'number' as const },
  { key: 'image_url', label: 'Group Image URL', type: 'text' as const },
  { key: 'max_members', label: 'Max Members', type: 'number' as const },
]

export default function GroupsPage() {
  return <CrudPage endpoint="groups" title="Groups" fields={fields} />
}
