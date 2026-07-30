import { NotBuiltYet } from '@/components/offerings/NotBuiltYet'

export default function Page() {
  return (
    <NotBuiltYet
      title="Presentation History"
      subtitle="Who showed what, and when"
      dependsOn="presentation_history is already written on every live action by handlers/presentation_live.rs; this page needs a read endpoint over it"
      planned={[
        'Timeline of go-live, slide changes, screen modes and stops',
        'Filter by service date, operator or presentation',
        'Restore a previous version of a presentation',
        'Duplicate or archive a past service',
      ]}
    />
  )
}
