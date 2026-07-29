import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function AdminsPage() {
  // Simulate data loading
  await new Promise(resolve => setTimeout(resolve, 500));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--text-strong)]">Admins</h1>
        <div className="flex gap-2">
          <div className="relative flex-1 md:max-w-xs">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[var(--muted)]" size={18} />
            <Input 
              placeholder="Search admins..." 
              className="pl-8 h-10"
            />
          </div>
          <Button className="gap-2">
            <Plus size={16} />
            Add Admin
          </Button>
        </div>
      </div>
      
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-soft)]">
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-[var(--border-soft)] last:border-0">
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-3/4" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-1/2" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-1/3" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
