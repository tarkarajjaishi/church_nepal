"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  PageTitle, Stat, Failed, Loading, Empty, Table, TR, TD, outcome,
} from "@/components/platform";

/**
 * Who is signed in, and who could sign in with a password alone.
 *
 * Ending a session signs that administrator out everywhere the token was used,
 * which is the point of having the button at all.
 */

interface Session {
  id: string; admin_email: string; user_agent: string | null; ip_address: string | null;
  last_used_at: string | null; expires_at: string; created_at: string;
}
interface Data {
  sessions: Session[]; admins_total: number; admins_without_2fa: number;
  recent_sign_ins: { actor?: string; action?: string; ip?: string; at?: string }[];
}

export default function SecurityPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["platform-security"],
    queryFn: async () => (await apiClient.get<Data>("/platform/security")).data,
  });

  const revoke = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/platform/security/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["platform-security"] }),
  });

  const d = q.data;
  const { failed, loading, reason } = outcome(q);

  return (
    <div className="space-y-6">
      <PageTitle title="Security" subtitle="Sessions, two-factor and recent sign-ins" />

      {failed ? <Failed error={reason} onRetry={() => q.refetch()} /> : loading || !d ? <Loading /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat label="Administrators" value={d.admins_total} />
            {/* On a console that governs every church, this is the number that
                matters most. */}
            <Stat
              label="Without two-factor"
              value={d.admins_without_2fa}
              hint={d.admins_without_2fa
                ? "These accounts need only a password"
                : "Everyone has a second factor"}
              tone={d.admins_without_2fa ? "bad" : "good"}
            />
            <Stat label="Open sessions" value={d.sessions.length} />
          </div>

          {!!d.admins_without_2fa && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
              <ShieldAlert className="size-4 mt-0.5 text-amber-400 shrink-0" aria-hidden />
              <p className="text-sm text-[var(--muted)]">
                {d.admins_without_2fa} administrator{d.admins_without_2fa === 1 ? "" : "s"} can
                sign in with a password alone. Anyone who holds one of those passwords can
                suspend every church on the platform.
              </p>
            </div>
          )}

          <section>
            <h2 className="font-semibold mb-3">Open sessions</h2>
            {!d.sessions.length ? (
              <Empty title="No open sessions" />
            ) : (
              <Table head={["Administrator", "Where from", "Last used", "Expires", ""]}>
                {d.sessions.map((s) => (
                  <tr key={s.id} className={TR}>
                    <td className={`${TD} font-medium`}>{s.admin_email}</td>
                    <td className={TD}>
                      <span className="block">{s.ip_address ?? "unknown"}</span>
                      <span className="block text-xs text-[var(--muted)] truncate max-w-[22rem]">
                        {s.user_agent ?? ""}
                      </span>
                    </td>
                    <td className={`${TD} text-[var(--muted)] whitespace-nowrap`}>
                      {s.last_used_at?.slice(0, 16).replace("T", " ") ?? "never"}
                    </td>
                    <td className={`${TD} text-[var(--muted)] whitespace-nowrap`}>
                      {s.expires_at.slice(0, 16).replace("T", " ")}
                    </td>
                    <td className={TD}>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={revoke.isPending}
                        aria-label={`End the session for ${s.admin_email}`}
                        onClick={() => {
                          if (confirm(`End this session? ${s.admin_email} will be signed out.`)) {
                            revoke.mutate(s.id);
                          }
                        }}
                      >
                        End session
                      </Button>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </section>

          <section>
            <h2 className="font-semibold mb-3">Recent sign-ins</h2>
            {!d.recent_sign_ins.length ? (
              <p className="text-sm text-[var(--muted)]">Nothing recorded yet.</p>
            ) : (
              <Table head={["When", "Who", "From"]}>
                {d.recent_sign_ins.map((e, i) => (
                  <tr key={i} className={TR}>
                    <td className={`${TD} text-[var(--muted)] whitespace-nowrap`}>
                      {e.at?.slice(0, 16).replace("T", " ")}
                    </td>
                    <td className={TD}>{e.actor}</td>
                    <td className={`${TD} text-[var(--muted)]`}>{e.ip ?? "unknown"}</td>
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
