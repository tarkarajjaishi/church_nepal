"use client";

import { useQuery } from "@tanstack/react-query";
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
 * How the platform is growing.
 *
 * This page rendered nothing at all — not an error, not an empty state, a blank
 * screen — because it was declared `"use client"` *and* `async`. React will not
 * render an async client component, and the only sign was one console message.
 * It was reachable from the sidebar the whole time.
 *
 * What it drew, had it rendered, was a bar chart of Jan–May figures invented in
 * a mock constant. The real numbers were already behind /analytics/*.
 */

interface Overview {
  total_churches: number;
  active_churches: number;
  suspended_churches: number;
  mrr: number;
  churches_this_month: number;
  churches_by_plan: { plan: string; count: number }[];
}

interface GrowthPoint {
  period: string;
  churches_created: number;
  churches_churned: number;
  net_growth: number;
}

interface TopChurch {
  id: string;
  name: string;
  slug: string;
  plan: string | null;
  status: string;
}

export default function AnalyticsPage() {
  const overview = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: async () => (await apiClient.get<Overview>("/analytics/overview")).data,
  });
  const growth = useQuery({
    queryKey: ["analytics-growth"],
    queryFn: async () => (await apiClient.get<GrowthPoint[]>("/analytics/growth")).data,
  });
  const top = useQuery({
    queryKey: ["analytics-top"],
    queryFn: async () => (await apiClient.get<TopChurch[]>("/analytics/top-churches")).data,
  });

  const o = overview.data;
  const points = growth.data ?? [];
  // Scaled against the busiest period so a single church does not fill the bar.
  const peak = Math.max(1, ...points.map((p) => p.churches_created));

  return (
    <div className="space-y-6">
      <PageTitle title="Analytics" subtitle="Growth, plans and where the money is" />

      {overview.isError ? (
        <Failed error={overview.error} onRetry={() => overview.refetch()} />
      ) : !o ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Churches" value={o.total_churches} />
            <Stat
              label="Active"
              value={o.active_churches}
              hint={o.suspended_churches ? `${o.suspended_churches} suspended` : "None suspended"}
              tone={o.suspended_churches ? "bad" : "good"}
            />
            <Stat label="Joined this month" value={o.churches_this_month} />
            <Stat label="Monthly recurring" value={rupees(o.mrr)} hint="From plans" />
          </div>

          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
            <h2 className="font-semibold mb-1">By plan</h2>
            <p className="text-sm text-[var(--muted)] mb-4">
              Every church is on exactly one, so these add up to {o.total_churches}.
            </p>
            {!o.churches_by_plan.length ? (
              <Empty title="No churches to group yet" />
            ) : (
              <ul className="space-y-3">
                {o.churches_by_plan.map((p) => {
                  const pct = o.total_churches
                    ? Math.round((p.count / o.total_churches) * 100)
                    : 0;
                  return (
                    <li key={p.plan}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{p.plan || "Free"}</span>
                        <span className="text-[var(--muted)] tabular-nums">
                          {p.count} · {pct}%
                        </span>
                      </div>
                      <div
                        className="h-2 rounded-full bg-[var(--border)] overflow-hidden"
                        role="img"
                        aria-label={`${p.plan || "Free"}: ${p.count} of ${o.total_churches} churches`}
                      >
                        <div className="h-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
            <h2 className="font-semibold mb-1">Joined and left</h2>
            <p className="text-sm text-[var(--muted)] mb-4">By the day churches were created.</p>
            {growth.isError ? (
              <Failed error={growth.error} onRetry={() => growth.refetch()} />
            ) : !growth.data ? (
              <Loading />
            ) : !points.length ? (
              <Empty title="No growth recorded yet" />
            ) : (
              <ul className="space-y-2">
                {points.map((p) => (
                  <li key={p.period} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 text-[var(--muted)] tabular-nums">
                      {p.period.slice(0, 10)}
                    </span>
                    <div className="flex-1 h-5 rounded bg-[var(--border)] overflow-hidden">
                      <div
                        className="h-full bg-emerald-500/70"
                        style={{ width: `${(p.churches_created / peak) * 100}%` }}
                      />
                    </div>
                    <span className="w-32 shrink-0 text-right tabular-nums">
                      +{p.churches_created}
                      {p.churches_churned > 0 && (
                        <span className="text-red-400"> −{p.churches_churned}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <section>
            <h2 className="font-semibold mb-3">Churches</h2>
            {top.isError ? (
              <Failed error={top.error} onRetry={() => top.refetch()} />
            ) : !top.data ? (
              <Loading />
            ) : !top.data.length ? (
              <Empty title="No churches yet" />
            ) : (
              <Table head={["Church", "Plan", "Status"]}>
                {top.data.map((c) => (
                  <tr key={c.id} className={TR}>
                    <td className={TD}>
                      <span className="font-medium">{c.name}</span>
                      <span className="block text-xs text-[var(--muted)]">{c.slug}</span>
                    </td>
                    <td className={TD}>{c.plan || "Free"}</td>
                    <td className={TD}>{c.status}</td>
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
