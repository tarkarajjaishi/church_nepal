"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PageTitle, Stat, Failed, Loading, Empty, Table, TR, TD, rupees } from "@/components/platform";

/**
 * Discounts.
 *
 * `redeemable` is derived on the server from expiry and remaining redemptions,
 * so a coupon that has run out cannot go on looking available just because
 * nobody remembered to switch it off.
 */

interface Coupon {
  code: string; description: string; kind: string; value: number;
  duration_months: number | null; max_redemptions: number | null;
  expires_at: string | null; active: boolean; created_at: string;
  redeemed_count: number; redeemable: boolean;
}

const discount = (c: Coupon) =>
  c.kind === "percent" ? `${c.value}% off` : `${rupees(c.value / 100)} off`;

export default function CouponsPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);

  const q = useQuery({
    queryKey: ["platform-coupons"],
    queryFn: async () => (await apiClient.get<Coupon[]>("/platform/coupons")).data,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["platform-coupons"] });

  const create = useMutation({
    mutationFn: (b: Record<string, unknown>) => apiClient.post("/platform/coupons", b),
    onSuccess: () => { invalidate(); setCreating(false); },
  });
  const toggle = useMutation({
    mutationFn: ({ code, active }: { code: string; active: boolean }) =>
      apiClient.post(`/platform/coupons/${code}/${active}`),
    onSuccess: invalidate,
  });

  const coupons = q.data ?? [];
  const message = (create.error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Coupons"
        subtitle="Discounts and trials"
        actions={
          <Button className="gap-2" onClick={() => { create.reset(); setCreating(true); }}>
            <Plus size={16} aria-hidden /> New coupon
          </Button>
        }
      />

      {creating && (
        <NewCoupon
          error={message}
          pending={create.isPending}
          onCancel={() => setCreating(false)}
          onSave={create.mutate}
        />
      )}

      {q.isError ? <Failed error={q.error} onRetry={() => q.refetch()} /> : q.isLoading ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat label="Coupons" value={coupons.length} />
            <Stat label="Redeemable now" value={coupons.filter((c) => c.redeemable).length} />
            <Stat label="Times redeemed" value={coupons.reduce((a, c) => a + c.redeemed_count, 0)} />
          </div>

          {!coupons.length ? (
            <Empty title="No coupons yet" subtitle="Create one to offer a discount." />
          ) : (
            <Table head={["Code", "Discount", "Lasts", "Redeemed", "Expires", "State"]}>
              {coupons.map((c) => (
                <tr key={c.code} className={TR}>
                  <td className={TD}>
                    <span className="font-mono font-medium">{c.code}</span>
                    {c.description && (
                      <span className="block text-xs text-[var(--muted)]">{c.description}</span>
                    )}
                  </td>
                  <td className={TD}>{discount(c)}</td>
                  <td className={`${TD} text-[var(--muted)]`}>
                    {c.duration_months ? `${c.duration_months} months` : "forever"}
                  </td>
                  <td className={`${TD} tabular-nums`}>
                    {c.redeemed_count}
                    {c.max_redemptions !== null && (
                      <span className="text-[var(--muted)]"> / {c.max_redemptions}</span>
                    )}
                  </td>
                  <td className={`${TD} text-[var(--muted)] whitespace-nowrap`}>
                    {c.expires_at?.slice(0, 10) ?? "never"}
                  </td>
                  <td className={TD}>
                    <span className="flex items-center gap-2">
                      <span className={c.redeemable ? "text-emerald-400" : "text-[var(--muted)]"}>
                        {c.redeemable ? "redeemable" : c.active ? "exhausted" : "off"}
                      </span>
                      <Button
                        variant="outline" size="sm"
                        aria-label={`${c.active ? "Disable" : "Enable"} the coupon ${c.code}`}
                        onClick={() => toggle.mutate({ code: c.code, active: !c.active })}
                      >
                        {c.active ? "Disable" : "Enable"}
                      </Button>
                    </span>
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

function NewCoupon({ onCancel, onSave, pending, error }: {
  onCancel: () => void;
  onSave: (b: Record<string, unknown>) => void;
  pending: boolean;
  error?: string;
}) {
  const [f, setF] = useState({
    code: "", description: "", kind: "percent", value: "10",
    duration_months: "", max_redemptions: "", expires_at: "",
  });
  const set = (p: Partial<typeof f>) => setF((s) => ({ ...s, ...p }));

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 space-y-4">
      <h2 className="font-semibold">New coupon</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-code" className="block text-sm font-medium mb-1">Code</label>
          <Input id="c-code" value={f.code} placeholder="LAUNCH25"
            onChange={(e) => set({ code: e.target.value.toUpperCase() })} />
        </div>
        <div>
          <label htmlFor="c-kind" className="block text-sm font-medium mb-1">Kind</label>
          <select id="c-kind" value={f.kind} onChange={(e) => set({ kind: e.target.value })}
            className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 text-sm">
            <option value="percent">Percent off</option>
            <option value="amount">Amount off</option>
          </select>
        </div>
        <div>
          <label htmlFor="c-value" className="block text-sm font-medium mb-1">
            {f.kind === "percent" ? "Percent" : "Rupees"}
          </label>
          <Input id="c-value" type="number" min={1} value={f.value}
            onChange={(e) => set({ value: e.target.value })} />
        </div>
        <div>
          <label htmlFor="c-months" className="block text-sm font-medium mb-1">
            Lasts (months)
          </label>
          <Input id="c-months" type="number" min={1} placeholder="forever"
            value={f.duration_months} onChange={(e) => set({ duration_months: e.target.value })} />
        </div>
        <div>
          <label htmlFor="c-max" className="block text-sm font-medium mb-1">Redemption limit</label>
          <Input id="c-max" type="number" min={1} placeholder="unlimited"
            value={f.max_redemptions} onChange={(e) => set({ max_redemptions: e.target.value })} />
        </div>
        <div>
          <label htmlFor="c-exp" className="block text-sm font-medium mb-1">Expires</label>
          <Input id="c-exp" type="date" value={f.expires_at}
            onChange={(e) => set({ expires_at: e.target.value })} />
        </div>
      </div>
      <div>
        <label htmlFor="c-desc" className="block text-sm font-medium mb-1">What it is for</label>
        <Input id="c-desc" value={f.description} onChange={(e) => set({ description: e.target.value })} />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          disabled={!f.code.trim() || pending}
          onClick={() =>
            onSave({
              code: f.code.trim(),
              description: f.description,
              kind: f.kind,
              // An amount is stored in paisa, like every other figure.
              value: f.kind === "percent" ? Number(f.value) : Math.round(Number(f.value) * 100),
              duration_months: f.duration_months ? Number(f.duration_months) : undefined,
              max_redemptions: f.max_redemptions ? Number(f.max_redemptions) : undefined,
              expires_at: f.expires_at ? `${f.expires_at}T00:00:00Z` : undefined,
            })
          }
        >
          {pending ? "Saving…" : "Create coupon"}
        </Button>
      </div>
    </Card>
  );
}
