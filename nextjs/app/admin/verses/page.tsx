'use client'

import { CrudPage } from '@/components/admin/CrudPage'

const fields = [
      { key: "text", label: "Text (EN)", type: "textarea" as const },
      { key: "refText", label: "Reference", type: "text" as const },
      { key: "ne", label: "Text (NE)", type: "textarea" as const },
    ]

export default function VersesPage() {
  return <CrudPage endpoint="verses" title="verses" fields={fields} />
}
