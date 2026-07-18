'use client'

import { CrudPage } from '@/components/admin/CrudPage'

const fields = [
      { key: "name", label: "Name (EN)", type: "text" as const },
      { key: "nameNe", label: "Name (NE)", type: "text" as const },
      { key: "description", label: "Description", type: "textarea" as const },
      { key: "leader", label: "Leader", type: "text" as const },
      { key: "meeting", label: "Meeting", type: "text" as const },
      { key: "image", label: "Image URL", type: "text" as const },
      { key: "icon", label: "Icon", type: "text" as const },
    ]

export default function MinistriesPage() {
  return <CrudPage endpoint="ministries" title="ministries" fields={fields} />
}
