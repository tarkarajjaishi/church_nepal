import { NotBuiltYet } from "@/components/NotBuiltYet";

export default function Page() {
  return (
    <NotBuiltYet
      title="Reports"
      subtitle="Platform reporting and exports"
      dependsOn="A report layer over the control database; the church app already has one to model it on"
      planned={[
        "Growth, revenue and churn over any period",
        "Per-church usage against plan limits",
        "CSV and PDF export",
        "Scheduled email to the owners",
      ]}
    />
  );
}
