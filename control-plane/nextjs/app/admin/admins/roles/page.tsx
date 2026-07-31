"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageTitle, Failed, Loading } from "@/components/platform";

/**
 * What each control-plane role may do.
 *
 * Built-in roles cannot be edited here: their meaning is compiled into the
 * server's own extractors, so letting someone change `super_admin` in this
 * table would imply a power the console does not actually have.
 */

interface Role {
  name: string; description: string; permissions: string[];
  is_builtin: boolean; admin_count: number;
}
interface Permission { key: string; label: string }

export default function RolesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);

  const roles = useQuery({
    queryKey: ["platform-roles"],
    queryFn: async () => (await apiClient.get<Role[]>("/platform/roles")).data,
  });
  const perms = useQuery({
    queryKey: ["platform-permissions"],
    queryFn: async () => (await apiClient.get<Permission[]>("/platform/permissions")).data,
  });

  const save = useMutation({
    mutationFn: ({ name, permissions }: { name: string; permissions: string[] }) =>
      apiClient.patch(`/platform/roles/${name}`, { permissions }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-roles"] });
      setEditing(null);
    },
  });
  const message = (save.error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;

  return (
    <div className="space-y-6">
      <PageTitle title="Roles" subtitle="What each role may do, and who holds it" />

      {roles.isError ? <Failed error={roles.error} onRetry={() => roles.refetch()} />
        : roles.isLoading ? <Loading /> : (
        <div className="space-y-4">
          {(roles.data ?? []).map((r) => (
            <Card key={r.name} className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-semibold flex items-center gap-2">
                    {r.name}
                    {r.is_builtin && (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">
                        <Lock size={12} aria-hidden /> built in
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-[var(--muted)] mt-0.5">{r.description}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {/* The verb agrees too: "1 administrator holds this",
                        "0 administrators hold this". */}
                    {r.admin_count} administrator{r.admin_count === 1 ? " holds" : "s hold"} this
                  </p>
                </div>
                {!r.is_builtin && (
                  <Button
                    variant="outline" size="sm"
                    aria-label={`Edit the ${r.name} role`}
                    onClick={() => { save.reset(); setEditing(editing === r.name ? null : r.name); }}
                  >
                    {editing === r.name ? "Close" : "Edit"}
                  </Button>
                )}
              </div>

              {editing === r.name ? (
                <Editor
                  role={r}
                  permissions={perms.data ?? []}
                  pending={save.isPending}
                  error={message}
                  onSave={(permissions) => save.mutate({ name: r.name, permissions })}
                />
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {r.permissions.map((p) => (
                    <span key={p} className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--border)]">
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Editor({ role, permissions, onSave, pending, error }: {
  role: Role;
  permissions: Permission[];
  onSave: (permissions: string[]) => void;
  pending: boolean;
  error?: string;
}) {
  const [held, setHeld] = useState<string[]>(role.permissions);

  return (
    <div className="mt-4 space-y-3">
      <fieldset>
        <legend className="text-sm font-medium mb-2">Permissions</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {permissions.map((p) => (
            <label key={p.key} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={held.includes(p.key)}
                onChange={(e) =>
                  setHeld((s) => (e.target.checked ? [...s, p.key] : s.filter((x) => x !== p.key)))
                }
              />
              <span>
                <span className="block">{p.label}</span>
                <span className="block text-xs font-mono text-[var(--muted)]">{p.key}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end">
        <Button disabled={pending} onClick={() => onSave(held)}>
          {pending ? "Saving…" : "Save role"}
        </Button>
      </div>
    </div>
  );
}
