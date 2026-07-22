"use client";

import { useAnalytics, useChurches } from "@/components/hooks";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import AreaChart from "@/components/admin/area-chart";
import DonutChart from "@/components/admin/donut-chart";
import BarChart from "@/components/admin/bar-chart";
import StatCard from "@/components/admin/stat-card";

export default function AnalyticsPage() {
  const { data: analytics, isLoading, error } = useAnalytics();
  const { data: churches, isLoading: churchesLoading } = useChurches();

  if (isLoading || churchesLoading) {
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

  // Prepare data for charts based on available data
  let growthData: { label: string; value: number }[] = [];
  let planDistribution: { label: string; value: number }[] = [];
  let topChurchesData: { label: string; value: number }[] = [];

  if (churches) {
    // Group churches by creation month for area chart
    const monthlyCounts: Record<string, number> = {};
    churches.forEach(church => {
      if (church.created_at) {
        const monthKey = new Date(church.created_at).toISOString().slice(0, 7); // YYYY-MM
        monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
      }
    });
    
    growthData = Object.entries(monthlyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ label: date, value: count }));

    // Count churches by plan for donut chart
    const planCounts: Record<string, number> = {};
    churches.forEach(church => {
      const planName = church.plan || 'Unknown';
      planCounts[planName] = (planCounts[planName] || 0) + 1;
    });
    
    planDistribution = Object.entries(planCounts).map(([name, value]) => ({ label: name, value }));

    // Top churches by member count for bar chart
    topChurchesData = [...churches]
      .filter(c => c.member_count !== undefined && c.name)
      .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
      .slice(0, 10)
      .map(c => ({ label: c.name || '', value: c.member_count || 0 }));
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-4">Churches Over Time</h3>
          {growthData.length > 0 ? (
            <AreaChart data={growthData} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-[var(--muted)]">No data available</p>
            </div>
          )}
        </div>

        {/* Plan Distribution */}
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

        {/* Top Churches by Members */}
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
