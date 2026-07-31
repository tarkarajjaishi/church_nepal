"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { PageTitle, Stat, Failed, Loading, Empty, Table, TR, TD } from "@/components/platform";
import { Input } from "@/components/ui/input";

/**
 * Who can operate this platform.
 *
 * The page used to sleep for half a second and then render five skeleton rows,
 * permanently — never calling the API. That reads as "still loading", not as
 * "nothing here", so it looked like a slow page rather than an absent one,
 * while /admin/settings/security correctly reported two administrators.
 *
 * The account without a second factor is the number worth surfacing: on a
 * console that governs every church, a password on its own is the whole door.
 */

interface Admin {
  id: string;
  email: string;
  role: string;
  status: string;
  last_active_at: string | null;
  created_at: string;
  twofa_enabled: boolean | null;
}

export default function AdminsPage() {
  const [term, setTerm] = useState("");
  const q = useQuery({
    queryKey: ["admins"],
    queryFn: async () => (await apiClient.get<Admin[]>("/admins")).data,
  });

  const rows = useMemo(() => {
    const all = q.data ?? [];
    const t = term.trim().toLowerCase();
    if (!t) return all;
    return all.filter((a) => `${a.email} ${a.role}`.toLowerCase().includes(t));
  }, [q.data, term]);

  const without2fa = (q.data ?? []).filter((a) => !a.twofa_enabled).length;

  return (
    <div className="space-y-6">
      <PageTitle title="Administrators" subtitle="Who can operate the platform" />

      {q.isError ? (
        <Failed error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat label="Administrators" value={q.data.length} />
            <Stat
              label="Without two-factor"
              value={without2fa}
              hint={
                without2fa
                  ? "A password alone opens every church"
                  : "Everyone has a second factor"
              }
              tone={without2fa ? "bad" : "good"}
            />
            <Stat
              label="Super administrators"
              value={q.data.filter((a) => a.role === "super_admin").length}
              hint={<Link href="/admin/admins/roles" className="underline">What each role may do</Link>}
            />
          </div>

          {!q.data.length ? (
            // Not reachable in practice — you have to be an administrator to
            // read this page — but an empty list must never render as skeletons.
            <Empty title="No administrators" />
          ) : (
            <>
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Filter by email or role…"
                aria-label="Filter administrators"
                className="max-w-sm h-10"
              />
              {!rows.length ? (
                <Empty title={`Nobody matches “${term}”`} />
              ) : (
                <Table head={["Email", "Role", "Two-factor", "Status", "Last active"]}>
                  {rows.map((a) => (
                    <tr key={a.id} className={TR}>
                      <td className={`${TD} font-medium`}>{a.email}</td>
                      <td className={TD}>{a.role}</td>
                      <td className={TD}>
                        {a.twofa_enabled ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400">
                            <ShieldCheck size={14} aria-hidden /> on
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-red-400">
                            <ShieldAlert size={14} aria-hidden /> off
                          </span>
                        )}
                      </td>
                      <td className={TD}>{a.status}</td>
                      <td className={`${TD} text-[var(--muted)]`}>
                        {a.last_active_at ? a.last_active_at.slice(0, 10) : "never"}
                      </td>
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
