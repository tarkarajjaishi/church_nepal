'use client'

import { CrudPage } from '@/components/admin/CrudPage'

const fields = [
      { key: "title", label: "Title", type: "text" as const },
      { key: "speaker", label: "Speaker", type: "text" as const },
      { key: "date", label: "Date", type: "text" as const },
      { key: "duration", label: "Duration", type: "text" as const },
      { key: "series", label: "Series", type: "text" as const },
      { key: "topic", label: "Topic", type: "text" as const },
      { key: "videoUrl", label: "Video URL (YouTube, etc.)", type: "text" as const },
      { key: "image", label: "Image URL", type: "text" as const },
      { key: "description", label: "Description", type: "textarea" as const },
    ]

export default function SermonsPage() {
  return <CrudPage endpoint="sermons" title="sermons" fields={fields} />
}
