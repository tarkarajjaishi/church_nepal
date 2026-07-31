"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { PageTitle, Stat, Failed, Loading, Table, TR, TD } from "@/components/platform";

/**
 * Turn a module on for one church, or for a slice of them, or for everybody.
 *
 * A flag that is off is off for everyone regardless of the percentage — the
 * rollout only narrows an enabled flag, it never enables a disabled one.
 */

interface Flag {
  key: string; description: string; enabled: boolean; rollout_percent: number;
  church_slugs: string[]; updated_by: string; updated_at: string;
}

export default function FlagsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["platform-flags"],
    queryFn: async () => (await apiClient.get<Flag[]>("/platform/flags")).data,
  });

  const update = useMutation({
    mutationFn: ({ key, patch }: { key: string; patch: Partial<Flag> }) =>
      apiClient.patch(`/platform/flags/${key}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["platform-flags"] }),
  });

  const flags = q.data ?? [];

  return (
    <div className="space-y-6">
      <PageTitle title="Feature flags" subtitle="What is switched on, and for whom" />

      {q.isError ? <Failed error={q.error} onRetry={() => q.refetch()} /> : q.isLoading ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat label="Flags" value={flags.length} />
            <Stat label="On" value={flags.filter((f) => f.enabled).length} />
            <Stat
              label="Partially rolled out"
              value={flags.filter((f) => f.enabled && f.rollout_percent < 100).length}
              hint="On, but not for everybody"
            />
          </div>

          <Table head={["Flag", "On", "Rollout", "Always on for", "Last changed"]}>
            {flags.map((f) => (
              <tr key={f.key} className={TR}>
                <td className={TD}>
                  <span className="font-mono text-xs">{f.key}</span>
                  <span className="block text-xs text-[var(--muted)]">{f.description}</span>
                </td>
                <td className={TD}>
                  <Switch
                    checked={f.enabled}
                    aria-label={`Turn ${f.key} ${f.enabled ? "off" : "on"}`}
                    onCheckedChange={(v) => update.mutate({ key: f.key, patch: { enabled: v } })}
                  />
                </td>
                <td className={TD}>
                  <span className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="h-8 w-20"
                      aria-label={`Rollout percentage for ${f.key}`}
                      defaultValue={f.rollout_percent}
                      disabled={!f.enabled}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== f.rollout_percent && v >= 0 && v <= 100) {
                          update.mutate({ key: f.key, patch: { rollout_percent: v } });
                        }
                      }}
                    />
                    <span className="text-xs text-[var(--muted)]">%</span>
                  </span>
                </td>
                <td className={`${TD} text-xs text-[var(--muted)]`}>
                  {/* Named churches get it whatever the percentage says — this
                      is how a feature reaches one willing church first. */}
                  {f.church_slugs.length ? f.church_slugs.join(", ") : "—"}
                </td>
                <td className={`${TD} text-xs text-[var(--muted)] whitespace-nowrap`}>
                  {f.updated_at.slice(0, 10)}
                  {f.updated_by && <span className="block">{f.updated_by}</span>}
                </td>
              </tr>
            ))}
          </Table>
        </>
      )}
    </div>
  );
}
