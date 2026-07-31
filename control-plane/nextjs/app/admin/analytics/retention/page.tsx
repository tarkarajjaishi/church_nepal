"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  PageTitle, Stat, Failed, Loading, Empty, Table, TR, TD,
} from "@/components/platform";

/**
 * Which churches stay, and which drift away.
 *
 * "Still active" means seen in the last thirty days, measured from one clock
 * read once on the server — so the cohort table and the quiet list cannot
 * disagree about where thirty days ago is.
 */

interface Cohort { month: string; joined: number; still_active: number; retention_percent: number }
interface Quiet {
  id: string; name: string; slug: string; plan: string | null;
  last_active_at: string | null; days_quiet: number | null;
}
interface Data { cohorts: Cohort[]; quiet: Quiet[]; active_30d: number; total: number }

export default function RetentionPage() {
  const q = useQuery({
    queryKey: ["platform-retention"],
    queryFn: async () => (await apiClient.get<Data>("/platform/retention")).data,
  });

  return (
    <div className="space-y-6">
      <PageTitle title="Retention" subtitle="Who is still here, by the month they joined" />

      {q.isError ? <Failed error={q.error} onRetry={() => q.refetch()} /> : q.isLoading || !q.data ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat label="Churches" value={q.data.total} />
            <Stat
              label="Active in the last 30 days"
              value={q.data.active_30d}
              hint={q.data.total
                ? `${((q.data.active_30d / q.data.total) * 100).toFixed(0)}% of everyone`
                : undefined}
            />
            <Stat
              label="Gone quiet"
              value={q.data.quiet.length}
              hint={q.data.quiet.length ? "Active churches with no recent activity" : "Nobody has gone quiet"}
              tone={q.data.quiet.length ? "warn" : "good"}
            />
          </div>

          <section>
            <h2 className="font-semibold mb-3">By joining month</h2>
            {!q.data.cohorts.length ? (
              <Empty title="No churches yet" />
            ) : (
              <Table head={["Joined", "Churches", "Still active", "Retention"]}>
                {q.data.cohorts.map((c) => (
                  <tr key={c.month} className={TR}>
                    <td className={TD}>{c.month}</td>
                    <td className={`${TD} tabular-nums`}>{c.joined}</td>
                    <td className={`${TD} tabular-nums`}>{c.still_active}</td>
                    <td className={TD}>
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-32 rounded-full bg-[var(--border)] overflow-hidden" aria-hidden>
                          <span
                            className="block h-full bg-emerald-400"
                            style={{ width: `${c.retention_percent}%` }}
                          />
                        </span>
                        <span className="text-xs tabular-nums">{c.retention_percent}%</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </section>

          <section>
            <h2 className="font-semibold mb-3">Gone quiet</h2>
            <p className="text-sm text-[var(--muted)] mb-3">
              Active churches nobody has signed into for a month. The list to work
              through before they cancel rather than after.
            </p>
            {!q.data.quiet.length ? (
              <Empty title="Everyone has been active" subtitle="No church has been quiet for 30 days." />
            ) : (
              <Table head={["Church", "Plan", "Last active", "Quiet for"]}>
                {q.data.quiet.map((c) => (
                  <tr key={c.id} className={TR}>
                    <td className={TD}>
                      <span className="font-medium">{c.name}</span>
                      <span className="block text-xs text-[var(--muted)]">{c.slug}</span>
                    </td>
                    <td className={TD}>{c.plan || "Free"}</td>
                    <td className={`${TD} text-[var(--muted)]`}>
                      {c.last_active_at?.slice(0, 10) ?? "never"}
                    </td>
                    <td className={`${TD} tabular-nums`}>
                      {c.days_quiet === null ? "—" : `${c.days_quiet} days`}
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
