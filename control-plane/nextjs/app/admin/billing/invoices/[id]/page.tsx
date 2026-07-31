"use client";

import { use } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { PageTitle, Stat, Failed, Loading, rupees } from "@/components/platform";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * One invoice.
 *
 * This page previously rendered a complete, paid invoice — INV-2026-001, a Visa
 * ending 4242, transaction txn_xyz789, billed to "Grace Community Church" in US
 * dollars — for whatever id happened to be in the URL, including ids that do
 * not exist. It offered Download PDF, Resend and Refund buttons against it.
 *
 * A fabricated financial record is the worst thing on a console like this: it
 * is exactly the kind of page someone screenshots as evidence. It now shows the
 * invoice, or says there isn't one.
 */

interface Invoice {
  id: string;
  church_id: string;
  church_name: string | null;
  church_slug: string | null;
  amount: number;
  status: string;
  period_start: string;
  period_end: string;
  due_date: string;
  paid_at: string | null;
  created_at: string | null;
}

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => (await apiClient.get<Invoice>(`/invoices/${id}`)).data,
    retry: false,
  });

  const pay = useMutation({
    mutationFn: () => apiClient.post(`/invoices/${id}/pay`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoice", id] }),
  });

  const inv = q.data;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/billing"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:underline"
      >
        <ArrowLeft size={14} aria-hidden /> Billing
      </Link>

      {q.isError ? (
        <Failed error={q.error} onRetry={() => q.refetch()} />
      ) : !inv ? (
        <Loading />
      ) : (
        <>
          <PageTitle
            title={`Invoice ${inv.id.slice(0, 8)}`}
            subtitle={
              inv.church_name
                ? `${inv.church_name} · raised ${(inv.created_at ?? inv.due_date).slice(0, 10)}`
                : // The church can be deleted while its invoices remain.
                  "The church this was raised for no longer exists"
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Amount" value={rupees(inv.amount)} />
            <Stat
              label="Status"
              value={inv.status}
              tone={inv.status === "paid" ? "good" : "bad"}
            />
            <Stat label="Due" value={inv.due_date.slice(0, 10)} />
            <Stat label="Paid" value={inv.paid_at ? inv.paid_at.slice(0, 10) : "not yet"} />
          </div>

          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
            <h2 className="font-semibold mb-4">Period covered</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {[
                ["From", inv.period_start.slice(0, 10)],
                ["To", inv.period_end.slice(0, 10)],
                ["Church", inv.church_name ?? "deleted"],
                ["Invoice id", inv.id],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-4 border-b border-[var(--border)] pb-2"
                >
                  <dt className="text-[var(--muted)]">{k}</dt>
                  <dd className="text-right break-all">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {inv.status !== "paid" && (
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={pay.isPending} onClick={() => pay.mutate()}>
                {pay.isPending ? "Recording…" : "Mark as paid"}
              </Button>
              {/* No payment provider is connected, so this records that money
                  arrived by some other route. It does not take a payment, and
                  it should not look as though it does. */}
              <p className="text-sm text-[var(--muted)]">
                Records that this was settled elsewhere — it does not collect
                anything.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
