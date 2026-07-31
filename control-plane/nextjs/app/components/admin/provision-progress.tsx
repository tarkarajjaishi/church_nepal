'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

/**
 * Provision a church, and report what actually happened.
 *
 * This used to be four setTimeouts. It ticked "Creating database", "Configuring
 * storage", "Creating admin account" off one by one and finished on "Church
 * Created Successfully!" — having called nothing. The wizard behind it is the
 * "Add church" button on /admin/churches, the global search action and a
 * keyboard shortcut, so the main way to create a church in this console created
 * no church at all. Provisioning worked the whole time; only the page did not
 * ask for it.
 *
 * It is one request, so it is reported as one thing rather than a fake sequence.
 * The administrator password comes back once and is never recoverable, so it is
 * shown once and said so.
 */

interface NewChurch {
  id: string;
  slug: string;
  subdomain: string;
  admin_email: string;
  admin_password: string;
  url?: string;
}

export default function ProvisionProgress({
  churchData,
  onComplete,
}: {
  churchData: { name: string; subdomain: string; plan: string; adminEmail: string };
  onComplete: () => void;
}) {
  const [created, setCreated] = useState<NewChurch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Provisioning creates a database; React 18 mounts effects twice in
  // development, and doing it twice would leave a half-made second church.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    apiClient
      .post<NewChurch>('/churches', { name: churchData.name })
      .then((r) => setCreated(r.data))
      .catch((e) =>
        setError(
          e?.response?.data?.error ||
            e?.message ||
            'Could not create the church. Nothing was changed.',
        ),
      );
  }, [churchData.name]);

  if (error) {
    return (
      <Card className="bg-[var(--panel)] border border-red-500/30 rounded-xl p-5">
        <h2 className="text-xl font-semibold text-[var(--text)] mb-1">
          {churchData.name} was not created
        </h2>
        <p className="text-sm text-[var(--muted)] mb-4">{error}</p>
        <div className="flex gap-3">
          <Button onClick={onComplete}>Back to churches</Button>
        </div>
      </Card>
    );
  }

  if (!created) {
    return (
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="text-xl font-semibold text-[var(--text)] mb-2">
          Creating {churchData.name}
        </h2>
        <p className="text-[var(--muted)] mb-6">
          Making the database, running its migrations, setting up storage and
          seeding an administrator. This takes a few seconds.
        </p>
        <div className="flex items-center gap-3 text-[var(--muted)]">
          <span
            className="size-5 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin"
            aria-hidden
          />
          <span>Provisioning…</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
      <h2 className="text-xl font-semibold text-[var(--text)] mb-1">
        {churchData.name} is ready
      </h2>
      <p className="text-[var(--muted)] mb-6">
        Its database, storage and administrator account all exist.
      </p>

      <div className="rounded-xl border border-amber-500/30 p-4 mb-6 space-y-2">
        <p className="font-medium text-[var(--text)]">
          Save this password now — it is shown only once
        </p>
        <p className="text-sm text-[var(--muted)]">
          Only a hash is stored, so it cannot be shown again. If it is lost the
          administrator has to reset it.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <code className="px-3 py-2 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] text-sm break-all">
            {created.admin_email} · {created.admin_password}
          </code>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              navigator.clipboard?.writeText(
                `${created.admin_email} ${created.admin_password}`,
              );
              setCopied(true);
            }}
          >
            {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={`http://${created.slug}.localhost:3005`} target="_blank" rel="noreferrer">
          <Button variant="outline">Visit the site</Button>
        </Link>
        <Link href={`/admin/churches/${created.id}`}>
          <Button>Open in the console</Button>
        </Link>
        <Button variant="ghost" onClick={onComplete}>
          Back to churches
        </Button>
      </div>
    </Card>
  );
}
