import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCircle } from "lucide-react";

export default async function NotificationsPage() {
  // Simulate data loading
  await new Promise(resolve => setTimeout(resolve, 500));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--text-strong)]">Notifications</h1>
        <div className="flex gap-2">
          <button className="p-2 rounded-md hover:bg-[var(--panel-2)]">
            <CheckCircle size={18} className="text-[var(--muted)]" />
          </button>
        </div>
      </div>
      
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--panel-2)] transition-colors">
              <div className="mt-0.5">
                <Bell size={18} className="text-[var(--accent)]" />
              </div>
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
