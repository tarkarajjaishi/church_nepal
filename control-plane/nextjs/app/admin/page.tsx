"use client";

import Link from "next/link";
import { useState } from "react";
import { useChurches, useSeedDummyChurches, useMe } from "@/components/hooks";
import { LoadingState, EmptyState, ErrorState } from "@/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AreaChart from "@/components/admin/area-chart";
import DonutChart from "@/components/admin/donut-chart";
import SystemStatus from "@/components/admin/system-status";
import ActivityFeed from "@/components/admin/activity-feed";
import CreateChurchModal from "@/components/admin/create-church-modal";

export default function AdminPage() {
  const churchesQuery = useChurches();
  const seedDummyMutation = useSeedDummyChurches();
  const meQuery = useMe(); // Replaced useAuth with useMe
  const churches = churchesQuery.data || [];

  // Calculate stats
  const totalChurches = churches.length;
  const activeChurches = churches.filter(c => c.status === "active").length;
  const totalMembers = churches.reduce((sum, c) => sum + (c.member_count || 0), 0);
  const totalGiving = churches.reduce((sum, c) => sum + (c.giving_total || 0), 0);

  // Recent churches (last 5)
  const recentChurches = [...churches]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 5);

  // Plan distribution data for donut chart
  const planCounts = churches.reduce((acc, church) => {
    const plan = church.plan || "Free";
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const planChartData: { label: string; value: number }[] = Object.entries(planCounts).map(([name, count]) => ({
    label: name,
    value: count,
  }));

  // Prepare data for area chart
  const areaChartData: { label: string; value: number }[] = churches
    .filter(c => c.created_at)
    .map(c => ({
      label: new Date(c.created_at!).toISOString().split('T')[0],
      value: 1,
    }))
    .reduce((acc: { label: string; value: number }[], item) => {
      const existing = acc.find(x => x.label === item.label);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push(item);
      }
      return acc;
    }, [])
    .sort((a, b) => a.label.localeCompare(b.label));

  // Compute cumulative values for area chart
  let cumulative = 0;
  const cumulativeData: { label: string; value: number }[] = areaChartData.map(item => {
    cumulative += item.value;
    return {
      label: item.label,
      value: cumulative,
    };
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleSeed = () => {
    seedDummyMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCardItem
          label="Total Churches"
          value={totalChurches.toString()}
          isLoading={churchesQuery.isLoading}
        />
        <StatsCardItem
          label="Active Churches"
          value={activeChurches.toString()}
          isLoading={churchesQuery.isLoading}
        />
        <StatsCardItem
          label="Total Members"
          value={totalMembers.toLocaleString()}
          isLoading={churchesQuery.isLoading}
        />
        <StatsCardItem
          label="Total Giving"
          value={`Rs. ${totalGiving.toLocaleString()}`}
          isLoading={churchesQuery.isLoading}
        />
      </div>

      {/* New charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Churches Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {churchesQuery.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : churchesQuery.error ? (
              <ErrorState
                title="Failed to load church data"
                description={churchesQuery.error.message}
                retry={() => churchesQuery.refetch()}
                variant="network"
              />
            ) : cumulativeData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted text-sm">No church creation data available yet</p>
              </div>
            ) : (
              <AreaChart data={cumulativeData} />
            )}
          </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {churchesQuery.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : churchesQuery.error ? (
              <ErrorState
                title="Failed to load plan data"
                description={churchesQuery.error.message}
                retry={() => churchesQuery.refetch()}
                variant="network"
              />
            ) : planChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted text-sm">No plan data available yet</p>
              </div>
            ) : (
              <DonutChart data={planChartData} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status and Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <SystemStatus />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed />
          </CardContent>
        </Card>
      </div>

      {/* Recent Churches */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Churches</CardTitle>
          {totalChurches > 0 && (
            <Link href="/admin/churches" className="text-sm text-accent hover:underline">
              View all →
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {churchesQuery.isLoading ? (
            <LoadingState variant="skeleton" rows={3} />
          ) : churchesQuery.error ? (
            <ErrorState
              title="Failed to load churches"
              description={churchesQuery.error.message}
              retry={() => churchesQuery.refetch()}
            />
          ) : churches.length === 0 ? (
            <EmptyState
              icon="church"
              title="No churches yet"
              description="Get started by creating a new church or seeding demo data."
              action={{
                label: seedDummyMutation.isPending ? "Seeding..." : "Seed 5 Demo Churches",
                onClick: handleSeed,
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentChurches.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted">{c.slug}.localhost:3005</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="accent" className={c.plan === "Pro" ? "badge-accent" : c.plan === "Standard" ? "badge-success" : "badge-muted"}>
                          {c.plan || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={c.status === "active" ? "success" : "destructive"} 
                          className="capitalize"
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted">{c.member_count ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <a
                          className="text-accent hover:underline text-sm font-medium"
                          href={`http://${c.slug}.localhost:3005`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Church
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleSeed} 
              disabled={seedDummyMutation.isPending}
            >
              {seedDummyMutation.isPending ? "Seeding..." : "Seed Demo Churches"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Church Modal */}
      <CreateChurchModal 
        open={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}

// Stats Card Component using Card
interface StatsCardProps {
  label: string;
  value: string;
  isLoading: boolean;
}

function StatsCardItem({ label, value, isLoading }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted mb-1">{label}</p>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-2xl font-bold text-text-strong">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
