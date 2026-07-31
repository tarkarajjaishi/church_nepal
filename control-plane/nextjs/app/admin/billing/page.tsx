"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard, TrendingUp, AlertTriangle, Info, Users } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * What the platform earns, and from whom.
 *
 * `source` says whether the headline came from Stripe or was derived from the
 * plans churches are on. Without it the page could not tell "nobody is paying"
 * from "no payment provider is connected", and it used to report the first
 * while meaning the second.
 */

interface Overview {
  source: string;
  stripe_connected: boolean;
  mrr: number;
  active_subscriptions: number;
  total_churn: number;
  churn_rate: number;
}

interface BillingRow {
  church_id: string;
  church_name: string;
  plan: string | null;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  mrr: number;
}

const rupees = (n: number) => `Rs ${(n || 0).toLocaleString("en-IN")}`;

export default function BillingPage() {
  const overview = useQuery({
    queryKey: ["billing-overview"],
    queryFn: async () => (await apiClient.get<Overview>("/billing/overview")).data,
  });
  const rows = useQuery({
    queryKey: ["billing"],
    queryFn: async () => (await apiClient.get<BillingRow[]>("/billing")).data,
  });

  const o = overview.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-strong)]">Billing</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">
          Subscriptions, revenue and churn
        </p>
      </div>

      {o && !o.stripe_connected && (
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-4 flex items-start gap-3">
          <Info className="size-4 mt-0.5 text-sky-400 shrink-0" aria-hidden />
          <p className="text-sm text-[var(--muted)]">
            Stripe is not connected, so these figures are derived from the plans
            churches are on rather than from money actually collected. Set
            <code className="mx-1 text-[var(--text-strong)]">STRIPE_SECRET_KEY</code>
            to bill for real.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Monthly recurring"
          value={o ? rupees(o.mrr) : null}
          hint={o ? (o.stripe_connected ? "From Stripe" : "From plans") : undefined}
          icon={TrendingUp}
        />
        <Stat
          label="Paying churches"
          value={o ? String(o.active_subscriptions) : null}
          icon={Users}
        />
        <Stat label="Churned" value={o ? String(o.total_churn) : null} icon={AlertTriangle} />
        <Stat
          label="Churn rate"
          value={o ? `${o.churn_rate.toFixed(1)}%` : null}
          icon={CreditCard}
        />
      </div>

      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden">
        {rows.isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : !rows.data?.length ? (
          <p className="p-10 text-center text-sm text-[var(--muted)]">
            No churches are being billed yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--border)]">
                <tr>
                  {["Church", "Plan", "Status", "Renews", "Monthly"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="text-left px-4 py-3 font-medium text-[var(--muted)] whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.data.map((r) => (
                  <tr key={r.church_id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 font-medium">{r.church_name}</td>
                    <td className="px-4 py-3">{r.plan || "Free"}</td>
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3 text-[var(--muted)] whitespace-nowrap">
                      {r.current_period_end?.slice(0, 10) ??
                        (r.trial_ends_at ? `trial to ${r.trial_ends_at.slice(0, 10)}` : "—")}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{rupees(r.mrr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | null;
  hint?: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
        <Icon className="size-4 text-[var(--muted)]" aria-hidden />
      </div>
      {value === null ? (
        <Skeleton className="h-8 w-24 mt-2" />
      ) : (
        <p className="text-2xl font-bold mt-1">{value}</p>
      )}
      {hint && <p className="text-xs text-[var(--muted)] mt-1">{hint}</p>}
    </Card>
  );
}
