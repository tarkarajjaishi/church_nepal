'use client'

import { CrudPage } from '@/components/admin/CrudPage'

const fields = [
      { key: "name", label: "Name", type: "text" as const },
      { key: "role", label: "Role", type: "text" as const },
      { key: "category", label: "Category (Pastors/Elders/Deacons/Ministry Leaders)", type: "text" as const },
      { key: "image", label: "Profile Image", type: "text" as const },
      { key: "bio", label: "Bio", type: "textarea" as const },
      { key: "socialLinks", label: 'Social Links (JSON: [{"platform":"Facebook","url":"..."}])', type: "text" as const },
    ]

export default function LeadersPage() {
  return <CrudPage endpoint="leaders" title="Team Members" fields={fields} />
}
