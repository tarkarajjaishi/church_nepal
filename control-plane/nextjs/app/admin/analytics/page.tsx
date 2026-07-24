"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for the chart
const mockData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 200 },
  { name: 'Apr', value: 278 },
  { name: 'May', value: 189 },
];

export default async function AnalyticsPage() {
  // Simulate data loading
  await new Promise(resolve => setTimeout(resolve, 800));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--text-strong)]">Analytics</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2" />
        </Card>
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2" />
        </Card>
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2" />
        </Card>
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2" />
        </Card>
      </div>

      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text)" />
              <YAxis stroke="var(--text)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--panel)', 
                  borderColor: 'var(--border)',
                  color: 'var(--text)'
                }} 
              />
              <Bar dataKey="value" fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
