import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertCircle, Clock, Server } from "lucide-react";

export default async function StatusPage() {
  // Simulate data loading
  await new Promise(resolve => setTimeout(resolve, 500));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--text-strong)]">System Status</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="text-[var(--good)]" size={20} />
            <Skeleton className="h-5 w-1/2" />
          </div>
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
        
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="text-[var(--accent)]" size={20} />
            <Skeleton className="h-5 w-1/2" />
          </div>
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
        
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="text-[var(--good)]" size={20} />
            <Skeleton className="h-5 w-1/2" />
          </div>
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
        
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Server className="text-[var(--accent)]" size={20} />
            <Skeleton className="h-5 w-1/2" />
          </div>
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
      </div>
      
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <Skeleton className="h-6 w-1/4 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[var(--panel-2)]">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-4 w-1/6" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
