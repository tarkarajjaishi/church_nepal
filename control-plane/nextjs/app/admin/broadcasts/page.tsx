"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Send, Users } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PageTitle, Stat, Failed, Loading, Empty, Table, TR, TD } from "@/components/platform";

/**
 * Message every church admin at once.
 *
 * The recipient list is resolved when you press send, not when the draft was
 * written — so a church that joined this morning is included, and one that
 * left is not.
 */

interface Broadcast {
  id: string; subject: string; body: string; audience: string; status: string;
  sent_at: string | null; created_by: string; created_at: string;
  recipient_count: number; delivered_count: number; failed_count: number;
}

const AUDIENCES = [
  { key: "all", label: "Every church" },
  { key: "active", label: "Active churches" },
  { key: "suspended", label: "Suspended churches" },
  { key: "Pro", label: "Churches on Pro" },
  { key: "Standard", label: "Churches on Standard" },
  { key: "Free", label: "Churches on Free" },
];

export default function BroadcastsPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);

  const q = useQuery({
    queryKey: ["platform-broadcasts"],
    queryFn: async () => (await apiClient.get<Broadcast[]>("/platform/broadcasts")).data,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["platform-broadcasts"] });

  const create = useMutation({
    mutationFn: (b: Record<string, unknown>) => apiClient.post("/platform/broadcasts", b),
    onSuccess: () => { invalidate(); setCreating(false); },
  });
  const send = useMutation({
    mutationFn: (id: string) => apiClient.post(`/platform/broadcasts/${id}/send`),
    onSuccess: invalidate,
  });

  const rows = q.data ?? [];
  const sendError = (send.error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Broadcasts"
        subtitle="One message to many churches"
        actions={
          <Button className="gap-2" onClick={() => { create.reset(); setCreating(true); }}>
            <Plus size={16} aria-hidden /> New broadcast
          </Button>
        }
      />

      {creating && (
        <Composer
          pending={create.isPending}
          error={(create.error as { response?: { data?: { error?: string } } })?.response?.data?.error}
          onCancel={() => setCreating(false)}
          onSave={create.mutate}
        />
      )}

      {sendError && <p className="text-sm text-red-400">{sendError}</p>}

      {q.isError ? <Failed error={q.error} onRetry={() => q.refetch()} /> : q.isLoading ? (
        <Loading />
      ) : !rows.length ? (
        <Empty title="Nothing sent yet" subtitle="Write one to tell every church something." />
      ) : (
        <Table head={["Subject", "Audience", "State", "Recipients", ""]}>
          {rows.map((b) => (
            <tr key={b.id} className={TR}>
              <td className={TD}>
                <span className="font-medium">{b.subject}</span>
                <span className="block text-xs text-[var(--muted)] truncate max-w-[30rem]">
                  {b.body}
                </span>
              </td>
              <td className={TD}>
                {AUDIENCES.find((a) => a.key === b.audience)?.label ?? b.audience}
              </td>
              <td className={TD}>
                <span className={b.status === "sent" ? "text-emerald-400" : "text-[var(--muted)]"}>
                  {b.status}
                </span>
                {b.sent_at && (
                  <span className="block text-xs text-[var(--muted)]">{b.sent_at.slice(0, 10)}</span>
                )}
              </td>
              <td className={`${TD} tabular-nums`}>
                {b.recipient_count}
                {!!b.failed_count && (
                  <span className="text-amber-400"> · {b.failed_count} failed</span>
                )}
              </td>
              <td className={TD}>
                {b.status === "draft" && (
                  <Button
                    size="sm" className="gap-1.5" disabled={send.isPending}
                    aria-label={`Send "${b.subject}"`}
                    onClick={() => {
                      if (confirm(`Send "${b.subject}"? This cannot be taken back.`)) {
                        send.mutate(b.id);
                      }
                    }}
                  >
                    <Send size={14} aria-hidden /> Send
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

function Composer({ onCancel, onSave, pending, error }: {
  onCancel: () => void;
  onSave: (b: Record<string, unknown>) => void;
  pending: boolean;
  error?: string;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");

  // Who this actually reaches, before it is sent rather than after.
  const preview = useQuery({
    queryKey: ["broadcast-audience", audience],
    queryFn: async () =>
      (await apiClient.get<{ count: number; emails: string[] }>(
        `/platform/broadcasts/audience?audience=${encodeURIComponent(audience)}`,
      )).data,
  });

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 space-y-4">
      <h2 className="font-semibold">New broadcast</h2>
      <div>
        <label htmlFor="b-subject" className="block text-sm font-medium mb-1">Subject</label>
        <Input id="b-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
      <div>
        <label htmlFor="b-body" className="block text-sm font-medium mb-1">Message</label>
        <textarea
          id="b-body" rows={6} value={body} onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--panel)] p-3 text-sm"
        />
      </div>
      <div>
        <label htmlFor="b-aud" className="block text-sm font-medium mb-1">Who receives it</label>
        <select id="b-aud" value={audience} onChange={(e) => setAudience(e.target.value)}
          className="h-10 w-full max-w-sm rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 text-sm">
          {AUDIENCES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
        </select>
      </div>

      <div className="rounded-lg border border-[var(--border)] p-3">
        <p className="text-sm font-medium flex items-center gap-2">
          <Users size={14} aria-hidden />
          {preview.isLoading ? "Counting…" : `${preview.data?.count ?? 0} recipients`}
        </p>
        {!!preview.data?.emails.length && (
          <p className="text-xs text-[var(--muted)] mt-1 break-all">
            {preview.data.emails.slice(0, 8).join(", ")}
            {preview.data.count > 8 && ` and ${preview.data.count - 8} more`}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          disabled={!subject.trim() || pending}
          onClick={() => onSave({ subject: subject.trim(), body, audience })}
        >
          {pending ? "Saving…" : "Save draft"}
        </Button>
      </div>
    </Card>
  );
}
