import { NotBuiltYet } from '@/components/offerings/NotBuiltYet'

export default function Page() {
  return (
    <NotBuiltYet
      title="Receipts"
      subtitle="Issue, reprint and send donation receipts"
      dependsOn="Receipt numbers are already issued on submission; needs a PDF renderer and email/SMS delivery"
      planned={[
        'A4 and thermal receipt templates with church logo and address',
        'QR code linking to the receipt verification page',
        'Download PDF, print, email and SMS',
        'Bulk year-end giving statements',
        'Reprint history so duplicates are traceable',
      ]}
    />
  )
}
