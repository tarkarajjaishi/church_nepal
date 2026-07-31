"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Database, Play, Unplug } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageTitle, Stat, Failed, Loading, Empty, Table, TR, TD, bytes } from "@/components/platform";

/**
 * Snapshots, and whether they exist.
 *
 * "We have backups" is only a true sentence about churches whose dump is still
 * on disk — so the ones without are named rather than counted. A row recording
 * that a backup was taken is a weaker claim than a file you can restore from,
 * and every figure here is checked against the disk before it is shown.
 *
 * Coverage is worked out from the registry, which means it can only ever be a
 * statement about churches the registry remembers. A database left behind by a
 * provision that failed partway is not covered by that sentence and not
 * contradicted by it either, so it is reconciled separately and shown on its
 * own terms.
 */

interface Run {
  id: string; church_slug: string | null; kind: string; status: string;
  size_bytes: number; path: string; error: string; started_by: string;
  started_at: string; finished_at: string | null; available: boolean;
}
interface Stray {
  name: string; size_bytes: number; last_backup_at: string | null;
}
interface Data {
  runs: Run[]; last_success_at: string | null; unprotected: string[];
  unregistered: Stray[]; total_size_bytes: number; missing_files: number;
  pg_dump_available: boolean;
}

export default function BackupsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["platform-backups"],
    queryFn: async () => (await apiClient.get<Data>("/platform/backups")).data,
  });

  const run = useMutation({
    mutationFn: (slug: string) => apiClient.post(`/platform/backups/${slug}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["platform-backups"] }),
  });
  const message = (run.error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;

  const d = q.data;

  return (
    <div className="space-y-6">
      <PageTitle title="Backups" subtitle="Snapshots per church, and when one last worked" />

      {q.isError ? <Failed error={q.error} onRetry={() => q.refetch()} /> : !d ? <Loading /> : (
        <>
          {!d.pg_dump_available && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <AlertTriangle className="size-4 mt-0.5 text-red-400 shrink-0" aria-hidden />
              <p className="text-sm text-[var(--muted)]">
                <span className="text-[var(--text-strong)] font-medium">pg_dump is not on the
                PATH of this server.</span> No backup can be taken until it is — said here rather
                than discovered at the moment one is needed.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat
              label="Last successful backup"
              value={d.last_success_at ? d.last_success_at.slice(0, 10) : "never"}
              tone={d.last_success_at ? "good" : "bad"}
            />
            <Stat
              label="Churches with no backup"
              value={d.unprotected.length}
              hint={
                d.unprotected.length
                  ? d.unprotected.slice(0, 3).join(", ")
                  // Not "everyone is covered": this counts the registry, and the
                  // tile beside it exists precisely because the registry can be
                  // incomplete.
                  : "Every registered church has one"
              }
              tone={d.unprotected.length ? "bad" : "good"}
            />
            <Stat
              label="Databases with no church"
              value={d.unregistered.length}
              hint={
                d.unregistered.length
                  ? d.unregistered.map((s) => s.name).slice(0, 2).join(", ")
                  : "Registry matches the instance"
              }
              tone={d.unregistered.length ? "bad" : "good"}
            />
            <Stat
              label="Stored"
              value={bytes(d.total_size_bytes)}
              hint={
                d.missing_files
                  ? `${d.missing_files} recorded backup${d.missing_files > 1 ? "s are" : " is"} no longer on disk`
                  : "Measured on disk"
              }
              tone={d.missing_files ? "bad" : undefined}
            />
          </div>

          {message && <p className="text-sm text-red-400">{message}</p>}

          {!!d.unregistered.length && (
            <Card className="bg-[var(--panel)] border border-amber-500/30 rounded-xl p-5">
              <h2 className="font-semibold flex items-center gap-2">
                <Unplug size={16} className="text-amber-400" aria-hidden /> Databases with no church
              </h2>
              <p className="text-sm text-[var(--muted)] mt-1 mb-4 max-w-2xl">
                These exist on the instance but no church row points at them —
                usually a provision that created the database and then failed
                before the registry row was written. Every other figure on this
                page is counted from the registry, so nothing above describes
                them. Back one up before deciding whether to keep it — dropping a
                database is not something this page will do for you.
              </p>
              <Table head={["Database", "Size", "Last backup", ""]}>
                {d.unregistered.map((s) => (
                  <tr key={s.name} className={TR}>
                    <td className={`${TD} font-medium`}>{s.name}</td>
                    <td className={`${TD} tabular-nums`}>{bytes(s.size_bytes)}</td>
                    <td className={TD}>
                      {s.last_backup_at ? (
                        <span className="text-[var(--muted)]">
                          {s.last_backup_at.slice(0, 10)}
                        </span>
                      ) : (
                        <span className="text-amber-400">never</span>
                      )}
                    </td>
                    <td className={`${TD} text-right`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={run.isPending || !d.pg_dump_available}
                        aria-label={`Back up the ${s.name} database now`}
                        onClick={() => run.mutate(s.name)}
                      >
                        <Play size={13} aria-hidden /> Back up
                      </Button>
                    </td>
                  </tr>
                ))}
              </Table>
            </Card>
          )}

          {!!d.unprotected.length && (
            <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
              <h2 className="font-semibold flex items-center gap-2">
                <Database size={16} aria-hidden /> Nothing to restore from
              </h2>
              {/* Not "never backed up": a church lands here either because no
                  dump was ever taken or because the one that was has gone from
                  disk, and from a restore's point of view those are the same
                  position. Saying "never" would flatly contradict a run above
                  it that says ok. */}
              <p className="text-sm text-[var(--muted)] mt-1 mb-3">
                No dump exists for these that could be restored — either none was
                ever taken, or the file is no longer on disk. If the instance
                were lost today, so would they be.
              </p>
              <div className="flex flex-wrap gap-2">
                {d.unprotected.map((slug) => (
                  <Button
                    key={slug}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={run.isPending || !d.pg_dump_available}
                    aria-label={`Back up ${slug} now`}
                    onClick={() => run.mutate(slug)}
                  >
                    <Play size={13} aria-hidden /> {slug}
                  </Button>
                ))}
              </div>
            </Card>
          )}

          <section>
            <h2 className="font-semibold mb-3">Recent runs</h2>
            {!d.runs.length ? (
              <Empty title="Nothing has been run yet" />
            ) : (
              <Table head={["Started", "Church", "Kind", "Result", "Size", "By"]}>
                {d.runs.map((r) => (
                  <tr key={r.id} className={TR}>
                    <td className={`${TD} text-[var(--muted)] whitespace-nowrap`}>
                      {r.started_at.slice(0, 16).replace("T", " ")}
                    </td>
                    <td className={TD}>{r.church_slug ?? "—"}</td>
                    <td className={TD}>{r.kind}</td>
                    <td className={TD}>
                      <span className={
                        r.status === "ok" ? "text-emerald-400"
                        : r.status === "failed" ? "text-red-400" : "text-[var(--muted)]"
                      }>
                        {r.status}
                      </span>
                      {r.error && (
                        <span className="block text-xs text-[var(--muted)] truncate max-w-[24rem]">
                          {r.error}
                        </span>
                      )}
                    </td>
                    <td className={`${TD} tabular-nums`}>
                      {r.size_bytes ? bytes(r.size_bytes) : "—"}
                      {/* A run that succeeded and whose file has since gone is
                          the dangerous row on this page: it reads as a backup
                          until the day somebody needs it. */}
                      {r.status === "ok" && !r.available && (
                        <span className="block text-xs text-red-400 whitespace-nowrap">
                          file missing
                        </span>
                      )}
                    </td>
                    <td className={`${TD} text-[var(--muted)]`}>{r.started_by}</td>
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
