"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Send, Trash2, KeyRound } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PageTitle, Stat, Failed, Loading, Empty, Table, TR, TD } from "@/components/platform";

/**
 * Outbound events to other systems.
 *
 * The signing secret is shown once, at creation, and never again — a receiver
 * that loses it needs a new endpoint. That is the same rule every payment
 * provider uses, and for the same reason.
 */

interface Endpoint {
  id: string; url: string; description: string; events: string[]; active: boolean;
  created_at: string; delivery_count: number; failure_count: number;
  last_delivery_at: string | null;
}
interface Delivery {
  id: number; event: string; status_code: number | null; error: string;
  attempt: number; created_at: string;
}

const EVENTS = ["church.created", "church.suspended", "church.reactivated", "invoice.paid", "invoice.failed"];

export default function WebhooksPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["platform-webhooks"],
    queryFn: async () => (await apiClient.get<Endpoint[]>("/platform/webhooks")).data,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["platform-webhooks"] });

  const create = useMutation({
    mutationFn: (body: { url: string; description: string; events: string[] }) =>
      apiClient.post<{ id: string; secret: string }>("/platform/webhooks", body),
    onSuccess: (r) => { invalidate(); setCreating(false); setSecret(r.data.secret); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/platform/webhooks/${id}`),
    onSuccess: invalidate,
  });
  const test = useMutation({
    mutationFn: (id: string) => apiClient.post(`/platform/webhooks/${id}/test`),
    onSuccess: invalidate,
  });

  const endpoints = q.data ?? [];

  return (
    <div className="space-y-6">
      <PageTitle
        title="Webhooks"
        subtitle="Tell another system when something happens here"
        actions={
          <Button className="gap-2" onClick={() => setCreating(true)}>
            <Plus size={16} aria-hidden /> Add endpoint
          </Button>
        }
      />

      {secret && (
        <Card className="bg-[var(--panel)] border border-emerald-500/30 rounded-xl p-4">
          <p className="font-medium flex items-center gap-2">
            <KeyRound size={16} aria-hidden /> Signing secret
          </p>
          <p className="text-sm text-[var(--muted)] mt-1">
            Copy this now — it is never shown again. The receiver uses it to verify
            that a payload really came from us.
          </p>
          <code className="block mt-2 p-2 rounded bg-[var(--border)] text-xs break-all">
            {secret}
          </code>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setSecret(null)}>
            I have copied it
          </Button>
        </Card>
      )}

      {creating && <NewEndpoint onCancel={() => setCreating(false)} onSave={create.mutate} pending={create.isPending} error={create.error} />}

      {q.isError ? <Failed error={q.error} onRetry={() => q.refetch()} /> : q.isLoading ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat label="Endpoints" value={endpoints.length} />
            <Stat label="Deliveries" value={endpoints.reduce((a, e) => a + e.delivery_count, 0)} />
            <Stat
              label="Failed deliveries"
              value={endpoints.reduce((a, e) => a + e.failure_count, 0)}
              tone={endpoints.some((e) => e.failure_count) ? "warn" : "good"}
            />
          </div>

          {!endpoints.length ? (
            <Empty title="No endpoints yet" subtitle="Add one to start sending events." />
          ) : (
            <Table head={["Endpoint", "Events", "Deliveries", "Last", ""]}>
              {endpoints.map((e) => (
                <tr key={e.id} className={TR}>
                  <td className={TD}>
                    <span className="font-mono text-xs break-all">{e.url}</span>
                    {e.description && (
                      <span className="block text-xs text-[var(--muted)]">{e.description}</span>
                    )}
                  </td>
                  <td className={`${TD} text-xs text-[var(--muted)]`}>
                    {e.events.length ? e.events.join(", ") : "everything"}
                  </td>
                  <td className={`${TD} tabular-nums`}>
                    {e.delivery_count}
                    {!!e.failure_count && (
                      <span className="text-amber-400"> · {e.failure_count} failed</span>
                    )}
                  </td>
                  <td className={`${TD} text-xs text-[var(--muted)] whitespace-nowrap`}>
                    {e.last_delivery_at?.slice(0, 16).replace("T", " ") ?? "never"}
                  </td>
                  <td className={TD}>
                    <span className="flex items-center gap-1 justify-end">
                      <Button
                        variant="outline" size="sm" className="gap-1.5"
                        disabled={test.isPending}
                        aria-label={`Send a test event to ${e.url}`}
                        onClick={() => test.mutate(e.id)}
                      >
                        <Send size={14} aria-hidden /> Test
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        aria-label={`Show deliveries for ${e.url}`}
                        onClick={() => setOpen(open === e.id ? null : e.id)}
                      >
                        Log
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        aria-label={`Delete the endpoint ${e.url}`}
                        onClick={() => { if (confirm(`Delete ${e.url}?`)) remove.mutate(e.id); }}
                      >
                        <Trash2 size={14} className="text-red-400" aria-hidden />
                      </Button>
                    </span>
                  </td>
                </tr>
              ))}
            </Table>
          )}

          {open && <DeliveryLog id={open} />}
        </>
      )}
    </div>
  );
}

function NewEndpoint({ onCancel, onSave, pending, error }: {
  onCancel: () => void;
  onSave: (b: { url: string; description: string; events: string[] }) => void;
  pending: boolean;
  error: unknown;
}) {
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 space-y-4">
      <h2 className="font-semibold">New endpoint</h2>
      <div>
        <label htmlFor="hook-url" className="block text-sm font-medium mb-1">URL</label>
        <Input
          id="hook-url" value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/churchnepal"
        />
        <p className="text-xs text-[var(--muted)] mt-1">
          Must be https — anything else sends church data across the network in the clear.
        </p>
      </div>
      <div>
        <label htmlFor="hook-desc" className="block text-sm font-medium mb-1">What is it for</label>
        <Input id="hook-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <fieldset>
        <legend className="text-sm font-medium mb-1">Events</legend>
        <p className="text-xs text-[var(--muted)] mb-2">Choose none to receive everything.</p>
        <div className="flex flex-wrap gap-2">
          {EVENTS.map((ev) => (
            <label key={ev} className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={events.includes(ev)}
                onChange={(e) =>
                  setEvents((s) => (e.target.checked ? [...s, ev] : s.filter((x) => x !== ev)))
                }
              />
              <span className="font-mono">{ev}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {message && <p className="text-sm text-red-400">{message}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          disabled={!url.trim() || pending}
          onClick={() => onSave({ url: url.trim(), description, events })}
        >
          {pending ? "Saving…" : "Add endpoint"}
        </Button>
      </div>
    </Card>
  );
}

function DeliveryLog({ id }: { id: string }) {
  const q = useQuery({
    queryKey: ["webhook-deliveries", id],
    queryFn: async () => (await apiClient.get<Delivery[]>(`/platform/webhooks/${id}/deliveries`)).data,
  });
  if (q.isLoading) return <Loading rows={3} />;
  if (!q.data?.length) return <Empty title="Nothing delivered yet" />;
  return (
    <Table head={["When", "Event", "Response", "Attempt"]}>
      {q.data.map((d) => (
        <tr key={d.id} className={TR}>
          <td className={`${TD} text-[var(--muted)] whitespace-nowrap`}>
            {d.created_at.slice(0, 19).replace("T", " ")}
          </td>
          <td className={`${TD} font-mono text-xs`}>{d.event}</td>
          <td className={TD}>
            {d.status_code === null ? (
              <span className="text-red-400">{d.error || "no response"}</span>
            ) : (
              <span className={d.status_code >= 400 ? "text-amber-400" : "text-emerald-400"}>
                {d.status_code}
              </span>
            )}
          </td>
          <td className={`${TD} tabular-nums`}>{d.attempt}</td>
        </tr>
      ))}
    </Table>
  );
}
