import { NotBuiltYet } from "@/components/NotBuiltYet";

export default function Page() {
  return (
    <NotBuiltYet
      title="Backups"
      subtitle="Snapshots and restores, per church"
      dependsOn="A backup job that can dump and restore one church database without touching the others"
      planned={[
        "Nightly snapshot per church database and storage folder",
        "On-demand backup before a risky change",
        "Restore into a scratch database first, then swap",
        "Retention policy and off-site copy",
        "Restore drill history, so \"we have backups\" can be proven",
      ]}
    />
  );
}
