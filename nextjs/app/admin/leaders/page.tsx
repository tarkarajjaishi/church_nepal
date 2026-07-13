'use client'

import { CrudPage } from '@/components/admin/CrudPage'

const fields = [
      { key: "name", label: "Name", type: "text" as const },
      { key: "role", label: "Role", type: "text" as const },
      { key: "category", label: "Category", type: "text" as const },
      { key: "image", label: "Image URL", type: "text" as const },
      { key: "bio", label: "Bio", type: "textarea" as const },
    ]

export default function LeadersPage() {
  return <CrudPage endpoint="leaders" title="leaders" fields={fields} />
}
