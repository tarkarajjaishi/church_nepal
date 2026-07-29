import { NotBuiltYet } from '@/components/offerings/NotBuiltYet'

export default function Page() {
  return (
    <NotBuiltYet
      title="Funds"
      subtitle="Balances and movement per fund"
      dependsOn="offering_allocations is already written on every offering; this view reads it"
      planned={[
        'Opening and current balance per fund',
        'Money in from offering allocations, money out from expenses',
        'Fund statement for a date range',
        'Transfers between funds',
      ]}
    />
  )
}
