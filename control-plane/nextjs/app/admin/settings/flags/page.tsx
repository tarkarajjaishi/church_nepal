import { NotBuiltYet } from "@/components/NotBuiltYet";

export default function Page() {
  return (
    <NotBuiltYet
      title="Feature flags"
      subtitle="Turn a module on for one church, or all"
      dependsOn="A flags table read by the church app at request time"
      planned={[
        "Enable a module for one church before everyone",
        "Percentage rollout",
        "Kill switch for a misbehaving feature",
        "Who changed a flag, and when",
      ]}
    />
  );
}
