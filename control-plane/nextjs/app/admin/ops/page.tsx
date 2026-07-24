import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Server, Database, Users } from "lucide-react";

export default async function OpsPage() {
  // Simulate data loading
  await new Promise(resolve => setTimeout(resolve, 600));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--text-strong)]">Operations</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[var(--accent-soft)]">
            <Activity className="text-[var(--accent)]" size={24} />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-16" />
          </div>
        </Card>
        
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[var(--accent-soft)]">
            <Server className="text-[var(--accent)]" size={24} />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-16" />
          </div>
        </Card>
        
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[var(--accent-soft)]">
            <Database className="text-[var(--accent)]" size={24} />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-16" />
          </div>
        </Card>
        
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[var(--accent-soft)]">
            <Users className="text-[var(--accent)]" size={24} />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-16" />
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
          <Skeleton className="h-6 w-1/3 mb-4" />
          <Skeleton className="h-64 w-full" />
        </Card>
        
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
          <Skeleton className="h-6 w-1/3 mb-4" />
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    </div>
  );
}
