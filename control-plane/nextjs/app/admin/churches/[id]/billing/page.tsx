"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import {
  PageTitle,
  Stat,
  Failed,
  Loading,
  Empty,
  Table,
  TR,
  TD,
  rupees,
} from "@/components/platform";
import { Card } from "@/components/ui/card";

/**
 * What one church is billed.
 *
 * The page used to render a fabricated "Example Church" on a "Pro Plan" at
 * $49/month with a next invoice due 2024-08-01 — none of it real, and priced in
 * dollars on a platform that bills in rupees. Whoever read it came away with a
 * confident wrong idea of what a church was paying.
 */

interface Billing {
  church_id: string;
  church_name: string;
  plan: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  mrr: number;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  period_start: string;
  period_end: string;
}

export default function ChurchBillingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const q = useQuery({
    queryKey: ["church-billing", id],
    queryFn: async () => (await apiClient.get<Billing>(`/billing/${id}`)).data,
  });
  const invoices = useQuery({
    queryKey: ["church-invoices", id],
    queryFn: async () =>
      (await apiClient.get<Invoice[]>(`/invoices`, { params: { church_id: id } })).data,
  });

  const b = q.data;

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/churches/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:underline"
      >
        <ArrowLeft size={14} aria-hidden /> Back to the church
      </Link>

      {q.isError ? (
        <Failed error={q.error} onRetry={() => q.refetch()} />
      ) : !b ? (
        <Loading />
      ) : (
        <>
          <PageTitle title={b.church_name} subtitle="Billing" />

          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-4 flex items-start gap-3">
            <Info className="size-4 mt-0.5 text-sky-400 shrink-0" aria-hidden />
            <p className="text-sm text-[var(--muted)]">
              Figures are derived from the plan this church is on, not from money
              collected — no payment provider is connected. The plan price is
              what it would be charged.
            </p>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Plan" value={b.plan} />
            <Stat
              label="Status"
              value={b.status}
              tone={b.status === "active" ? "good" : "bad"}
            />
            <Stat
              label="Per month"
              value={rupees(b.mrr)}
              hint={b.status === "active" ? undefined : "Not billed while suspended"}
            />
            <Stat
              label="Renews"
              value={
                b.current_period_end?.slice(0, 10) ??
                (b.trial_ends_at ? `trial to ${b.trial_ends_at.slice(0, 10)}` : "—")
              }
            />
          </div>

          <section>
            <h2 className="font-semibold mb-3">Invoices</h2>
            {invoices.isError ? (
              <Failed error={invoices.error} onRetry={() => invoices.refetch()} />
            ) : !invoices.data ? (
              <Loading />
            ) : !invoices.data.length ? (
              <Empty title="No invoices have been raised for this church" />
            ) : (
              <Table head={["Period", "Amount", "Due", "Status", ""]}>
                {invoices.data.map((inv) => (
                  <tr key={inv.id} className={TR}>
                    <td className={`${TD} whitespace-nowrap`}>
                      {inv.period_start.slice(0, 10)} → {inv.period_end.slice(0, 10)}
                    </td>
                    <td className={`${TD} tabular-nums`}>{rupees(inv.amount)}</td>
                    <td className={`${TD} text-[var(--muted)]`}>{inv.due_date.slice(0, 10)}</td>
                    <td className={TD}>
                      <span className={inv.status === "paid" ? "text-emerald-400" : "text-amber-400"}>
                        {inv.status}
                      </span>
                    </td>
                    <td className={`${TD} text-right`}>
                      <Link href={`/admin/billing/invoices/${inv.id}`} className="underline text-sm">
                        View
                      </Link>
                    </td>
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
