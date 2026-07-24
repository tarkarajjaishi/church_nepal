import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CreditCard, Download } from "lucide-react";

export default async function BillingPage() {
  // Simulate data loading
  await new Promise(resolve => setTimeout(resolve, 600));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--text-strong)]">Billing</h1>
        <Button className="gap-2">
          <CreditCard size={16} />
          Upgrade Plan
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 lg:col-span-2">
          <Skeleton className="h-6 w-1/3 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center pb-4 border-b border-[var(--border-soft)]">
                <div>
                  <Skeleton className="h-4 w-1/4 mb-2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
          <Skeleton className="h-6 w-1/2 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
      
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-1/4" />
          <Button variant="outline" className="gap-2">
            <Download size={16} />
            Export
          </Button>
        </div>
        <Skeleton className="h-96 w-full" />
      </Card>
    </div>
  );
}
