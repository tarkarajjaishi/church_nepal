"use client";

import { useState } from "react";
import { useAnalytics, useGrowthAnalytics, useTopChurches } from "@/components/hooks";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import AreaChart from "@/components/admin/area-chart";
import DonutChart from "@/components/admin/donut-chart";
import BarChart from "@/components/admin/bar-chart";
import StatCard from "@/components/admin/stat-card";

type DateRange = "30d" | "90d" | "12m";

const RANGES: { value: DateRange; label: string }[] = [
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "12m", label: "12 Months" },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const { data: overview, isLoading, error } = useAnalytics();
  const { data: growthData } = useGrowthAnalytics(dateRange);
  const { data: topChurches } = useTopChurches();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="h-4 bg-[var(--panel-2)] rounded animate-pulse mb-2" />
              <div className="h-8 bg-[var(--panel-2)] rounded animate-pulse" />
            </div>
          ))}
        </div>
        <LoadingState message="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="chart"
        title="Failed to load analytics"
        description={error.message}
      />
    );
  }

  if (!overview) {
    return (
      <EmptyState
        icon="chart"
        title="No analytics data"
        description="Analytics data will appear here once churches are created."
      />
    );
  }

  const growthSeries = (growthData ?? []).map(d => ({
    label: d.period,
    value: d.churches_created,
  }));

  const planDistribution = (overview.churches_by_plan ?? []).map(p => ({
    label: p.plan || "Unknown",
    value: p.count,
  }));

  const topChurchesData = (topChurches ?? [])
    .filter(c => c.member_count !== undefined && c.name)
    .slice(0, 10)
    .map(c => ({ label: c.name || "", value: c.member_count || 0 }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Churches" value={overview.total_churches.toLocaleString()} />
        <StatCard label="Active Churches" value={overview.active_churches.toLocaleString()} />
        <StatCard
          label="Monthly Revenue"
          value={`Rs. ${overview.mrr.toLocaleString()}`}
        />
        <StatCard
          label="New This Month"
          value={overview.churches_this_month.toLocaleString()}
        />
      </div>

      <div className="flex justify-end">
        <div className="flex gap-1 bg-[var(--panel)] border border-[var(--border)] rounded-lg p-1">
          {RANGES.map(range => (
            <button
              key={range.value}
              onClick={() => setDateRange(range.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === range.value
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-4">Churches Over Time</h3>
          {growthSeries.length > 0 ? (
            <AreaChart data={growthSeries} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-[var(--muted)]">No data available</p>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-4">Plan Distribution</h3>
          {planDistribution.length > 0 ? (
            <DonutChart data={planDistribution} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-[var(--muted)]">No data available</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-4">Top Churches by Members</h3>
          {topChurchesData.length > 0 ? (
            <BarChart data={topChurchesData} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-[var(--muted)]">No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
