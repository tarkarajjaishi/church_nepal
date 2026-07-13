'use client'

import { CrudPage } from '@/components/admin/CrudPage'

const fields = [
      { key: "name", label: "Name", type: "text" as const },
      { key: "email", label: "Email", type: "text" as const },
      { key: "role", label: "Role", type: "text" as const },
    ]

export default function UsersPage() {
  return <CrudPage endpoint="users" title="users" fields={fields} />
}
