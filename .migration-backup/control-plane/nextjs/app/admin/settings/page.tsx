import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export default async function SettingsPage() {
  // Simulate data loading
  await new Promise(resolve => setTimeout(resolve, 500));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--text-strong)]">Settings</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 lg:col-span-2">
          <div className="space-y-6">
            <div>
              <Skeleton className="h-6 w-1/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-10 w-full" />
            </div>
            
            <div>
              <Skeleton className="h-6 w-1/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-10 w-full" />
            </div>
            
            <div>
              <Skeleton className="h-6 w-1/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-10 w-full" />
            </div>
            
            <div className="pt-4 border-t border-[var(--border-soft)]">
              <Button className="gap-2">
                <Save size={16} />
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
