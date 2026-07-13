'use client'

import { CrudPage } from '@/components/admin/CrudPage'

const fields = [
      { key: "title", label: "Title", type: "text" as const },
      { key: "raised", label: "Raised (Rs)", type: "number" as const },
      { key: "goal", label: "Goal (Rs)", type: "number" as const },
    ]

export default function CampaignsPage() {
  return <CrudPage endpoint="campaigns" title="campaigns" fields={fields} />
}
