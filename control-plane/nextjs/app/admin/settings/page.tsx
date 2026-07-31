"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Flag,
  Mail,
  Webhook,
  HardDrive,
  DatabaseBackup,
  ShieldCheck,
  Receipt,
  KeyRound,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { PageTitle, Failed, Loading, Table, TR, TD } from "@/components/platform";
import { Card } from "@/components/ui/card";

/**
 * Where the platform's settings live.
 *
 * This page was a heading and a "Save Changes" button over a grid of skeletons —
 * a form with no fields, which saved nothing. The settings it implied already
 * exist, each on its own page with a real backend behind it, so this is an index
 * of those rather than a second place to edit the same things.
 *
 * `platform_settings` is a free-form key/value store with no schema, so whatever
 * is actually in it is listed at the bottom rather than guessed at up here.
 */

const SECTIONS = [
  {
    href: "/admin/settings/flags",
    icon: Flag,
    name: "Feature flags",
    blurb: "What is switched on, and for whom",
  },
  {
    href: "/admin/settings/emails",
    icon: Mail,
    name: "Email templates",
    blurb: "What the platform sends to churches",
  },
  {
    href: "/admin/settings/webhooks",
    icon: Webhook,
    name: "Webhooks",
    blurb: "Tell another system when something happens here",
  },
  {
    href: "/admin/settings/storage",
    icon: HardDrive,
    name: "Storage",
    blurb: "Usage per church against the plan allowance",
  },
  {
    href: "/admin/settings/backups",
    icon: DatabaseBackup,
    name: "Backups",
    blurb: "Snapshots per church, and whether the files are still there",
  },
  {
    href: "/admin/settings/security",
    icon: ShieldCheck,
    name: "Security",
    blurb: "Sessions, two-factor and recent sign-ins",
  },
  {
    href: "/admin/settings/tax",
    icon: Receipt,
    name: "Tax",
    blurb: "VAT and what appears on an invoice",
  },
  {
    href: "/admin/settings/api-keys",
    icon: KeyRound,
    name: "API keys",
    blurb: "Programmatic access to the platform",
  },
];

export default function SettingsPage() {
  const q = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => (await apiClient.get<Record<string, unknown>>("/settings")).data,
  });

  const stored = Object.entries(q.data ?? {});

  return (
    <div className="space-y-6">
      <PageTitle title="Settings" subtitle="How the platform behaves" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map(({ href, icon: Icon, name, blurb }) => (
          <Link key={href} href={href} className="block group">
            <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 h-full group-hover:border-[var(--accent)] transition-colors">
              <div className="flex items-start gap-3">
                <Icon className="size-4 mt-0.5 text-[var(--muted)] shrink-0" aria-hidden />
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-[var(--muted)] mt-0.5">{blurb}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="font-semibold mb-3">Stored values</h2>
        {q.isError ? (
          <Failed error={q.error} onRetry={() => q.refetch()} />
        ) : !q.data ? (
          <Loading />
        ) : !stored.length ? (
          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
            <p className="text-sm text-[var(--muted)]">
              Nothing has been written to the platform key/value store. The
              sections above keep their own settings; this is only for values set
              outside them.
            </p>
          </Card>
        ) : (
          <Table head={["Key", "Value"]}>
            {stored.map(([k, v]) => (
              <tr key={k} className={TR}>
                <td className={`${TD} font-medium`}>{k}</td>
                <td className={`${TD} font-mono text-xs break-all`}>{JSON.stringify(v)}</td>
              </tr>
            ))}
          </Table>
        )}
      </section>
    </div>
  );
}
