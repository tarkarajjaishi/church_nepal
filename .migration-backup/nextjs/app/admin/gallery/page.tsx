'use client'

import { CrudPage } from '@/components/admin/CrudPage'

const fields = [
      { key: "title", label: "Title", type: "text" as const },
      { key: "category", label: "Category", type: "text" as const },
      { key: "image", label: "Image URL", type: "text" as const },
    ]

export default function GalleryPage() {
  return <CrudPage endpoint="gallery" title="gallery" fields={fields} />
}
