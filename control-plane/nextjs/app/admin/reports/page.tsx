"use client";

import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  PageTitle, Stat, Failed, Loading, Table, TR, TD, bytes, rupees,
} from "@/components/platform";

/**
 * Platform reporting.
 *
 * The three groupings below share one MRR expression on the server, so they
 * cannot add up to three different platform totals — which is the way a
 * reporting page usually starts lying.
 */

interface Row { label: string; churches: number; storage_bytes: number; mrr: number }
interface Data { by_plan: Row[]; by_status: Row[]; by_month: Row[]; totals: Row }

/** Quote a CSV cell, and defuse anything a spreadsheet would run as a formula. */
function cell(v: unknown): string {
  const s = String(v ?? "");
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
}

export default function ReportsPage() {
  const q = useQuery({
    queryKey: ["platform-report"],
    queryFn: async () => (await apiClient.get<Data>("/platform/report")).data,
  });
  const d = q.data;

  const download = () => {
    if (!d) return;
    const lines = ["Grouping,Label,Churches,Storage bytes,MRR"];
    for (const [name, rows] of [
      ["Plan", d.by_plan], ["Status", d.by_status], ["Month", d.by_month],
    ] as [string, Row[]][]) {
      for (const r of rows) {
        lines.push([name, r.label, r.churches, r.storage_bytes, r.mrr].map(cell).join(","));
      }
    }
    const href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = href;
    a.download = `platform-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(href);
  };

  const Group = ({ title, rows }: { title: string; rows: Row[] }) => (
    <section>
      <h2 className="font-semibold mb-3">{title}</h2>
      <Table head={[title, "Churches", "Storage", "Monthly revenue"]}>
        {rows.map((r) => (
          <tr key={r.label} className={TR}>
            <td className={`${TD} font-medium`}>{r.label}</td>
            <td className={`${TD} tabular-nums`}>{r.churches}</td>
            <td className={`${TD} tabular-nums text-[var(--muted)]`}>{bytes(r.storage_bytes)}</td>
            <td className={`${TD} tabular-nums`}>{rupees(r.mrr)}</td>
          </tr>
        ))}
      </Table>
    </section>
  );

  return (
    <div className="space-y-6">
      <PageTitle
        title="Reports"
        subtitle="The platform, grouped three ways"
        actions={
          <Button variant="outline" className="gap-2" disabled={!d} onClick={download}>
            <Download size={16} aria-hidden /> Export CSV
          </Button>
        }
      />

      {q.isError ? <Failed error={q.error} onRetry={() => q.refetch()} /> : !d ? <Loading /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat label="Churches" value={d.totals.churches} />
            <Stat label="Storage" value={bytes(d.totals.storage_bytes)} />
            <Stat label="Monthly revenue" value={rupees(d.totals.mrr)} />
          </div>
          <Group title="Plan" rows={d.by_plan} />
          <Group title="Status" rows={d.by_status} />
          <Group title="Month" rows={d.by_month} />
        </>
      )}
    </div>
  );
}
