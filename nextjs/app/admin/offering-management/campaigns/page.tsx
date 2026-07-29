import { NotBuiltYet } from '@/components/offerings/NotBuiltYet'

export default function Page() {
  return (
    <NotBuiltYet
      title="Campaigns"
      subtitle="Fundraising progress and top donors"
      dependsOn="campaigns table and admin page already exist at /admin/campaigns; this view adds giving analytics"
      planned={[
        'Goal, raised, remaining and percentage complete',
        'Progress chart over the campaign period',
        'Top donors leaderboard',
        'Shareable link and QR code',
        'Banner, gallery and documents',
      ]}
    />
  )
}
