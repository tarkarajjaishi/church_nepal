import { NotBuiltYet } from "@/components/NotBuiltYet";

export default function Page() {
  return (
    <NotBuiltYet
      title="Retention"
      subtitle="Which churches stay, and which drift away"
      dependsOn="A cohort query over churches.created_at and last_active_at"
      planned={[
        "Cohort retention by signup month",
        "Churches that have gone quiet",
        "Time from signup to first service recorded",
        "Churn reasons captured at cancellation",
      ]}
    />
  );
}
