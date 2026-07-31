"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PageTitle, Failed, Loading } from "@/components/platform";

/**
 * What the platform sends, and how it reads.
 *
 * The server refuses a substitution the template does not declare, so a typo
 * like {{chruch_name}} cannot ship and reach every church as literal text in
 * their welcome email.
 */

interface Template {
  key: string; name: string; subject: string; body: string;
  description: string; variables: string[]; updated_by: string; updated_at: string;
}

export default function TemplatesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["platform-templates"],
    queryFn: async () => (await apiClient.get<Template[]>("/platform/templates")).data,
  });

  const save = useMutation({
    mutationFn: ({ key, subject, body }: { key: string; subject: string; body: string }) =>
      apiClient.patch(`/platform/templates/${key}`, { subject, body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-templates"] });
      setEditing(null);
    },
  });

  const message = (save.error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;

  return (
    <div className="space-y-6">
      <PageTitle title="Email templates" subtitle="What the platform sends to churches" />

      {q.isError ? <Failed error={q.error} onRetry={() => q.refetch()} /> : q.isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-4">
          {(q.data ?? []).map((t) => (
            <Card key={t.key} className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-semibold">{t.name}</h2>
                  <p className="text-sm text-[var(--muted)] mt-0.5">{t.description}</p>
                </div>
                <Button
                  variant="outline" size="sm"
                  aria-label={`Edit the ${t.name} template`}
                  onClick={() => { save.reset(); setEditing(editing === t.key ? null : t.key); }}
                >
                  {editing === t.key ? "Close" : "Edit"}
                </Button>
              </div>

              {editing === t.key ? (
                <Editor
                  template={t}
                  error={message}
                  pending={save.isPending}
                  onSave={(subject, body) => save.mutate({ key: t.key, subject, body })}
                />
              ) : (
                <div className="mt-3 space-y-2">
                  <p className="text-sm"><span className="text-[var(--muted)]">Subject: </span>{t.subject}</p>
                  <pre className="text-xs text-[var(--muted)] whitespace-pre-wrap font-sans">{t.body}</pre>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Editor({ template, onSave, pending, error }: {
  template: Template;
  onSave: (subject: string, body: string) => void;
  pending: boolean;
  error?: string;
}) {
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);

  // A sample of what it will actually look like, so nobody ships a template
  // they have only ever seen with the braces still in it.
  const sample: Record<string, string> = {
    church_name: "Grace Church Kathmandu", admin_name: "Samuel Rai",
    site_url: "https://gracechurchkathmandu.churchnepal.com",
    admin_url: "https://gracechurchkathmandu.churchnepal.com/admin",
    amount: "Rs 2,900", plan: "Standard", next_due: "2026-09-01",
    billing_url: "https://churchnepal.com/billing", grace_days: "14",
    reason: "Payment failed",
  };
  const render = (s: string) =>
    s.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (m, k) => sample[k] ?? m);

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label htmlFor={`s-${template.key}`} className="block text-sm font-medium mb-1">Subject</label>
        <Input id={`s-${template.key}`} value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
      <div>
        <label htmlFor={`b-${template.key}`} className="block text-sm font-medium mb-1">Body</label>
        <textarea
          id={`b-${template.key}`}
          rows={8}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--panel)] p-3 text-sm"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      <p className="text-xs text-[var(--muted)]">
        Understands: {template.variables.map((v) => `{{${v}}}`).join(", ")}
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="rounded-lg border border-[var(--border)] p-3">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)] mb-2">Preview</p>
        <p className="text-sm font-medium">{render(subject)}</p>
        <pre className="text-xs text-[var(--muted)] whitespace-pre-wrap font-sans mt-1">{render(body)}</pre>
      </div>

      <div className="flex justify-end">
        <Button disabled={pending || !subject.trim()} onClick={() => onSave(subject, body)}>
          {pending ? "Saving…" : "Save template"}
        </Button>
      </div>
    </div>
  );
}
