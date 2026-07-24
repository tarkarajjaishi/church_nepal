import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function ChurchesPage() {
  // Simulate data loading
  await new Promise(resolve => setTimeout(resolve, 500));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--text-strong)]">Churches</h1>
        <div className="flex gap-2">
          <div className="relative flex-1 md:max-w-xs">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[var(--muted)]" size={18} />
            <Input 
              placeholder="Search churches..." 
              className="pl-8 h-10"
            />
          </div>
          <Button className="gap-2">
            <Plus size={16} />
            Add Church
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-5 w-1/6" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-4" />
            <div className="flex justify-between">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
