"use client";

import Link from "next/link";
import { useChurches, useSeedDummyChurches, useGrowthAnalytics } from "@/components/hooks";
import { LoadingState, EmptyState, ErrorState } from "@/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminPage() {
  const churchesQuery = useChurches();
  const seedDummyMutation = useSeedDummyChurches();
  const growthQuery = useGrowthAnalytics();
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

  // Process growth data for chart
  const growthData = growthQuery.data || [];
  const maxValue = Math.max(...growthData.map(d => d.churches_created), 1);

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

      {/* Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Churches Growth</CardTitle>
        </CardHeader>
        <CardContent>
          {growthQuery.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : growthQuery.error ? (
            <ErrorState
              title="Failed to load growth data"
              description={growthQuery.error.message}
              retry={() => growthQuery.refetch()}
              variant="network"
            />
          ) : growthData.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-muted text-sm">No growth data available yet</p>
            </div>
          ) : (
            <GrowthChart data={growthData} maxValue={maxValue} />
          )}
        </CardContent>
      </Card>

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
            <Link href="/admin/churches">
              <Button variant="primary">
                Create Church
              </Button>
            </Link>
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

// Growth Chart Component (SVG-based, no external lib)
interface GrowthChartProps {
  data: Array<{ month: string; churches_created: number }>;
  maxValue: number;
}

function GrowthChart({ data, maxValue }: GrowthChartProps) {
  const chartHeight = 200;
  const chartWidth = 400;
  const barWidth = Math.max(20, (chartWidth - 60) / data.length - 10);
  const barGap = 10;

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[400px]">
        <svg 
          viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} 
          className="w-full h-64"
          role="img"
          aria-label="Churches growth chart"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
            <line
              key={`grid-${i}`}
              x1={30}
              y1={20 + tick * chartHeight}
              x2={chartWidth - 20}
              y2={20 + tick * chartHeight}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Bars */}
          {data.map((d, i) => {
            const barHeight = (d.churches_created / maxValue) * chartHeight;
            const x = 30 + i * (barWidth + barGap);
            const y = 20 + chartHeight - barHeight;
            
            return (
              <g key={`bar-${i}`}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="var(--accent)"
                  rx={4}
                  ry={4}
                  className="opacity-80 hover:opacity-100 transition-opacity"
                />
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 35}
                  textAnchor="middle"
                  className="text-xs fill-muted"
                >
                  {d.month}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className="text-xs fill-text font-medium"
                >
                  {d.churches_created}
                </text>
              </g>
            );
          })}

          {/* Y-axis label */}
          <text
            x={10}
            y={20 + chartHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 10, ${20 + chartHeight / 2})`}
            className="text-xs fill-muted"
          >
            Churches
          </text>
        </svg>
      </div>
    </div>
  );
}