import { NotBuiltYet } from "@/components/NotBuiltYet";

export default function Page() {
  return (
    <NotBuiltYet
      title="Operations"
      subtitle="Health of the platform itself"
      dependsOn="Metrics from the API process and the Postgres instance"
      planned={[
        "API latency and error rate",
        "Database connections and slow queries",
        "Provisioning queue and failures",
        "Disk and memory headroom",
        "Recent deploys",
      ]}
    />
  );
}
