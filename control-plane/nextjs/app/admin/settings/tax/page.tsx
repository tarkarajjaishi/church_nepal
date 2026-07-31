"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { PageTitle, Failed, Loading } from "@/components/platform";

/**
 * What goes on an invoice, and at what rate.
 *
 * "Prices include VAT" is asked rather than assumed: getting it backwards
 * misstates every invoice by the rate, in a direction nobody notices until an
 * auditor does.
 */

interface Tax {
  vat_number: string; vat_percent: number; company_name: string;
  address: string; invoice_footer: string; prices_include_vat: boolean;
}

const EMPTY: Tax = {
  vat_number: "", vat_percent: 13, company_name: "", address: "",
  invoice_footer: "", prices_include_vat: false,
};

export default function TaxPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Tax>(EMPTY);

  const q = useQuery({
    queryKey: ["platform-tax"],
    queryFn: async () => (await apiClient.get<Tax>("/platform/tax")).data,
  });
  useEffect(() => { if (q.data) setForm({ ...EMPTY, ...q.data }); }, [q.data]);

  const save = useMutation({
    mutationFn: (body: Tax) => apiClient.put("/platform/tax", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["platform-tax"] }),
  });
  const message = (save.error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;

  const set = (patch: Partial<Tax>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="space-y-6">
      <PageTitle title="Tax" subtitle="VAT and what appears on an invoice" />

      {q.isError ? <Failed error={q.error} onRetry={() => q.refetch()} /> : q.isLoading ? (
        <Loading />
      ) : (
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 space-y-4 max-w-2xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="vat-no" className="block text-sm font-medium mb-1">VAT number</label>
              <Input id="vat-no" value={form.vat_number}
                onChange={(e) => set({ vat_number: e.target.value })} />
            </div>
            <div>
              <label htmlFor="vat-pc" className="block text-sm font-medium mb-1">Rate</label>
              <Input id="vat-pc" type="number" min={0} max={100} step="0.5"
                value={form.vat_percent}
                onChange={(e) => set({ vat_percent: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label htmlFor="company" className="block text-sm font-medium mb-1">Registered name</label>
            <Input id="company" value={form.company_name}
              onChange={(e) => set({ company_name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="addr" className="block text-sm font-medium mb-1">Registered address</label>
            <textarea id="addr" rows={3}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--panel)] p-3 text-sm"
              value={form.address} onChange={(e) => set({ address: e.target.value })} />
          </div>
          <div>
            <label htmlFor="footer" className="block text-sm font-medium mb-1">Invoice footer</label>
            <Input id="footer" value={form.invoice_footer}
              onChange={(e) => set({ invoice_footer: e.target.value })} />
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3">
            <Switch
              checked={form.prices_include_vat}
              aria-label="Plan prices already include VAT"
              onCheckedChange={(v) => set({ prices_include_vat: v })}
            />
            <div>
              <p className="text-sm font-medium">Plan prices already include VAT</p>
              <p className="text-xs text-[var(--muted)]">
                Getting this backwards misstates every invoice by the rate. If a
                Standard plan is Rs 2,900 <em>including</em> tax, turn this on.
              </p>
            </div>
          </div>

          {message && <p className="text-sm text-red-400">{message}</p>}
          {save.isSuccess && !save.isPending && (
            <p className="text-sm text-emerald-400">Saved.</p>
          )}

          <div className="flex justify-end">
            <Button disabled={save.isPending} onClick={() => save.mutate(form)}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
