import { NotBuiltYet } from '@/components/offerings/NotBuiltYet'

export default function Page() {
  return (
    <NotBuiltYet
      title="Analytics"
      subtitle="Trends, growth and giving behaviour"
      dependsOn="Needs a warehouse-style aggregate layer; the dashboard covers the headline charts today"
      planned={[
        'Growth rate and giving trend over time',
        'Donor retention and lapse analysis',
        'Average and largest donation',
        'Giving by service and by weekday heatmap',
        'Forecast for the remainder of the year',
      ]}
    />
  )
}
