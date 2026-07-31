"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { PageTitle, Stat, Failed, Loading } from "@/components/platform";
import { Card } from "@/components/ui/card";

/**
 * Whether the platform is up, component by component.
 *
 * The page was a heading over four skeleton cards that never resolved — the one
 * page whose entire job is to say whether things are working, saying nothing at
 * all. /api/status was already serving this and is public, because a status page
 * nobody can reach during an outage is no use.
 */

interface Component {
  name: string;
  status: string;
}
interface Status {
  status: string;
  updated_at: string;
  components: Component[];
}

const TONE: Record<string, { icon: typeof CheckCircle; className: string }> = {
  operational: { icon: CheckCircle, className: "text-emerald-400" },
  degraded: { icon: AlertTriangle, className: "text-amber-400" },
  down: { icon: XCircle, className: "text-red-400" },
};

function look(status: string) {
  // Anything unrecognised is treated as a problem rather than quietly rendered
  // green, which is the failure mode that matters on this page.
  return TONE[status.toLowerCase()] ?? { icon: AlertTriangle, className: "text-amber-400" };
}

export default function StatusPage() {
  const q = useQuery({
    queryKey: ["status"],
    // apiClient already points at …:3100/api, so this resolves to /api/status.
    queryFn: async () => (await apiClient.get<Status>("/status")).data,
    // It is a status page: it should not need a reload to stop being wrong.
    refetchInterval: 30_000,
  });

  const s = q.data;
  const healthy = s?.components.filter((c) => c.status === "operational").length ?? 0;

  return (
    <div className="space-y-6">
      <PageTitle title="System status" subtitle="What is working, and what is not" />

      {q.isError ? (
        <Failed error={q.error} onRetry={() => q.refetch()} />
      ) : !s ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat
              label="Overall"
              value={s.status}
              tone={s.status === "operational" ? "good" : "bad"}
            />
            <Stat
              label="Components healthy"
              value={`${healthy} of ${s.components.length}`}
              tone={healthy === s.components.length ? "good" : "bad"}
            />
            <Stat label="Checked" value={s.updated_at.slice(11, 16)} hint="Refreshes every 30s" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {s.components.map((c) => {
              const { icon: Icon, className } = look(c.status);
              return (
                <Card
                  key={c.name}
                  className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className={`inline-flex items-center gap-1.5 text-sm ${className}`}>
                    <Icon size={15} aria-hidden />
                    {c.status}
                  </span>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
