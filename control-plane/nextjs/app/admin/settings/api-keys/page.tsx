"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { KeyRound, Copy, Check } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { PageTitle, Stat, Failed, Loading, Empty, Table, TR, TD } from "@/components/platform";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Keys that can act on this platform without a person behind them.
 *
 * The page used to list a fabricated "Webhook Handler / wh_abc" created in
 * January 2024, from a mock constant, complete with invented usage figures. A
 * made-up credential list is worse than an empty one: it invites someone to
 * believe an integration exists, and it hides a real key that does.
 *
 * The full key is returned once, on creation, and never again — only a prefix
 * and last four are stored — so it is shown once, prominently, and said plainly.
 */

interface ApiKey {
  id: string;
  name: string | null;
  masked_key: string;
  scopes: string[] | null;
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

const SCOPES = [
  "churches:read",
  "churches:write",
  "billing:read",
  "reports:read",
  "webhooks:read",
  "webhooks:write",
];

export default function ApiKeysPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  const [issued, setIssued] = useState<{ full_key: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const q = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => (await apiClient.get<ApiKey[]>("/api-keys")).data,
  });

  const create = useMutation({
    mutationFn: async () =>
      (
        await apiClient.post<{ full_key: string; name: string }>("/api-keys", {
          name: name.trim(),
          scopes,
        })
      ).data,
    onSuccess: (data) => {
      setIssued(data);
      setName("");
      setScopes([]);
      setCopied(false);
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  const revoke = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api-keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });

  const message = (create.error as { response?: { data?: { error?: string } } })?.response?.data
    ?.error;

  const live = (q.data ?? []).filter((k) => !k.revoked_at);

  return (
    <div className="space-y-6">
      <PageTitle title="API keys" subtitle="Programmatic access to the platform" />

      {issued && (
        <Card className="bg-[var(--panel)] border border-amber-500/30 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Copy “{issued.name}” now</h2>
          <p className="text-sm text-[var(--muted)]">
            Only a prefix and the last four characters are stored, so this is the
            one and only time the key can be shown. Losing it means issuing
            another.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm break-all">
              {issued.full_key}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                navigator.clipboard?.writeText(issued.full_key);
                setCopied(true);
              }}
            >
              {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIssued(null);
                setCopied(false);
              }}
            >
              I have saved it
            </Button>
          </div>
        </Card>
      )}

      {q.isError ? (
        <Failed error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat label="Active keys" value={live.length} />
            <Stat label="Revoked" value={q.data.length - live.length} />
            <Stat label="Ever used" value={q.data.filter((k) => k.last_used_at).length} />
          </div>

          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <KeyRound size={16} aria-hidden /> Issue a key
            </h2>
            <div className="flex flex-wrap gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What is it for?"
                aria-label="Key name"
                className="max-w-xs h-10"
              />
              <Button disabled={!name.trim() || create.isPending} onClick={() => create.mutate()}>
                {create.isPending ? "Issuing…" : "Issue key"}
              </Button>
            </div>
            <fieldset className="flex flex-wrap gap-2">
              <legend className="text-sm text-[var(--muted)] mb-2">
                What may it do? A key with no scopes can do nothing.
              </legend>
              {SCOPES.map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-2 text-sm px-2.5 py-1.5 rounded-lg border border-[var(--border)] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={scopes.includes(s)}
                    onChange={(e) =>
                      setScopes((prev) =>
                        e.target.checked ? [...prev, s] : prev.filter((x) => x !== s),
                      )
                    }
                  />
                  {s}
                </label>
              ))}
            </fieldset>
            {message && <p className="text-sm text-red-400">{message}</p>}
          </Card>

          {!q.data.length ? (
            <Empty title="No keys have been issued" />
          ) : (
            <Table head={["Name", "Key", "Scopes", "Last used", "Created", ""]}>
              {q.data.map((k) => (
                <tr key={k.id} className={TR}>
                  <td className={TD}>
                    {k.name || "—"}
                    {k.revoked_at && (
                      <span className="block text-xs text-red-400">
                        revoked {k.revoked_at.slice(0, 10)}
                      </span>
                    )}
                  </td>
                  <td className={`${TD} font-mono text-xs`}>{k.masked_key}</td>
                  <td className={`${TD} text-[var(--muted)] text-xs`}>
                    {k.scopes?.length ? k.scopes.join(", ") : "none"}
                  </td>
                  <td className={`${TD} text-[var(--muted)]`}>
                    {k.last_used_at ? k.last_used_at.slice(0, 10) : "never"}
                  </td>
                  <td className={`${TD} text-[var(--muted)]`}>{k.created_at.slice(0, 10)}</td>
                  <td className={`${TD} text-right`}>
                    {!k.revoked_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Revoke ${k.name || "this key"}`}
                        disabled={revoke.isPending}
                        onClick={() => revoke.mutate(k.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </>
      )}
    </div>
  );
}
