'use client'

import { CrudPage } from '@/components/admin/CrudPage'

const fields = [
      { key: "key", label: "Key", type: "text" as const },
      { key: "value", label: "Value", type: "textarea" as const },
    ]

export default function SettingsPage() {
  return <CrudPage endpoint="settings" title="settings" fields={fields} />
}
