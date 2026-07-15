'use client'

import { CrudPage } from '@/components/admin/CrudPage'

const fields = [
  { key: 'name', label: 'Name (EN)', type: 'text' as const },
  { key: 'nameNe', label: 'Name (NE)', type: 'text' as const },
  { key: 'day', label: 'Day', type: 'text' as const },
  { key: 'time', label: 'Time', type: 'text' as const },
  { key: 'icon', label: 'Icon', type: 'text' as const },
]

export default function ServiceTimesPage() {
  return <CrudPage endpoint="service-times" title="Service Times" fields={fields} />
}
