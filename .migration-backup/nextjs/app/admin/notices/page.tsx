'use client'

import { CrudPage } from '@/components/admin/CrudPage'

const fields = [
      { key: "title", label: "Title", type: "text" as const },
      { key: "date", label: "Date", type: "text" as const },
      { key: "category", label: "Category", type: "text" as const },
      { key: "text", label: "Text", type: "textarea" as const },
      { key: "urgent", label: "Urgent", type: "checkbox" as const },
    ]

export default function NoticesPage() {
  return <CrudPage endpoint="notices" title="notices" fields={fields} />
}
