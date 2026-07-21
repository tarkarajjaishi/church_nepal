"use client";

import { useAnalytics } from "@/components/hooks";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";

export default function AnalyticsPage() {
  const { data: analytics, isLoading, error } = useAnalytics();

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

  if (!analytics) {
    return (
      <EmptyState
        icon="chart"
        title="No analytics data"
        description="Analytics data will appear here once churches are created."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Churches" value={analytics.total_churches.toString()} />
        <StatCard label="Active Churches" value={analytics.active_churches.toString()} />
        <StatCard label="Total Members" value={analytics.total_members?.toLocaleString() || "—"} />
        <StatCard label="Total Giving" value={`Rs. ${analytics.total_giving?.toLocaleString() || "—"}`} />
      </div>

      {/* Growth Chart Placeholder */}
      <div className="card">
        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-4">Churches Over Time</h3>
        <div className="h-64 bg-[var(--panel-2)] rounded flex items-center justify-center">
          <p className="text-[var(--muted)]">Chart visualization will be added in the next task</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-sm text-[var(--muted)] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[var(--text-strong)]">{value}</p>
    </div>
  );
}