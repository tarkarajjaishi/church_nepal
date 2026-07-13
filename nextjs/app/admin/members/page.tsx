'use client'

import { CrudPage } from '@/components/admin/CrudPage'

const fields = [
      { key: "name", label: "Name", type: "text" as const },
      { key: "role", label: "Role", type: "text" as const },
      { key: "since", label: "Since", type: "text" as const },
      { key: "image", label: "Image URL", type: "text" as const },
    ]

export default function MembersPage() {
  return <CrudPage endpoint="members" title="members" fields={fields} />
}
