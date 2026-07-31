"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { PageTitle, Stat, Failed, Loading, Empty, Table, TR, TD } from "@/components/platform";
import { Input } from "@/components/ui/input";

/**
 * What administrators have actually done.
 *
 * This page used to render invented entries — CREATE_USER against usr-123 from
 * 192.168.1.1, dated 2024 — from a mock constant, because there was no endpoint
 * to call. A log of things nobody did is worse than no log at all: this is the
 * page people are meant to be able to trust when working out what happened.
 *
 * It now shows the table, and when the table is empty it says so.
 */

interface Entry {
  id: number;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  ip: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export default function AuditLogPage() {
  const [term, setTerm] = useState("");
  const q = useQuery({
    queryKey: ["audit-log"],
    queryFn: async () => (await apiClient.get<Entry[]>("/audit-log")).data,
  });

  const entries = useMemo(() => {
    const all = q.data ?? [];
    const t = term.trim().toLowerCase();
    if (!t) return all;
    return all.filter((e) =>
      [e.actor_email, e.action, e.target_type, e.target_id].some((v) =>
        (v ?? "").toLowerCase().includes(t),
      ),
    );
  }, [q.data, term]);

  const actors = new Set((q.data ?? []).map((e) => e.actor_email).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <PageTitle title="Audit log" subtitle="Who changed what, and when" />

      {q.isError ? (
        <Failed error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat label="Recorded events" value={q.data.length} hint="Most recent 200" />
            <Stat label="Administrators involved" value={actors} />
            <Stat
              label="Most recent"
              value={q.data.length ? q.data[0].created_at.slice(0, 10) : "—"}
            />
          </div>

          {!q.data.length ? (
            <Empty title="Nothing has been recorded yet" />
          ) : (
            <>
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Filter by administrator, action or target…"
                aria-label="Filter the audit log"
                className="max-w-sm h-10"
              />
              {!entries.length ? (
                <Empty title={`Nothing matches “${term}”`} />
              ) : (
                <Table head={["When", "Administrator", "Action", "Target", "From"]}>
                  {entries.map((e) => (
                    <tr key={e.id} className={TR}>
                      <td className={`${TD} text-[var(--muted)] whitespace-nowrap`}>
                        {e.created_at.slice(0, 16).replace("T", " ")}
                      </td>
                      <td className={TD}>{e.actor_email ?? "system"}</td>
                      <td className={`${TD} font-medium`}>{e.action}</td>
                      <td className={TD}>
                        {e.target_type ? (
                          <>
                            {e.target_type}
                            {e.target_id && (
                              <span className="block text-xs text-[var(--muted)] truncate max-w-[18rem]">
                                {e.target_id}
                              </span>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      {/* Nothing populates the address column yet, so it says
                          so rather than inventing one, which is what it did. */}
                      <td className={`${TD} text-[var(--muted)]`}>{e.ip ?? "not recorded"}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
