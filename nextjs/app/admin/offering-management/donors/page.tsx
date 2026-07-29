import { NotBuiltYet } from '@/components/offerings/NotBuiltYet'

export default function Page() {
  return (
    <NotBuiltYet
      title="Donors"
      subtitle="Giving history and donor profiles"
      dependsOn="A donor read model over offerings joined to people, plus lifetime/average aggregates"
      planned={[
        'Profile with photo, member ID, contact, birthday and membership status',
        'Lifetime giving, average donation, last donation, preferred payment method',
        'Giving history table with receipts',
        'Activity timeline and notes',
        'Duplicate donor detection',
      ]}
    />
  )
}
