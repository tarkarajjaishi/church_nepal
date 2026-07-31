"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  PageTitle, Stat, Failed, Loading, Table, TR, TD, bytes,
} from "@/components/platform";

/**
 * Health of the platform itself.
 *
 * Everything here is read from Postgres' own statistics at request time, so
 * there is nothing to keep up to date and nothing that can go stale.
 */

interface TableSize { name: string; bytes: number; rows: number }
interface Data {
  uptime_seconds: number; version: string; database_size_bytes: number;
  connections: number; max_connections: number;
  tenant_databases: number; tenant_size_bytes: number;
  provisioning_stuck: number; failed_churches: number;
  largest_tables: TableSize[];
  recent_errors: { action?: string; target?: string; actor?: string; at?: string }[];
}

function duration(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function OpsPage() {
  const q = useQuery({
    queryKey: ["platform-ops"],
    queryFn: async () => (await apiClient.get<Data>("/platform/ops")).data,
    // Health that is a minute old is not health.
    refetchInterval: 30_000,
  });

  const d = q.data;
  const connectionLoad = d ? (d.connections / Math.max(1, d.max_connections)) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Operations"
        subtitle={d ? `API ${d.version}, up ${duration(d.uptime_seconds)}` : "Platform health"}
      />

      {q.isError ? <Failed error={q.error} onRetry={() => q.refetch()} /> : !d ? <Loading /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat
              label="Database connections"
              value={`${d.connections} / ${d.max_connections}`}
              hint={`${connectionLoad.toFixed(0)}% of the ceiling`}
              tone={connectionLoad > 80 ? "bad" : connectionLoad > 60 ? "warn" : "good"}
            />
            <Stat label="Control database" value={bytes(d.database_size_bytes)} />
            <Stat
              label="Tenant databases"
              value={d.tenant_databases}
              hint={`${bytes(d.tenant_size_bytes)} in total`}
            />
            <Stat
              label="Provisioning stuck"
              value={d.provisioning_stuck}
              hint={d.provisioning_stuck
                ? "Started over 15 minutes ago and never finished"
                : "Nothing is stuck"}
              tone={d.provisioning_stuck ? "bad" : "good"}
            />
          </div>

          {!!d.failed_churches && (
            <Stat
              label="Churches in a failed state"
              value={d.failed_churches}
              hint="Provisioning did not complete — these sites are not serving"
              tone="bad"
            />
          )}

          <section>
            <h2 className="font-semibold mb-3">Largest tables</h2>
            <Table head={["Table", "Size", "Rows (estimate)"]}>
              {d.largest_tables.map((t) => (
                <tr key={t.name} className={TR}>
                  <td className={`${TD} font-mono text-xs`}>{t.name}</td>
                  <td className={`${TD} tabular-nums`}>{bytes(t.bytes)}</td>
                  {/* Postgres keeps an estimate, not a count. Said so, because
                      a number that looks exact and is not is worse than one
                      that admits it. */}
                  <td className={`${TD} tabular-nums text-[var(--muted)]`}>
                    ~{t.rows.toLocaleString()}
                  </td>
                </tr>
              ))}
            </Table>
          </section>

          <section>
            <h2 className="font-semibold mb-3">Recent failures</h2>
            {!d.recent_errors.length ? (
              <p className="text-sm text-[var(--muted)]">Nothing has failed recently.</p>
            ) : (
              <Table head={["When", "What", "Who"]}>
                {d.recent_errors.map((e, i) => (
                  <tr key={i} className={TR}>
                    <td className={`${TD} text-[var(--muted)] whitespace-nowrap`}>
                      {e.at?.slice(0, 16).replace("T", " ")}
                    </td>
                    <td className={TD}>{e.action} {e.target && `· ${e.target}`}</td>
                    <td className={`${TD} text-[var(--muted)]`}>{e.actor}</td>
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
