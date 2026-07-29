import { NotBuiltYet } from '@/components/offerings/NotBuiltYet'

export default function Page() {
  return (
    <NotBuiltYet
      title="Recurring Giving"
      subtitle="Standing orders and scheduled gifts"
      dependsOn="recurring_donations table exists; needs a scheduler plus gateway webhooks"
      planned={[
        'Weekly, monthly, quarterly and yearly schedules',
        'Pause, resume and cancel a schedule',
        'Automatic retry on a failed charge',
        'Upcoming charge calendar',
        'Failed payment notifications',
      ]}
    />
  )
}
