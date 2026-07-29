import { NotBuiltYet } from '@/components/offerings/NotBuiltYet'

export default function Page() {
  return (
    <NotBuiltYet
      title="Financial Reports"
      subtitle="Period, category, fund and donor reporting"
      dependsOn="The dashboard aggregates exist; reports need a period-scoped query layer and exporters"
      planned={[
        'Daily, weekly, monthly, quarterly, yearly and custom ranges',
        'Category, fund, service, donor and payment-method breakdowns',
        'Cash versus online comparison',
        'Outstanding deposits and top/inactive donors',
        'Export to PDF, Excel and CSV',
      ]}
    />
  )
}
