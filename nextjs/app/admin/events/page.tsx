'use client'

import { CrudPage } from '@/components/admin/CrudPage'

const fields = [
  { key: 'title', label: 'Title', type: 'text' as const },
  { key: 'displayDate', label: 'Display Date', type: 'text' as const },
  { key: 'date', label: 'Date (ISO)', type: 'text' as const },
  { key: 'time', label: 'Time', type: 'text' as const },
  { key: 'location', label: 'Location', type: 'text' as const },
  { key: 'image', label: 'Image URL', type: 'text' as const },
  { key: 'description', label: 'Description', type: 'textarea' as const },
]

export default function EventsPage() {
  return <CrudPage endpoint="events" title="Events" fields={fields} />
}
