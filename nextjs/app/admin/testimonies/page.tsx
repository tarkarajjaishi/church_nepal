'use client'

import { CrudPage } from '@/components/admin/CrudPage'

const fields = [
      { key: "name", label: "Name", type: "text" as const },
      { key: "role", label: "Role", type: "text" as const },
      { key: "quote", label: "Quote", type: "textarea" as const },
      { key: "image", label: "Image URL", type: "text" as const },
      { key: "rating", label: "Rating", type: "number" as const },
    ]

export default function TestimoniesPage() {
  return <CrudPage endpoint="testimonies" title="testimonies" fields={fields} />
}
