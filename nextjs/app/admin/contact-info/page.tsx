'use client'

import { PyCrudPage } from '@/components/admin/PyCrudPage'

const fields = [
  { key: 'address', label: 'Address', type: 'text' as const },
  { key: 'phone', label: 'Phone', type: 'text' as const },
  { key: 'email', label: 'Email', type: 'text' as const },
  { key: 'hours', label: 'Hours', type: 'text' as const, placeholder: 'Sun 9:00 AM, Wed 6:00 PM' },
  { key: 'mapUrl', label: 'Map URL', type: 'text' as const },
]

export default function ContactInfoAdminPage() {
  return <PyCrudPage endpoint="contact-info" title="Contact Info" fields={fields} />
}
